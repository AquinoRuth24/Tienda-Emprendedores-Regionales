const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const  verificarToken  = require('../middlewares/authMiddleware');

// ← agregá esto para ver qué tiene el controlador
console.log("carritoController:", Object.keys(carritoController));
console.log("validarAntesDeEnvio:", carritoController.validarAntesDeEnvio);

router.post('/agregar', carritoController.agregarItem);
router.post('/eliminar', carritoController.eliminarItem);
router.post('/actualizar', carritoController.actualizarCantidad);
router.post('/finalizar-con-envio', carritoController.finalizarCompraConEnvio);

router.get("/validar/:id_carrito", verificarToken, carritoController.validarAntesDeEnvio);
router.get('/:id_cliente', carritoController.obtenerCarrito);

module.exports = router;