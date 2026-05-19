const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

//obtener detalle de una factura
router.get('/detalle/:id_factura', facturaController.obtenerDetalleFactura);

//obtener facturas de un cliente
router.get('/:id_cliente', facturaController.obtenerFacturasCliente);

module.exports = router;