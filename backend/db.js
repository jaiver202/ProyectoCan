const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});
async function verificarConexion() {
    try {
        const conexion = await pool.getConnection();
        console.log('Conectado exitosamente a la base de datos MySQL en Aiven: CandyKane');
        conexion.release();
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
    }
}

verificarConexion();

module.exports = pool;