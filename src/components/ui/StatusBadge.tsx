import React from 'react';
import { BookingStatus, BookingPaymentState } from '../../features/bookings/types/booking.types';
import { DifficultyLevel, TourStatus, ScheduleStatus } from '../../features/tours/types/tour.types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  CreditCard,
  RotateCcw,
  Mountain,
  FileEdit,
  Archive,
  Send,
  Calendar,
  Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  bookingStatus?: BookingStatus;
  paymentState?: BookingPaymentState;
  difficulty?: DifficultyLevel | string;
  tourStatus?: TourStatus | string;
  scheduleStatus?: ScheduleStatus | string;
  equipmentReservationStatus?: string;
  attendanceStatus?: 'checked_in' | 'checked_out' | 'pending';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  bookingStatus,
  paymentState,
  difficulty,
  tourStatus,
  scheduleStatus,
  equipmentReservationStatus,
  attendanceStatus,
  size = 'md',
  className,
}) => {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-0.5 gap-1' : 'text-xs px-3 py-1 gap-1.5';

  if (tourStatus) {
    const norm = String(tourStatus).toUpperCase() as TourStatus;
    const config: Record<
      TourStatus,
      { label: string; style: string; icon: React.ReactNode }
    > = {
      DRAFT: {
        label: 'Bản nháp',
        style: 'bg-stone-100 text-stone-700 border-stone-300',
        icon: <FileEdit className="w-3.5 h-3.5 text-stone-500" />,
      },
      PENDING: {
        label: 'Chờ duyệt',
        style: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: <Send className="w-3.5 h-3.5 text-amber-600" />,
      },
      PUBLISHED: {
        label: 'Đã xuất bản',
        style: 'bg-[#B9EADB]/50 text-[#1F4E43] border-[#88D4BC]',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#1F4E43]" />,
      },
      REJECTED: {
        label: 'Từ chối',
        style: 'bg-red-50 text-red-800 border-red-200',
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      },
      ARCHIVED: {
        label: 'Đã lưu trữ',
        style: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: <Archive className="w-3.5 h-3.5 text-slate-500" />,
      },
    };

    const item = config[norm] || {
      label: String(tourStatus),
      style: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: null,
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  if (bookingStatus) {
    const config: Record<
      BookingStatus,
      { label: string; style: string; icon: React.ReactNode }
    > = {
      PENDING_PAYMENT: {
        label: 'Chờ thanh toán (Giữ chỗ)',
        style: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      },
      CONFIRMED: {
        label: 'Đã xác nhận chỗ',
        style: 'bg-[#B9EADB]/50 text-[#1F4E43] border-[#88D4BC]',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#1F4E43]" />,
      },
      COMPLETED: {
        label: 'Hoàn thành chuyến đi',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: <Award className="w-3.5 h-3.5 text-emerald-600" />,
      },
      EXPIRED: {
        label: 'Hết hạn giữ chỗ',
        style: 'bg-stone-100 text-stone-700 border-stone-300',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />,
      },
      CANCELLED: {
        label: 'Đã hủy đặt chỗ',
        style: 'bg-red-50 text-red-800 border-red-200',
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      },
      NO_SHOW: {
        label: 'Vắng mặt (No-show)',
        style: 'bg-stone-200 text-stone-700 border-stone-300',
        icon: <XCircle className="w-3.5 h-3.5 text-stone-600" />,
      },
    };

    const item = config[bookingStatus] || {
      label: bookingStatus,
      style: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: null,
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  if (paymentState) {
    const config: Record<
      BookingPaymentState,
      { label: string; style: string; icon: React.ReactNode }
    > = {
      UNPAID: {
        label: 'Chưa thanh toán',
        style: 'bg-stone-100 text-stone-700 border-stone-300',
        icon: <CreditCard className="w-3.5 h-3.5 text-stone-500" />,
      },
      DEPOSIT_PAID: {
        label: 'Đã đặt cọc',
        style: 'bg-sky-50 text-sky-800 border-sky-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />,
      },
      FULLY_PAID: {
        label: 'Đã thanh toán 100%',
        style: 'bg-[#B9EADB]/60 text-[#1F4E43] border-[#75C9B0]',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#1F4E43]" />,
      },
      PARTIALLY_REFUNDED: {
        label: 'Đã hoàn tiền một phần',
        style: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: <RotateCcw className="w-3.5 h-3.5 text-purple-600" />,
      },
      FULLY_REFUNDED: {
        label: 'Đã hoàn tiền toàn bộ',
        style: 'bg-purple-100 text-purple-900 border-purple-300',
        icon: <RotateCcw className="w-3.5 h-3.5 text-purple-700" />,
      },
    };

    const item = config[paymentState] || {
      label: paymentState,
      style: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: null,
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  if (difficulty) {
    const norm = String(difficulty).toUpperCase();
    const diffConfig: Record<string, { label: string; style: string }> = {
      EASY: {
        label: 'Dễ',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
      MODERATE: {
        label: 'Trung bình',
        style: 'bg-amber-50 text-amber-800 border-amber-200',
      },
      HARD: {
        label: 'Khó',
        style: 'bg-orange-50 text-[#C2410C] border-orange-200',
      },
      EXPERT: {
        label: 'Chuyên gia',
        style: 'bg-red-50 text-red-800 border-red-200',
      },
    };

    const item = diffConfig[norm] || {
      label: String(difficulty),
      style: 'bg-stone-100 text-stone-800 border-stone-200',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        <Mountain className="w-3.5 h-3.5 shrink-0" />
        <span>{item.label}</span>
      </span>
    );
  }

  if (scheduleStatus) {
    const norm = String(scheduleStatus).toUpperCase() as ScheduleStatus;
    const config: Record<
      ScheduleStatus,
      { label: string; style: string; icon: React.ReactNode }
    > = {
      SCHEDULED: {
        label: 'Đã lên lịch',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: <Calendar className="w-3.5 h-3.5 text-emerald-700" />,
      },
      ONGOING: {
        label: 'Đang diễn ra',
        style: 'bg-blue-50 text-blue-800 border-blue-300',
        icon: <Compass className="w-3.5 h-3.5 text-blue-700 animate-spin" />,
      },
      COMPLETED: {
        label: 'Đã hoàn thành',
        style: 'bg-stone-100 text-stone-700 border-stone-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />,
      },
      CANCELLED: {
        label: 'Đã hủy',
        style: 'bg-rose-50 text-rose-800 border-rose-300',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      },
    };

    const item = config[norm] || {
      label: String(scheduleStatus),
      style: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: null,
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  if (equipmentReservationStatus) {
    const norm = String(equipmentReservationStatus).toLowerCase();
    const config: Record<
      string,
      { label: string; style: string; icon: React.ReactNode }
    > = {
      confirmed: {
        label: 'Đã đặt chỗ (Chờ giao)',
        style: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
      },
      issued: {
        label: 'Đã giao đủ',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      },
      return_required: {
        label: 'Cần thu hồi',
        style: 'bg-orange-50 text-orange-800 border-orange-300',
        icon: <RotateCcw className="w-3.5 h-3.5 text-orange-700" />,
      },
      returned: {
        label: 'Đã thu hồi đủ',
        style: 'bg-teal-50 text-teal-800 border-teal-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />,
      },
    };

    const item = config[norm] || {
      label: String(equipmentReservationStatus),
      style: 'bg-stone-100 text-stone-700 border-stone-200',
      icon: null,
    };

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  if (attendanceStatus) {
    const config = {
      checked_in: {
        label: 'Đã điểm danh',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      },
      checked_out: {
        label: 'Đã hoàn tất chuyến',
        style: 'bg-blue-50 text-blue-800 border-blue-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />,
      },
      pending: {
        label: 'Chưa điểm danh',
        style: 'bg-stone-100 text-stone-700 border-stone-300',
        icon: <Clock className="w-3.5 h-3.5 text-stone-500" />,
      },
    };

    const item = config[attendanceStatus] || config.pending;

    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          sizeClass,
          item.style,
          className
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  }

  return null;
};
