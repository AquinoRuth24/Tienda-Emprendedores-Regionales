import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Inicio from './pages/Inicio'
import Carrito from './pages/Carrito';
import Envio from "./pages/Envio";
import MisPedidos from "./pages/Mispedidos";
import Facturas from "./pages/facturas";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/envio" element={<Envio />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/facturas" element={<Facturas />} />
    </Routes>
  )
}

export default App