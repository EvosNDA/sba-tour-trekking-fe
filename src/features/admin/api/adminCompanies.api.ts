import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';
import { authStore } from '../../../stores/auth.store';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const path = (value: string) => `${API_V1}${value}`;

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export interface AdminCompany {
  id: number; name: string; taxCode: string; representativeName: string; contactEmail: string;
  contactPhone: string | null; address: string | null; description: string | null; status: CompanyStatus;
  licenseAvailable: boolean; licenseUrl: string | null; approvedBy: number | null; approvedAt: string | null;
  decisionReason: string | null; createdAt: string; updatedAt: string;
}
export interface AdminCompanyPage { items: AdminCompany[]; page: number; size: number; totalElements: number; totalPages: number; }
interface Envelope<T> { data: T; }
const unwrap = <T,>(value: T | Envelope<T>): T => value && typeof value === 'object' && 'data' in value ? (value as Envelope<T>).data : value as T;

export const adminCompaniesApi = {
  list: async (status: CompanyStatus | '', page = 0, size = 20) => unwrap(await apiClient.get<AdminCompanyPage>(path('/admin/companies'), { params: { status: status || undefined, page, size } })),
  read: async (id: number) => unwrap(await apiClient.get<AdminCompany>(path(`/admin/companies/${id}`))),
  decide: async (id: number, decision: 'approve' | 'reject' | 'suspend', reason: string) => {
    return unwrap(await apiClient.post<AdminCompany>(path(`/admin/companies/${id}/decision`), { decision, reason }));
  },
  downloadLicense: async (id: number) => {
    const url = new URL(`${APP_CONFIG.API_BASE_URL.replace(/\/$/, '')}${path(`/admin/companies/${id}/license`)}`, window.location.origin);
    const accessToken = authStore.getState().token;
    const response = await fetch(url, { credentials: 'include', headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} });
    if (!response.ok) throw new Error(response.status === 404 ? 'LICENSE_NOT_FOUND' : `LICENSE_DOWNLOAD_${response.status}`);
    return { blob: await response.blob(), filename: response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ?? `company-${id}-license` };
  },
};
