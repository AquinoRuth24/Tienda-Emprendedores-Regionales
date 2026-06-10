const { sql, poolPromise } = require("../config/db");

const pedidoService = {
// Obtener todos los pedidos de un cliente con su info de envío y factura
async obtenerPedidosCliente(id_cliente) {
    const pool = await poolPromise;
    const result = await pool.request().input("id_cliente", sql.Int, id_cliente)
    .query(`
        SELECT 
        p.id_pedido,
        p.fecha_pedido,
        ep.descripcion AS estado_pedido,
        f.id_factura,
        f.total,
        f.nro_comprobante,
        f.fecha AS fecha_factura,
        te.descripcion AS tipo_envio,
        ee.descripcion AS estado_envio,
        e.costo_envio,
        d.calle,
        d.numero,
        d.descripcion AS referencia,
        c.nombre AS ciudad,
        pr.nombre AS provincia
        FROM Pedido p
        INNER JOIN estado_pedido ep ON p.id_estado_pedido = ep.id_estado_pedido
        LEFT JOIN Factura f ON f.id_pedido = p.id_pedido
        LEFT JOIN Envio e ON e.id_pedido = p.id_pedido
        LEFT JOIN Tipo_envio te ON e.id_tipo_envio = te.id_tipo_envio
        LEFT JOIN estado_envio ee ON e.id_estado_envio = ee.id_estado_envio
        LEFT JOIN Direccion d ON e.id_direccion = d.id_direccion
        LEFT JOIN Ciudad c ON d.id_ciudad = c.id_ciudad
        LEFT JOIN Provincia pr ON c.id_provincia = pr.id_provincia
        WHERE p.id_cliente = @id_cliente
        ORDER BY p.fecha_pedido DESC
    `);

//Para cada pedido obtener sus productos
const pedidos = result.recordset;
    for (const pedido of pedidos) {
    if (pedido.id_factura) {
        const detalle = await pool
        .request()
        .input("id_factura", sql.Int, pedido.id_factura).query(`
            SELECT 
            df.cantidad,
            df.precio_unitario,
            df.subtotal,
            pr.nombre,
            pr.imagen
            FROM Detalle_factura df
            INNER JOIN Producto pr ON df.id_producto = pr.id_producto
            WHERE df.id_factura = @id_factura
        `);
        pedido.productos = detalle.recordset;
    } else {
        pedido.productos = [];
    }
}
return pedidos;
},

//Obtener un pedido específico
async obtenerPedidoPorId(id_pedido, id_cliente) {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .input("id_pedido", sql.Int, id_pedido)
    .input("id_cliente", sql.Int, id_cliente).query(`
        SELECT 
        p.id_pedido,
        p.fecha_pedido,
        ep.descripcion AS estado_pedido
        FROM Pedido p
        INNER JOIN estado_pedido ep ON p.id_estado_pedido = ep.id_estado_pedido
        WHERE p.id_pedido = @id_pedido AND p.id_cliente = @id_cliente
    `);
    if (!result.recordset[0]) {
    throw new Error("Pedido no encontrado");
    }
    return result.recordset[0];
},

async obtenerEstadoPedido(id_pedido) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id_pedido', sql.Int, id_pedido)
    .query(`SELECT ep.descripcion AS estado_pedido
            FROM Pedido p
            INNER JOIN estado_pedido ep 
              ON p.id_estado_pedido = ep.id_estado_pedido
            WHERE p.id_pedido = @id_pedido`);
  if (!result.recordset[0]) {
    throw new Error('Pedido no encontrado');
  }
  return result.recordset[0].estado_pedido;
},

};

module.exports = pedidoService;
