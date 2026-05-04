const productoService = require("../services/productoService");

//obtener todos los productos disponibles 
const getProductos = async (req, res) => {
  try {
    const productos = await productoService.getProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

//obtener producos por categoria
const getProductosPorCategoria = async (req, res) => {
  const { id_categoria } = req.params;
  try {
    const productos =
      await productoService.getProductosPorCategoria(
        id_categoria,
      );
    res.json(productos);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

//obtener todas las categorias
const getCategorias = async (req, res) => {
  try {
    const categorias =
      await productoService.getCategorias();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

//obtener productos por emprendedor
const getProductosPorEmprendedor = async (
  req,
  res,
) => {
  const { id_usuario } = req.params;
  try {
    const productos =
      await productoService.getProductosPorEmprendedor(
        id_usuario,
      );
    res.json(productos);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

//obtener todos los emprendedores
const getEmprendedores = async (req, res) => {
  try {
    const emprendedores =
      await productoService.getEmprendedores();
    res.json(emprendedores);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

//obtener un producto por su ID
const getProducto = async (req, res) => {
  const { id_producto } = req.params;
  try {
    const producto =
      await productoService.getProducto(
        id_producto,
      );
    res.json(producto);
  } catch (err) {
    if (err.message === "Producto no encontrado") {
      return res.status(404).json({
        error: err.message,
      });
    }
    res.status(500).json({
      error: err.message,
    });
  }
};

//validar stock de un producto
const validarStock = async (req, res) => {
  const { id_producto } = req.params;
  const { cantidad } = req.query;
  try {
    const resultado =
      await productoService.validarStock(
        id_producto,
        cantidad,
      );
    res.json(resultado);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = {
  getProductos,
  getProductosPorCategoria,
  getCategorias,
  getProductosPorEmprendedor,
  getEmprendedores,
  getProducto,
  validarStock,
};