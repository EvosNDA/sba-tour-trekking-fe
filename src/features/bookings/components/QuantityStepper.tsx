import React, { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function QuantityStepper({ label, value, onChange, disabled }: QuantityStepperProps) {
  const id = useId();
  return (
    <div className="inline-flex shrink-0 items-center rounded-xl border border-[#D6CEBE] bg-white">
      <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(String(Math.max(0, value - 1)))} aria-label={`Giảm số lượng ${label}`} className="flex size-11 items-center justify-center rounded-l-xl text-[#1F4E43] hover:bg-[#F7F4EE] disabled:opacity-40"><Minus size={16} aria-hidden="true" /></button>
      <label htmlFor={id} className="sr-only">Số lượng {label}</label>
      <input id={id} type="number" inputMode="numeric" min={0} step={1} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-11 w-12 min-w-0 bg-transparent text-center text-base font-semibold tabular-nums text-[#1C2526]" />
      <button type="button" disabled={disabled} onClick={() => onChange(String(value + 1))} aria-label={`Tăng số lượng ${label}`} className="flex size-11 items-center justify-center rounded-r-xl text-[#1F4E43] hover:bg-[#F7F4EE] disabled:opacity-40"><Plus size={16} aria-hidden="true" /></button>
    </div>
  );
}
