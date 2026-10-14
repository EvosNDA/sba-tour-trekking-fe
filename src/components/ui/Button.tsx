import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#C2410C] hover:bg-[#9B2F00] text-white shadow-sm focus:ring-[#C2410C]/40',
    secondary: 'bg-[#1C2526] hover:bg-[#2C3839] text-white shadow-sm focus:ring-[#1C2526]/30',
    outline: 'border border-[#D6CEBE] bg-white hover:bg-[#FDFBF7] text-[#1C2526] focus:ring-[#C2410C]/20',
    ghost: 'bg-transparent hover:bg-stone-100 text-[#1C2526]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className={variant === 'outline' || variant === 'ghost' ? 'text-[#C2410C]' : 'text-white'} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
