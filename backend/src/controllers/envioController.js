const { sql, poolPromise } = require("../config/db");
const envioService = require("../services/envioService");

const envioController = {
//muestra las opciones de recepción al cliente(retiro en local o envio a domicilio)
obtenerMetodos: async (req, res) => {
    try {
    const metodos = await envioService.obtenerMetodosEnvio();
    res.json(metodos);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},

//*************Retiro en el local*************

//registra la modalidad de retiro en el pedido
registrarRetiro: async (req, res) => {
    const { id_pedido } = req.body;
    try {
    await envioService.registrarModalidadRetiro(id_pedido);
    res.json({ mensaje: "Listo para retirar en el local" });
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
},

//*************ENVÍO A DOMICILIO*************

//calcula el costo de envío según el método seleccionado
calcularCosto: async (req, res) => {
    const { id_tipo_envio } = req.body;
    try {
    const costo = await envioService.calcularCostoEnvio(id_tipo_envio);
    res.json({ costo });
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
},

//asocia el envío al pedido con dirección y costo
asociarEnvio: async (req, res) => {
    const {
    id_pedido,
    id_tipo_envio,
    calle,
    numero,
    descripcion,
    ciudad,
    codigo_postal,
    provincia,
    } = req.body;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
await transaction.begin();

const { costo, id_direccion } = await envioService.asociarEnvio(
        id_pedido,
        id_tipo_envio,
        calle,
        numero,
        descripcion,
        ciudad,
        codigo_postal,
        provincia,
        transaction
    );
await transaction.commit();
    res.json({ mensaje: "Envío registrado con éxito", costo, id_direccion });
    } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message });
    }
},

//obtener el envío asociado a un pedido
obtenerEnvio: async (req, res) => {
    const { id_pedido } = req.params;
    try {
    const envio = await envioService.obtenerEnvioPorPedido(id_pedido);
    if (!envio) return res.status(404).json({ error: "Envío no encontrado" });
    res.json(envio);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},

//actualizar el estado del envío (Pendiente / Despachado / En camino / Entregado / Cancelado)
actualizarEstado: async (req, res) => {
    const { id_envio, id_estado_envio } = req.body;
    try {
    await envioService.actualizarEstadoEnvio(id_envio, id_estado_envio);
    res.json({ mensaje: "Estado del envío actualizado correctamente" });
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
},
};

module.exports = envioController;