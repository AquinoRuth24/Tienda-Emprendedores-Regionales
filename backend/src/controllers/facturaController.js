const { sql, poolPromise } = require("../config/db");
const facturaService = require("../services/facturaService");

const facturaController = {
//obtener todas las facturas de un cliente
obtenerFacturasCliente: async (req, res) => {
    const { id_cliente } = req.params;
    try {
    const { facturas, detalles } = await facturaService.obtenerFacturasCliente(id_cliente);

      // combinar facturas con sus detalles igual que antes
    const resultado = facturas.map((factura) => ({
        ...factura,
        items: detalles.filter((d) => d.id_factura === factura.id_factura),
    }));

    res.json(resultado);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},


//obtener detalle de una factura
obtenerDetalleFactura: async (req, res) => {
    const { id_factura } = req.params;
    try {
    const pool = await poolPromise;
    const factura = await pool
        .request()
        .input("id_factura", sql.Int, id_factura).query(`
        SELECT 
            f.id_factura,
            f.fecha,
            f.total,
            f.nro_comprobante,
            f.id_pedido,
            f.id_cliente
        FROM Factura f
        WHERE f.id_factura = @id_factura
        `);

if (!factura.recordset[0]) {
    return res.status(404).json({ error: "Factura no encontrada" });
}
const items = await pool
    .request()
    .input("id_factura", sql.Int, id_factura).query(`
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
    res.json({ ...factura.recordset[0], items: items.recordset });
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
},
};

module.exports = facturaController;
