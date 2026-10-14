import { useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi } from '../api/auth.api';
import { LoginPayload, RegisterPayload } from '../types/auth.types';

export function useAuth() {
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.login(payload);
      store.login(session.user, session.token);
      return session;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.register(payload);
      store.login(session.user, session.token);
      return session;
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      store.logout();
      setIsLoading(false);
    }
  };

  return {
    ...store,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
