import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) { setLoading(false); return; }

    // Try to restore session — keep token unless server explicitly rejects it
    api.sessionGet()
      .then(res => {
        if (res.success) {
          setUser(res.data.user);
        } else if (res.status === 401) {
          // Only clear token on explicit 401 Unauthorized
          localStorage.removeItem('ss_token');
        }
        // Any other error (500, network) — keep token, stay logged in
      })
      .catch(() => {
        // Network error — keep token, user stays logged in
        // They'll be properly verified on next successful request
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.signIn({ email, password });
    if (res.success) {
      localStorage.setItem('ss_token', res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    const res = await api.register(data);
    return res;
  };

  const logout = async () => {
    await api.sessionDestroy().catch(() => {});
    localStorage.removeItem('ss_token');
    setUser(null);
  };

  // Derive isLoggedIn from token existence OR user object
  const token = localStorage.getItem('ss_token');
  const isLoggedIn = !!user || !!token;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);