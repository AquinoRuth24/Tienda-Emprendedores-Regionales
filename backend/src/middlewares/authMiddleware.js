const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
const authHeader = req.headers["authorization"];
const token = authHeader && authHeader.split(" ")[1];

if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
}

if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET no está definido en las variables de entorno.");
    return res.status(500).json({ error: "Error de configuración del servidor." });
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.cliente = decoded; //disponible en los controllers para obtener el id del cliente
    next();
} catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
}
};

module.exports = verificarToken;