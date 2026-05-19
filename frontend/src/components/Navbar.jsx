import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <span className="brand">💰 Expense Tracker</span>

        {user && (
          <div className="nav-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            {user.role === 'admin' && (
              <>
                <NavLink to="/admin/users">Users</NavLink>
                <NavLink to="/admin/activity">Activity</NavLink>
              </>
            )}
            <span className="nav-user">
              {user.name}
              {user.role === 'admin' && <span className="badge">admin</span>}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
