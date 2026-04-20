const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  port: 1433
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Conectado a la base de datos exitosamente!');
    return pool;
  })
  .catch(err => {
    console.error('Error de conexión:', err.message);
    throw err;
  });

module.exports = { sql, poolPromise };