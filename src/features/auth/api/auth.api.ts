import { apiClient } from '../../../lib/axios';
import { APP_CONFIG } from '../../../constants/config';
import { LoginPayload, RegisterPayload, AuthSession, AccountProfile, UpdateAccountPayload } from '../types/auth.types';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const authPath = (path: string) => `${API_V1}/auth${path}`;
interface CsrfResponse { headerName: string; token: string; }
interface MessageResponse { message: string; }
interface BackendAuthResponse {
  accessToken: string;
  account: { id: number; email: string; fullName: string; phone: string | null; roles: string[] };
}

function toAuthSession(response: BackendAuthResponse): AuthSession {
  const roles = response.account.roles.map(role => role.toLowerCase());
  const role = roles.includes('company_manager') ? 'partner'
    : roles.includes('admin') ? 'admin'
    : roles.includes('guide') ? 'guide'
    : roles.some(value => value === 'support_staff' || value === 'content_staff' || value === 'accountant') ? 'staff'
    : 'customer';
  return {
    token: response.accessToken,
    user: {
      id: String(response.account.id),
      name: response.account.fullName,
      email: response.account.email,
      role,
      phone: response.account.phone,
    },
  };
}

let refreshInFlight: Promise<AuthSession> | null = null;

function refreshSession(): Promise<AuthSession> {
  if (!refreshInFlight) {
    const requestRefresh = async () => {
      const csrfResponse = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
      const csrf = 'data' in csrfResponse ? csrfResponse.data : csrfResponse;
      const response = await apiClient.post<BackendAuthResponse>(authPath('/refresh'), undefined, {
        credentials: 'include',
        auth: false,
        headers: { [csrf.headerName]: csrf.token },
      });
      return toAuthSession('data' in response ? response.data : response);
    };
    const locks = (navigator as Navigator & {
      locks?: { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
    }).locks;
    refreshInFlight = (locks
      ? locks.request('wetrek-auth-refresh', requestRefresh)
      : requestRefresh()
    ).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export const authApi = {
  requestOtp: async (payload: RegisterPayload): Promise<void> => {
    // Public auth endpoints must not inherit an expired bearer token from localStorage.
    const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in response ? response.data : response;
    await apiClient.post<MessageResponse>(authPath('/register'), payload, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
  },

  resendVerification: async (email: string): Promise<void> => {
    const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in response ? response.data : response;
    await apiClient.post<MessageResponse>(authPath('/resend-verification'), { email }, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
  },

  forgotPassword: async (email: string): Promise<void> => {
    const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in response ? response.data : response;
    await apiClient.post<MessageResponse>(authPath('/forgot-password'), { email }, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in response ? response.data : response;
    await apiClient.post<MessageResponse>(authPath('/reset-password'), { email, otp, newPassword }, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
  },

  verifyEmail: async (email: string, otp: string): Promise<void> => {
    const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in response ? response.data : response;
    await apiClient.post<MessageResponse>(authPath('/verify-email'), { email, otp }, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
  },

  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const csrfResponse = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in csrfResponse ? csrfResponse.data : csrfResponse;
    const response = await apiClient.post<BackendAuthResponse>(authPath('/login'), payload, {
      credentials: 'include',
      auth: false,
      headers: { [csrf.headerName]: csrf.token },
    });
    return toAuthSession('data' in response ? response.data : response);
  },

  refresh: refreshSession,

  updateMe: async (payload: UpdateAccountPayload): Promise<AccountProfile> => {
    const csrfResponse = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
    const csrf = 'data' in csrfResponse ? csrfResponse.data : csrfResponse;
    const response = await apiClient.put<AccountProfile>(authPath('/me'), payload, {
      credentials: 'include', headers: { [csrf.headerName]: csrf.token },
    });
    return 'data' in response ? response.data : response;
  },

  logout: async (): Promise<void> => {
    try {
      const response = await apiClient.get<CsrfResponse>(authPath('/csrf'), { credentials: 'include', auth: false });
      const csrf = 'data' in response ? response.data : response;
      await apiClient.post(authPath('/logout'), undefined, {
        credentials: 'include',
        auth: false,
        headers: { [csrf.headerName]: csrf.token },
      });
    } catch {
      // Ignore — local session is cleared by the store regardless.
    }
  },
};
