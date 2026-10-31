const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { verificarToken, esAdministrador } = require('./authMiddleware');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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