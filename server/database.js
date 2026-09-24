require('dotenv').config();

const mysql = require('mysql2/promise');

// Pool compartilhado: reutiliza conexões e aceita várias requisições da API.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'bd_rf_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bd_rf',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Cria a tabela usada pelo CRUD na primeira execução do servidor.
async function initializeDatabase() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS people (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      phone VARCHAR(30) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
  `);
}

module.exports = { pool, initializeDatabase };
