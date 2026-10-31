const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { verificarToken, esAdministrador } = require('./authMiddleware');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'clave_secreta_super_segura_candykane';

app.use(cors());
app.use(express.json());


// RUTA

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de CandyKane funcionando correctamente' });
});


// MÓDULO PRODUCTOS: Obtener el catálogo de postres

app.get('/api/productos', async (req, res) => {
    try {
        const [filas] = await pool.query(`
            SELECT id_producto, nombre, descripcion, precio, stock, imagen
            FROM productos
            WHERE activo = TRUE AND stock > 0
            ORDER BY id_producto ASC
        `);
        res.json(filas);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno al consultar el catálogo' });
    }
});


// MÓDULO USUARIOS: Registrar un nuevo cliente

app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, correo, contrasena, telefono, direccion } = req.body;

        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }

        const [usuarioExistente] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        const saltRounds = 10;
        const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

        const [resultado] = await pool.query(
            `INSERT INTO usuarios (nombre, correo, contrasena_hash, telefono, direccion, rol, activo)
             VALUES (?, ?, ?, ?, ?, 'cliente', TRUE)`,
            [nombre, correo, contrasenaHash, telefono || null, direccion || null]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            id_usuario: resultado.insertId
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error interno en el servidor al registrar el usuario' });
    }
});


// MÓDULO USUARIOS: Iniciar sesión 

app.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }

        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE',
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const usuario = usuarios[0];
        const contraseñaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contraseñaCorrecta) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                correo: usuario.correo, 
                rol: usuario.rol 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno en el servidor al iniciar sesión' });
    }
});


// MÓDULO PERFIL: Obtener perfil, pedidos y dirección de la BD

app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const idUsuario = req.usuario.id_usuario;
        const [[usuario]] = await pool.query(
            `SELECT id_usuario, nombre, correo, telefono, direccion
             FROM usuarios
             WHERE id_usuario = ? AND activo = TRUE`,
            [idUsuario]
        );

        if (!usuario) {
            return res.status(404).json({ error: 'No se encontró la cuenta del usuario.' });
        }

        // Adaptamos la dirección de la tabla usuarios para que el frontend la lea bien
        const direcciones = usuario.direccion ? [
            {
                id_direccion: 1,
                alias: 'Principal',
                direccion: usuario.direccion,
                ciudad: '',
                referencia: null
            }
        ] : [];

        // Consultar los pedidos reales de la tabla 'pedidos'
        const [pedidos] = await pool.query(
            `SELECT id_pedido, total, estado, fecha_pedido AS creado_en
             FROM pedidos
             WHERE id_usuario = ?
             ORDER BY fecha_pedido DESC`,
            [idUsuario]
        );

        res.json({ usuario, direcciones, favoritos: [], pedidos });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'No se pudo cargar la información del perfil.' });
    }
});


// MÓDULO PERFIL: Actualizar información personal

app.put('/api/perfil', verificarToken, async (req, res) => {
    try {
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
        const correo = typeof req.body.correo === 'string' ? req.body.correo.trim() : '';
        const telefono = typeof req.body.telefono === 'string' ? req.body.telefono.trim() : '';

        if (!nombre || !correo) {
            return res.status(400).json({ error: 'El nombre y el correo son obligatorios.' });
        }

        const [correoExistente] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario <> ?',
            [correo, req.usuario.id_usuario]
        );
        if (correoExistente.length > 0) {
            return res.status(409).json({ error: 'Ese correo ya está asociado a otra cuenta.' });
        }

        await pool.query(
            `UPDATE usuarios
             SET nombre = ?, correo = ?, telefono = ?
             WHERE id_usuario = ? AND activo = TRUE`,
            [nombre, correo, telefono || null, req.usuario.id_usuario]
        );

        res.json({
            mensaje: 'La información se actualizó correctamente.',
            usuario: {
                id_usuario: req.usuario.id_usuario,
                nombre,
                correo,
                telefono: telefono || null,
                rol: req.usuario.rol
            }
        });
    } catch (error) {
        console.error('Error al actualizar la información del perfil:', error);
        res.status(500).json({ error: 'No se pudo actualizar la información del perfil.' });
    }
});


// MÓDULO PERFIL: Guardar dirección directamente en 'usuarios'

