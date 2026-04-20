const { sql, poolPromise } = require("../config/db");

//OBTENER TODOS LOS PRODUCTOS CON SU CATEGORÍA
const getProductos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const resultado = await pool.request().query(`
        SELECT p.id_producto, p.nombre, p.descripcion, p.stock, p.precio,
            c.descripcion AS categoria, p.id_categoria, p.id_usuario, p.imagen
        FROM Producto p
        INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
    `);
    res.json(resultado.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//OBTENER PRODUCTOS POR CATEGORÍA
const getProductosPorCategoria = async (req, res) => {
  const { id_categoria } = req.params;
  try {
    const pool = await poolPromise;
    const resultado = await pool
      .request()
      .input("id_categoria", sql.Int, id_categoria).query(`
        SELECT p.id_producto, p.nombre, p.descripcion, p.stock, p.precio,
            c.descripcion AS categoria, p.id_categoria, p.id_usuario, p.imagen
        FROM Producto p
        INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
        WHERE p.id_categoria = @id_categoria
    `);
    res.json(resultado.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//OBTENER TODAS LAS CATEGORÍAS
const getCategorias = async (req, res) => {
  try {
    const pool = await poolPromise;
    const resultado = await pool.request().query("SELECT * FROM Categoria");
    res.json(resultado.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//OBTENER PRODUCTOS POR EMPRENDEDOR
const getProductosPorEmprendedor = async (req, res) => {
  const { id_usuario } = req.params;
  try {
    const pool = await poolPromise;
    const resultado = await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario).query(`
        SELECT p.id_producto, p.nombre, p.descripcion, p.stock, p.precio,
          c.descripcion AS categoria, p.id_categoria, p.id_usuario, p.imagen
        FROM Producto p
        INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
        WHERE p.id_usuario = @id_usuario
    `);
    res.json(resultado.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//OBTENER TODOS LOS EMPRENDEDORES
const getEmprendedores = async (req, res) => {
  try {
    const pool = await poolPromise;
    const resultado = await pool.request().query(`
        SELECT DISTINCT u.id_usuario, u.apellidoNombre,
              STRING_AGG(c.descripcion, ', ') AS categorias
        FROM Usuario u
        INNER JOIN Producto p ON u.id_usuario = p.id_usuario
        INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
        GROUP BY u.id_usuario, u.apellidoNombre
      `);
    res.json(resultado.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  getProductos,
  getProductosPorCategoria,
  getCategorias,
  getProductosPorEmprendedor,
  getEmprendedores,
};
