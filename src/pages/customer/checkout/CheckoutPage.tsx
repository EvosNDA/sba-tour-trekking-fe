import React, { useEffect } from 'react';
import type { Booking, ScreenId } from '../../../types/expedition';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface CheckoutPageProps {
  booking?: Booking;
  onUpdateBooking?: (updated: Booking) => void;
  onNavigate?: (screen: ScreenId) => void;
  onOpenAIRanger?: () => void;
}

// Legacy entries use the same server-backed payment flow as a booking.
export function CheckoutPage({ booking }: CheckoutPageProps) {
  const queryId = new URLSearchParams(window.location.search).get('bookingId');
  const candidate = queryId || String(booking?.id || '');
  const bookingId = /^\d+$/.test(candidate) && Number(candidate) > 0 && Number.isSafeInteger(Number(candidate)) ? Number(candidate) : null;
  useEffect(() => {
    if (bookingId) navigateTo(ROUTES.BOOKING.DETAIL(bookingId), { replace: true });
  }, [bookingId]);
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-[#1F4E43]">{bookingId ? 'Đang mở thông tin thanh toán' : 'Chọn đặt chỗ cần thanh toán'}</h1>
      <p className="mt-4 text-base leading-7 text-[#5C645E]">Để kiểm tra đúng số tiền và trạng thái giao dịch, vui lòng mở đặt chỗ của bạn trước khi thanh toán.</p>
      <button type="button" onClick={() => navigateTo(bookingId ? ROUTES.BOOKING.DETAIL(bookingId) : ROUTES.ACCOUNT.BOOKINGS)} className="mt-6 min-h-12 rounded-xl bg-[#1F4E43] px-6 py-3 text-sm font-semibold text-white hover:bg-[#15372F]">{bookingId ? 'Mở đặt chỗ' : 'Đến đặt chỗ của tôi'}</button>
    </section>
  );
}
