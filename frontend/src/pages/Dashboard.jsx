import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import SearchBar from '../components/SearchBar.jsx';

const CATEGORIES = ['All', 'Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Other'];

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('');

  async function load() {
    const data = await api.get('/expenses');
    setExpenses(data);
  }

  useEffect(() => {
    load().catch((e) => setStatus(e.message));
  }, []);

  // Auto-dismiss the status banner after a few seconds.
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(''), 3000);
    return () => clearTimeout(t);
  }, [status]);

  // Real-time client-side filtering as the user types.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      const matchesCategory = category === 'All' || exp.category === category;
      const matchesSearch =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        (exp.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [expenses, search, category]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered]
  );

  async function handleSave(payload) {
    if (editing) {
      await api.put(`/expenses/${editing._id}`, payload);
      setStatus('Expense updated.');
    } else {
      await api.post('/expenses', payload);
      setStatus('Expense added.');
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(exp) {
    if (!window.confirm(`Delete "${exp.title}"?`)) return;
    await api.del(`/expenses/${exp._id}`);
    setStatus('Expense deleted.');
    if (editing && editing._id === exp._id) setEditing(null);
    await load();
  }

  return (
    <div className="dashboard">
      <header className="page-head">
        <div>
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">Track and manage your spending.</p>
        </div>
        <div className="total-box">
          <span>Total (filtered)</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
      </header>

      {status && <div className="alert alert-info">{status}</div>}

      <div className="dashboard-grid">
        <ExpenseForm
          editing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <section className="card">
          <div className="list-controls">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Live search by title or description…"
            />
            <select
              className="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All categories' : c}
                </option>
              ))}
            </select>
          </div>

          <p className="muted result-count">
            {filtered.length} of {expenses.length} expenses
          </p>

          <ExpenseList
            expenses={filtered}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </div>
  );
}
