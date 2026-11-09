import React from 'react';

interface TravelerFieldsProps {
  idPrefix: string;
  value: { fullName: string; phone?: string; email?: string };
  onChange: (field: 'fullName' | 'phone' | 'email', value: string) => void;
  errors?: Partial<Record<'fullName' | 'phone' | 'email', string>>;
  disabled?: boolean;
}

export function TravelerFields({ idPrefix, value, onChange, errors = {}, disabled }: TravelerFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {([
        { name: 'fullName', label: 'Họ và tên', type: 'text', maxLength: 200, autoComplete: 'name' },
        { name: 'phone', label: 'Số điện thoại liên hệ', type: 'tel', maxLength: 30, autoComplete: 'tel' },
        { name: 'email', label: 'Địa chỉ email', type: 'email', maxLength: 254, autoComplete: 'email' },
      ] as const).map((field) => {
        const id = `${idPrefix}-${field.name}`;
        const error = errors[field.name];
        return (
          <div key={field.name}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#1C2526]">{field.label} <span className="text-[#C2410C]" aria-hidden="true">*</span></label>
            <input id={id} name={id} type={field.type} autoComplete={`section-${idPrefix} ${field.autoComplete}`} maxLength={field.maxLength} required disabled={disabled} value={value[field.name] || ''} onChange={(event) => onChange(field.name, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`min-h-12 w-full rounded-xl border bg-white px-3 py-2.5 text-base text-[#1C2526] disabled:bg-[#F7F4EE] ${error ? 'border-red-600' : 'border-[#D6CEBE]'}`} />
            {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
