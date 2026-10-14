import React from 'react';
import { QrCode, CreditCard, ShieldCheck } from 'lucide-react';
import { PaymentMethod } from '../types/payment.types';
import { cn } from '../../../lib/utils';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selected,
  onChange,
}) => {
  const methods = [
    {
      id: 'VIETQR' as PaymentMethod,
      title: 'VietQR Direct Transfer',
      desc: 'Instant zero-fee banking app QR code scan',
      icon: QrCode,
    },
    {
      id: 'WEATHER_ESCROW' as PaymentMethod,
      title: 'SafePay Alpine Escrow',
      desc: '100% weather disruption refund protected',
      icon: ShieldCheck,
    },
    {
      id: 'CREDIT_CARD' as PaymentMethod,
      title: 'International Visa / Mastercard',
      desc: 'Multi-currency settlement',
      icon: CreditCard,
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
              'flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all',
              isSelected
                ? 'border-[#C2410C] bg-[#FFF8F5] ring-1 ring-[#C2410C]'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                isSelected ? 'bg-[#C2410C] text-white' : 'bg-stone-100 text-stone-600'
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
              className="accent-[#C2410C]"
            />
          </div>
        );
      })}
    </div>
  );
};
