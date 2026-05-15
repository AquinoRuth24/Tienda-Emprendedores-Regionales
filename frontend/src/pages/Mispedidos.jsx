import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pedidoAbierto, setPedidoAbierto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cliente = JSON.parse(localStorage.getItem("cliente"));
    const id_cliente = cliente?.id;

    if (!id_cliente) {
      navigate("/login");
      return;
    }
    //cargar pedidos del clinte
    const cargarPedidos = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/pedidos/${id_cliente}`,
        );
        const data = await res.json();
        setPedidos(data);
      } catch (error) {
        console.error("Error al cargar pedidos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarPedidos();
  }, [navigate]);
  //colores de los estados del pedido
  const colorEstado = (estado) => {
    const estados = {
      Pendiente: "#f59e0b",
      Pagado: "#3b82f6",
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
        <p style={estilos.textoCargando}>Cargando pedidos...</p>
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
        <h2 style={estilos.titulo}>Mis Pedidos</h2>

        {pedidos.length === 0 ? (
          <div style={estilos.sinPedidos}>
            <p style={estilos.textoVacio}>
              Todavía no realizaste ningún pedido.
            </p>
            <button
              style={estilos.btnVerProductos}
              onClick={() => navigate("/inicio")}
            >
              Ver productos
            </button>
          </div>
        ) : (
          <div style={estilos.lista}>
            {pedidos.map((pedido) => (
              <div key={pedido.id_pedido} style={estilos.tarjeta}>
                {/* Encabezado*/}
                <div
                  style={estilos.encabezado}
                  onClick={() =>
                    setPedidoAbierto(
                      pedidoAbierto === pedido.id_pedido
                        ? null
                        : pedido.id_pedido,
                    )
                  }
                >
                  <div>
                    <p style={estilos.idPedido}>Pedido #{pedido.id_pedido}</p>
                    <p style={estilos.fecha}>
                      {new Date(pedido.fecha_pedido).toLocaleDateString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div style={estilos.encabezadoDerecha}>
                    <span
                      style={{
                        ...estilos.badge,
                        backgroundColor:
                          colorEstado(pedido.estado_pedido) + "20",
                        color: colorEstado(pedido.estado_pedido),
                      }}
                    >
                      {pedido.estado_pedido}
                    </span>
                    <span style={estilos.flecha}>
                      {pedidoAbierto === pedido.id_pedido ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {pedidoAbierto === pedido.id_pedido && (
                  <div style={estilos.detalle}>
                    {/* Productos */}
                    {pedido.productos?.length > 0 && (
                      <div style={estilos.seccion}>
                        <p style={estilos.tituloSeccion}>Productos</p>
                        {pedido.productos.map((prod, i) => (
                          <div key={i} style={estilos.filaProd}>
                            <span>
                              {prod.nombre} × {prod.cantidad}
                            </span>
                            <span style={estilos.subtotalProd}>
                              ${prod.subtotal?.toLocaleString("es-AR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Envío */}
                    <div style={estilos.seccion}>
                      <p style={estilos.tituloSeccion}>Envío</p>
                      <p style={estilos.textoInfo}>
                        <strong>Tipo:</strong> {pedido.tipo_envio || "—"}
                      </p>
                      <p style={estilos.textoInfo}>
                        <strong>Estado del envío:</strong>{" "}
                        {pedido.estado_envio || "—"}
                      </p>
                      {pedido.calle && (
                        <p style={estilos.textoInfo}>
                          <strong>Dirección:</strong> {pedido.calle}{" "}
                          {pedido.numero}, {pedido.ciudad}, {pedido.provincia}
                        </p>
                      )}
                      <p style={estilos.textoInfo}>
                        <strong>Costo de envío:</strong> $
                        {pedido.costo_envio?.toLocaleString("es-AR") ?? "0"}
                      </p>
                    </div>

                    {/* Total */}
                    {pedido.total && (
                      <div style={estilos.filaTotal}>
                        <span style={estilos.labelTotal}>Total</span>
                        <span style={estilos.valorTotal}>
                          ${pedido.total?.toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}

                    {/* Comprobante */}
                    {pedido.nro_comprobante && (
                      <p style={estilos.comprobante}>
                        Comprobante: {pedido.nro_comprobante}
                      </p>
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
    fontSize: "20px",
  },
  navDerecha: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
    padding: "2rem 1rem",
  },
  titulo: {
    color: "#333",
    fontSize: "22px",
    marginBottom: "1.5rem",
  },
  cargando: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
  },
  textoCargando: {
    color: "#6b7280",
    fontSize: "1rem",
  },
  sinPedidos: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  textoVacio: {
    color: "#6b7280",
    fontSize: "1rem",
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
    gap: "1rem",
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
  idPedido: {
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
    fontSize: "15px",
  },
  fecha: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: "2px 0 0",
  },
  encabezadoDerecha: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  flecha: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  detalle: {
    padding: "1.25rem",
    borderTop: "1px solid #f1f5f9",
  },
  seccion: {
    marginBottom: "1rem",
  },
  tituloSeccion: {
    fontWeight: "600",
    color: "#475569",
    fontSize: "13px",
    marginBottom: "0.5rem",
  },
  filaProd: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.4rem 0",
    borderBottom: "1px solid #f8fafc",
    fontSize: "14px",
    color: "#334155",
  },
  subtotalProd: {
    fontWeight: "600",
  },
  textoInfo: {
    color: "#64748b",
    fontSize: "13px",
    margin: "2px 0",
  },
  filaTotal: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "0.75rem",
    borderTop: "1px solid #e2e8f0",
  },
  labelTotal: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "15px",
  },
  valorTotal: {
    fontWeight: "700",
    color: "#4ab8d8",
    fontSize: "17px",
  },
  comprobante: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "0.5rem",
  },
};
