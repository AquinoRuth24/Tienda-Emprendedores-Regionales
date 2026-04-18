const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'Admin123',
  server: 'localhost',
  database: 'TiendaEmprendedoresInge2',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  port: 1433
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Conectado a SQL Server');
    return pool;
  })
  .catch(err => console.error('Error:', err));

module.exports = { sql, poolPromise };