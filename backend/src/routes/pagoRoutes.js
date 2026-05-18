const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

//obtener metodos de pago disponibles
router.get('/metodos', pagoController.obtenerMetodos);

//registrar un pago para una factura
router.post('/registrar', pagoController.registrarPago);

//obtener pago de una factura
router.get('/factura/:id_factura', pagoController.obtenerPago);

module.exports = router;