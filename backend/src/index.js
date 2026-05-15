const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

//importar las rutas

const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//Rutas
app.use('/api/cliente', clienteRoutes);//se define la ruta para el manejo de autentificacion de clientes.

app.use('/api/productos', productoRoutes);//se define la ruta para el manejo de productos

app.use('/api/carrito', require('./routes/carritoRoutes'));//se define la ruta para el manejo del carrito

app.use('/api/envio', require('./routes/envioRoutes'));//se define la ruta para el manejo de envios

app.use('/api/pedidos', require('./routes/pedidoRoutes'));//se define la ruta para el menejo de los pedidos

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});