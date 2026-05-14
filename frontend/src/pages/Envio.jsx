import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Envio() {
const navigate = useNavigate();
const location = useLocation();
const { id_pedido, subtotal } = location.state || {};
//paso: "seleccion" "domicilio" "confirmacion"
const [paso, setPaso] = useState("seleccion");
// datos del formulario de domicilio
const [form, setForm] = useState({
    provincia: "",
    ciudad: "",
    calle: "",
    numero: "",
    descripcion: "",
});
const [costoEnvio, setCostoEnvio] = useState(0);
const [cargando, setCargando] = useState(false);
const ID_DOMICILIO = 1; //id_tipo_envio = 1 en la base de datos
const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
};

//*******Retiro en el local*********************** */

const confirmarRetiro = async () => {
    setCargando(true);
    try {
    const res = await fetch("http://localhost:3001/api/envio/retiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pedido }),
    });
    const data = await res.json();
    if (res.ok) {
        alert(data.mensaje);
        navigate("/inicio");
    } else {
        alert(data.error || "Error al registrar retiro");
    }
    } catch (error) {
    console.error("Error al registrar retiro:", error);
    } finally {
    setCargando(false);
    }
};

//***************Envio a Domicilio**************** */

const calcularCosto = async () => {
    try {
    const res = await fetch("http://localhost:3001/api/envio/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tipo_envio: ID_DOMICILIO }),
    });
const data = await res.json();
    if (res.ok) {
        setCostoEnvio(data.costo);
        setPaso("confirmacion");
    } else {
        alert(data.error || "Error al calcular costo");
    }
    } catch (error) {
    console.error("Error al calcular costo:", error);
    }
};

const validarFormulario = () => {
    if (!form.provincia || !form.ciudad || !form.calle || !form.numero) {
    alert("Provincia, ciudad, calle y número son obligatorios");
    return false;
    }
    return true;
};

const irAConfirmacion = () => {
    if (validarFormulario()) calcularCosto();
};

const confirmarEnvio = async () => {
    setCargando(true);
    try {
    const res = await fetch("http://localhost:3001/api/envio/asociar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        id_pedido,
        id_tipo_envio: ID_DOMICILIO,
        calle: form.calle,
        numero: parseInt(form.numero),
        descripcion: form.descripcion,
        ciudad: form.ciudad,
        provincia: form.provincia,
        }),
    });
    const data = await res.json();
    if (res.ok) {
        alert("¡Envío registrado con éxito!");
        navigate("/inicio");
    } else {
        alert(data.error || "Error al registrar envío");
    }
    } catch (error) {
    console.error("Error al confirmar envío:", error);
    } finally {
    setCargando(false);
    }
};


