import React from 'react';
import { Check, Users, FileCheck2, CreditCard } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface BookingStepperProps {
  currentStep: 1 | 2 | 3;
}

export const BookingStepper: React.FC<BookingStepperProps> = ({ currentStep }) => {
  const steps = [
    {
      step: 1,
      title: 'Lịch & Hành khách',
      subtitle: 'Nhập danh sách người đi & chuẩn bị thiết bị',
      icon: Users,
    },
    {
      step: 2,
      title: 'Xác nhận đặt chỗ',
      subtitle: 'Kiểm tra chi phí, tiền cọc & chính sách',
      icon: FileCheck2,
    },
    {
      step: 3,
      title: 'Thanh toán trực tuyến',
      subtitle: 'Giữ chỗ 15 phút & xác nhận tự động',
      icon: CreditCard,
    },
  ] as const;

  return (
    <nav aria-label="Tiến trình đặt tour" className="w-full mb-8">
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <li
              key={s.step}
              className={cn(
                'flex items-center gap-3.5 p-4 rounded-2xl border transition-all',
                isCurrent
                  ? 'bg-white border-[#C2410C] ring-2 ring-[#C2410C]/15 shadow-sm'
                  : isCompleted
                  ? 'bg-[#F7F4EE] border-[#88D4BC]'
                  : 'bg-white/60 border-[#E6E1D8] opacity-75'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold shrink-0 transition-colors',
                  isCompleted
                    ? 'bg-[#1F4E43] text-white'
                    : isCurrent
                    ? 'bg-[#C2410C] text-white'
                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
                    Bước {s.step}/3
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
                  )}
                </div>
                <div className="font-editorial text-base font-bold text-[#1C2526] truncate">
                  {s.title}
                </div>
                <div className="text-[11px] text-[#64748B] truncate">{s.subtitle}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
