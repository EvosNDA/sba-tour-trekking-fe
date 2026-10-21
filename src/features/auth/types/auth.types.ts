import { UserRole } from '../../../types/common.types';

export interface LoginPayload {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string | null;
  };
}

export interface AccountProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
}

export interface UpdateAccountPayload {
  fullName: string;
  phone: string;
}
