import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const path = (value: string) => `${API_V1}${value}`;

export interface AdminAccount {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
  status: 'active' | 'blocked' | 'disabled' | string;
  blockedReason: string | null;
  blockedBy: number | null;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
}

interface CsrfResponse { headerName: string; token: string; }
interface Envelope<T> { data: T; }
const unwrap = <T,>(value: T | Envelope<T>): T => value && typeof value === 'object' && 'data' in value ? (value as Envelope<T>).data : value as T;

async function mutate<T>(method: 'POST' | 'PUT', url: string, body?: unknown): Promise<T> {
  const csrfResponse = await apiClient.get<CsrfResponse>(path('/auth/csrf'), { credentials: 'include', auth: false });
  const csrf = unwrap(csrfResponse);
  const response = await apiClient.request<T>(path(url), {
    method,
    data: body,
    headers: { [csrf.headerName]: csrf.token },
  });
  return unwrap(response);
}

export const adminAccountsApi = {
  get: async (id: number) => unwrap(await apiClient.get<AdminAccount>(path(`/admin/accounts/${id}`))),
  block: (id: number, reason: string) => mutate<AdminAccount>('POST', `/admin/accounts/${id}/block`, { reason }),
  unblock: (id: number, reason: string) => mutate<AdminAccount>('POST', `/admin/accounts/${id}/unblock`, { reason }),
  replaceRoles: (id: number, roles: string[], reason: string) => mutate<AdminAccount>('PUT', `/admin/accounts/${id}/roles`, { roles, reason }),
  inviteStaff: (input: { email: string; fullName: string; phone?: string; role: 'admin' }) =>
    mutate<InvitationResult>('POST', '/admin/staff/invitations', input),
  resendStaffInvite: (accountId: number) => mutate<InvitationResult>('POST', `/admin/staff/invitations/${accountId}/resend`),
};

export interface InvitationResult { accountId: number; email: string; role: string; companyId: number | null; activationRequired: boolean; deliveryStatus: 'sent' | 'retry_required'; }
