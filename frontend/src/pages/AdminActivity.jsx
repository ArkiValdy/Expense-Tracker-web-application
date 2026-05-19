import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import SearchBar from '../components/SearchBar.jsx';

const ACTIONS = ['All', 'login', 'logout', 'register', 'create', 'update', 'delete'];

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('All');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const data = await api.get('/activity');
    setActivities(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      const matchesAction = action === 'All' || a.action === action;
      const matchesSearch =
        !q ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.details || '').toLowerCase().includes(q);
      return matchesAction && matchesSearch;
    });
  }, [activities, search, action]);

  async function removeOne(a) {
    if (!window.confirm('Delete this activity entry?')) return;
    try {
      await api.del(`/activity/${a._id}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function clearAll() {
    if (!window.confirm('Clear the ENTIRE activity log? This cannot be undone.')) return;
    try {
      await api.del('/activity');
      setMsg('Activity log cleared.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Activity Log</h1>
          <p className="muted">Login/logout and CRUD actions across all users.</p>
        </div>
        <button className="btn btn-danger" onClick={clearAll}>
          Clear log
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card">
        <div className="list-controls">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by user email or details…"
          />
          <select
            className="category-filter"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a === 'All' ? 'All actions' : a}
              </option>
            ))}
          </select>
        </div>

        <p className="muted result-count">
          {filtered.length} of {activities.length} entries
        </p>

        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a._id}>
                <td className="nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                <td>{a.email || '—'}</td>
                <td>
                  <span className={`badge action-${a.action}`}>{a.action}</span>
                </td>
                <td>{a.details}</td>
                <td>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => removeOne(a)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">No activity found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
