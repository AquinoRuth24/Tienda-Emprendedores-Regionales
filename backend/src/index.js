const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

require('./config/db');
require('express-async-errors');

//importar las rutas

const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const verificarToken = require('./middlewares/authMiddleware');
const { router: compraRouter } = require('./facade/CompraFacade');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas públicas sin token
app.use('/api/cliente', clienteRoutes);//registro, login, logout
app.use('/api/productos', productoRoutes);//listado de productos para mostrar en el frontend, no requiere autenticacion

//Rutas protegidas (requieren token)
app.use('/api/carrito', verificarToken, require('./routes/carritoRoutes'));//definir la ruta del  carrito
app.use('/api/envio', verificarToken, require('./routes/envioRoutes'));//definir la ruta de la  direccion de envio
app.use('/api/pedidos', verificarToken, require('./routes/pedidoRoutes'));//definir la ruta de los pedidos
app.use('/api/factura', verificarToken, require('./routes/facturaRoutes'));//definir la ruta de las facturas
app.use('/api/pago', verificarToken, require('./routes/pagoRoutes'));//definir la ruta de los pagos
app.use('/api/compra', verificarToken, compraRouter);//definir la ruta de la compra, que es el proceso completo que involucra carrito, envio, pedido y factura


app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
