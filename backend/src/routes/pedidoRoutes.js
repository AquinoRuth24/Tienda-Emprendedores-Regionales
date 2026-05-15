const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

//Obtener todos los pedidos de un cliente
router.get('/:id_cliente', pedidoController.obtenerPedidos);

//Obtener detalle de un pedido específico
router.get('/detalle/:id_pedido/:id_cliente', pedidoController.obtenerDetalle);

module.exports = router;