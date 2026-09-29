const express = require('express');
const cors = require('cors');
const { sql, pool, initializeDatabase } = require('./database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Lista todos os cadastros mais recentes primeiro.
app.get('/api/people', async (request, response) => {
  try {
    const result = await pool.request().query(`
      SELECT id, name, email, phone, created_at
      FROM dbo.people
      ORDER BY id DESC;
    `);
    response.json(result.recordset);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error.message);
    response.status(500).json({ error: 'Não foi possível carregar os cadastros.' });
  }
});

// Validação compartilhada para criação e edição.
function validatePerson(request, response, next) {
  const { name, email, phone = '' } = request.body;
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return response.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  request.person = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: typeof phone === 'string' ? phone.trim() : '',
  };
  next();
}

function isDuplicateEmail(error) {
  return error.number === 2601 || error.number === 2627;
}

app.post('/api/people', validatePerson, async (request, response) => {
  try {
    const { name, email, phone } = request.person;
    const result = await pool.request()
      .input('name', sql.NVarChar(120), name)
      .input('email', sql.NVarChar(254), email)
      .input('phone', sql.NVarChar(30), phone)
      .query(`
        INSERT INTO dbo.people (name, email, phone)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.created_at
        VALUES (@name, @email, @phone);
      `);

    response.status(201).json(result.recordset[0]);
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return response.status(409).json({ error: 'Já existe um cadastro com este e-mail.' });
    }
    console.error('Erro ao cadastrar pessoa:', error.message);
    response.status(500).json({ error: 'Não foi possível cadastrar a pessoa.' });
  }
});

app.put('/api/people/:id', validatePerson, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: 'Identificador inválido.' });
  }

  try {
    const { name, email, phone } = request.person;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(120), name)
      .input('email', sql.NVarChar(254), email)
      .input('phone', sql.NVarChar(30), phone)
      .query(`
        UPDATE dbo.people
        SET name = @name, email = @email, phone = @phone
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.created_at
        WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return response.status(404).json({ error: 'Cadastro não encontrado.' });
    }
    response.json(result.recordset[0]);
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return response.status(409).json({ error: 'Já existe um cadastro com este e-mail.' });
    }
    console.error('Erro ao atualizar pessoa:', error.message);
    response.status(500).json({ error: 'Não foi possível atualizar a pessoa.' });
  }
});

app.delete('/api/people/:id', async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: 'Identificador inválido.' });
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.people OUTPUT DELETED.id WHERE id = @id;');

    if (result.recordset.length === 0) {
      return response.status(404).json({ error: 'Cadastro não encontrado.' });
    }
    response.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir pessoa:', error.message);
    response.status(500).json({ error: 'Não foi possível excluir a pessoa.' });
  }
});

// Só abre a porta da API depois de conectar ao SQL Server.
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`API BD-RF conectada ao SQL Server em http://localhost:${port}`);
  });
}).catch(async (error) => {
  console.error('Não foi possível conectar ao SQL Server ou preparar a tabela people.');
  console.error(error.message);
  if (pool.connected) await pool.close();
  process.exitCode = 1;
});