app.post('/api/perfil/direcciones', verificarToken, async (req, res) => {
    try {
        const direccionTexto = typeof req.body.direccion === 'string' ? req.body.direccion.trim() : '';
        const ciudad = typeof req.body.ciudad === 'string' ? req.body.ciudad.trim() : '';
        const alias = typeof req.body.alias === 'string' ? req.body.alias.trim() : '';

        if (!direccionTexto) {
            return res.status(400).json({ error: 'La dirección es obligatoria.' });
        }

        const direccionCompleta = `${alias ? alias + ': ' : ''}${direccionTexto}${ciudad ? ', ' + ciudad : ''}`;

        await pool.query(
            `UPDATE usuarios 
             SET direccion = ? 
             WHERE id_usuario = ? AND activo = TRUE`,
            [direccionCompleta, req.usuario.id_usuario]
        );

        res.status(201).json({
            id_direccion: 1,
            alias: alias || 'Principal',
            direccion: direccionTexto,
            ciudad: ciudad,
            referencia: req.body.referencia || null
        });
    } catch (error) {
        console.error('Error al guardar la dirección:', error);
        res.status(500).json({ error: 'No se pudo guardar la dirección.' });
    }
});

// MÓDULO PERFIL: Eliminar dirección

app.delete('/api/perfil/direcciones/:id', verificarToken, async (req, res) => {
    try {
        await pool.query(
            `UPDATE usuarios SET direccion = NULL WHERE id_usuario = ?`,
            [req.usuario.id_usuario]
        );
        res.json({ mensaje: 'Dirección eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la dirección:', error);
        res.status(500).json({ error: 'No se pudo eliminar la dirección.' });
    }
});


// MÓDULO ADMIN: Crear producto

app.post('/api/productos', verificarToken, esAdministrador, async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen } = req.body;

        if (!nombre || precio === undefined || stock === undefined) {
            return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [nombre, descripcion || null, precio, stock, imagen || null]
        );

        res.status(201).json({
            mensaje: 'Producto creado exitosamente por el administrador',
            id_producto: resultado.insertId
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error interno en el servidor al crear el producto' });
    }
});

// MÓDULO ADMIN: Actualizar producto

app.put('/api/productos/:id', verificarToken, esAdministrador, async (req, res) => {
    try {
        const idProducto = req.params.id;
        const { nombre, descripcion, precio, stock, imagen, activo } = req.body;

        if (!/^\d+$/.test(idProducto)) {
            return res.status(400).json({ error: 'El identificador del producto no es válido.' });
        }

        if (precio !== undefined && (!Number.isFinite(Number(precio)) || Number(precio) < 0)) {
            return res.status(400).json({ error: 'El precio debe ser un número igual o mayor que cero.' });
        }

        if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
            return res.status(400).json({ error: 'El stock debe ser un número entero igual o mayor que cero.' });
        }

        if (activo !== undefined && typeof activo !== 'boolean') {
            return res.status(400).json({ error: 'El estado activo debe ser verdadero o falso.' });
        }

        const [resultado] = await pool.query(
            `UPDATE productos 
             SET nombre = COALESCE(?, nombre), 
                 descripcion = COALESCE(?, descripcion), 
                 precio = COALESCE(?, precio), 
                 stock = COALESCE(?, stock), 
                 imagen = COALESCE(?, imagen), 
                 activo = COALESCE(?, activo)
             WHERE id_producto = ?`,
            [nombre, descripcion, precio, stock, imagen, activo, idProducto]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error interno al actualizar el producto' });
    }
    }

);
// MÓDULO ADMIN: Resumen del negocio
app.get('/api/admin/resumen', verificarToken, esAdministrador, async (req, res) => {
    try {
        const [[productos]] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(activo = TRUE), 0) AS activos,
                COALESCE(SUM(stock > 0 AND stock <= 5), 0) AS stock_bajo,
                COALESCE(SUM(stock = 0), 0) AS agotados
            FROM productos
        `);
        const [[clientes]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM usuarios
            WHERE rol = 'cliente' AND activo = TRUE
        `);
        const [[pedidos]] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(LOWER(estado) IN ('pendiente', 'pending')), 0) AS pendientes,
                COALESCE(SUM(total), 0) AS ventas
            FROM pedidos
        `);

        res.json({
            productos: {
                total: Number(productos.total),
                activos: Number(productos.activos),
                stock_bajo: Number(productos.stock_bajo),
                agotados: Number(productos.agotados)
            },
            clientes: Number(clientes.total),
            pedidos: {
                total: Number(pedidos.total),
                pendientes: Number(pedidos.pendientes)
            },
            ventas: Number(pedidos.ventas)
        });
    } catch (error) {
        console.error('Error al obtener el resumen administrativo:', error);
        res.status(500).json({ error: 'No se pudo cargar el resumen administrativo.' });
    }
});

// MÓDULO ADMIN: Consultar todos los productos, incluidos los inactivos y agotados
app.get('/api/admin/productos', verificarToken, esAdministrador, async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT id_producto, nombre, descripcion, precio, stock, imagen, activo
            FROM productos
            ORDER BY id_producto DESC
        `);
        res.json(productos);
    } catch (error) {
        console.error('Error al listar productos para administración:', error);
        res.status(500).json({ error: 'No se pudo cargar la lista de productos.' });
    }
});

