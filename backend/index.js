const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { verificarToken, esAdministrador } = require('./authMiddleware');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
let perfilTablasListas;

app.use(cors());
app.use(express.json());

function asegurarTablasPerfil() {
    if (!perfilTablasListas) {
        perfilTablasListas = Promise.all([
            pool.query(`
                CREATE TABLE IF NOT EXISTS ck_direcciones (
                    id_direccion INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    id_usuario INT NOT NULL,
                    alias VARCHAR(60) NOT NULL,
                    direccion VARCHAR(255) NOT NULL,
                    ciudad VARCHAR(100) NOT NULL,
                    referencia VARCHAR(255) NULL,
                    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_ck_direcciones_usuario (id_usuario)
                )
            `),
            pool.query(`
                CREATE TABLE IF NOT EXISTS ck_favoritos (
                    id_usuario INT NOT NULL,
                    id_producto INT NOT NULL,
                    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id_usuario, id_producto)
                )
            `),
            pool.query(`
                CREATE TABLE IF NOT EXISTS ck_pedidos (
                    id_pedido INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    id_usuario INT NOT NULL,
                    estado VARCHAR(40) NOT NULL DEFAULT 'pendiente',
                    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_ck_pedidos_usuario (id_usuario)
                )
            `)
        ]).catch((error) => {
            perfilTablasListas = null;
            throw error;
        });
    }

    return perfilTablasListas;
}

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de CandyKane funcionando correctamente' });
});

// Ruta para ver el catálogo de postres
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

const bcrypt = require('bcrypt');

// ==========================================================
// RUTA 4: Registrar un nuevo usuario (Cliente) de forma segura
// ==========================================================
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, correo, contrasena, telefono, direccion } = req.body;

        // 1. Validar que los campos obligatorios no estén vacíos
        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }

        // 2. Verificar si el correo ya está registrado en la base de datos
        const [usuarioExistente] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // 3. Encriptar la contraseña de forma segura usando bcrypt (10 rondas de sal)
        const saltRounds = 10;
        const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

        // 4. Guardar el usuario en la tabla usuarios (por defecto el rol será 'cliente')
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

const jwt = require('jsonwebtoken');

// Clave secreta para firmar los tokens (en un proyecto real va en el archivo .env)
const JWT_SECRET = 'clave_secreta_super_segura_candykane';

// ==========================================================
// RUTA 5: Iniciar sesión (Login) de usuarios y administradores
// ==========================================================
app.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        // 1. Validar que envíen correo y contraseña
        if (!correo || !contrasena) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }

        // 2. Buscar al usuario en la base de datos por su correo
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE',
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const usuario = usuarios[0];

        // 3. Comparar la contraseña escrita con el hash guardado usando bcrypt
        const contraseñaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contraseñaCorrecta) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        // 4. Generar un Token JWT con los datos del usuario y su rol ('cliente' o 'admin')
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                correo: usuario.correo, 
                rol: usuario.rol 
            },
            JWT_SECRET,
            { expiresIn: '8h' } // El token expira en 8 horas
        );

        // 5. Responder al frontend con el token y los datos básicos (sin la contraseña)
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

app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        await asegurarTablasPerfil();
        const idUsuario = req.usuario.id_usuario;
        const [[usuario]] = await pool.query(
            `SELECT id_usuario, nombre, correo, telefono
             FROM usuarios
             WHERE id_usuario = ? AND activo = TRUE`,
            [idUsuario]
        );

        if (!usuario) {
            return res.status(404).json({ error: 'No se encontró la cuenta del usuario.' });
        }

        const [direcciones] = await pool.query(
            `SELECT id_direccion, alias, direccion, ciudad, referencia
             FROM ck_direcciones
             WHERE id_usuario = ?
             ORDER BY creado_en DESC`,
            [idUsuario]
        );
        const [favoritos] = await pool.query(
            `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen
             FROM ck_favoritos f
             INNER JOIN productos p ON p.id_producto = f.id_producto
             WHERE f.id_usuario = ?
             ORDER BY f.creado_en DESC`,
            [idUsuario]
        );
        const [pedidos] = await pool.query(
            `SELECT id_pedido, estado, total, creado_en
             FROM ck_pedidos
             WHERE id_usuario = ?
             ORDER BY creado_en DESC`,
            [idUsuario]
        );

        res.json({ usuario, direcciones, favoritos, pedidos });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'No se pudo cargar la información del perfil.' });
    }
});

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

