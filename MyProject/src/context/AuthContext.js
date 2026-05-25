import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const [savedUser, token] = await Promise.all([storage.get('user'), storage.get('token')]);
      if (savedUser && token) {
        setUser(savedUser);
        try {
          const current = await authService.me();
          setUser(current.user);
          await storage.set('user', current.user);
        } catch {
          setUser(savedUser);
        }
      }
      setLoading(false);
    }
    restore();
  }, []);

  const storeSession = useCallback(async (result) => {
    await Promise.all([storage.set('token', result.token), storage.set('user', result.user)]);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (values) => storeSession(await authService.login(values)), [storeSession]);
  const register = useCallback(async (values) => storeSession(await authService.register(values)), [storeSession]);

  const logout = useCallback(async () => {
    await storage.clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (values) => {
    const result = await authService.updateProfile(values);
    setUser(result.user);
    await storage.set('user', result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
