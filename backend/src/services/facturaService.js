const { sql, poolPromise } = require("../config/db");

const facturaService = {
//crea la factura y devuelve su id para cargar los detalles
async crearFactura(id_pedido, total, transaction) {
    const req = new sql.Request(transaction);
    const result = await req
    .input("total", sql.Decimal(10, 2), total)
    .input("id_pedido", sql.Int, id_pedido)
    .query(`
        INSERT INTO Factura (fecha, total, nro_comprobante, id_pedido, id_cliente)
        VALUES (
        GETDATE(),
        @total,
        CONCAT('FC-', CAST(GETDATE() AS VARCHAR), '-', @id_pedido),
        @id_pedido,
        (SELECT id_cliente FROM Pedido WHERE id_pedido = @id_pedido)
        );
        SELECT SCOPE_IDENTITY() AS id_factura;
    `);
    return result.recordset[0].id_factura;
},

async cargarDetalles(id_factura, items, transaction) {
    for (const item of items) {
    const req = new sql.Request(transaction);
      const subtotal = item.cantidad * item.precio;
    await req
        .input("cantidad", sql.Int, item.cantidad)
        .input("precio_unitario", sql.Decimal(10, 2), item.precio)
        .input("subtotal", sql.Decimal(10, 2), subtotal)
        .input("id_factura", sql.Int, id_factura)
        .input("id_producto", sql.Int, item.id_producto)
        .query(`
        INSERT INTO Detalle_factura 
            (cantidad, precio_unitario, subtotal, id_factura, id_producto)
        VALUES 
            (@cantidad, @precio_unitario, @subtotal, @id_factura, @id_producto)
        `);
    }
},
};

module.exports = facturaService;