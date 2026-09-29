require('dotenv').config();

const sql = require('mssql');

// SQL Server Express costuma usar uma instância nomeada, como SQLEXPRESS.
const options = {
  encrypt: process.env.DB_ENCRYPT !== 'false',
  trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
};

if (process.env.DB_INSTANCE) {
  options.instanceName = process.env.DB_INSTANCE;
}

const config = {
  server: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'bd_rf_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bd_rf',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options,
};

// Instâncias nomeadas descobrem a porta pelo SQL Server Browser.
// Sem instância, conectamos diretamente pela porta configurada.
if (!process.env.DB_INSTANCE) {
  config.port = Number(process.env.DB_PORT || 1433);
}

const pool = new sql.ConnectionPool(config);

// Conecta e cria a tabela na primeira inicialização da API.
async function initializeDatabase() {
  await pool.connect();

  try {
    await pool.request().query(`
      CREATE TABLE dbo.people (
        id INT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        name NVARCHAR(120) NOT NULL,
        email NVARCHAR(254) NOT NULL UNIQUE,
        phone NVARCHAR(30) NOT NULL DEFAULT N'',
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
      );
    `);
  } catch (error) {
    // O código 2714 significa que a tabela já existe.
    if (error.number !== 2714) throw error;
  }
}

module.exports = { sql, pool, initializeDatabase };
