const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Lista os cadastros mais recentes primeiro.
app.get('/api/people', async (request, response) => {
  try {
    const [people] = await pool.execute(
      'SELECT id, name, email, phone, created_at FROM people ORDER BY id DESC',
    );
    response.json(people);
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

app.post('/api/people', validatePerson, async (request, response) => {
  try {
    const { name, email, phone } = request.person;
    const [result] = await pool.execute(
      'INSERT INTO people (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone],
    );

    const [rows] = await pool.execute('SELECT * FROM people WHERE id = ?', [result.insertId]);
    const person = rows[0];
    response.status(201).json(person);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
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
    const [result] = await pool.execute(
      'UPDATE people SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name, email, phone, id],
    );

    const [rows] = await pool.execute('SELECT * FROM people WHERE id = ?', [id]);
    if (rows.length === 0) {
      return response.status(404).json({ error: 'Cadastro não encontrado.' });
    }
    response.json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
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
    const [result] = await pool.execute('DELETE FROM people WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return response.status(404).json({ error: 'Cadastro não encontrado.' });
    }
    response.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir pessoa:', error.message);
    response.status(500).json({ error: 'Não foi possível excluir a pessoa.' });
  }
});

// Inicializa o banco antes de aceitar requisições da interface.
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`API BD-RF conectada ao MySQL e disponível em http://localhost:${port}`);
  });
}).catch(async (error) => {
  console.error('Não foi possível conectar ao MySQL ou preparar a tabela people.');
  console.error(error.message);
  await pool.end();
  process.exitCode = 1;
});
