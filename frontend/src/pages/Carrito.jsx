import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Carrito() {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [idCarrito, setIdCarrito] = useState(null);
  const navigate = useNavigate();

  const cliente = JSON.parse(localStorage.getItem("cliente"));
  const id_cliente = cliente?.id || 1; // Usamos el ID del cliente logueado

  const cargarCarrito = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/carrito/${id_cliente}`);
      const data = await res.json();
      setItems(data.items || []);
      setSubtotal(data.subtotal || 0);
      setIdCarrito(data.id_carrito);
    } catch (error) {
      console.error("Error al cargar carrito:", error);
    }
  };
  
useEffect(() => {
    cargarCarrito();
  }, []);

  const eliminarItem = async (id_item_carrito) => {
    try {
      const res = await fetch('http://localhost:3001/api/carrito/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_item_carrito, id_carrito: idCarrito })
      });
      if (res.ok) {
        cargarCarrito(); // Recargamos para actualizar el total y la lista
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  return (
    <div style={estilos.pagina}>
      <nav style={estilos.navbar}>
        <h2 style={estilos.logo}>Mi Carrito</h2>
        <button style={estilos.btnNav} onClick={() => navigate("/inicio")}>Volver a la Tienda</button>
      </nav>

      <div style={estilos.contenido}>
        {items.length === 0 ? (
          <div style={estilos.tarjeta}>
            <h2>Tu carrito está vacío 🛒</h2>
            <p>¡Agregá algunos productos de nuestros emprendedores!</p>
          </div>
        ) : (
          <div style={estilos.carritoLayout}>
            <div style={estilos.listaItems}>
              {items.map((item) => (
                <div key={item.id_item_carrito} style={estilos.item}>
                  <div style={estilos.infoItem}>
                    <h3>{item.nombre}</h3>
                    <p>Cantidad: {item.cantidad}</p>
                    <p>Precio Unitario: ${item.precio}</p>
                  </div>
                  <div style={estilos.accionesItem}>
                    <h4>${item.cantidad * item.precio}</h4>
                    <button style={estilos.btnEliminar} onClick={() => eliminarItem(item.id_item_carrito)}>
                      ❌ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={estilos.resumen}>
              <h3>Resumen de Compra</h3>
              <hr />
              <h2>Total: ${subtotal}</h2>
              <button style={estilos.btnFinalizar} onClick={() => alert("¡Próximamente: Finalizar Compra!")}>
                Finalizar Compra
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const estilos = {
  pagina: { minHeight: "100vh", backgroundColor: "#d6e8f7", fontFamily: "Arial, sans-serif" },
  navbar: { backgroundColor: "#4ab8d8", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  logo: { color: "white", margin: 0 },
  btnNav: { backgroundColor: "transparent", color: "white", border: "2px solid white", borderRadius: "20px", padding: "8px 15px", cursor: "pointer" },
  contenido: { padding: "40px", maxWidth: "1000px", margin: "0 auto" },
  tarjeta: { backgroundColor: "white", padding: "30px", borderRadius: "10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  carritoLayout: { display: "flex", gap: "20px", alignItems: "flex-start" },
  listaItems: { flex: 2, display: "flex", flexDirection: "column", gap: "15px" },
  item: { backgroundColor: "white", padding: "20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  infoItem: { display: "flex", flexDirection: "column", gap: "5px" },
  accionesItem: { textAlign: "right", display: "flex", flexDirection: "column", gap: "10px" },
  btnEliminar: { backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer" },
  resumen: { flex: 1, backgroundColor: "white", padding: "20px", borderRadius: "10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  btnFinalizar: { backgroundColor: "#4ab8d8", color: "white", border: "none", padding: "15px", borderRadius: "8px", width: "100%", fontSize: "16px", cursor: "pointer", marginTop: "15px", fontWeight: "bold" }
};

export default Carrito;