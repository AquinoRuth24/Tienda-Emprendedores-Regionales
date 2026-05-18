const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

//obtener facturas de un cliente
router.get('/:id_cliente', facturaController.obtenerFacturasCliente);

//obtener detalle de una factura
router.get('/detalle/:id_factura', facturaController.obtenerDetalleFactura);

module.exports = router;