import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fetchConToken from "../utils/fetchConToken";

function Envio() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state;

//Carga inicial: intenta obtener datos del estado de navegación en caso de no estar recargado,
  const [envioData, setEnvioData] = useState(null);
  useEffect(() => {
    if (fromState?.id_carrito) {
      sessionStorage.setItem("envio_state", JSON.stringify(fromState));
      setEnvioData(fromState);
    } else {
      const guardado = sessionStorage.getItem("envio_state");
      if (guardado) {
        setEnvioData(JSON.parse(guardado));
      }
    }
  }, [fromState]);
  const id_carrito = envioData?.id_carrito;
  const subtotal = envioData?.subtotal;

  //paso: "seleccion","domicilio","confirmacion"
  const [paso, setPaso] = useState("seleccion");
  //métodos de envío cargados desde la BD
  const [metodosEnvio, setMetodosEnvio] = useState([]);

  // datos del formulario de domicilio
  const [form, setForm] = useState({
    provincia: "",
    ciudad: "",
    codigo_postal: "",
    calle: "",
    numero: "",
    descripcion: "",
  });

  const [costoEnvio, setCostoEnvio] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cargandoCosto, setCargandoCosto] = useState(false);

  //subtotal como número para evitar NaN al sumar
  const subtotalNumerico = Number(subtotal) || 0;

  const ID_DOMICILIO = 1;

useEffect(() => {
    const cargarMetodos = async () => {
      try {
        const res = await fetchConToken("http://localhost:3001/api/envio/metodos");
        if (!res) return; //verificar que no sea null antes de intentar parsear si el token expiro
        const data = await res.json();
        if (res.ok) setMetodosEnvio(data);
      } catch (error) {
        console.error("Error al cargar métodos de envío:", error);
      }
    };
    cargarMetodos();
  }, []);

  //costo real de domicilio desde la BD
  const costoBase =
    metodosEnvio.find((m) => m.id_tipo_envio === ID_DOMICILIO)?.costo_base ??
    "...";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //Validaciones del formulario de domicilio antes de calcular el costo real

  const validarFormulario = () => {
    if (!form.provincia.trim()) {
      alert("La provincia es obligatoria");
      return false;
    }
    if (form.provincia.trim().length > 200) {
      alert("La provincia no puede superar los 200 caracteres");
      return false;
    }
    if (!form.ciudad.trim()) {
      alert("La ciudad es obligatoria");
      return false;
    }
    if (form.ciudad.trim().length > 200) {
      alert("La ciudad no puede superar los 200 caracteres");
      return false;
    }
    if (!form.calle.trim()) {
      alert("La calle es obligatoria");
      return false;
    }
    if (form.calle.trim().length > 200) {
      alert("La calle no puede superar los 200 caracteres");
      return false;
    }
    if (
      !form.numero ||
      parseInt(form.numero) <= 0 ||
      isNaN(parseInt(form.numero))
    ) {
      alert("El número debe ser mayor a 0");
      return false;
    }
    if (form.descripcion.trim().length > 200) {
      alert("La referencia no puede superar los 200 caracteres");
      return false;
    }
    return true;
  };

