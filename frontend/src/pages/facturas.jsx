import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import fetchConToken from "../utils/fetchConToken";

export default function Facturas() {
const [facturas, setFacturas] = useState([]);
const [cargando, setCargando] = useState(true);
const [facturaAbierta, setFacturaAbierta] = useState(null);
const [pagando, setPagando] = useState(null); // id_factura que está en proceso de pago
const [metodosPago, setMetodosPago] = useState([]);
const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState({});
const navigate = useNavigate();

const cliente = JSON.parse(localStorage.getItem("cliente"));
const id_cliente = cliente?.id;

const cargarFacturas = useCallback(async () => {
try {
    const res = await fetchConToken(`http://localhost:3001/api/factura/${id_cliente}`);
    const data = await res.json();
    setFacturas(data);
} catch (error) {
    console.error("Error al cargar facturas:", error);
} finally {
    setCargando(false);
}
}, [id_cliente]);

const cargarMetodosPago = useCallback(async () => {
    try {
    const res = await fetchConToken("http://localhost:3001/api/pago/metodos");
    const data = await res.json();
setMetodosPago(data);
    } catch (error) {
    console.error("Error al cargar métodos de pago:", error);
    }
},[]);

useEffect(() => {
if (!id_cliente) {
    navigate("/login");
    return;
}
cargarFacturas();
cargarMetodosPago();
}, [id_cliente, navigate, cargarFacturas, cargarMetodosPago]);

const registrarPago = async (id_factura) => {
    const id_metodo_pago = metodoPagoSeleccionado[id_factura];
    if (!id_metodo_pago) {
    alert("Seleccioná un método de pago");
    return;
    }
    try {
    const res = await fetchConToken(
        "http://localhost:3001/api/pago/registrar",
        {
        method: "POST",
        body: JSON.stringify({ id_factura, id_metodo_pago }),
        },
    );
    const data = await res.json();
    if (res.ok) {
        alert("¡Pago registrado con éxito!");
        setPagando(null);
        cargarFacturas(); // recargar para ver el estado actualizado
    } else {
        alert(data.error || "Error al registrar el pago");
    }
    } catch (error) {
    console.error("Error al registrar pago:", error);
    alert("No se pudo conectar con el servidor");
    }
};

const colorEstado = (estado) => {
    const estados = {
    Pendiente: "#f59e0b",
    Pagado: "#10b981",
    "En preparación": "#8b5cf6",
    Enviado: "#06b6d4",
    Entregado: "#10b981",
    Cancelado: "#ef4444",
    };
    return estados[estado] || "#6b7280";
};

if (cargando) {
    return (
    <div style={estilos.cargando}>
        <p style={estilos.textoCargando}>Cargando facturas...</p>
    </div>
    );
}

return (
    <div style={estilos.pagina}>
      {/* NAVBAR */}
    <nav style={estilos.navbar}>
        <h2 style={estilos.logo}>Tienda Emprendedores</h2>
        <div style={estilos.navDerecha}>
        <button style={estilos.btnNav} onClick={() => navigate("/inicio")}>
            ← Volver a la tienda
        </button>
        </div>
    </nav>

      {/* CONTENIDO */}
    <div style={estilos.contenido}>
        <h2 style={estilos.titulo}>Mis Facturas</h2>

        {facturas.length === 0 ? (
        <div style={estilos.sinFacturas}>
            <p style={estilos.textoVacio}>Todavía no tenés facturas.</p>
            <button
            style={estilos.btnVerProductos}
            onClick={() => navigate("/inicio")}
            >
            Ver productos
            </button>
        </div>
        ) : (
        <div style={estilos.lista}>
            {facturas.map((factura) => (
            <div key={factura.id_factura} style={estilos.tarjeta}>
                {/* Encabezado */}
                <div
                style={estilos.encabezado}
                onClick={() =>
                    setFacturaAbierta(
                    facturaAbierta === factura.id_factura
                        ? null
                        : factura.id_factura,
                    )
                }
                >
                <div>
                    <p style={estilos.nroComprobante}>
                    {factura.nro_comprobante}
                    </p>
                    <p style={estilos.idFactura}>Pedido #{factura.id_pedido}</p>
                    <p style={estilos.fecha}>
                    {new Date(factura.fecha).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    })}
                    </p>
                </div>
                <div style={estilos.encabezadoDerecha}>
                    <span
                    style={{
                        ...estilos.badge,
                        backgroundColor:
                        colorEstado(factura.estado_pedido) + "20",
                        color: colorEstado(factura.estado_pedido),
                    }}
                    >
                    {factura.estado_pedido}
                    </span>
                    <span style={estilos.flecha}>
                    {facturaAbierta === factura.id_factura ? "▲" : "▼"}
                    </span>
                </div>
                </div>

                {/* Detalle expandible */}
                {facturaAbierta === factura.id_factura && (
                <div style={estilos.detalle}>
                    {/* Items */}
                    {factura.items?.length > 0 && (
                    <div style={estilos.seccion}>
                        <p style={estilos.tituloSeccion}>Productos</p>
                        {factura.items.map((item, i) => (
                        <div key={i} style={estilos.filaItem}>
                            <span>
                            {item.nombre} × {item.cantidad}
                            </span>
                            <span style={estilos.subtotal}>
                            ${item.subtotal?.toLocaleString("es-AR")}
                            </span>
                        </div>
                        ))}
                    </div>
                    )}

                    {/* Total */}
                    <div style={estilos.filaTotal}>
                    <span style={estilos.labelTotal}>Total</span>
                    <span style={estilos.valorTotal}>
                        ${factura.total?.toLocaleString("es-AR")}
                    </span>
                    </div>

                    {/* Sección de pago */}
                    {factura.estado_pedido === "Pendiente" && (
                    <div style={estilos.seccionPago}>
                        <p style={estilos.tituloSeccion}>Registrar pago</p>

                        {pagando === factura.id_factura ? (
                        <div style={estilos.formPago}>
                            <select
                            style={estilos.select}
                            value={
                                metodoPagoSeleccionado[factura.id_factura] || ""
                            }
                            onChange={(e) =>
                                setMetodoPagoSeleccionado({
                                ...metodoPagoSeleccionado,
                                [factura.id_factura]: parseInt(
                                    e.target.value,
                                ),
                                })
                            }
                            >
                            <option value="">Seleccioná un método</option>
                            {metodosPago.map((m) => (
                                <option
                                key={m.id_metodo_pago}
                                value={m.id_metodo_pago}
                                >
                                {m.descripcion}
                                </option>
                            ))}
                            </select>
                            <div style={estilos.botonesFormPago}>
                            <button
                                style={estilos.btnConfirmarPago}
                                onClick={() =>
                                registrarPago(factura.id_factura)
                                }
                            >
                                Confirmar pago
                            </button>
                            <button
                                style={estilos.btnCancelarPago}
                                onClick={() => setPagando(null)}
                            >
                                Cancelar
                            </button>
                            </div>
                        </div>
                        ) : (
                        <button
                            style={estilos.btnPagar}
                            onClick={() => setPagando(factura.id_factura)}
                        >
                            Pagar ahora
                        </button>
                        )}
                    </div>
                    )}
                    {factura.estado_pedido === "Pagado" && (
                    <div style={estilos.pagadoBadge}>✅ Pago registrado</div>
                    )}
                </div>
                )}
            </div>
            ))}
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
logo: { 
    color: "white", 
    margin: 0, 
    fontSize: "20px" 
},
navDerecha: { 
    display: "flex", 
    alignItems: "center", 
    gap: "10px" 
},
btnNav: {
    backgroundColor: "transparent",
    color: "white",
    border: "2px solid white",
    borderRadius: "20px",
    padding: "8px 15px",
    cursor: "pointer",
    fontSize: "13px",
},
contenido: { 
    maxWidth: "860px",
    margin: "0 auto", 
    padding: "2rem 1rem" 
},
titulo: { 
    color: "#333", 
    fontSize: "22px", 
    marginBottom: "1.5rem" 
},
cargando: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
},
textoCargando: { 
    color: "#6b7280", 
    fontSize: "1rem" 
},
sinFacturas: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
},
textoVacio: { 
    color: "#6b7280", 
    fontSize: "1rem" 
},
btnVerProductos: {
    marginTop: "1rem",
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
},
lista: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "1rem" 
},
tarjeta: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
},
encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    cursor: "pointer",
},
nroComprobante: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#4ab8d8",
    margin: "0 0 2px 0",
},
idFactura: {
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    fontSize: "14px",
},
fecha: { 
    color: "#94a3b8", 
    fontSize: "13px", 
    margin: "2px 0 0" 
},
encabezadoDerecha: { 
    display: "flex", 
    alignItems: "center", 
    gap: "1rem" 
},
badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
},
flecha: { 
    color: "#94a3b8", 
    fontSize: "12px" 
},
detalle: { 
    padding: "1.25rem", 
    borderTop: "1px solid #f1f5f9" 
},
seccion: { 
    marginBottom: "1rem" 
},
tituloSeccion: {
    fontWeight: "600",
    color: "#475569",
    fontSize: "13px",
    marginBottom: "0.5rem",
},
filaItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.4rem 0",
    borderBottom: "1px solid #f8fafc",
    fontSize: "14px",
    color: "#334155",
},
subtotal: { 
    fontWeight: "600" 
},
filaTotal: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "0.75rem",
    borderTop: "1px solid #e2e8f0",
    marginBottom: "1rem",
},
labelTotal: { 
    fontWeight: "700", 
    color: "#1e293b", 
    fontSize: "15px" 
},
valorTotal: { 
    fontWeight: "700", 
    color: "#4ab8d8", 
    fontSize: "17px" 
},
seccionPago: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #f1f5f9",
},
formPago: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "0.75rem" 
},
select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
    width: "100%",
},
botonesFormPago: { display: "flex", gap: "0.75rem" },
btnConfirmarPago: {
    flex: 1,
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
},
btnCancelarPago: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
},
btnPagar: {
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    width: "100%",
},
pagadoBadge: {
    marginTop: "1rem",
    padding: "0.75rem",
    backgroundColor: "#f0fdf4",
    color: "#10b981",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    textAlign: "center",
},
};
