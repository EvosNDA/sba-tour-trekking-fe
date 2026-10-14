import { apiClient } from '../../../lib/axios';
import { LoginPayload, RegisterPayload, AuthSession } from '../types/auth.types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    try {
      const res = await apiClient.post<AuthSession>('/auth/login', payload);
      return res.data;
    } catch {
      // Mock fallback
      const derivedName = payload.email.includes('@')
        ? payload.email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
        : 'Eleanor Vance';

      return {
        token: 'mock_jwt_token_auth',
        user: {
          id: 'user_1',
          name: derivedName,
          email: payload.email,
          role: 'customer',
        },
      };
    }
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    try {
      const res = await apiClient.post<AuthSession>('/auth/register', payload);
      return res.data;
    } catch {
      return {
        token: 'mock_jwt_token_auth',
        user: {
          id: 'user_' + Date.now(),
          name: payload.name,
          email: payload.email,
          role: 'customer',
        },
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore
    }
  },
};
