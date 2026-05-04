const { sql, poolPromise } = require("../config/db");

const productoService = {
//obtener todos los productos disponibles 
async getProductos() {
    const pool = await poolPromise;
    const resultado = await pool.request().query(`
    SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.stock,
        p.precio,
        c.descripcion AS categoria,
        p.id_categoria,
        p.id_usuario,
        p.imagen
    FROM Producto p
    INNER JOIN Categoria c
        ON p.id_categoria = c.id_categoria
    `);
    return resultado.recordset;
},

//obtener productos por categoria
async getProductosPorCategoria(id_categoria) {
    const pool = await poolPromise;
    const resultado = await pool
    .request()
    .input("id_categoria", sql.Int, id_categoria)
    .query(`
        SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.stock,
        p.precio,
        c.descripcion AS categoria,
        p.id_categoria,
        p.id_usuario,
        p.imagen
        FROM Producto p
        INNER JOIN Categoria c
        ON p.id_categoria = c.id_categoria
        WHERE p.id_categoria = @id_categoria
    `);
    return resultado.recordset;
},
//obtener todas las categorias
async getCategorias() {
    const pool = await poolPromise;
    const resultado = await pool
    .request()
    .query(`
        SELECT *
        FROM Categoria
    `);
    return resultado.recordset;
},

//obtener productos por emprendedor
async getProductosPorEmprendedor(id_usuario) {
    const pool = await poolPromise;
    const resultado = await pool
    .request()
    .input("id_usuario", sql.Int, id_usuario)
    .query(`
        SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.stock,
        p.precio,
        c.descripcion AS categoria,
        p.id_categoria,
        p.id_usuario,
        p.imagen
        FROM Producto p
        INNER JOIN Categoria c
        ON p.id_categoria = c.id_categoria
        WHERE p.id_usuario = @id_usuario
    `);
    return resultado.recordset;
},

//obtener todos los emprendedores
async getEmprendedores() {
    const pool = await poolPromise;
    const resultado = await pool.request().query(`
    SELECT DISTINCT
        u.id_usuario,
        u.apellidoNombre,
        STRING_AGG(c.descripcion, ', ') AS categorias
    FROM Usuario u
    INNER JOIN Producto p
        ON u.id_usuario = p.id_usuario
    INNER JOIN Categoria c
        ON p.id_categoria = c.id_categoria
    GROUP BY
        u.id_usuario,
        u.apellidoNombre
    `);
    return resultado.recordset;
},

//obtener producto por ID
async getProducto(id_producto) {
    const pool = await poolPromise;

    const resultado = await pool
    .request()
    .input("id_producto", sql.Int, id_producto)
    .query(`
        SELECT *
        FROM Producto p
        INNER JOIN Categoria c
        ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = @id_producto
    `);
    if (resultado.recordset.length === 0) {
    throw new Error("Producto no encontrado");
    }
    return resultado.recordset[0];
},

//validar stock de un producto
async validarStock(id_producto, cantidad) {
    const pool = await poolPromise;
    const resultado = await pool
    .request()
    .input("id_producto", sql.Int, id_producto)
    .query(`
        SELECT stock
        FROM Producto
        WHERE id_producto = @id_producto
    `);
    const stock =
    resultado.recordset[0]?.stock ?? 0;
    if (stock >= parseInt(cantidad)) {
    return {
        disponible: true,
        stock,
    };
    } else {
    return {
        disponible: false,
        stock,
    };
    }
},
};

module.exports = productoService;