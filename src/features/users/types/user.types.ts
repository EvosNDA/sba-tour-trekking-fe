import { UserRole } from '../../../types/common.types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  nationalParkPassNo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// Admin Accounts Contract Types
export type AdminAccountRole = 'admin' | 'guide' | 'customer';
export type AdminAccountRoleParam = 'ADMIN' | 'GUIDE' | 'CUSTOMER';

export type AdminAccountStatus = 'active' | 'blocked' | 'disabled';
export type AdminAccountStatusParam = 'ACTIVE' | 'BLOCKED' | 'DISABLED';

export interface AdminAccountItem {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  roles: AdminAccountRole[];
  status: AdminAccountStatus;
  createdAt: string; // ISO string
  lastLoginAt: null;
}

export interface AdminAccountListResponse {
  items: AdminAccountItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminAccountDetail {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  roles: AdminAccountRole[];
  status: AdminAccountStatus;
  blockedReason: string | null;
  blockedBy: number | null;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AdminAccountsParams {
  page?: number;
  size?: number;
  q?: string;
  role?: AdminAccountRoleParam;
  status?: AdminAccountStatusParam;
  sort?: string; // e.g. "createdAt,desc"
}

export interface AccountActionRequest {
  reason: string;
}

export interface AdminInvitationRequest {
  email: string;
  fullName: string;
  role: 'ADMIN' | 'GUIDE';
  phone?: string;
  bio?: string;
}

export interface AdminInvitationResponse {
  accountId: number;
  email: string;
  role: string;
  activationRequired: boolean;
  deliveryStatus: string;
}

export interface AccountRolesRequest {
  roles: string[];
  reason: string;
}
