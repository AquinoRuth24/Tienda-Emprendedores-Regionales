const express = require("express");
const router = express.Router();
const {
getProductos,
getProductosPorCategoria,
getCategorias,
getProductosPorEmprendedor,
getEmprendedores,
} = require("../controllers/productoController");

//Obtener todos los productos
router.get("/", getProductos);

//Obtener todas las categorías
router.get("/categorias", getCategorias);

//Obtener todos los emprendedores
router.get("/emprendedores", getEmprendedores);

//Obtener productos por categoría
router.get("/categoria/:id_categoria", getProductosPorCategoria);

//Obtener productos por emprendedor
router.get("/emprendedor/:id_usuario", getProductosPorEmprendedor);

module.exports = router;
