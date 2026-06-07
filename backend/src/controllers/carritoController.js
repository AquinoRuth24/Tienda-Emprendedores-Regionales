const { sql, poolPromise } = require("../config/db");
const carritoService = require("../services/carritoService");

const carritoController = {

  //agregar producto al carrito, si no existe se crea uno nuevo
  agregarItem: async (req, res) => {
    const { id_cliente, id_producto, cantidad, precio } = req.body;
    if (!id_cliente || !id_producto || !cantidad || !precio) {
  return res.status(400).json({
    error: "Faltan datos requeridos",
  });
}
if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser un número entero mayor a 0" });
  }
  
    try {
      await carritoService.getProducto(id_producto);

      const stock = await carritoService.verificarStock(id_producto);
      if (stock < cantidad) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }

      const resultado = await carritoService.agregarProducto(
        id_cliente,
        id_producto,
        cantidad,
        precio,
      );
      res.json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  //eliminar un producto del carrito
  eliminarItem: async (req, res) => {
    const { id_item_carrito, id_carrito } = req.body;
    try {
      const resultado = await carritoService.eliminarItem(
        id_item_carrito,
        id_carrito,
      );
      res.json(resultado);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  //obtener el carrito activo de un cliente
  obtenerCarrito: async (req, res) => {
    const { id_cliente } = req.params;
    try {
      const carrito = await carritoService.obtenerCarritoActivo(id_cliente);

      if (!carrito) {
        return res.json({ id_carrito: null, items: [], subtotal: 0 });
      }

      const items = await carritoService.obtenerItemsCarrito(carrito.id_carrito);
      res.json({
        id_carrito: carrito.id_carrito,
        items,
        subtotal: carrito.total_carrito,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  //actualizar cantidad de un producto en el carrito
  actualizarCantidad: async (req, res) => {
    const { id_item_carrito, nueva_cantidad, id_carrito } = req.body;
    try {
      const resultado = await carritoService.actualizarCantidad(
        id_item_carrito,
        nueva_cantidad,
        id_carrito,
      );
      res.json(resultado);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

//finalizar la compra y registrar el envio
finalizarCompraConEnvio: async (req, res) => {
    const id_cliente = req.cliente.id; //obtenemos el id del cliente desde el token
    const { id_carrito, datosEnvio } = req.body;
    try {
      const resultado = await carritoService.finalizarCompraConEnvio(
        id_carrito,
        id_cliente,
        datosEnvio
      );
      res.json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
validarAntesDeEnvio: async (req, res) => {
  const { id_carrito } = req.params;
  try {
    const pool = await poolPromise;

    // Verifica carrito activo
    const carritoResult = await pool
      .request()
      .input("id_carrito", sql.Int, id_carrito)
      .query(`SELECT id_estado_carrito FROM Carrito WHERE id_carrito = @id_carrito`);

    if (!carritoResult.recordset[0]) {
      return res.status(400).json({ error: "El carrito no existe" });
    }
    if (carritoResult.recordset[0].id_estado_carrito !== 1) {
      return res.status(400).json({ error: "Este carrito ya fue procesado" });
    }

    // Verifica stock de cada item
    const stockResult = await pool
      .request()
      .input("id_carrito", sql.Int, id_carrito)
      .query(`
        SELECT p.nombre, ic.cantidad, p.stock
        FROM Item_carrito ic
        INNER JOIN Producto p ON ic.id_producto = p.id_producto
        WHERE ic.id_carrito = @id_carrito
      `);

    const sinStock = stockResult.recordset.filter(i => i.cantidad > i.stock);
    if (sinStock.length > 0) {
      return res.status(400).json({ error: "Stock insuficiente para uno o más productos" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
};

module.exports = carritoController;