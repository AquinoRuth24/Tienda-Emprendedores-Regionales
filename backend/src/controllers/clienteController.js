const clienteService = require("../services/clienteService");

//registrar cliente
const registrar = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    contraseña,
    DNI,
    fecha_nacimiento,
    telefono,
  } = req.body;

  try {
    //validar datos
    await clienteService.validarDatosRegistro(
      email,
      DNI,
    );

    //encriptar contraseña
    const hash = await clienteService.encriptarContraseña(
      contraseña,
    );

    //guardar cliente
    await clienteService.guardarCliente(
      nombre,
      apellido,
      email,
      hash,
      DNI,
      fecha_nacimiento,
      telefono,
      new Date(),//fecha registro actual
      1 //activo por defecto
    );

    res.json({
      mensaje: "Cliente registrado correctamente.",
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

//login cliente
const login = async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    //buscar cliente por email
    const cliente = await clienteService.buscarPorEmail(
      email,
    );

    //validar contraseña
    await clienteService.validarContraseña(
      contraseña,
      cliente.contraseña,
    );

    //crear token
    const token = clienteService.generarToken(cliente);

    res.json({
      token,
      cliente: {
        id:       cliente.id_cliente,
        nombre:   cliente.nombre,
        apellido: cliente.apellido,
        email:    cliente.email,
      },
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

//logout cliente
const logout = (req, res) => {
  res.json({
    mensaje: "Sesión cerrada correctamente.",
  });
};

module.exports = {
  registrar,
  login,
  logout,
};