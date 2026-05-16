const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; //el token se envia como "Bearer token_aqui"

if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
    req.cliente = decoded; //disponible en los controllers como req.cliente.id
    next();
} catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
}
};

module.exports = verificarToken;