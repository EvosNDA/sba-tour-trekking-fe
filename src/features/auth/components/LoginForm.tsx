import React from 'react';
import { AuthForm } from './AuthForm';

interface LoginFormProps {
  onSuccess?: (email: string) => void;
  onNavigateToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateToRegister }) => {
  return (
    <AuthForm
      initialMode="login"
      onAuthSuccess={() => onSuccess?.('')}
      onModeChange={(mode) => {
        if (mode === 'register' && onNavigateToRegister) {
          onNavigateToRegister();
        }
      }}
    />
  );
};
