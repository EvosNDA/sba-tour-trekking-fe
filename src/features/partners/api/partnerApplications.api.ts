import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const path = (value: string) => `${API_V1}${value}`;

interface CsrfResponse { headerName: string; token: string; }
interface ApiEnvelope<T> { data: T; }
const unwrap = <T,>(response: T | ApiEnvelope<T>): T => 'data' in (response as object) ? (response as ApiEnvelope<T>).data : response as T;

export interface PartnerApplicationRequest {
  email: string;
  contactName: string;
  phone: string;
  businessName: string;
  taxCode: string;
  businessType?: string;
  foundedYear?: number;
  address?: string;
  description?: string;
  tourRegions: string[];
  safetyRulesAccepted: boolean;
}

export interface PartnerApplicationStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  companyId: number | null;
  businessName: string | null;
  decisionReason: string | null;
}

export interface PartnerApplicationQueueItem {
  companyId: number;
  accountId: number;
  businessName: string;
  taxCode: string;
  businessType: string | null;
  foundedYear: number | null;
  address: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  tourRegions: string[];
  safetyRulesAcceptedAt: string | null;
  submittedAt: string;
}

async function csrf() {
  const response = await apiClient.get<CsrfResponse>(path('/auth/csrf'), { credentials: 'include', auth: false });
  return unwrap(response);
}

export const partnerApplicationsApi = {
  apply: async (request: PartnerApplicationRequest) => {
    const token = await csrf();
    const response = await apiClient.post(path('/partner-applications'), request, {
      credentials: 'include', auth: false, headers: { [token.headerName]: token.token },
    });
    return unwrap(response);
  },
  resendActivation: async (email: string) => {
    const token = await csrf();
    const response = await apiClient.post(path('/partner-applications/resend-activation'), { email }, {
      credentials: 'include', auth: false, headers: { [token.headerName]: token.token },
    });
    return unwrap(response);
  },
  activate: async (tokenValue: string, password: string) => {
    const token = await csrf();
    const response = await apiClient.post(path('/partner-applications/activate'), { token: tokenValue, password }, {
      credentials: 'include', auth: false, headers: { [token.headerName]: token.token },
    });
    return unwrap(response);
  },
  status: async () => unwrap(await apiClient.get<PartnerApplicationStatus>(path('/partner-applications/me'))),
  pending: async () => unwrap(await apiClient.get<PartnerApplicationQueueItem[]>(path('/admin/partner-applications'))),
  approve: async (companyId: number) => unwrap(await apiClient.post<PartnerApplicationStatus>(path(`/admin/partner-applications/${companyId}/approve`))),
  reject: async (companyId: number, reason: string) => unwrap(await apiClient.post<PartnerApplicationStatus>(path(`/admin/partner-applications/${companyId}/reject`), { reason })),
};
