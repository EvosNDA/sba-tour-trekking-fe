import { apiClient } from '../../../lib/axios';
import type {
  AdminPolicy,
  AdminPolicyVersion,
  PolicyCreateRequest,
  PolicyPublishRequest,
} from '../types/admin-policy.types';

const BASE = '/api/v1/admin/policies';

export const adminPoliciesApi = {
  list: () => apiClient.get<AdminPolicy[]>(BASE),
  read: (policyId: number) => apiClient.get<AdminPolicy>(`${BASE}/${policyId}`),
  versions: (policyId: number) => apiClient.get<AdminPolicyVersion[]>(`${BASE}/${policyId}/versions`),
  createWithVersion: (policy: PolicyCreateRequest, version: PolicyPublishRequest) =>
    apiClient.post<AdminPolicy>(`${BASE}/with-version`, { policy, version }),
  publish: (policyId: number, version: PolicyPublishRequest) =>
    apiClient.post<AdminPolicyVersion>(`${BASE}/${policyId}/versions`, version),
  changeStatus: (policyId: number, active: boolean, reason: string) =>
    apiClient.patch<AdminPolicy>(`${BASE}/${policyId}/status`, { active, reason }),
  revokeVersion: (policyId: number, versionId: number, reason: string) =>
    apiClient.post<AdminPolicyVersion>(`${BASE}/${policyId}/versions/${versionId}/revoke`, { reason }),
  remove: (policyId: number) => apiClient.delete<void>(`${BASE}/${policyId}`),
  extractDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ content: string }>(`${BASE}/extract-document`, form);
  },
};
