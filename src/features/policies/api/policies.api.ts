import { apiClient } from '../../../lib/axios';
import type { PolicyDocument } from '../policy-documents';

export interface PublicPolicyResponse {
  code: PolicyDocument['code'];
  title: string;
  content: string;
  versionNumber: number;
  effectiveFrom: string;
}

export const policiesApi = {
  readPublic: (code: PolicyDocument['code'], signal?: AbortSignal) =>
    apiClient.get<PublicPolicyResponse>(`/api/v1/public/policies/${code}`, {
      signal,
      skipAuth: true,
      skipAuthRefresh: true,
    }),
};
