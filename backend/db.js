
const mysql = require('mysql2/promise');
require('dotenv').config();

const configuracion = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
};

if (process.env.NODE_ENV === 'production') {
    configuracion.ssl = {
        ca: process.env.DB_CA_CERT
    };
} else {
    configuracion.authPlugins = {
        mysql_native_password: () =>
            () => Buffer.from(process.env.DB_PASSWORD + '\0')
    };
}

const pool = mysql.createPool(configuracion);

async function verificarConexion() {
    try {
        const conexion = await pool.getConnection();
        console.log('Conectado exitosamente a MySQL: CandyKane');
        conexion.release();
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
    }
}

verificarConexion();

module.exports = pool;
