import React from 'react';
import { BookingSummaryResponse } from '../types/booking.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatDateTime, formatVND } from '../../../lib/utils';
import { Calendar, Users, ArrowRight, Hash, Clock } from 'lucide-react';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface BookingCardProps {
  booking: BookingSummaryResponse;
  onSelect?: (booking: BookingSummaryResponse) => void;
  onCancel?: (booking: BookingSummaryResponse) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onSelect, onCancel }) => {
  const handleView = () => {
    if (onSelect) {
      onSelect(booking);
      return;
    }
    navigateTo(ROUTES.BOOKING.DETAIL(booking.id));
  };

  const remaining = Math.max(booking.totalPriceVnd - booking.paidAmountVnd, 0);

  return (
    <article className="bg-white rounded-2xl border border-[#E6E1D8] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#D6CEBE] transition-all flex flex-col justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E6E1D8]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#1C2526] bg-[#F7F4EE] border border-[#E6E1D8] px-2.5 py-0.5 rounded-lg">
              <Hash className="w-3.5 h-3.5 text-[#C2410C]" />
              {booking.bookingCode}
            </span>
            <span className="text-[11px] font-mono text-[#78716C]">
              Tạo lúc: {formatDateTime(booking.createdAt)}
            </span>
          </div>

          <h3
            onClick={handleView}
            className="font-editorial text-xl font-bold text-[#1C2526] hover:text-[#C2410C] transition-colors cursor-pointer"
          >
            {booking.tourTitle}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatusBadge bookingStatus={booking.status} size="sm" />
          <StatusBadge paymentState={booking.paymentState} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E6E1D8]/70">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-0.5">
            Khởi hành
          </span>
          <strong className="text-[#1C2526] font-mono-numbers flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
            {formatDateTime(booking.startsAt)}
          </strong>
        </div>

        <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E6E1D8]/70">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-0.5">
            Số hành khách
          </span>
          <strong className="text-[#1C2526] font-mono-numbers flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#1F4E43] shrink-0" />
            {booking.participantCount} người
          </strong>
        </div>

        <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E6E1D8]/70">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-0.5">
            Tổng tiền / Đã trả
          </span>
          <div className="font-mono-numbers">
            <strong className="text-[#1C2526]">{formatVND(booking.totalPriceVnd)}</strong>
            <span className="text-[#1F4E43] block text-[11px]">
              Đã trả: {formatVND(booking.paidAmountVnd)}
            </span>
          </div>
        </div>

        <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E6E1D8]/70">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-0.5">
            Còn lại cần trả
          </span>
          <strong className="font-mono-numbers text-sm text-[#C2410C]">
            {formatVND(remaining)}
          </strong>
          {booking.status === 'PENDING_PAYMENT' && booking.holdExpiresAt && (
            <span className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5 font-mono-numbers">
              <Clock className="w-3 h-3" /> Giữ đến {formatDateTime(booking.holdExpiresAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(booking.tourId))}
          className="text-xs font-medium text-[#64748B] hover:text-[#1C2526] hover:underline cursor-pointer"
        >
          Xem thông tin tour #{booking.tourId}
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (booking.status === 'PENDING_PAYMENT' || booking.status === 'CONFIRMED') && (
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy đặt chỗ
            </button>
          )}

          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1F4E43] hover:bg-[#15372F] text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>
              {booking.status === 'PENDING_PAYMENT'
                ? 'Thanh toán / Quản lý đặt chỗ'
                : 'Chi tiết & Chỉnh sửa'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
