import { useState, useEffect } from 'react';
import { UserRole } from '../types/common.types';

export type XRole = 'ADMIN' | 'PARTNER' | 'GUIDE' | 'CUSTOMER' | 'GUEST';

export interface AccountProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roles?: string[];
  avatar?: string;
  partnerCompany?: string;
}

export interface BookingIntent {
  tourId: number;
  scheduleId: number;
  tourTitle?: string;
  startsAt?: string;
  endsAt?: string;
  basePriceVnd?: number;
  depositPercent?: number;
  availableSeats?: number;
  guestCount?: number;
  returnPath?: string;
}

export interface AuthState {
  account: AccountProfile | null;
  user: AuthUser | null;
  xRole: XRole;
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  bookingIntent: BookingIntent | null;
}

const BOOKING_INTENT_KEY = 'wetrek_booking_intent_v1';
const X_ROLE_STORAGE_KEY = 'wetrek_x_role_v1';
const HAS_SESSION_HINT_KEY = 'wetrek_has_session_v1';

function loadBookingIntent(): BookingIntent | null {
  try {
    const saved = sessionStorage.getItem(BOOKING_INTENT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function loadSavedXRole(): XRole | null {
  try {
    const saved = sessionStorage.getItem(X_ROLE_STORAGE_KEY) as XRole | null;
    if (saved && ['ADMIN', 'PARTNER', 'GUIDE', 'CUSTOMER', 'GUEST'].includes(saved)) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return null;
}

function hasStoredSessionHint(): boolean {
  try {
    if (localStorage.getItem(HAS_SESSION_HINT_KEY) === '1') {
      return true;
    }
    const savedRole = loadSavedXRole();
    return Boolean(savedRole && savedRole !== 'GUEST');
  } catch {
    return false;
  }
}

export function resolveXRole(account?: AccountProfile | null, user?: AuthUser | null): XRole {
  if (!account && !user) return 'GUEST';

  const roles = (account?.roles || user?.roles || []).map((r) => String(r).toUpperCase());
  const primaryRole = String(user?.role || '').toUpperCase();

  if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN') || primaryRole === 'ADMIN') {
    return 'ADMIN';
  }
  if (roles.includes('PARTNER') || roles.includes('ROLE_PARTNER') || primaryRole === 'PARTNER') {
    return 'PARTNER';
  }
  if (roles.includes('GUIDE') || roles.includes('ROLE_GUIDE') || primaryRole === 'GUIDE') {
    return 'GUIDE';
  }
  if (roles.includes('CUSTOMER') || roles.includes('ROLE_CUSTOMER') || primaryRole === 'CUSTOMER') {
    return 'CUSTOMER';
  }
  return 'CUSTOMER';
}

function mapAccountToUser(account: AccountProfile): AuthUser {
  const primaryRole = account.roles?.some((r) => r.toUpperCase() === 'ADMIN')
    ? 'admin'
    : account.roles?.some((r) => r.toUpperCase() === 'GUIDE')
    ? 'guide'
    : account.roles?.some((r) => r.toUpperCase() === 'PARTNER')
    ? 'partner'
    : 'customer';

  return {
    id: String(account.id),
    name: account.fullName || account.email,
    email: account.email,
    phone: account.phone || undefined,
    role: primaryRole,
    roles: account.roles || ['CUSTOMER'],
  };
}

let globalState: AuthState = {
  account: null,
  user: null,
  xRole: loadSavedXRole() || 'GUEST',
  accessToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isInitializing: hasStoredSessionHint(),
  bookingIntent: loadBookingIntent(),
};

const listeners = new Set<(state: AuthState) => void>();

function notify() {
  listeners.forEach((listener) => listener({ ...globalState }));
}

export const authStore = {
  getState: () => globalState,

  hasSessionHint: (): boolean => hasStoredSessionHint(),

  getAccessToken: (): string | null => globalState.accessToken,

  getXRole: (): XRole => {
    if (!globalState.isAuthenticated) return 'GUEST';
    return globalState.xRole || resolveXRole(globalState.account, globalState.user);
  },

  setXRole: (newXRole: XRole) => {
    globalState = {
      ...globalState,
      xRole: newXRole,
    };
    try {
      sessionStorage.setItem(X_ROLE_STORAGE_KEY, newXRole);
    } catch {
      // Ignore
    }
    notify();
  },

  checkXRole: (allowedRoles: XRole | XRole[]): boolean => {
    const currentXRole = authStore.getXRole();
    if (currentXRole === 'GUEST') return false;

    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (allowed.includes(currentXRole)) return true;

    // Also check if user has the underlying role in their roles list
    const userRoles = (globalState.account?.roles || []).map((r) =>
      r.toUpperCase().replace(/^ROLE_/, '')
    );
    return allowed.some((target) => userRoles.includes(target));
  },

  setSession: (accessToken: string, expiresInSeconds: number, account: AccountProfile) => {
    const user = mapAccountToUser(account);
    const resolvedRole = resolveXRole(account, user);
    const isAdminAccount =
      resolvedRole === 'ADMIN' ||
      account.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN');
    const savedRole = loadSavedXRole();
    const activeXRole = isAdminAccount
      ? 'ADMIN'
      : savedRole && account.roles?.map((r) => r.toUpperCase()).includes(savedRole)
      ? savedRole
      : resolvedRole;

    globalState = {
      ...globalState,
      account,
      user,
      xRole: activeXRole,
      accessToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
      isAuthenticated: true,
      isInitializing: false,
    };
    try {
      sessionStorage.setItem(X_ROLE_STORAGE_KEY, activeXRole);
      localStorage.setItem(HAS_SESSION_HINT_KEY, '1');
    } catch {
      // Ignore
    }
    notify();
  },

  setAccount: (account: AccountProfile) => {
    const user = mapAccountToUser(account);
    const resolvedRole = resolveXRole(account, user);
    globalState = {
      ...globalState,
      account,
      user,
      xRole: resolvedRole,
      isAuthenticated: Boolean(globalState.accessToken && account),
    };
    notify();
  },

  setInitializing: (isInitializing: boolean) => {
    globalState = {
      ...globalState,
      isInitializing,
    };
    notify();
  },

  clearSession: () => {
    globalState = {
      ...globalState,
      account: null,
      user: null,
      xRole: 'GUEST',
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isInitializing: false,
    };
    try {
      sessionStorage.removeItem(X_ROLE_STORAGE_KEY);
      localStorage.removeItem(HAS_SESSION_HINT_KEY);
    } catch {
      // Ignore
    }
    notify();
  },

  setBookingIntent: (intent: BookingIntent | null) => {
    globalState = {
      ...globalState,
      bookingIntent: intent,
    };
    try {
      if (intent) {
        sessionStorage.setItem(BOOKING_INTENT_KEY, JSON.stringify(intent));
      } else {
        sessionStorage.removeItem(BOOKING_INTENT_KEY);
      }
    } catch {
      // Ignore storage error
    }
    notify();
  },

  // Backward compatibility methods for legacy screens
  login: (user: AuthUser, token: string = '') => {
    const account: AccountProfile = {
      id: Number(user.id) || 0,
      email: user.email,
      fullName: user.name,
      phone: user.phone || null,
      roles: user.roles || [user.role.toUpperCase()],
    };
    const resolvedRole = resolveXRole(account, user);
    globalState = {
      ...globalState,
      account,
      user,
      xRole: resolvedRole,
      accessToken: token,
      expiresAt: Date.now() + 900 * 1000,
      isAuthenticated: Boolean(token),
      isInitializing: false,
    };
    try {
      if (token) {
        localStorage.setItem(HAS_SESSION_HINT_KEY, '1');
      }
    } catch {
      // Ignore
    }
    notify();
  },

  logout: () => {
    authStore.clearSession();
  },

  updateUser: (partial: Partial<AuthUser>) => {
    if (globalState.user) {
      const updatedUser = { ...globalState.user, ...partial };
      globalState = {
        ...globalState,
        user: updatedUser,
        account: globalState.account
          ? {
              ...globalState.account,
              fullName: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone || globalState.account.phone,
            }
          : null,
      };
      notify();
    }
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
    xRole: state.xRole,
    setXRole: authStore.setXRole,
    checkXRole: authStore.checkXRole,
    setSession: authStore.setSession,
    setAccount: authStore.setAccount,
    clearSession: authStore.clearSession,
    setBookingIntent: authStore.setBookingIntent,
    login: authStore.login,
    logout: authStore.logout,
    updateUser: authStore.updateUser,
  };
}

export const useAuth = useAuthStore;
