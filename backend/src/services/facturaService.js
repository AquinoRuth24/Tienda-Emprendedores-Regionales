const { sql, poolPromise } = require("../config/db");

const facturaService = {
//crear la factura despues de finalizar la compra(se llama desde carritoController.finalizarCompra)
async crearFactura(id_pedido, total, transaction) {
    const req = new sql.Request(transaction);
    const result = await req
    .input("total", sql.Decimal(10, 2), total)
    .input("id_pedido", sql.Int, id_pedido)
    .query(`
        DECLARE @nuevoId INT;
        SELECT @nuevoId = ISNULL(MAX(id_factura), 0) + 1 FROM Factura;
        INSERT INTO Factura (id_factura, fecha, total, id_pedido)
        VALUES (@nuevoId, GETDATE(), @total, @id_pedido);
        SELECT @nuevoId AS id_factura;
    `);
    return result.recordset[0].id_factura;
},

  //Llena la tabla Detalle_factura
async cargarDetalles(id_factura, items, transaction) {
    for (const item of items) {
    const req = new sql.Request(transaction);
    await req
        .input("cantidad", sql.Int, item.cantidad)
        .input("precio_unitario", sql.Decimal(10, 2), item.precio)
        .input("id_factura", sql.Int, id_factura)
        .input("id_producto", sql.Int, item.id_producto)
        .query(`INSERT INTO Detalle_factura (cantidad, precio_unitario, id_factura, id_producto)
                VALUES (@cantidad, @precio_unitario, @id_factura, @id_producto)`);
    }
},
};

module.exports = facturaService;