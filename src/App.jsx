import { useEffect, useMemo, useState } from 'react';

const emptyForm = { name: '', email: '', phone: '' };

// Centraliza a comunicação HTTP para facilitar manutenção e leitura.
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Ocorreu um erro. Tente novamente.');
  }
  return response.status === 204 ? null : response.json();
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function App() {
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPeople() {
    try {
      setPeople(await apiRequest('/api/people'));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPeople(); }, []);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return people;
    return people.filter((person) =>
      `${person.name} ${person.email} ${person.phone}`.toLocaleLowerCase('pt-BR').includes(query),
    );
  }, [people, search]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const person = await apiRequest(
        editingId ? `/api/people/${editingId}` : '/api/people',
        { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) },
      );
      if (editingId) {
        setPeople((current) => current.map((item) => item.id === person.id ? person : item));
        setNotice('Cadastro atualizado com sucesso.');
      } else {
        setPeople((current) => [person, ...current]);
        setNotice('Pessoa cadastrada com sucesso.');
      }
      cancelEdit();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(person) {
    setEditingId(person.id);
    setForm({ name: person.name, email: person.email, phone: person.phone || '' });
    setNotice('');
    document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function deletePerson(person) {
    if (!window.confirm(`Excluir o cadastro de ${person.name}?`)) return;
    try {
      await apiRequest(`/api/people/${person.id}`, { method: 'DELETE' });
      setPeople((current) => current.filter((item) => item.id !== person.id));
      if (editingId === person.id) cancelEdit();
      setNotice('Cadastro excluído.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="BD-RF início">
          <span className="brand-mark">b<span>.</span></span>
          <span className="brand-name">bd<span>-</span>rf</span>
        </a>
        <nav className="top-nav" aria-label="Menu principal">
          <a className="nav-link active" href="#cadastro">Pessoas</a>
          <a className="nav-link" href="#lista">Cadastros</a>
        </nav>
        <div className="topbar-right"><span className="status-dot" /> MySQL conectado</div>
      </header>

      <main id="inicio" className="main-content">
        <section className="intro">
          <div className="eyebrow"><span className="eyebrow-line" /> PAINEL DE CADASTROS</div>
          <h1>Cadastro de pessoas<span>.</span></h1>
          <p>Um lugar simples para organizar as informações do seu time.</p>
        </section>

        <section className="stats-row" aria-label="Resumo dos cadastros">
          <div className="stat-card"><span className="stat-icon people-icon">♧</span><div><span className="stat-label">PESSOAS CADASTRADAS</span><strong>{people.length.toString().padStart(2, '0')}</strong></div></div>
          <div className="stat-card"><span className="stat-icon sync-icon">↻</span><div><span className="stat-label">ARMAZENAMENTO</span><strong className="stat-text">MySQL</strong></div></div>
          <div className="stat-card"><span className="stat-icon shield-icon">⌑</span><div><span className="stat-label">STATUS DO SISTEMA</span><strong className="stat-text status-text">Operacional <i /></strong></div></div>
        </section>

        <div className="content-grid">
          <section className="panel form-panel" id="cadastro">
            <div className="panel-heading">
              <div className="heading-icon">＋</div>
              <div><h2>{editingId ? 'Editar cadastro' : 'Novo cadastro'}</h2><p>Preencha os dados da pessoa abaixo</p></div>
            </div>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Nome completo <span>*</span></label>
              <input id="name" name="name" value={form.name} onChange={updateField} placeholder="Ex: Maria da Silva" required maxLength="120" />

              <label htmlFor="email">E-mail <span>*</span></label>
              <input id="email" type="email" name="email" value={form.email} onChange={updateField} placeholder="maria@email.com" required maxLength="254" />

              <label htmlFor="phone">Telefone <small>OPCIONAL</small></label>
              <input id="phone" type="tel" name="phone" value={form.phone} onChange={updateField} placeholder="(11) 99999-9999" maxLength="30" />

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar cadastro'} <span>→</span></button>
                {editingId && <button className="cancel-button" type="button" onClick={cancelEdit}>Cancelar</button>}
              </div>
            </form>
            <div className="privacy-note"><span>♧</span> Seus dados ficam armazenados localmente.</div>
          </section>

          <section className="panel list-panel" id="lista">
            <div className="list-heading">
              <div><div className="list-title-line"><h2>Pessoas cadastradas</h2><span className="count-badge">{people.length}</span></div><p>Gerencie os cadastros existentes</p></div>
              <div className="search-box"><span>⌕</span><input aria-label="Buscar pessoa" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." /></div>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr><th>PESSOA</th><th>TELEFONE</th><th className="actions-heading">AÇÕES</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="3" className="empty-state">Carregando cadastros…</td></tr> : filteredPeople.length === 0 ? (
                    <tr><td colSpan="3" className="empty-state">{search ? 'Nenhuma pessoa encontrada.' : 'Nenhum cadastro ainda. Adicione a primeira pessoa ao lado.'}</td></tr>
                  ) : filteredPeople.map((person) => (
                    <tr key={person.id}>
                      <td><div className="person-cell"><span className="avatar">{initials(person.name)}</span><span className="person-copy"><strong>{person.name}</strong><small>{person.email}</small></span></div></td>
                      <td className="phone-cell">{person.phone || '—'}</td>
                      <td><div className="row-actions"><button type="button" className="edit-button" onClick={() => startEdit(person)} aria-label={`Editar ${person.name}`} title="Editar">✎</button><button type="button" className="delete-button" onClick={() => deletePerson(person)} aria-label={`Excluir ${person.name}`} title="Excluir">⌫</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Exibindo <strong>{filteredPeople.length}</strong> de <strong>{people.length}</strong> cadastros</span><span className="footer-mark">BD-RF <i>·</i> MYSQL</span></div>
          </section>
        </div>
        {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" aria-label="Fechar mensagem" onClick={() => setNotice('')}>×</button></div>}
        <footer className="page-footer"><span>BD-RF <i>·</i> PROJETO DE ESTUDO</span><span>Feito para aprender, um cadastro de cada vez.</span></footer>
      </main>
    </div>
  );
}