return (
    <div style={estilos.pagina}>
    <nav style={estilos.navbar}>
        <h2 style={estilos.logo}>Gestión de Envío</h2>
        <button style={estilos.btnNav} onClick={() => navigate("/carrito")}>
        Volver al Carrito
        </button>
    </nav>

    <div style={estilos.contenido}>

        {/* ── PASO 1: SELECCIÓN DE MÉTODO ── */}
        {paso === "seleccion" && (
        <div style={estilos.tarjeta}>
            <h3 style={{ marginBottom: "24px", color: "#333" }}>
            ¿Cómo querés recibir tu pedido?
            </h3>
            <div style={estilos.opcionesLayout}>

            <div style={estilos.opcion}>
                <h4 style={estilos.opcionTitulo}>Retiro en el local</h4>
                <p style={estilos.opcionDesc}>Sin costo adicional. Retirá tu pedido directamente en nuestro local.</p>
                <p style={estilos.costo}>$0</p>
                <button style={estilos.btnFinalizar} onClick={confirmarRetiro} disabled={cargando}>
                {cargando ? "Registrando..." : "Confirmar retiro"}
                </button>
            </div>

            <div style={estilos.separador} />

            <div style={estilos.opcion}>
                <h4 style={estilos.opcionTitulo}>Envío a domicilio</h4>
                <p style={estilos.opcionDesc}>Recibí tu pedido en la dirección que indiques. Costo calculado según destino.</p>
                <p style={estilos.costo}>$1.500</p>
                <button style={estilos.btnFinalizar} onClick={() => setPaso("domicilio")}>
                Ingresar dirección
                </button>
            </div>

            </div>
        </div>
        )}

        {/*FORMULARIO DE DIRECCIÓN*/}
        {paso === "domicilio" && (
        <div style={estilos.tarjeta}>
            <button style={estilos.btnVolver} onClick={() => setPaso("seleccion")}>
            ← Volver a seleccionar método
            </button>
            <h3 style={{ margin: "16px 0 24px", color: "#333" }}>Dirección de entrega</h3>

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
                />
                </div>
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
                />
                </div>
                <div style={estilos.campo}>
                  <label style={estilos.label}>Número *</label>
                <input
                    style={estilos.input}
                    name="numero"
                    type="number"
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
                />
            </div>

            <button style={{ ...estilos.btnFinalizar, marginTop: "24px" }} onClick={irAConfirmacion}>
                Ver costo y confirmar
            </button>
            </div>
        </div>
        )}

        {/*CONFIRMACIÓN CON COSTO*/}
        {paso === "confirmacion" && (
        <div style={estilos.tarjeta}>
            <button style={estilos.btnVolver} onClick={() => setPaso("domicilio")}>
            ← Volver a la dirección
            </button>
            <h3 style={{ margin: "16px 0 24px", color: "#333" }}>Confirmá tu envío</h3>

            <div style={estilos.resumenEnvio}>
            <div style={estilos.filaResumen}>
                <span style={estilos.labelResumen}>Dirección:</span>
                <span>{form.calle} {form.numero}, {form.ciudad}, {form.provincia}</span>
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
                <span>${subtotal}</span>
            </div>
            <div style={estilos.filaResumen}>
                <span style={estilos.labelResumen}>Costo de envío:</span>
                <span>${costoEnvio}</span>
            </div>
            <div style={{ ...estilos.filaResumen, fontWeight: "bold", fontSize: "18px", marginTop: "8px" }}>
                <span>Total:</span>
                <span>${Number(subtotal) + Number(costoEnvio)}</span>
            </div>
            </div>

            <button
            style={{ ...estilos.btnFinalizar, marginTop: "24px" }}
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
    fontFamily: "Arial, sans-serif" 
},
navbar: { 
    backgroundColor: "#4ab8d8", 
    padding: "15px 30px", display: "flex", 
    justifyContent: "space-between", alignItems: "center", 
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
},
logo: { 
    color: "white", 
    margin: 0 
},
btnNav: { 
    backgroundColor: "transparent", 
    color: "white", border: "2px solid white", 
    borderRadius: "20px", padding: "8px 15px", 
    cursor: "pointer" 
},
contenido: { 
    padding: "40px", 
    maxWidth: "800px", 
    margin: "0 auto" 
},
tarjeta: { 
    backgroundColor: "white", 
    padding: "30px", 
    borderRadius: "10px", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" 
},
opcionesLayout: { 
    display: "flex", 
    gap: "20px", 
    alignItems: "stretch" 
},
opcion: { 
    flex: 1, 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    padding: "20px", 
    borderRadius: "10px", 
    backgroundColor: "#f0f8ff", 
    textAlign: "center" 
},
opcionTitulo: { 
    color: "#2a7da8", 
    marginBottom: "8px" 
},
opcionDesc: { 
    color: "#666", 
    fontSize: "14px", 
    marginBottom: "12px", 
    flex: 1 
},
costo: { 
    fontSize: "22px", 
    fontWeight: "bold", 
    color: "#4ab8d8", 
    marginBottom: "16px" 
},
separador: { 
    width: "1px", 
    backgroundColor: "#ddd" 
},
btnFinalizar: { 
    backgroundColor: "#4ab8d8", 
    color: "white", 
    border: "none", 
    padding: "12px 20px", 
    borderRadius: "8px", 
    width: "100%", 
    fontSize: "15px", 
    cursor: "pointer", 
    fontWeight: "bold" 
},
btnVolver: { 
    backgroundColor: "transparent", 
    color: "#4ab8d8", 
    border: "none", 
    cursor: "pointer", 
    fontSize: "14px", 
    padding: "0", 
    marginBottom: "8px" 
},
formulario: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "16px" 
},
fila: { 
    display: "flex", 
    gap: "16px" 
},
campo: { 
    flex: 1, 
    display: "flex", 
    flexDirection: "column", 
    gap: "6px" 
},
label: { 
    fontSize: "14px", 
    color: "#555", 
    fontWeight: "bold" 
},
input: { 
    padding: "10px 14px", 
    borderRadius: "8px", 
    border: "1px solid #ccc", 
    fontSize: "14px", 
    outline: "none" 
},
resumenEnvio: { 
    backgroundColor: "#f0f8ff", 
    padding: "20px", 
    borderRadius: "10px" 
},
filaResumen: { 
    display: "flex", 
    justifyContent: "space-between", 
    marginBottom: "10px", 
    fontSize: "15px" 
},
labelResumen: { 
    color: "#555", 
    fontWeight: "bold" 
},
};

export default Envio;