import React, { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SelectOption } from '../../types/common.types';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[#1C2526]">
            {label}{props.required && <span aria-hidden="true" className="ml-1 text-[#C2410C]">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'min-h-11 w-full bg-white border border-[#E6E1D8] text-[#1C2526] text-base sm:text-sm rounded-lg px-3 py-2.5 pr-9 appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 focus:border-[#C2410C] cursor-pointer disabled:bg-[#F7F4EE] disabled:text-[#6B7068]',
              error && 'border-red-500 focus:ring-red-200 focus:border-red-500',
              className
            )}
            {...props}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={[props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 text-[#A0AEC0] pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span id={errorId} className="text-sm text-red-700">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
