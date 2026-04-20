import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Inicio() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [emprendedores, setEmprendedores] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [emprendedorSeleccionado, setEmprendedorSeleccionado] = useState(null);
  const navigate = useNavigate();

  // Obtener cliente del localStorage
  const cliente = JSON.parse(localStorage.getItem("cliente"));

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarEmprendedores();
  }, []);

  const cargarEmprendedores = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3001/api/productos/emprendedores",
      );
      setEmprendedores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/productos");
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCategorias = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3001/api/productos/categorias",
      );
      setCategorias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtrarPorCategoria = async (id_categoria) => {
    setCategoriaSeleccionada(id_categoria);
    setEmprendedorSeleccionado(null);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/productos/categoria/${id_categoria}`,
      );
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtrarPorEmprendedor = async (id_usuario) => {
    setEmprendedorSeleccionado(id_usuario);
    setCategoriaSeleccionada(null);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/productos/emprendedor/${id_usuario}`,
      );
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada(null);
    setEmprendedorSeleccionado(null);
    cargarProductos();
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cliente");
    navigate("/login");
  };

  return (
    <div style={estilos.pagina}>
      {/* NAVBAR */}
      <nav style={estilos.navbar}>
        <h2 style={estilos.logo}>Tienda Emprendedores</h2>
        <div style={estilos.navDerecha}>
          <span style={estilos.bienvenido}>{cliente?.nombre}</span>
          <button style={estilos.btnNav} onClick={() => navigate("/carrito")}>
            Carrito
          </button>
          <button style={estilos.btnNav} onClick={() => navigate("/facturas")}>
            Facturas
          </button>
          <button style={estilos.btnCerrar} onClick={cerrarSesion}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div style={estilos.contenido}>
        {/* SIDEBAR IZQUIERDO */}
        <div style={estilos.sidebar}>
          {/* Categorías */}
          <div style={estilos.seccionFiltro}>
            <h3 style={estilos.tituloFiltro}>Categorías</h3>
            <button
              style={
                categoriaSeleccionada === null &&
                emprendedorSeleccionado === null
                  ? estilos.filtroActivo
                  : estilos.filtroBtn
              }
              onClick={limpiarFiltros}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id_categoria}
                style={
                  categoriaSeleccionada === cat.id_categoria
                    ? estilos.filtroActivo
                    : estilos.filtroBtn
                }
                onClick={() => filtrarPorCategoria(cat.id_categoria)}
              >
                {cat.descripcion}
              </button>
            ))}
          </div>

          {/* Emprendedores */}
          <div style={estilos.seccionFiltro}>
            <h3 style={estilos.tituloFiltro}>Emprendedores</h3>
            {emprendedores.map((emp) => (
              <button
                key={emp.id_usuario}
                style={
                  emprendedorSeleccionado === emp.id_usuario
                    ? estilos.filtroActivo
                    : estilos.filtroBtn
                }
                onClick={() => filtrarPorEmprendedor(emp.id_usuario)}
              >
                <strong>{emp.apellidoNombre}</strong>
                <br />
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  {emp.categorias}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div style={estilos.listaProductos}>
          <h2 style={estilos.tituloProductos}>
            {categoriaSeleccionada
              ? `Categoría: ${categorias.find((c) => c.id_categoria === categoriaSeleccionada)?.descripcion}`
              : emprendedorSeleccionado
                ? `Emprendedor #${emprendedorSeleccionado}`
                : "Todos los productos"}
          </h2>

          <div style={estilos.grilla}>
            {productos.length === 0 ? (
              <p>No hay productos disponibles.</p>
            ) : (
              productos.map((producto) => {
  console.log('Producto:', producto.nombre, '| imagen:', producto.imagen);
  return (
    <div key={producto.id_producto} style={estilos.tarjeta}>
                  {producto.imagen ? (
                    <img
                      src={`http://localhost:3001/uploads/${producto.imagen}`}
                      alt={producto.nombre}
                      style={estilos.imagen}
                      onError={(e) =>
                        console.log("Error cargando imagen:", e.target.src)
                      }
                    />
                  ) : (
                    <div style={estilos.imagenPlaceholder}>🛍️</div>
                  )}
                  <h3 style={estilos.nombreProducto}>{producto.nombre}</h3>
                  <p style={estilos.descripcion}>{producto.descripcion}</p>
                  <p style={estilos.categoria}> {producto.categoria}</p>
                  <p style={estilos.precio}>${producto.precio}</p>
                  <p style={estilos.stock}>Stock: {producto.stock}</p>
                  <button style={estilos.btnAgregar}>Agregar al carrito</button>
                </div>
                ); // ← cerrás el return
    })
            )}
          </div>
        </div>
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
  bienvenido: {
    color: "white",
    fontSize: "14px",
    marginRight: "10px",
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
  btnCerrar: {
    backgroundColor: "white",
    color: "#4ab8d8",
    border: "none",
    borderRadius: "20px",
    padding: "8px 15px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  contenido: {
    display: "flex",
    padding: "20px",
    gap: "20px",
  },
  sidebar: {
    width: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  seccionFiltro: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tituloFiltro: {
    color: "#333",
    fontSize: "15px",
    marginBottom: "5px",
  },
  filtroBtn: {
    backgroundColor: "#eaf4fb",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "left",
  },
  filtroActivo: {
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "left",
  },
  listaProductos: {
    flex: 1,
  },
  tituloProductos: {
    color: "#333",
    marginBottom: "15px",
    fontSize: "20px",
  },
  grilla: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "15px",
  },
  tarjeta: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  imagenPlaceholder: {
    fontSize: "40px",
    textAlign: "center",
    padding: "10px",
    backgroundColor: "#eaf4fb",
    borderRadius: "8px",
  },
  imagen: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  nombreProducto: {
    color: "#333",
    fontSize: "15px",
    margin: 0,
  },
  descripcion: {
    color: "#666",
    fontSize: "12px",
    margin: 0,
  },
  categoria: {
    color: "#888",
    fontSize: "12px",
    margin: 0,
  },
  precio: {
    color: "#4ab8d8",
    fontSize: "18px",
    fontWeight: "bold",
    margin: 0,
  },
  stock: {
    color: "#888",
    fontSize: "12px",
    margin: 0,
  },
  btnAgregar: {
    backgroundColor: "#4ab8d8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    fontSize: "13px",
    marginTop: "5px",
  },
};

export default Inicio;
