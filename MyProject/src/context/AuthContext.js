import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

const mergeUser = (incoming, fallback = null) => {
  if (!incoming && !fallback) return null;
  const merged = { ...(fallback || {}), ...(incoming || {}) };
  if (incoming && !Object.prototype.hasOwnProperty.call(incoming, 'dateOfBirth')) merged.dateOfBirth = fallback?.dateOfBirth || '';
  if (incoming && !Object.prototype.hasOwnProperty.call(incoming, 'profileImage')) merged.profileImage = fallback?.profileImage || null;
  return merged;
};

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
          const restoredUser = mergeUser(current.user, savedUser);
          setUser(restoredUser);
          await storage.set('user', restoredUser);
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
    const nextUser = mergeUser({ ...result.user, ...values }, user);
    setUser(nextUser);
    await storage.set('user', nextUser);
    return nextUser;
  }, [user]);

  const refreshUser = useCallback(async () => {
    const current = await authService.me();
    const nextUser = mergeUser(current.user, user);
    setUser(nextUser);
    await storage.set('user', nextUser);
    return nextUser;
  }, [user]);

  const submitVerification = useCallback(async (values) => {
    const result = await authService.submitVerification(values);
    setUser(result.user);
    await storage.set('user', result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, submitVerification, refreshUser, isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout, updateProfile, submitVerification, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
