import { useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi } from '../api/auth.api';
import {
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  GoogleLoginRequest,
  ResetPasswordRequest,
} from '../types/auth.types';
import { ApiError } from '../../../types/api.types';

export function useAuth() {
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const clearError = () => {
    setError(null);
    setApiError(null);
  };

  const login = async (payload: LoginRequest) => {
    setIsLoading(true);
    clearError();
    try {
      const response = await authApi.login(payload);
      return response;
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (payload: GoogleLoginRequest) => {
    setIsLoading(true);
    clearError();
    try {
      const response = await authApi.loginGoogle(payload);
      return response;
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập Google thất bại');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true);
    clearError();
    try {
      const response = await authApi.register(payload);
      return response;
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (payload: VerifyEmailRequest) => {
    setIsLoading(true);
    clearError();
    try {
      const response = await authApi.verifyEmail(payload);
      return response;
    } catch (err: any) {
      setError(err?.message || 'Xác thực OTP thất bại');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setIsLoading(true);
    clearError();
    try {
      return await authApi.resendVerification({ email });
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lại mã OTP');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    clearError();
    try {
      return await authApi.forgotPassword({ email });
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (payload: ResetPasswordRequest) => {
    setIsLoading(true);
    clearError();
    try {
      return await authApi.resetPassword(payload);
    } catch (err: any) {
      setError(err?.message || 'Đặt lại mật khẩu thất bại');
      setApiError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...store,
    isLoading,
    error,
    apiError,
    clearError,
    login,
    loginGoogle,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
  };
}
