import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1C2526]">
            {label}{props.required && <span aria-hidden="true" className="ml-1 text-[#C2410C]">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#A0AEC0] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'min-h-11 w-full bg-white border border-[#E6E1D8] text-[#1C2526] text-base sm:text-sm rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 focus:border-[#C2410C] placeholder:text-stone-400 disabled:bg-[#F7F4EE] disabled:text-[#6B7068]',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-red-500 focus:ring-red-200 focus:border-red-500',
              className
            )}
            {...props}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={[props['aria-describedby'], (error || helperText) ? messageId : undefined].filter(Boolean).join(' ') || undefined}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#A0AEC0] pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span id={messageId} className="text-sm text-red-700">{error}</span>}
        {helperText && !error && <span id={messageId} className="text-sm text-[#6B7068]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
