const carritoService = require("../services/carritoService");

const carritoController = {

  //agregar producto al carrito, si no existe se crea uno nuevo
  agregarItem: async (req, res) => {
    const { id_cliente, id_producto, cantidad, precio } = req.body;
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

  //finalizar compra
  finalizarCompra: async (req, res) => {
    const { id_carrito, id_cliente } = req.body;
    try {
      const resultado = await carritoService.finalizarCompra(id_carrito, id_cliente);
      res.json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
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
};

module.exports = carritoController;