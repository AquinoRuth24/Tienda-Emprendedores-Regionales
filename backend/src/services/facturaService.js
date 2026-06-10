const { sql, poolPromise } = require("../config/db");

const facturaService = {
//crea la factura y devuelve su id para cargar los detalles
async crearFactura(id_pedido, total, transaction) {
    const req = new sql.Request(transaction);
    const result = await req
    .input("total", sql.Decimal(10, 2), total)
    .input("id_pedido", sql.Int, id_pedido).query(`
    INSERT INTO Factura (fecha, total, nro_comprobante, id_pedido, id_cliente)
    VALUES (
        GETDATE(),
        @total,
        'TEMP',
        @id_pedido,
        (SELECT id_cliente FROM Pedido WHERE id_pedido = @id_pedido)
    );
    SELECT SCOPE_IDENTITY() AS id_factura;
    `);
    const id_factura = result.recordset[0].id_factura;
    //Actualiza con el id_factura real, nunca se repite
    const reqUpdate = new sql.Request(transaction);
    await reqUpdate.input("id_factura", sql.Int, id_factura).query(`
    UPDATE Factura 
    SET nro_comprobante = CONCAT('FC-', RIGHT('00000' + CAST(@id_factura AS VARCHAR), 5))
    WHERE id_factura = @id_factura
    `);
    return id_factura;
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
        .input("id_producto", sql.Int, item.id_producto).query(`
        INSERT INTO Detalle_factura 
            (cantidad, precio_unitario, subtotal, id_factura, id_producto)
        VALUES 
            (@cantidad, @precio_unitario, @subtotal, @id_factura, @id_producto)
        `);
    }
},

async obtenerFacturasCliente(id_cliente) {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .input("id_cliente", sql.Int, id_cliente)
    .execute("sp_ObtenerFacturasCliente");

    return {
      facturas: result.recordsets[0],  // cabecera de facturas
      detalles: result.recordsets[1],  // detalle de productos
    };
},


async obtenerDetalles(id_factura) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id_factura', sql.Int, id_factura)
    .query(`SELECT 
              df.id_detalle_factura,
              df.cantidad,
              df.precio_unitario,
              df.subtotal,
              p.nombre AS nombre_producto
            FROM Detalle_factura df
            INNER JOIN Producto p 
              ON df.id_producto = p.id_producto
            WHERE df.id_factura = @id_factura`);
  return result.recordset;
},

};

module.exports = facturaService;
