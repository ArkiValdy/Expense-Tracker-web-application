import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, restore the session.
  useEffect(() => {
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.get('/auth/me');
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const { token, user } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(user);
    return user;
  }

  async function register(name, email, password) {
    const { token, user } = await api.post('/auth/register', { name, email, password });
    setToken(token);
    setUser(user);
    return user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network/expiry errors on logout */
    }
    setToken(null);
    setUser(null);
  }

  const value = { user, setUser, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
