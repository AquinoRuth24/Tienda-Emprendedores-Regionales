const pedidoService = require("../services/pedidoService");

const pedidoController = {
//obtener todos los pedidos de un cliente con su info de envio y factura
obtenerPedidos: async (req, res) => {
    const { id_cliente } = req.params;
    try {
    const pedidos = await pedidoService.obtenerPedidosCliente(id_cliente);
    res.json(pedidos);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},
//obtener detalles de un pedido especifico
obtenerDetalle: async (req, res) => {
    const { id_pedido, id_cliente } = req.params;
    try {
    const pedido = await pedidoService.obtenerPedidoPorId(id_pedido, id_cliente);
    res.json(pedido);
    } catch (err) {
    res.status(404).json({ error: err.message });
    }
},
};

module.exports = pedidoController;