import React from 'react';
import { QrCode } from 'lucide-react';
import type { PaymentProvider } from '../types/payment.types';
import { cn } from '../../../lib/utils';

interface PaymentMethodSelectorProps {
  selected: PaymentProvider;
  onChange: (provider: PaymentProvider) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selected,
  onChange,
}) => {
  const methods: Array<{
    id: PaymentProvider;
    title: string;
    desc: string;
    icon: typeof QrCode;
  }> = [
    {
      id: 'PAYOS',
      title: 'Cổng thanh toán trực tuyến (VietQR)',
      desc: 'Quét mã QR chuyển khoản ngân hàng nội địa — Tự động xác nhận thanh toán',
      icon: QrCode,
    },
  ];

  return (
    <div className="space-y-2">
      {methods.map((m) => {
        const Icon = m.icon;
        const isSelected = selected === m.id;
        return (
          <div
            key={m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
              isSelected
                ? 'border-[#1F4E43] bg-[#1F4E43]/5 ring-1 ring-[#1F4E43]'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                isSelected ? 'bg-[#1F4E43] text-white' : 'bg-stone-100 text-stone-600'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-stone-800 block">{m.title}</span>
              <span className="text-[11px] text-stone-500 block">{m.desc}</span>
            </div>
            <input
              type="radio"
              checked={isSelected}
              onChange={() => onChange(m.id)}
              className="accent-[#1F4E43]"
            />
          </div>
        );
      })}
    </div>
  );
};