// MÓDULO ADMIN: Consultar clientes sin exponer credenciales
app.get('/api/admin/clientes', verificarToken, esAdministrador, async (req, res) => {
    try {
        const [clientes] = await pool.query(`
            SELECT id_usuario, nombre, correo, telefono, activo
            FROM usuarios
            WHERE rol = 'cliente'
            ORDER BY nombre ASC
        `);
        res.json(clientes);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ error: 'No se pudo cargar la lista de clientes.' });
    }
});

// MÓDULO ADMIN: Consultar pedidos
app.get('/api/admin/pedidos', verificarToken, esAdministrador, async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT
                p.id_pedido,
                p.id_usuario,
                u.nombre AS cliente,
                u.correo,
                p.total,
                p.estado,
                p.fecha_pedido
            FROM pedidos p
            LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
            ORDER BY p.fecha_pedido DESC
        `);
        res.json(pedidos);
    } catch (error) {
        console.error('Error al listar pedidos:', error);
        res.status(500).json({ error: 'No se pudo cargar la lista de pedidos.' });
    }
});

// MÓDULO ADMIN: Actualizar el estado de un pedido
app.put('/api/admin/pedidos/:id/estado', verificarToken, esAdministrador, async (req, res) => {
    try {
        const idPedido = req.params.id;
        const estadosPermitidos = ['pendiente', 'en preparación', 'entregado'];
        const estado = typeof req.body.estado === 'string'
            ? req.body.estado.trim().toLowerCase()
            : '';

        if (!/^\d+$/.test(idPedido)) {
            return res.status(400).json({ error: 'El identificador del pedido no es válido.' });
        }
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ error: 'Selecciona un estado válido para el pedido.' });
        }

        const [resultado] = await pool.query(
            'UPDATE pedidos SET estado = ? WHERE id_pedido = ?',
            [estado, idPedido]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró el pedido.' });
        }

        res.json({ mensaje: 'Estado del pedido actualizado.', estado });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ error: 'No se pudo actualizar el estado del pedido.' });
    }
});

// MÓDULO ADMIN: Reportes disponibles a partir de pedidos registrados
app.get('/api/admin/reportes', verificarToken, esAdministrador, async (req, res) => {
    try {
        const [resumen] = await pool.query(`
            SELECT
                DATE_FORMAT(fecha_pedido, '%Y-%m') AS periodo,
                COUNT(*) AS pedidos,
                COALESCE(SUM(total), 0) AS ventas
            FROM pedidos
            WHERE fecha_pedido >= DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
            ORDER BY periodo DESC
        `);
        const [estados] = await pool.query(`
            SELECT estado, COUNT(*) AS cantidad
            FROM pedidos
            GROUP BY estado
            ORDER BY cantidad DESC
        `);
        const [[ventasTotales]] = await pool.query(
            'SELECT COALESCE(SUM(total), 0) AS ventas, COUNT(*) AS pedidos FROM pedidos'
        );

        res.json({
            ventas: Number(ventasTotales.ventas),
            pedidos: Number(ventasTotales.pedidos),
            porMes: resumen.map((item) => ({
                periodo: item.periodo,
                pedidos: Number(item.pedidos),
                ventas: Number(item.ventas)
            })),
            porEstado: estados.map((item) => ({
                estado: item.estado,
                cantidad: Number(item.cantidad)
            })),
            productosMasVendidos: null,
            notaProductos: 'El sistema todavía no guarda el detalle de productos de cada pedido.'
        });
    } catch (error) {
        console.error('Error al generar reportes:', error);
        res.status(500).json({ error: 'No se pudieron generar los reportes.' });
    }
});



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});