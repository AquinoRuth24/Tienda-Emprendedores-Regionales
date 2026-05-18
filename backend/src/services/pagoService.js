const { sql, poolPromise } = require("../config/db");

const pagoService = {

// Obtener métodos de pago disponibles
async obtenerMetodosPago() {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT id_metodo_pago, descripcion FROM Metodo_pago");
    return result.recordset;
},

  // Registrar un pago para una factura
async registrarPago(id_factura, id_metodo_pago) {
    const pool = await poolPromise;

// Verificar que la factura existe
const factura = await pool
    .request()
    .input("id_factura", sql.Int, id_factura)
    .query("SELECT id_factura, id_pedido FROM Factura WHERE id_factura = @id_factura");

    if (!factura.recordset[0]) {
    throw new Error("Factura no encontrada");
    }

// Verificar que no tiene un pago aprobado ya
const pagoExistente = await pool
    .request()
    .input("id_factura", sql.Int, id_factura)
    .query(`
        SELECT id_pago FROM Pago 
        WHERE id_factura = @id_factura 
        AND id_estado_pago = 2  -- 2 = Aprobado
    `);
    if (pagoExistente.recordset[0]) {
    throw new Error("Esta factura ya tiene un pago aprobado");
    }

const transaction = new sql.Transaction(pool);
    try {
    await transaction.begin();
// Registrar el pago con estado Aprobado (2)
const req = new sql.Request(transaction);
const result = await req
        .input("id_factura", sql.Int, id_factura)
        .input("id_metodo_pago", sql.Int, id_metodo_pago)
        .query(`
        INSERT INTO Pago (fecha, id_factura, id_metodo_pago, id_estado_pago)
        VALUES (GETDATE(), @id_factura, @id_metodo_pago, 2);
        SELECT SCOPE_IDENTITY() AS id_pago;
        `);

const id_pago = result.recordset[0].id_pago;

// Actualizar estado del pedido a Pagado (2)
const reqPedido = new sql.Request(transaction);
    await reqPedido
        .input("id_pedido", sql.Int, factura.recordset[0].id_pedido)
        .query(`
        UPDATE Pedido 
        SET id_estado_pedido = 2  -- 2 = Pagado
        WHERE id_pedido = @id_pedido
        `);
    await transaction.commit();
    return { id_pago, mensaje: "Pago registrado correctamente" };
    } catch (err) {
    await transaction.rollback();
    throw err;
    }
},

// Obtener el pago de una factura
async obtenerPagoPorFactura(id_factura) {
const pool = await poolPromise;
const result = await pool
    .request()
    .input("id_factura", sql.Int, id_factura)
    .query(`
        SELECT 
        pg.id_pago,
        pg.fecha,
        mp.descripcion AS metodo_pago,
        ep.descripcion AS estado_pago
        FROM Pago pg
        INNER JOIN Metodo_pago mp ON pg.id_metodo_pago = mp.id_metodo_pago
        INNER JOIN estado_pago ep ON pg.id_estado_pago = ep.id_estado_pago
        WHERE pg.id_factura = @id_factura
    `);
    return result.recordset[0] ?? null;
},
};

module.exports = pagoService;