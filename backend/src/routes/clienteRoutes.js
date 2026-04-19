const express = require('express');//importa express para manejar las rutas del servidor
const router = express.Router();//importa las funciones del controlador para manejo de registros.
//se declara el controlador de clientes.
const { registrar, login, logout } = require('../controllers/clienteController');
//se define las rutas para registrar, iniciar y cerrar sesion.
router.post('/registrar', registrar);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;