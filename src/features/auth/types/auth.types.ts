import { UserRole } from '../../../types/common.types';
import { AccountProfile } from '../../../stores/auth.store';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface EmailRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ActivateAccountRequest extends ResetPasswordRequest {}

export interface MessageResponse {
  message: string;
}

export interface CsrfResponse {
  headerName: string;
  token: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  account: AccountProfile;
}

// Legacy compatibility types
export interface LoginPayload {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  passport?: string;
  agreeSafetyCharter?: boolean;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
