import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const data = await api.get('/users');
    setUsers(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function changeRole(u, role) {
    try {
      await api.put(`/users/${u._id}`, { role });
      setMsg(`${u.email} is now ${role}.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function rename(u) {
    const name = window.prompt('New name for ' + u.email, u.name);
    if (!name || name === u.name) return;
    try {
      await api.put(`/users/${u._id}`, { name });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(u) {
    if (!window.confirm(`Delete user ${u.email} and all their expenses?`)) return;
    try {
      await api.del(`/users/${u._id}`);
      setMsg(`Deleted ${u.email}.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>User Management</h1>
          <p className="muted">View and manage all registered accounts.</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search users by name or email…"
        />
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}>
                    {u.role}
                  </span>
                </td>
                <td>{(u.createdAt || '').slice(0, 10)}</td>
                <td className="row-actions">
                  <button className="btn btn-small" onClick={() => rename(u)}>
                    Rename
                  </button>
                  {u.role === 'user' ? (
                    <button
                      className="btn btn-small"
                      onClick={() => changeRole(u, 'admin')}
                    >
                      Make admin
                    </button>
                  ) : (
                    <button
                      className="btn btn-small"
                      onClick={() => changeRole(u, 'user')}
                      disabled={u._id === me._id}
                    >
                      Make user
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => remove(u)}
                    disabled={u._id === me._id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
