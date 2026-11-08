import React from 'react';
import { Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface AvailabilityBadgeProps {
  availableSeats?: number;
  capacity?: number;
  bookable?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  availableSeats,
  capacity,
  bookable,
  isLoading = false,
  size = 'md',
  className,
}) => {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  if (isLoading) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium',
          sizeClass,
          className
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
        <span>Đang kiểm tra chỗ...</span>
      </span>
    );
  }

  if (availableSeats === undefined || bookable === undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-medium',
          sizeClass,
          className
        )}
      >
        <Users className="w-3.5 h-3.5 text-stone-500" />
        <span>Đăng nhập để xem chỗ trống thực tế</span>
      </span>
    );
  }

  const isOpen = bookable && availableSeats > 0;
  const isLow = isOpen && availableSeats <= 5;

  if (!isOpen) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold',
          sizeClass,
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        <span>{availableSeats === 0 ? 'Hết chỗ (0 chỗ)' : 'Ngừng nhận khách'}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold font-mono-numbers',
        isLow
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-[#B9EADB]/50 text-[#1F4E43] border-[#88D4BC]',
        sizeClass,
        className
      )}
    >
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      <span>
        Còn {availableSeats}
        {capacity ? `/${capacity}` : ''} chỗ trống
      </span>
    </span>
  );
};
