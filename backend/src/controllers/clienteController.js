//se declara el controlador de clientes, que manejara las operaciones relacionadas con los usuarios.
const { sql, poolPromise } = require("../config/db"); //conexión a la BD
const bcrypt = require("bcryptjs"); //encriptar contraseñas
const jwt = require("jsonwebtoken"); //manejar sesiones

//REGISTRAR cliente
//se declara la funcion para registrar un nuevo cliente.
const registrar = async (req, res) => {
  const { apellidoNombre, email, contraseña, DNI, fecha_nacimiento } = req.body; //datos del formulario

  //try catch para manejar errores en la conexion a la BD y en las opraciones
try {
    const pool = await poolPromise; //se establece la conexion con la BD

    //Verificar si el email ya existe
    const existe = await pool
    .request()
    .input("email", sql.VarChar, email)
      .query("SELECT * FROM Clientes WHERE email = @email"); //consulta directamente a la BD para verificar el email.

    if (existe.recordset.length > 0) {
    return res.status(400).json({ error: "Este correo ya está registrado." });
    }

    //Verificar si el DNI ya existe
    const existeDNI = await pool
    .request()
    .input("DNI", sql.Int, DNI)
      .query("SELECT * FROM Clientes WHERE DNI = @DNI");

    if (existeDNI.recordset.length > 0) {
    return res.status(400).json({ error: "Este DNI ya está registrado." });
    }

    //Encriptar contraseña
    const hash = await bcrypt.hash(contraseña, 10); //10 es el nivel de incriptacion de la contraseña.

    //Insertar cliente
    //pool conecta con la BD.
    await pool
    .request() //se prepara la consulta para insertar el nuevo cliente en la BD.
    .input("apellidoNombre", sql.VarChar, apellidoNombre)
    .input("email", sql.VarChar, email)
    .input("contraseña", sql.VarChar, hash)
    .input("DNI", sql.Int, DNI)
    .input("fecha_nacimiento", sql.Date, fecha_nacimiento)
    .query(`INSERT INTO Clientes (apellidoNombre, email, contraseña, DNI, fecha_nacimiento) 
              VALUES (@apellidoNombre, @email, @contraseña, @DNI, @fecha_nacimiento)`); //se inserta el nuevo cliente directamente a la BD.

    res.json({ mensaje: "Cliente registrado correctamente." });
} catch (err) {
    res.status(500).json({ error: err.message });
}
};

//LOGIN Cliente
//se declara la funcion para iniciar sesion.
const login = async (req, res) => {
  const { email, contraseña } = req.body; //datos del formulario si esta registrado.

try {
    const pool = await poolPromise; //conexion con BD.

    const resultado = await pool //BD
    .request() //se prepara la consulta para verificar el email.
    .input("email", sql.VarChar, email)
      .query("SELECT * FROM Clientes WHERE email = @email");

    const cliente = resultado.recordset[0]; //primer cliente encontrado con ese email.

    if (!cliente) {
    return res.status(400).json({ error: "Cliente no encontrado." });
    }
    //compara la contraseña ingresada con la contraseña encriptada en la DB.
const passwordValida = await bcrypt.compare(contraseña, cliente.contraseña);
    if (!passwordValida) {
    return res.status(400).json({ error: 'Contraseña incorrecta.' });
}

    //Crear token JWT
    const token = jwt.sign(
      //datos del usuario que van dentro del token
    {
        id: cliente.id_cliente, //quién es
        nombre: cliente.apellidoNombre, //su nombre
        email: cliente.email, //su email
    },
      process.env.JWT_SECRET || "secreto123", //firma para que nadie pueda falsificarlo
      { expiresIn: "8h" }, //cuánto dura el token
    ); //se crea un token con la informacion del cliente y se firma con una clave secreta el token dura 8horas.

    res.json({
    token,
    cliente: {
        nombre: cliente.apellidoNombre,
        email: cliente.email,
    },
    });
} catch (err) {
    res.status(500).json({ error: err.message });
}
};

//LOGOUT (solo se elimina el token del frontend)
const logout = (req, res) => {
res.json({ mensaje: "Sesión cerrada correctamente." });
};

module.exports = { registrar, login, logout };
