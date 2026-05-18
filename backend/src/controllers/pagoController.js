const pagoService = require("../services/pagoService");
const pagoController = {

//obtener metodos de pago disponibles
obtenerMetodos: async (req, res) => {
    try {
    const metodos = await pagoService.obtenerMetodosPago();
    res.json(metodos);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},

//registar un pago para una factura
registrarPago: async (req, res) => {
    const { id_factura, id_metodo_pago } = req.body;
    try {
    const resultado = await pagoService.registrarPago(id_factura, id_metodo_pago);
    res.json(resultado);
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
},

//obtener pago de una factura
obtenerPago: async (req, res) => {
    const { id_factura } = req.params;
    try {
    const pago = await pagoService.obtenerPagoPorFactura(id_factura);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    res.json(pago);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},
};

module.exports = pagoController;