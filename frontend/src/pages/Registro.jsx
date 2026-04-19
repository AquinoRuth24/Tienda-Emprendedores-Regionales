import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

//maneja el registro del cliente,valida los campos manda al backend y redirige a login
function Registro() {
  const [form, setForm] = useState({
    apellidoNombre: "",
    email: "",
    contraseña: "",
    confirmar: "",
    DNI: "",
    fecha_nacimiento: "",
  });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }; //actualiza el estado del formulario a medida que el usuario escribe

  const handleSubmit = async (e) => {
    e.preventDefault(); //evita que la pagina se recarge
    setError("");
    setExito("");

    //validar contraseña
    if (form.contraseña.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres.");
    }

    //validar que las contraseñas coincidan
    if (form.contraseña !== form.confirmar) {
      return setError("Las contraseñas no coinciden.");
    }

    //validar DNI
    if (form.DNI.toString().length !== 8) {
      return setError("El DNI debe tener exactamente 8 números.");
    }

    //validar email
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailValido) {
      return setError("El formato del email no es válido.");
    }

    try {
      await axios.post("http://localhost:3001/api/cliente/registrar", {
        apellidoNombre: form.apellidoNombre,
        email: form.email,
        contraseña: form.contraseña,
        DNI: parseInt(form.DNI),
        fecha_nacimiento: form.fecha_nacimiento,
      });

      setExito("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    }
  };

  return (
    <div style={estilos.pagina}>
      <div style={estilos.tarjeta}>
        {/* Panel izquierdo */}
        <div style={estilos.panelIzquierdo}>
          <h2 style={estilos.titulo}>¡Bienvenido!</h2>
          <p style={estilos.subTitulo}>¿Ya tenés cuenta?</p>
          <Link to="/login">
            <button
              style={estilos.botonLogin}
              onClick={() => navigate("/login")}
            >
              INICIAR SESIÓN
            </button>
          </Link>
        </div>

        {/* Panel derecho - Formulario */}
        <div style={estilos.panelDerecho}>
          <h2 style={estilos.tituloForm}>Crear Cuenta</h2>

          {error && <p style={estilos.error}>{error}</p>}
          {exito && <p style={estilos.exito}>{exito}</p>}

          <form onSubmit={handleSubmit} style={estilos.form}>
            <div style={estilos.campo}>
              <label style={estilos.label}>Apellido y Nombre</label>
              <input
                type="text"
                name="apellidoNombre"
                placeholder="Pérez Juan"
                value={form.apellidoNombre}
                onChange={handleChange}
                style={estilos.input}
                required
              />
            </div>

            <div style={estilos.fila}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="juan@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  style={estilos.input}
                  required
                />
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>DNI</label>
                <input
                  type="number"
                  name="DNI"
                  placeholder="12345678"
                  value={form.DNI}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, ""); // solo números
                    if (valor.length <= 8) {
                      // máximo 8 dígitos
                      setForm({ ...form, DNI: valor });
                    }
                  }}
                  style={estilos.input}
                  required
                />
              </div>
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                style={estilos.input}
                required
              />
            </div>

            <div style={estilos.fila}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Contraseña</label>
                <input
                  type="password"
                  name="contraseña"
                  placeholder="••••••"
                  value={form.contraseña}
                  onChange={handleChange}
                  style={estilos.input}
                  required
                />
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>Confirmar Contraseña</label>
                <input
                  type="password"
                  name="confirmar"
                  placeholder="••••••"
                  value={form.confirmar}
                  onChange={handleChange}
                  style={estilos.input}
                  required
                />
              </div>
            </div>

            <button type="submit" style={estilos.boton}>
              REGISTRARSE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  pagina: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#d6e8f7",
  },
  tarjeta: {
    display: "flex",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    width: "850px",
    minHeight: "500px",
  },
  panelIzquierdo: {
    backgroundColor: "#4ab8d8",
    width: "250px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 25px",
    gap: "15px",
  },
  titulo: {
    color: "white",
    fontSize: "30px",
    margin: 0,
  },
  subTitulo: {
    color: "white",
    fontSize: "14px",
    margin: 0,
    textAlign: "center",
  },
  botonLogin: {
    backgroundColor: "transparent",
    color: "white",
    border: "2px solid white",
    borderRadius: "25px",
    padding: "10px 30px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  panelDerecho: {
    backgroundColor: "#eaf4fb",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
  },
  tituloForm: {
    color: "#333",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "bold",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fila: {
    display: "flex",
    gap: "15px",
  },
  campo: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    color: "#555",
    fontWeight: "500",
  },
  input: {
    border: "1px solid #cce0f0",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "14px",
    color: "#333",
    backgroundColor: "white",
    outline: "none",
    width: "100%",
  },
  boton: {
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "25px",
    padding: "13px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginTop: "5px",
    width: "100%",
  },
  error: {
    color: "red",
    fontSize: "13px",
    marginBottom: "5px",
  },
  exito: {
    color: "green",
    fontSize: "13px",
    marginBottom: "5px",
  },
};

export default Registro;