const confirmarCompra = async (datosEnvio) => {
    if (cargando) return;
    setCargando(true);
    try {
      const res = await fetchConToken("http://localhost:3001/api/compra/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //verificar que no sea null antes de intentar parsear si el token expiro
        body: JSON.stringify({ id_carrito, datosEnvio }),
      });
      if (!res) return; //verificar que no sea null antes de intentar parsear si el token expiro
      const data = await res.json();
      if (res.ok) {
        sessionStorage.removeItem("envio_state");
        alert("¡Compra y envío realizados con éxito!");
        navigate("/inicio");
      } else {
        alert(data.error || "Error al procesar la compra");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor. Intentá nuevamente.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

//****************Retiro en el Local*************/
const confirmarRetiro = () => confirmarCompra({ tipo: "retiro" });
  const confirmarEnvio = () =>
    confirmarCompra({
      tipo: "domicilio",
      id_tipo_envio: ID_DOMICILIO,
      calle: form.calle.trim(),
      numero: parseInt(form.numero),
      descripcion: form.descripcion.trim() || null,
      ciudad: form.ciudad.trim(),
      codigo_postal: form.codigo_postal ? parseInt(form.codigo_postal) : 0,
      provincia: form.provincia.trim(),
    });

  //****************Envio a domicilio*************/

const calcularCosto = async () => {
    if (cargandoCosto) return;
    setCargandoCosto(true);
    try {
      const res = await fetchConToken("http://localhost:3001/api/envio/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tipo_envio: ID_DOMICILIO }),
      });
      if (!res) return; //verificar que no sea null antes de intentar parsear si el token expiro
      const data = await res.json();
      if (res.ok) {
        setCostoEnvio(data.costo);
        setPaso("confirmacion");
      } else {
        alert(data.error || "Error al calcular costo");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor. Intentá nuevamente.");
      console.error("Error al calcular costo:", error);
    } finally {
      setCargandoCosto(false);
    }
  };

  const irAConfirmacion = () => {
    if (validarFormulario()) calcularCosto();
  };

  //Chequea el carrito en vez del pedido
  if (!id_carrito) {
    return (
      <div style={estilos.pagina}>
        <nav style={estilos.navbar}>
          <h2 style={estilos.logo}>Gestión de Envío</h2>
        </nav>
        <div style={{ padding: "80px", textAlign: "center" }}>
          <h3 style={{ color: "#555", marginBottom: "16px" }}>
            No hay un carrito activo para gestionar el envío.
          </h3>
          <p style={{ color: "#888", marginBottom: "24px" }}>
            Primero agregá productos desde la tienda.
          </p>
          <button style={estilos.btnFinalizar} onClick={() => navigate("/carrito")}>
            Ir al carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={estilos.pagina}>
      <nav style={estilos.navbar}>
        <h2 style={estilos.logo}>Gestión de Envío</h2>
        <button style={estilos.btnNav} onClick={() => navigate("/carrito")}>
          Volver al Carrito
        </button>
      </nav>

      <div style={estilos.contenido}>
        {/*SELECCION DE METODO*/}
        {paso === "seleccion" && (
          <div style={estilos.tarjeta}>
            <h3 style={{ marginBottom: "24px", color: "#333" }}>
              ¿Cómo querés recibir tu pedido?
            </h3>
            <div style={estilos.opcionesLayout}>
              <div style={estilos.opcion}>
                <h4 style={estilos.opcionTitulo}>Retiro en el local</h4>
                <p style={estilos.opcionDesc}>
                  Sin costo adicional. Retirá tu pedido directamente en nuestro
                  local.
                </p>
                <p style={estilos.costo}>$0</p>
                <button
                  style={{
                    ...estilos.btnFinalizar,
                    opacity: cargando ? 0.7 : 1,
                  }}
                  onClick={confirmarRetiro}
                  disabled={cargando}
                >
                  {cargando ? "Registrando..." : "Confirmar retiro"}
                </button>
              </div>

              <div style={estilos.separador} />

              <div style={estilos.opcion}>
                <h4 style={estilos.opcionTitulo}>Envío a domicilio</h4>
                <p style={estilos.opcionDesc}>
                  Recibí tu pedido en la dirección que indiques.
                </p>
                {/* precio real desde la BD*/}
                <p style={estilos.costo}>
                  {costoBase === "..." ? "Cargando..." : `$${costoBase}`}
                </p>
                <button
                  style={{
                    ...estilos.btnFinalizar,
                    opacity: cargando ? 0.7 : 1,
                  }}
                  onClick={() => setPaso("domicilio")}
                  disabled={cargando}
                >
                  Ingresar dirección
                </button>
              </div>
            </div>
          </div>
        )}

        {/*FORMULARIO DE DIRECCION*/}
        {paso === "domicilio" && (
          <div style={estilos.tarjeta}>
            <button
              style={estilos.btnVolver}
              onClick={() => setPaso("seleccion")}
            >
              ← Volver a seleccionar método
            </button>
            <h3 style={{ margin: "16px 0 24px", color: "#333" }}>
              Dirección de entrega
            </h3>

            <div style={estilos.formulario}>
              <div style={estilos.fila}>
                <div style={estilos.campo}>
                  <label style={estilos.label}>Provincia *</label>
                  <input
                    style={estilos.input}
                    name="provincia"
                    value={form.provincia}
                    onChange={handleChange}
                    placeholder="Ej: Corrientes"
                    maxLength={200}
                  />
                </div>
                <div style={estilos.campo}>
                  <label style={estilos.label}>Ciudad *</label>
                  <input
                    style={estilos.input}
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Corrientes Capital"
                    maxLength={200}
                  />
                </div>
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>Código Postal (opcional)</label>
                <input
                  style={estilos.input}
                  name="codigo_postal"
                  type="number"
                  min="0"
                  value={form.codigo_postal}
                  onChange={handleChange}
                  placeholder="Ej: 3400"
                />
              </div>

              <div style={estilos.fila}>
                <div style={{ ...estilos.campo, flex: 2 }}>
                  <label style={estilos.label}>Calle *</label>
                  <input
                    style={estilos.input}
                    name="calle"
                    value={form.calle}
                    onChange={handleChange}
                    placeholder="Ej: San Juan"
                    maxLength={200}
                  />
                </div>
                <div style={estilos.campo}>
                  <label style={estilos.label}>Número *</label>
                  <input
                    style={estilos.input}
                    name="numero"
                    type="number"
                    min="1"
                    value={form.numero}
                    onChange={handleChange}
                    placeholder="Ej: 1234"
                  />
                </div>
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>Referencia (opcional)</label>
                <input
                  style={estilos.input}
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Piso 2 dpto B, portón azul..."
                  maxLength={200}
                />
              </div>

              <button
                style={{
                  ...estilos.btnFinalizar,
                  marginTop: "24px",
                  opacity: cargandoCosto ? 0.7 : 1,
                }}
                onClick={irAConfirmacion}
                disabled={cargandoCosto}
              >
                {cargandoCosto
                  ? "Calculando costo..."
                  : "Ver costo y confirmar"}
              </button>
            </div>
          </div>
        )}

        {/*CONFIRMACION CON COSTO */}
        {paso === "confirmacion" && (
          <div style={estilos.tarjeta}>
            <button
              style={estilos.btnVolver}
              onClick={() => setPaso("domicilio")}
            >
              ← Volver a la dirección
            </button>
            <h3 style={{ margin: "16px 0 24px", color: "#333" }}>
              Confirmá tu envío
            </h3>

            <div style={estilos.resumenEnvio}>
              <div style={estilos.filaResumen}>
                <span style={estilos.labelResumen}>Dirección:</span>
                <span>
                  {form.calle} {form.numero}, {form.ciudad}, {form.provincia}
                </span>
              </div>
              {form.descripcion && (
                <div style={estilos.filaResumen}>
                  <span style={estilos.labelResumen}>Referencia:</span>
                  <span>{form.descripcion}</span>
                </div>
              )}
              <hr style={{ margin: "16px 0" }} />
              <div style={estilos.filaResumen}>
                <span style={estilos.labelResumen}>Subtotal productos:</span>
                <span>${subtotalNumerico}</span>
              </div>
              <div style={estilos.filaResumen}>
                <span style={estilos.labelResumen}>Costo de envío:</span>
                <span>${costoEnvio}</span>
              </div>
              <div
                style={{
                  ...estilos.filaResumen,
                  fontWeight: "bold",
                  fontSize: "18px",
                  marginTop: "8px",
                }}
              >
                <span>Total:</span>
                <span>${subtotalNumerico + Number(costoEnvio)}</span>
              </div>
            </div>

            <button
              style={{
                ...estilos.btnFinalizar,
                marginTop: "24px",
                opacity: cargando ? 0.7 : 1,
              }}
              onClick={confirmarEnvio}
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Confirmar envío"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    backgroundColor: "#d6e8f7",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    backgroundColor: "#4ab8d8",
    padding: "15px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  logo: { color: "white", margin: 0 },
  btnNav: {
    backgroundColor: "transparent",
    color: "white",
    border: "2px solid white",
    borderRadius: "20px",
    padding: "8px 15px",
    cursor: "pointer",
  },
  contenido: { padding: "40px", maxWidth: "800px", margin: "0 auto" },
  tarjeta: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  opcionesLayout: { display: "flex", gap: "20px", alignItems: "stretch" },
  opcion: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#f0f8ff",
    textAlign: "center",
  },
  opcionTitulo: { color: "#2a7da8", marginBottom: "8px" },
  opcionDesc: {
    color: "#666",
    fontSize: "14px",
    marginBottom: "12px",
    flex: 1,
  },
  costo: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#4ab8d8",
    marginBottom: "16px",
  },
  separador: { width: "1px", backgroundColor: "#ddd" },
  btnFinalizar: {
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    width: "100%",
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnVolver: {
    backgroundColor: "transparent",
    color: "#4ab8d8",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0",
    marginBottom: "8px",
  },
  formulario: { display: "flex", flexDirection: "column", gap: "16px" },
  fila: { display: "flex", gap: "16px" },
  campo: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", color: "#555", fontWeight: "bold" },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  resumenEnvio: {
    backgroundColor: "#f0f8ff",
    padding: "20px",
    borderRadius: "10px",
  },
  filaResumen: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "15px",
  },
  labelResumen: { color: "#555", fontWeight: "bold" },
};

export default Envio;
