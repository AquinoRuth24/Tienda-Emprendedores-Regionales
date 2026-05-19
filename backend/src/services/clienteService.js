const { sql, poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const clienteService = {
//validar datos de registro
async validarDatosRegistro(email, DNI) {
    //verificar email
    const existeEmail = await clienteService.buscarPorEmailOptional(email);

    if (existeEmail) {
    throw new Error("Este correo ya está registrado.");
    }

    //verificar DNI
    const existeDNI = await clienteService.buscarPorDNI(DNI);

    if (existeDNI) {
    throw new Error("Este DNI ya está registrado.");
    }
},

  //buscar cliente por email
async buscarPorEmail(email) {
    const pool = await poolPromise;
    const result = await pool
    .request()
    .input("email", sql.VarChar, email)
    .query(`
        SELECT c.*, e.descripcion AS estado_desc
        FROM Clientes c
        JOIN Estado e ON c.id_estado = e.id_estado
        WHERE c.email = @email
    `);

    const cliente = result.recordset[0];

    if (!cliente) {
    throw new Error("Email o contraseña incorrectos.");
    }

    // Verificar que el cliente esté activo (id_estado = 1)
    if (cliente.id_estado !== 1) {
    throw new Error("Tu cuenta está inactiva o bloqueada.");
    }
    return cliente;
},

  //buscar cliente por email sin lanzar error
async buscarPorEmailOptional(email) {
    const pool = await poolPromise;

    const result = await pool.request().input("email", sql.VarChar, email)
    .query(`
        SELECT *
        FROM Clientes
        WHERE email = @email
    `);

    return result.recordset[0] ?? null;
},

  //buscar cliente por DNI
async buscarPorDNI(DNI) {
    const pool = await poolPromise;

    const result = await pool.request().input("DNI", sql.Int, DNI).query(`
        SELECT *
        FROM Clientes
        WHERE DNI = @DNI
    `);

    return result.recordset[0] ?? null;
},

  //encriptar contraseña
async encriptarContraseña(contraseña) {
    return await bcrypt.hash(contraseña, 10);
},

  //guardar cliente en BD
async guardarCliente(
    apellidoNombre,
    email,
    contraseña,
    DNI,
    fecha_nacimiento,
    telefono = "",  //si el formulario no incluye telefono, se guarda vacio
    fecha_registro = new Date(),
    id_estado = 1 //activo por defecto
) {
    const pool = await poolPromise;

    await pool
    .request()
    .input("apellidoNombre", sql.VarChar, apellidoNombre)
    .input("email", sql.VarChar, email)
    .input("contraseña", sql.VarChar, contraseña)
    .input("DNI", sql.Int, DNI)
    .input("fecha_nacimiento", sql.Date, fecha_nacimiento)
    .input("telefono", sql.VarChar, telefono)
    .input("fecha_registro", sql.Date, fecha_registro)
    .input("id_estado", sql.Int, id_estado)
    .query(`
        INSERT INTO Clientes
        (
        apellidoNombre,
        email,
        contraseña,
        DNI,
        fecha_nacimiento,
        telefono,
        fecha_registro,
        id_estado
        )
        VALUES
        (
        @apellidoNombre,
        @email,
        @contraseña,
        @DNI,
        @fecha_nacimiento
        ,@telefono,
        @fecha_registro,
        @id_estado
        )
    `);
},

//validar contraseña
async validarContraseña(contraseñaIngresada, contraseñaBD) {
    const passwordValida = await bcrypt.compare(
    contraseñaIngresada,
    contraseñaBD,
    );

    if (!passwordValida) {
    throw new Error("Contraseña incorrecta.");
    }

    return true;
},
//generar token JWT
generarToken(cliente) {
    if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado en las variables de entorno.");
    }
    return jwt.sign(
    {
        id: cliente.id_cliente,
        nombre: cliente.apellidoNombre,
        email: cliente.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
    );
},
};

module.exports = clienteService;
