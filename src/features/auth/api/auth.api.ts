import { apiClient } from '../../../lib/axios';
import { AccountProfile, authStore } from '../../../stores/auth.store';
import {
  RegisterRequest,
  VerifyEmailRequest,
  EmailRequest,
  LoginRequest,
  GoogleLoginRequest,
  ResetPasswordRequest,
  MessageResponse,
  CsrfResponse,
  AuthResponse,
} from '../types/auth.types';

export const authApi = {
  getCsrf: async (signal?: AbortSignal): Promise<CsrfResponse> => {
    return apiClient.fetchCsrfToken(signal);
  },

  register: async (payload: RegisterRequest): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/v1/auth/register', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
  },

  verifyEmail: async (payload: VerifyEmailRequest): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/v1/auth/verify-email', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
  },

  resendVerification: async (payload: EmailRequest): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/v1/auth/resend-verification', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
  },

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
    if (res?.accessToken && res?.account) {
      authStore.setSession(res.accessToken, res.expiresIn || 900, res.account);
    }
    return res;
  },

  loginGoogle: async (payload: GoogleLoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/google', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
    if (res?.accessToken && res?.account) {
      authStore.setSession(res.accessToken, res.expiresIn || 900, res.account);
    }
    return res;
  },

  refresh: async (): Promise<string | null> => {
    return apiClient.refreshAccessToken();
  },

  getMe: async (signal?: AbortSignal): Promise<AccountProfile> => {
    const account = await apiClient.get<AccountProfile>('/api/v1/auth/me', { signal });
    if (account) {
      authStore.setAccount(account);
    }
    return account;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post<void>('/api/v1/auth/logout', undefined, {
        skipAuth: true,
        csrfRequired: true,
      });
    } finally {
      authStore.clearSession();
    }
  },

  forgotPassword: async (payload: EmailRequest): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/v1/auth/forgot-password', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/api/v1/auth/reset-password', payload, {
      skipAuth: true,
      csrfRequired: true,
    });
  },

  restoreSession: async (): Promise<AccountProfile | null> => {
    if (!authStore.hasSessionHint()) {
      authStore.clearSession();
      return null;
    }

    authStore.setInitializing(true);
    try {
      const token = await apiClient.refreshAccessToken();
      if (!token) {
        authStore.clearSession();
        return null;
      }
      const existingAccount = authStore.getState().account;
      if (existingAccount) {
        return existingAccount;
      }
      const me = await authApi.getMe();
      return me;
    } catch {
      authStore.clearSession();
      return null;
    } finally {
      authStore.setInitializing(false);
    }
  },
};
