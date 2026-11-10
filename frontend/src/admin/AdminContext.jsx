import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminTokenStore } from '../api/client.js';
import { adm } from './adminApi.js';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(!adminTokenStore.get());
  const [alerts, setAlerts] = useState(null);

  const refreshAlerts = useCallback(() => adm.get('/admin/alerts').then((r) => setAlerts(r.data)).catch(() => {}), []);

  // badges in the sidebar and the bell: load once signed in, then refresh every minute
  useEffect(() => {
    if (!admin) return undefined;
    refreshAlerts();
    const t = setInterval(refreshAlerts, 60000);
    return () => clearInterval(t);
  }, [admin, refreshAlerts]);

  useEffect(() => {
    if (!adminTokenStore.get()) return;
    adm.get('/admin/auth/me').then((r) => setAdmin(r.data)).catch(() => adminTokenStore.clear()).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const expire = () => setAdmin(null);
    window.addEventListener('admin:expired', expire);
    return () => window.removeEventListener('admin:expired', expire);
  }, []);

  const login = async (body) => {
    const res = await adm.post('/admin/auth/login', body);
    adminTokenStore.set(res.data.token);
    setAdmin(res.data.admin);
  };

  const logout = async () => {
    try {
      await adm.post('/admin/auth/logout');
    } catch {
      /* already invalid */
    }
    adminTokenStore.clear();
    setAdmin(null);
  };

  const can = (perm) => !perm || !!admin?.permissions?.[perm];

  return <AdminContext.Provider value={{ admin, ready, login, logout, can, alerts, refreshAlerts }}>{children}</AdminContext.Provider>;
}
