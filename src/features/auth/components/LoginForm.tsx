import React, { useState } from 'react';
import { Mail, Lock, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: (email: string) => void;
  onNavigateToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('eleanor.vance@wetrek.org');
  const [password, setPassword] = useState('••••••••••••');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      onSuccess?.(email);
    } catch {
      // Handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Climber Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-stone-600">
          <input type="checkbox" defaultChecked className="rounded accent-[#C2410C]" />
          <span>Keep me signed in</span>
        </label>
        <a href="#forgot" className="text-[#C2410C] hover:underline">
          Forgot Pass?
        </a>
      </div>

      <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
        Sign In to Trail Console
      </Button>

      {onNavigateToRegister && (
        <div className="text-center pt-2">
          <span className="text-xs text-stone-500">Don't have an account? </span>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-xs text-[#C2410C] font-semibold hover:underline cursor-pointer"
          >
            Register Climber Profile
          </button>
        </div>
      )}
    </form>
  );
};
