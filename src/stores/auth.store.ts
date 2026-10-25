import { useState, useEffect } from 'react';
import { UserRole } from '../types/common.types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  partnerApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  avatar?: string;
  partnerCompany?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
}

const STORAGE_KEY = 'wetrek_auth_v1';

let globalState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isRestoring: false,
};

// Initialize from localStorage if present
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    globalState = {
      user: parsed.user || null,
      token: parsed.token || null,
      isAuthenticated: Boolean(parsed.token || parsed.user),
      isRestoring: Boolean(parsed.user && parsed.token),
    };
  }
} catch {
  // Ignore localStorage read errors
}

const listeners = new Set<(state: AuthState) => void>();

function notify() {
  listeners.forEach((listener) => listener(globalState));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  } catch {
    // Ignore storage write error
  }
}

export const authStore = {
  getState: () => globalState,

  login: (user: AuthUser, token: string = 'mock_jwt_token_alpine') => {
    globalState = {
      user,
      token,
      isAuthenticated: true,
      isRestoring: false,
    };
    notify();
  },

  logout: () => {
    globalState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isRestoring: false,
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    notify();
  },

  updateUser: (partial: Partial<AuthUser>) => {
    if (globalState.user) {
      globalState = {
        ...globalState,
        user: { ...globalState.user, ...partial },
      };
      notify();
    }
  },

  setRestoring: (isRestoring: boolean) => {
    globalState = { ...globalState, isRestoring };
    notify();
  },
};

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    login: authStore.login,
    logout: authStore.logout,
    updateUser: authStore.updateUser,
    setRestoring: authStore.setRestoring,
  };
}
