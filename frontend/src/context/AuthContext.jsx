import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokenStore.get()); // false while we restore a saved session

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  // The API client fires this when a saved token is rejected.
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const startSession = useCallback((res) => {
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const login = (body) => authApi.login(body).then(startSession);
  const register = (body) => authApi.register(body).then(startSession);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* token may already be invalid */
    }
    tokenStore.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}
