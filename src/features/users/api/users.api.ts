import { apiClient } from '../../../lib/axios';
import {
  UserProfile,
  AdminAccountItem,
  AdminAccountDetail,
  AdminAccountListResponse,
  AdminAccountsParams,
  AccountActionRequest,
  AdminInvitationRequest,
  AdminInvitationResponse,
  AccountRolesRequest,
} from '../types/user.types';

export const usersApi = {
  // Legacy user profile mock
  getProfile: async (): Promise<UserProfile> => {
    return {
      id: 'usr_eleanor',
      name: 'Eleanor Vance',
      email: 'eleanor.vance@wetrek.org',
      phone: '+84 912 345 678',
      role: 'customer',
      nationalParkPassNo: 'HLP-89241',
      emergencyContactName: 'Marcus Vance',
      emergencyContactPhone: '+84 987 654 321',
    };
  },

  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    return {
      ...(await usersApi.getProfile()),
      ...profile,
    };
  },

  // 1. GET /api/v1/admin/accounts
  getAccounts: async (
    params: AdminAccountsParams = {},
    signal?: AbortSignal
  ): Promise<AdminAccountListResponse> => {
    return apiClient.get<AdminAccountListResponse>('/api/v1/admin/accounts', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        q: params.q?.trim() || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        sort: params.sort || undefined,
      },
      signal,
    });
  },

  // 2. GET /api/v1/admin/accounts/{id}
  getAccountDetail: async (
    id: number,
    signal?: AbortSignal
  ): Promise<AdminAccountDetail> => {
    return apiClient.get<AdminAccountDetail>(`/api/v1/admin/accounts/${id}`, {
      signal,
    });
  },

  // 3. POST /api/v1/admin/accounts/{id}/block
  blockAccount: async (
    id: number,
    payload: AccountActionRequest,
    signal?: AbortSignal
  ): Promise<AdminAccountDetail> => {
    return apiClient.post<AdminAccountDetail>(
      `/api/v1/admin/accounts/${id}/block`,
      payload,
      { signal }
    );
  },

  // 4. POST /api/v1/admin/accounts/{id}/unblock
  unblockAccount: async (
    id: number,
    payload: AccountActionRequest,
    signal?: AbortSignal
  ): Promise<AdminAccountDetail> => {
    return apiClient.post<AdminAccountDetail>(
      `/api/v1/admin/accounts/${id}/unblock`,
      payload,
      { signal }
    );
  },

  inviteAccount: async (payload: AdminInvitationRequest): Promise<AdminInvitationResponse> => {
    return apiClient.post<AdminInvitationResponse>('/api/v1/admin/invitations', payload);
  },

  replaceAccountRoles: async (id: number, payload: AccountRolesRequest): Promise<AdminAccountDetail> => {
    return apiClient.put<AdminAccountDetail>(`/api/v1/admin/accounts/${id}/roles`, payload);
  },
};
