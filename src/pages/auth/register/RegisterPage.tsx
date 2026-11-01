import React from 'react';
import { LoginPage } from '../login/LoginPage';

export interface RegisterPageProps {
  onSuccess?: (userData: { name: string; email: string; phone: string }) => void;
  onNavigate?: (screen: any) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = () => {
  return <LoginPage initialMode="register" />;
};

export default RegisterPage;
