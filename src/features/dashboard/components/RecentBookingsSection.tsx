import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { bookingsApi } from '../../bookings/api/bookings.api';
import type { BookingSummaryResponse } from '../../bookings/types/booking.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SectionStateWrapper } from './SectionStateWrapper';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import type { ApiError } from '../../../types/api.types';

export const RecentBookingsSection: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchBookings = async () => {
    setIsLoading(true); setError(null);
    try {
      const result = await bookingsApi.searchBookings({ page: 0, size: 3 });
      setBookings(result.content || []);
    } catch (err) {
      setError((err as ApiError)?.message || 'Không thể tải booking gần đây.');
    } finally { setIsLoading(false); }
  };
  useEffect(() => { void fetchBookings(); }, [refreshTrigger]);

  return <section className="min-w-0 rounded-xl border border-[#E3E4E2] bg-white p-4 shadow-[0_2px_8px_rgba(25,38,34,.04)] sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#151A20]">Booking gần đây</h2><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.BOOKINGS)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#08745B]">Tất cả booking <ArrowRight size={16}/></button></div>
    <SectionStateWrapper isLoading={isLoading} error={error} onRetry={fetchBookings} skeletonHeight="h-44">
      <div className="overflow-x-auto"><table className="w-full min-w-[400px] border-collapse text-sm"><thead><tr className="bg-[#F0F1F0] text-left text-slate-700"><th className="rounded-l-lg px-2.5 py-2">Mã booking</th><th className="px-2.5 py-2">Tour</th><th className="px-2.5 py-2 text-right">Số người</th><th className="rounded-r-lg px-2.5 py-2">Trạng thái</th></tr></thead><tbody>{bookings.map(booking => <tr key={booking.id} className="border-b border-[#E4E7E5]"><td className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-[#08745B]">#{booking.bookingCode}</td><td className="max-w-40 truncate px-2.5 py-2.5" title={booking.tourTitle}>{booking.tourTitle}</td><td className="px-2.5 py-2.5 text-right tabular-nums">{booking.participantCount}</td><td className="px-2.5 py-2.5"><StatusBadge bookingStatus={booking.status} size="sm"/></td></tr>)}</tbody></table>{bookings.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Chưa có booking gần đây.</p>}</div>
    </SectionStateWrapper>
  </section>;
};

export default RecentBookingsSection;
