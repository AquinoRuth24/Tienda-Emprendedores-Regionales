const { sql, poolPromise } = require("../config/db");

const envioService = {
//obtener los métodos de envío disponibles para mostrar al cliente
async obtenerMetodosEnvio() {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .query("SELECT id_tipo_envio, descripcion, costo_base FROM Tipo_envio");
    return result.recordset;
},

//*************Retiro en el local********************/

//registra la modalidad de retiro en el pedido
async registrarModalidadRetiro(id_pedido) {
const pool = await poolPromise;
//verificar que el pedido existe
const pedido = await pool
    .request()
    .input("id_pedido", sql.Int, id_pedido)
    .query("SELECT id_pedido FROM Pedido WHERE id_pedido = @id_pedido");

    if (!pedido.recordset[0]) {
    throw new Error("Pedido no encontrado");
    }
//verificar que el pedido no tenga ya un envío registrado
const yaExiste = await pool
    .request()
    .input("id_pedido_check", sql.Int, id_pedido)
    .query("SELECT id_envio FROM Envio WHERE id_pedido = @id_pedido_check");
    if (yaExiste.recordset[0]) {
    throw new Error("Este pedido ya tiene un envío registrado");
    }
//calcular fecha estimada de entrega costo 0, fecha estimada el mismo día
await pool
    .request()
    .input("id_pedido", sql.Int, id_pedido)
    .query(`INSERT INTO Envio 
                (fecha_envio, fecha_estimada_entrega, costo_envio, id_estado_envio, id_direccion, id_tipo_envio, id_pedido)
            VALUES 
                (GETDATE(), GETDATE(), 0, 1, NULL,
                (SELECT id_tipo_envio FROM Tipo_envio WHERE descripcion = 'Retiro en local'),
                @id_pedido)`);
},

//****************Envio a domicilio*************/

//calcular el costo de envío según el método seleccionado
async calcularCostoEnvio(id_tipo_envio) {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .input("id_tipo_envio", sql.Int, id_tipo_envio)
    .query(
        "SELECT costo_base FROM Tipo_envio WHERE id_tipo_envio = @id_tipo_envio"
    );
    if (!result.recordset[0]) {
    throw new Error("Método de envío no disponible");
    }
    return result.recordset[0].costo_base;
},

//buscar provincia ignorando mayúsculas y espacios, o crearla si no existe
//LOWER(TRIM()) evita duplicados como "corrientes", "Corrientes", "Ctes "
async obtenerOCrearProvincia(nombreProvincia, transaction) {
const req1 = new sql.Request(transaction);
const existe = await req1
    .input("nombre", sql.VarChar, nombreProvincia.trim())
    .query(
        "SELECT id_provincia, nombre FROM Provincia WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(@nombre))"
    );
    if (existe.recordset[0]) {
    return existe.recordset[0].id_provincia;
    }

//si no existe se crea con el nombre tal como lo escribió el usuario (trim aplicado)
const req2 = new sql.Request(transaction);
const nueva = await req2
    .input("nombre", sql.VarChar, nombreProvincia.trim())
    .query(`INSERT INTO Provincia (nombre) VALUES (@nombre);
            SELECT SCOPE_IDENTITY() AS id_provincia`); 
    return nueva.recordset[0].id_provincia;
},
//buscar ciudad ignorando mayúsculas y espacios, o crearla si no existe
//LOWER(TRIM()) evita duplicados como "corrientes capital", "Capital", "Ctes capital"
async obtenerOCrearCiudad(nombreCiudad, codigoPostal, id_provincia, transaction) {
    const req1 = new sql.Request(transaction);
    const existe = await req1
    .input("nombre", sql.VarChar, nombreCiudad.trim())
    .input("id_provincia", sql.Int, id_provincia)
    .query(
        `SELECT id_ciudad FROM Ciudad 
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(@nombre)) 
        AND id_provincia = @id_provincia`
    );
    if (existe.recordset[0]) {
    return existe.recordset[0].id_ciudad;
    }
    //si no existe se crea con el código postal ingresado por el cliente
    const req2 = new sql.Request(transaction);
    const nueva = await req2
    .input("nombre", sql.VarChar, nombreCiudad.trim())
    .input("codigo_postal", sql.Int, codigoPostal || 0)
    .input("id_provincia", sql.Int, id_provincia)
    .query(`INSERT INTO Ciudad (nombre, codigo_postal, id_provincia) 
            VALUES (@nombre, @codigo_postal, @id_provincia);
            SELECT SCOPE_IDENTITY() AS id_ciudad`);
    return nueva.recordset[0].id_ciudad;
},

async registrarDireccion(calle, numero, descripcion, nombreCiudad, codigoPostal, nombreProvincia, transaction) {
    if (!calle || !numero || !nombreCiudad || !nombreProvincia) {
    throw new Error("Provincia, ciudad, calle y número son obligatorios");
    }
    //id_provincia normalizando el nombre
    const id_provincia = await envioService.obtenerOCrearProvincia(
    nombreProvincia,
    transaction
    );

//id_ciudad normalizando el nombre, con código postal del cliente
const id_ciudad = await envioService.obtenerOCrearCiudad(
    nombreCiudad,
    codigoPostal,
    id_provincia,
    transaction
    );

//insertar la dirección con el id_ciudad 
const req = new sql.Request(transaction);
const result = await req
    .input("calle", sql.VarChar, calle.trim())
    .input("numero", sql.Int, numero)
    .input("descripcion", sql.VarChar, descripcion ? descripcion.trim() : null)
    .input("id_ciudad", sql.Int, id_ciudad)
    .query(`INSERT INTO Direccion (calle, numero, descripcion, id_ciudad)
            VALUES (@calle, @numero, @descripcion, @id_ciudad);
            SELECT SCOPE_IDENTITY() AS id_direccion`);
    return result.recordset[0].id_direccion;
},

//asociar el envío al pedido con dirección y costo
async asociarEnvio(id_pedido, id_tipo_envio, calle, numero, descripcion, nombreCiudad, codigoPostal, nombreProvincia, transaction) {
    //verificar que el pedido no tenga ya un envío registrado (evita duplicados)
    const reqCheck = new sql.Request(transaction);
    const yaExiste = await reqCheck
    .input("id_pedido_check", sql.Int, id_pedido)
    .query("SELECT id_envio FROM Envio WHERE id_pedido = @id_pedido_check");
    if (yaExiste.recordset[0]) {
    throw new Error("Este pedido ya tiene un envío registrado");
}
//calcular costo desde la tabla Tipo_envio
const costo = await envioService.calcularCostoEnvio(id_tipo_envio);
//registrar la dirección normalizando provincia y ciudad
const id_direccion = await envioService.registrarDireccion(
    calle,
    numero,
    descripcion,
    nombreCiudad,
    codigoPostal,
    nombreProvincia,
    transaction
    );
//insertar el envío con fecha estimada de entrega en 3 días
const req = new sql.Request(transaction);
    await req
    .input("id_pedido", sql.Int, id_pedido)
    .input("id_tipo_envio", sql.Int, id_tipo_envio)
    .input("id_direccion", sql.Int, id_direccion)
    .input("costo_envio", sql.Decimal(10, 2), costo)
    .query(`INSERT INTO Envio 
                (fecha_envio, fecha_estimada_entrega, costo_envio, id_estado_envio, id_direccion, id_tipo_envio, id_pedido)
            VALUES 
                (GETDATE(), DATEADD(DAY, 3, GETDATE()), @costo_envio, 1, @id_direccion, @id_tipo_envio, @id_pedido)`);
    return { costo, id_direccion };
},

//obtener el envío asociado a un pedido

async obtenerEnvioPorPedido(id_pedido) {
const pool = await poolPromise;
const result = await pool
    .request()
    .input("id_pedido", sql.Int, id_pedido)
    .query(`SELECT 
                e.id_envio,
                e.fecha_envio,
                e.fecha_estimada_entrega,
                e.costo_envio,
                t.descripcion AS tipo_envio,
                ee.descripcion AS estado_envio,
                d.calle,
                d.numero,
                d.descripcion AS referencia,
                c.nombre AS ciudad,
                c.codigo_postal,
                p.nombre AS provincia
            FROM Envio e
            INNER JOIN Tipo_envio t ON e.id_tipo_envio = t.id_tipo_envio
            INNER JOIN estado_envio ee ON e.id_estado_envio = ee.id_estado_envio
            LEFT JOIN Direccion d ON e.id_direccion = d.id_direccion
            LEFT JOIN Ciudad c ON d.id_ciudad = c.id_ciudad
            LEFT JOIN Provincia p ON c.id_provincia = p.id_provincia
            WHERE e.id_pedido = @id_pedido`);
    return result.recordset[0] ?? null;
},

//actualizar el estado del envío(1=Pendiente,2=Despachado,3=En camino,4=Entregado,5=Cancelado)
async actualizarEstadoEnvio(id_envio, id_estado_envio) {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .input("id_envio", sql.Int, id_envio)
    .input("id_estado_envio", sql.Int, id_estado_envio)
    .query(
        "UPDATE Envio SET id_estado_envio = @id_estado_envio WHERE id_envio = @id_envio"
    );
    if (result.rowsAffected[0] === 0) {
    throw new Error("Envío no encontrado");
    }
},
};

module.exports = envioService;