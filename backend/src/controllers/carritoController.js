const { sql, poolPromise } = require("../config/db");
const carritoService = require("../services/carritoService");
const facturaService = require("../services/facturaService");

const carritoController = {
  //agregar producto al carrito,si no existe se crea uno nuevo
  agregarItem: async (req, res) => {
    const { id_cliente, id_producto, cantidad, precio } = req.body;
    try {
      //Lanza excepción si el producto no existe, lo que corta el flujo acá
      await carritoService.getProducto(id_producto);
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
        return res.json({
          id_carrito: null,
          items: [],
          subtotal: 0,
        });
      }

      const items = await carritoService.obtenerItemsCarrito(
        carrito.id_carrito,
      );

      res.json({
        id_carrito: carrito.id_carrito,
        items,
        subtotal: carrito.subtotal,
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
  //finaliza la compra
  finalizarCompra: async (req, res) => {
    console.log("BODY:", req.body);
    const { id_carrito, id_cliente, total } = req.body;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      //Valida el stock de todos los productos
      const items = await carritoService.validarStockProductos(
        id_carrito,
        transaction,
      );

      //Calcula el subtotal desde la BD
      const subtotal = await carritoService.calcularSubtotal(id_carrito);

      //Actualizar stock
      await carritoService.actualizarStock(items, transaction);

      //Cambiar estado del carrito
      await new sql.Request(transaction)
        .input("id_c", sql.Int, id_carrito)
        .query(
          "UPDATE Carrito SET id_estado_carrito = 2 WHERE id_carrito = @id_c",
        );

      //Crea el pedido
      const pedidoResult = await new sql.Request(transaction)
        .input("id_cliente", sql.Int, id_cliente)
        .input("id_carrito", sql.Int, id_carrito)
        .query(`INSERT INTO Pedido (fecha_pedido, estado_pedido, id_cliente, id_carrito)
              VALUES (GETDATE(), 'pendiente', @id_cliente, @id_carrito);
              SELECT SCOPE_IDENTITY() AS id_pedido`);
      const id_pedido = pedidoResult.recordset[0].id_pedido;

      //Crea la factura
      const id_factura = await facturaService.crearFactura(
        id_pedido,
        subtotal,
        transaction,
      );

      //Carga el detalle_factura
      await facturaService.cargarDetalles(id_factura, items, transaction);

      await transaction.commit();

      res.json({
        mensaje: "Compra realizada con éxito",
        id_pedido,
        id_factura,
      });
    } catch (err) {
      await transaction.rollback();
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = carritoController;
