const express = require("express");
const router = express.Router();
const {
getProductos,
getProductosPorCategoria,
getCategorias,
getProductosPorEmprendedor,
getEmprendedores,
getProducto,    
validarStock  
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

//Validar stock de un producto antes de agregar al carrito
router.get("/:id_producto/stock", validarStock);

//Obtener un producto por su id 
router.get("/:id_producto", getProducto);

module.exports = router;