app.post('/api/perfil/direcciones', verificarToken, async (req, res) => {
    try {
        await asegurarTablasPerfil();
        const alias = typeof req.body.alias === 'string' ? req.body.alias.trim() : '';
        const direccion = typeof req.body.direccion === 'string' ? req.body.direccion.trim() : '';
        const ciudad = typeof req.body.ciudad === 'string' ? req.body.ciudad.trim() : '';
        const referencia = typeof req.body.referencia === 'string' ? req.body.referencia.trim() : '';

        if (!alias || !direccion || !ciudad) {
            return res.status(400).json({ error: 'El alias, la dirección y la ciudad son obligatorios.' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO ck_direcciones (id_usuario, alias, direccion, ciudad, referencia)
             VALUES (?, ?, ?, ?, ?)`,
            [req.usuario.id_usuario, alias, direccion, ciudad, referencia || null]
        );

        res.status(201).json({
            id_direccion: resultado.insertId,
            alias,
            direccion,
            ciudad,
            referencia: referencia || null
        });
    } catch (error) {
        console.error('Error al guardar la dirección:', error);
        res.status(500).json({ error: 'No se pudo guardar la dirección.' });
    }
});

app.delete('/api/perfil/direcciones/:id', verificarToken, async (req, res) => {
    try {
        await asegurarTablasPerfil();
        const [resultado] = await pool.query(
            'DELETE FROM ck_direcciones WHERE id_direccion = ? AND id_usuario = ?',
            [req.params.id, req.usuario.id_usuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró esa dirección.' });
        }

        res.json({ mensaje: 'Dirección eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la dirección:', error);
        res.status(500).json({ error: 'No se pudo eliminar la dirección.' });
    }
});

app.post('/api/perfil/favoritos', verificarToken, async (req, res) => {
    try {
        await asegurarTablasPerfil();
        const idProducto = Number(req.body.id_producto);
        if (!Number.isInteger(idProducto) || idProducto <= 0) {
            return res.status(400).json({ error: 'Selecciona un postre válido.' });
        }

        const [producto] = await pool.query(
            'SELECT id_producto FROM productos WHERE id_producto = ? AND activo = TRUE',
            [idProducto]
        );
        if (producto.length === 0) {
            return res.status(404).json({ error: 'No se encontró ese postre.' });
        }

        await pool.query(
            'INSERT IGNORE INTO ck_favoritos (id_usuario, id_producto) VALUES (?, ?)',
            [req.usuario.id_usuario, idProducto]
        );

        res.status(201).json({ mensaje: 'Postre agregado a tus favoritos.' });
    } catch (error) {
        console.error('Error al guardar el favorito:', error);
        res.status(500).json({ error: 'No se pudo guardar el postre favorito.' });
    }
});

app.delete('/api/perfil/favoritos/:idProducto', verificarToken, async (req, res) => {
    try {
        await asegurarTablasPerfil();
        const [resultado] = await pool.query(
            'DELETE FROM ck_favoritos WHERE id_usuario = ? AND id_producto = ?',
            [req.usuario.id_usuario, req.params.idProducto]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Ese postre no está en tus favoritos.' });
        }

        res.json({ mensaje: 'Postre eliminado de tus favoritos.' });
    } catch (error) {
        console.error('Error al eliminar el favorito:', error);
        res.status(500).json({ error: 'No se pudo eliminar el postre favorito.' });
    }
});

app.put('/api/perfil/contrasena', verificarToken, async (req, res) => {
    try {
        const { contrasenaActual, contrasenaNueva } = req.body;
        if (
            typeof contrasenaActual !== 'string'
            || typeof contrasenaNueva !== 'string'
            || !contrasenaActual
            || contrasenaNueva.length < 8
        ) {
            return res.status(400).json({ error: 'Ingresa tu contraseña actual y una nueva de al menos 8 caracteres.' });
        }

        const [usuarios] = await pool.query(
            'SELECT contrasena_hash FROM usuarios WHERE id_usuario = ? AND activo = TRUE',
            [req.usuario.id_usuario]
        );
        if (usuarios.length === 0 || !(await bcrypt.compare(contrasenaActual, usuarios[0].contrasena_hash))) {
            return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
        }

        const contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
        await pool.query(
            'UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?',
            [contrasenaHash, req.usuario.id_usuario]
        );

        res.json({ mensaje: 'La contraseña se cambió correctamente.' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ error: 'No se pudo cambiar la contraseña.' });
    }
});


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

// ==========================================================
// RUTA 7: ACTUALIZAR PRODUCTO (Solo Administrador)
// ==========================================================
app.put('/api/productos/:id', verificarToken, esAdministrador, async (req, res) => {
    try {
        const idProducto = req.params.id;
        const { nombre, descripcion, precio, stock, imagen, activo } = req.body;

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
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});