import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleUpdate(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const body = { name };
      if (password) body.password = password;
      await api.put('/users/me', body);
      setUser({ ...user, name });
      setPassword('');
      setMsg('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your account and all your expenses? This cannot be undone.')) {
      return;
    }
    try {
      await api.del('/users/me');
      await logout();
      navigate('/register');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-card wide">
      <h1>My Profile</h1>

      <div className="profile-meta">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleUpdate}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          New password <span className="muted">(leave blank to keep current)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            placeholder="••••••"
          />
        </label>
        <button className="btn btn-primary">Save changes</button>
      </form>

      <hr />

      <div className="danger-zone">
        <h3>Danger zone</h3>
        <p className="muted">Permanently delete your account and expenses.</p>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete my account
        </button>
      </div>
    </div>
  );
}
