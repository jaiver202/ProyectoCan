// authMiddleware.js - Valida el Token JWT y los permisos de administrador
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'clave_secreta_super_segura_candykane';

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token de autenticación.' });
    }

    try {
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado; // Guardamos los datos del usuario en la petición
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
}

function esAdministrador(req, res, next) {
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso prohibido. Se requieren permisos de administrador.' });
    }
}

module.exports = { verificarToken, esAdministrador };