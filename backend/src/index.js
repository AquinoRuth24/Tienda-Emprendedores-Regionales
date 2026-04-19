const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

const clienteRoutes = require('./routes/clienteRoutes');//importar las rutas

const app = express();
app.use(cors());
app.use(express.json());

//Rutas
app.use('/api/cliente', clienteRoutes);//se define la ruta para el manejo de autentificacion de clientea.

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});