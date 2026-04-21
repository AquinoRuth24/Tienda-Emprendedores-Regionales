const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');

router.post('/agregar', carritoController.agregarItem);
router.post('/eliminar', carritoController.eliminarItem);
router.post('/actualizar', carritoController.actualizarCantidad);
router.post('/finalizar', carritoController.finalizarCompra);
router.get('/:id_cliente', carritoController.obtenerCarrito);
module.exports = router;