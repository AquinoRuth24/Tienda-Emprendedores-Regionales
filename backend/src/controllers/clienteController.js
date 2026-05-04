const clienteService = require("../services/clienteService");

//registrar cliente
const registrar = async (req, res) => {
  const {
    apellidoNombre,
    email,
    contraseña,
    DNI,
    fecha_nacimiento,
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
      apellidoNombre,
      email,
      hash,
      DNI,
      fecha_nacimiento,
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
        nombre: cliente.apellidoNombre,
        email: cliente.email,
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