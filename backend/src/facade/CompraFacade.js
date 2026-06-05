// src/facade/CompraFacade.js
// Patrón de diseño: Facade (Estructural)
// Librería del framework: express + express-async-errors
// Propósito: proveer una interfaz simplificada al subsistema complejo
//            de compra. El frontend hace UNA sola llamada; la Facade
//            orquesta CarritoService, EnvioService, FacturaService
//            y PedidoService de forma transparente.

require('express-async-errors');

const { Router } = require('express');
const { sql, poolPromise } = require('../config/db');

const carritoService = require('../services/carritoService');
const envioService   = require('../services/envioService');
const facturaService = require('../services/facturaService');
const pedidoService  = require('../services/pedidoService');

//Clase Facade que unifica la complejidad de los subsistemas de compra en una interfaz simple para el frontend
class CompraFacade {

// Operación unificada de compra.

async finalizarCompra(id_carrito, id_cliente, datosEnvio) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
    await transaction.begin();

//Validar que el carrito sigue activo
    const req1 = new sql.Request(transaction);
    const carritoResult = await req1
        .input('id_carrito', sql.Int, id_carrito)
        .query(`
        SELECT id_carrito, total_carrito, id_estado_carrito
        FROM Carrito
        WHERE id_carrito = @id_carrito AND id_estado_carrito = 1
        `);

    if (!carritoResult.recordset[0]) {
        throw new Error('Este carrito ya fue procesado o no existe');
    }

    const subtotal = carritoResult.recordset[0].total_carrito ?? 0;

//Subsistema CarritoService: validar stock y descontarlo
    const items = await carritoService.validarStockProductos(id_carrito, transaction);
    await carritoService.actualizarStock(items, transaction);
    await carritoService.cambiarEstadoCarrito(id_carrito, transaction);

// Subsistema CarritoService: crear el pedido
    const id_pedido = await carritoService.crearPedido(id_cliente, id_carrito, transaction);

//Subsistema EnvioService: calcular y registrar envío
    let costoEnvio = 0;
    if (datosEnvio.tipo !== 'retiro') {
        costoEnvio = await envioService.calcularCostoEnvio(datosEnvio.id_tipo_envio);
        await envioService.asociarEnvio(
        id_pedido,
        datosEnvio.id_tipo_envio,
        datosEnvio.calle,
        datosEnvio.numero,
        datosEnvio.descripcion,
        datosEnvio.ciudad,
        datosEnvio.codigo_postal ?? 0,
        datosEnvio.provincia,
        transaction
        );
    } else {
        await envioService.registrarModalidadRetiro(id_pedido, transaction);
    }

    //Subsistema FacturaService: generar comprobante
    const totalFinal = subtotal + Number(costoEnvio);
    const id_factura = await facturaService.crearFactura(id_pedido, totalFinal, transaction);
    await facturaService.cargarDetalles(id_factura, items, transaction);

    await transaction.commit();

    return { mensaje: 'Compra realizada con éxito', id_pedido, id_factura, totalFinal };
    } catch (err) {
    await transaction.rollback();
    throw err;
    }
}

// Consulta unificada: historial completo del cliente
async obtenerHistorialCliente(id_cliente) {
    return pedidoService.obtenerPedidosCliente(id_cliente);
}
}
//Router de Compra 
// El Router es la interfaz unificada del patrón:

const facade = new CompraFacade();
const router = Router();

//finalizar compra: el cliente envía y la Facade hace todo lo demás
router.post('/finalizar', async (req, res) => {
const id_cliente = req.cliente.id;
const { id_carrito, datosEnvio } = req.body;
const resultado = await facade.finalizarCompra(id_carrito, id_cliente, datosEnvio);
res.status(201).json(resultado);
});
//historial de compras: el cliente consulta su historial completo, y la Facade orquesta la consulta a PedidoService
router.get('/historial', async (req, res) => {
const id_cliente = req.cliente.id;
const historial = await facade.obtenerHistorialCliente(id_cliente);
res.json(historial);
});

module.exports = { CompraFacade, router };