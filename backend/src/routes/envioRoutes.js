const express = require('express');
const router = express.Router();
const envioController = require('../controllers/envioController');

//obtener opciones de recepción (envío a domicilio / retiro en el local)
router.get('/metodos', envioController.obtenerMetodos);

// envío a domicilio → calcularCostoEnvio(direccion)
router.post('/calcular', envioController.calcularCosto);

//envio a domicilio → asociarEnvio(id_pedido)
router.post('/asociar', envioController.asociarEnvio);

//obtener envio de un pedido
router.get('/:id_pedido', envioController.obtenerEnvio);

//actualizar estado del envio
router.post('/estado', envioController.actualizarEstado);

module.exports = router;