import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, Search, X, Mountain } from 'lucide-react';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import type { BookingDetailResponse, BookingStatus, BookingSummaryResponse } from '../../../features/bookings/types/booking.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import { Pagination } from '../../../components/ui/Pagination';
import type { ApiError } from '../../../types/api.types';

const statusOptions: Array<{ value: BookingStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'NO_SHOW', label: 'Không tham gia' },
];
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
type BookingDateMode = 'day' | 'week' | 'month' | 'custom' | 'all';
const localStart = (value: string) => new Date(`${value}T00:00:00`);
const addLocalDays = (value: string, days: number) => { const result = localStart(value); result.setDate(result.getDate() + days); return result; };
const dateInputValue = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const currentIsoWeek = (value: Date) => {
  const thursday = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7));
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  const weekNumber = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000);
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

export default function AdminBookingListPage() {
  const [items, setItems] = useState<BookingSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [paymentState, setPaymentState] = useState('');
  const [dateMode, setDateMode] = useState<BookingDateMode>('month');
  const [day, setDay] = useState(() => dateInputValue(new Date()));
  const [week, setWeek] = useState(() => currentIsoWeek(new Date()));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [customFrom, setCustomFrom] = useState(() => dateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(() => dateInputValue(new Date()));
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<BookingDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      let from: string | undefined;
      let until: string | undefined;
      if (dateMode === 'day') {
        from = localStart(day).toISOString();
        until = addLocalDays(day, 1).toISOString();
      } else if (dateMode === 'week') {
        const match = /^(\d{4})-W(\d{2})$/.exec(week);
        if (match) {
          const jan4 = new Date(Number(match[1]), 0, 4);
          const monday = new Date(jan4);
          monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (Number(match[2]) - 1) * 7);
          const mondayValue = dateInputValue(monday);
          from = localStart(mondayValue).toISOString();
          until = addLocalDays(mondayValue, 7).toISOString();
        }
      } else if (dateMode === 'month') {
        const [year, monthNumber] = month.split('-').map(Number);
        from = new Date(year, monthNumber - 1, 1).toISOString();
        until = new Date(year, monthNumber, 1).toISOString();
      } else if (dateMode === 'custom') {
        if (customFrom) from = localStart(customFrom).toISOString();
        if (customTo) until = addLocalDays(customTo, 1).toISOString();
      }
      const result = await bookingsApi.searchBookings({ status, query: appliedQuery || undefined, createdFrom: from, createdTo: until, page, size: 10 }, signal);
      setItems(result.content ?? []); setPages(result.totalPages ?? 0); setTotal(result.totalElements ?? 0);
    } catch (e) {
      if (signal?.aborted || (e as Error)?.name === 'AbortError') return;
      setError((e as ApiError)?.message || 'Không tải được danh sách đặt chỗ.');
    }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [appliedQuery, customFrom, customTo, dateMode, day, month, page, status, week]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(0); setAppliedQuery(query.trim()); }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    return items.filter(b => !paymentState || b.paymentState === paymentState);
  }, [items, paymentState]);
  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try { setDetail(await bookingsApi.getBookingDetail(id)); }
    catch (e) { setError((e as ApiError)?.message || 'Không tải được chi tiết đặt chỗ.'); }
    finally { setDetailLoading(false); }
  };
  return <div className="min-h-full px-4 py-6 sm:px-7 lg:px-8">
    <div className="mx-auto max-w-[1500px] space-y-5">
      <AdminPageHeader className="admin-booking-page-header" title="Đặt chỗ" description="Theo dõi hành khách, thanh toán và trạng thái giữ chỗ." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-[1.4fr_.75fr_.75fr_.8fr_1.2fr]">
        <label className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/><input aria-label="Tìm mã booking hoặc tên khách" className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white pl-12 pr-4 text-base" placeholder="Mã booking, tên khách..." value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/></label>
        <select aria-label="Lọc trạng thái" value={status} onChange={e => { setStatus(e.target.value as BookingStatus | ''); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"><option value="">Trạng thái</option>{statusOptions.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select aria-label="Lọc thanh toán" value={paymentState} onChange={e => { setPaymentState(e.target.value); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"><option value="">Thanh toán</option><option value="UNPAID">Chưa thanh toán</option><option value="DEPOSIT_PAID">Đã cọc</option><option value="FULLY_PAID">Đã thanh toán đủ</option></select>
        <select aria-label="Lọc theo thời gian tạo" value={dateMode} onChange={e => { setDateMode(e.target.value as BookingDateMode); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"><option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option><option value="custom">Khoảng tùy chọn</option><option value="all">Toàn thời gian</option></select>
        {dateMode === 'day' && <input aria-label="Chọn ngày tạo booking" type="date" value={day} onChange={e => { setDay(e.target.value); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"/>}
        {dateMode === 'week' && <input aria-label="Chọn tuần tạo booking" type="week" value={week} onChange={e => { setWeek(e.target.value); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"/>}
        {dateMode === 'month' && <input aria-label="Chọn tháng tạo booking" type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(0); }} className="min-h-14 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 text-base"/>}
        {dateMode === 'custom' && <div className="grid grid-cols-2 gap-2"><input aria-label="Ngày bắt đầu" type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setPage(0); }} className="min-h-14 min-w-0 w-full rounded-xl border border-[#CCD5E1] bg-white px-3 text-sm"/><input aria-label="Ngày kết thúc" type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setPage(0); }} className="min-h-14 min-w-0 w-full rounded-xl border border-[#CCD5E1] bg-white px-3 text-sm"/></div>}
        {dateMode === 'all' && <div className="flex min-h-14 items-center rounded-xl border border-[#CCD5E1] bg-slate-50 px-4 text-sm text-slate-600">Không giới hạn thời gian</div>}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><CalendarDays size={18}/><span><strong>Giữ chỗ tối đa 15 phút.</strong> Đặt chỗ chưa thanh toán sẽ tự hết hạn sau thời gian giữ chỗ.</span></div>
      <section className="overflow-hidden rounded-xl border border-[#d9e1dc] bg-[#fffefa]">
        <div className="flex items-center gap-3 border-b border-[#e1e7e2] p-5"><h2 className="text-xl font-bold">Đặt chỗ</h2></div>
        {error && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#EEF1F4] text-slate-700"><tr><th className="px-2.5 py-3">Mã booking</th><th className="px-2.5 py-3">Khách đặt</th><th className="px-2.5 py-3">Tour</th><th className="px-2.5 py-3">Ngày khởi hành</th><th className="px-2.5 py-3">Số khách</th><th className="px-2.5 py-3">Thanh toán</th><th className="px-2.5 py-3">Trạng thái</th><th className="px-2.5 py-3">Thao tác</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={8} className="p-10 text-center text-slate-600">Đang tải đặt chỗ…</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-slate-600">Không có đặt chỗ phù hợp với bộ lọc.</td></tr> : filtered.map(b => <tr key={b.id} className="border-t border-[#e1e7e2] hover:bg-[#f7faf7]"><td className="whitespace-nowrap px-2.5 py-4 font-semibold text-[#102b2b]">{b.bookingCode}</td><td className="whitespace-nowrap px-2.5 py-4">{b.customerName || `Khách #${b.customerId}`}</td><td className="max-w-64 px-2.5 py-4"><span className="block truncate font-semibold"><Mountain className="mr-2 inline h-4 w-4 text-[#08745c]"/>{b.tourTitle}</span><span className="pl-6 text-xs text-slate-500">{b.participantCount} khách</span></td><td className="whitespace-nowrap px-2.5 py-4">{date(b.startsAt)}</td><td className="px-2.5 py-4 tabular-nums">{b.participantCount}</td><td className="px-2.5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${b.paymentState === 'UNPAID' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>{b.paymentState === 'UNPAID' ? 'Chưa thanh toán' : b.paymentState === 'DEPOSIT_PAID' ? 'Đã cọc' : b.paymentState === 'FULLY_PAID' ? 'Đã thanh toán đủ' : b.paymentState}</span></td><td className="px-2.5 py-4"><StatusBadge bookingStatus={b.status} size="sm"/></td><td className="px-2.5 py-4"><button type="button" onClick={() => void openDetail(b.id)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#08745c] px-2.5 py-2 font-semibold text-[#075541] hover:bg-[#e4f3ed]"><Eye size={16}/> Xem</button></td></tr>)}
        </tbody></table></div>
        {pages > 1 && <Pagination page={page} totalPages={pages} totalElements={total} pageSize={10} onPageChange={next => { if (!loading) setPage(next); }} />}
      </section>
    </div>
    {(detail || detailLoading) && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={e => { if (e.target === e.currentTarget) setDetail(null); }}><aside aria-label="Chi tiết đặt chỗ" className="h-full w-full max-w-xl overflow-y-auto bg-[#fffefa] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-bold">Chi tiết đặt chỗ</h2>{detail && <p className="mt-1 text-sm text-slate-600">{detail.bookingCode}</p>}</div><button aria-label="Đóng chi tiết" onClick={() => setDetail(null)} className="rounded-lg p-2 hover:bg-slate-100"><X/></button></div>{detailLoading ? <p className="py-12 text-slate-600">Đang tải…</p> : detail && <div className="mt-6 space-y-5"><div className="flex items-center justify-between rounded-lg bg-[#eef4ef] p-4"><span className="font-semibold">{detail.tourTitle}</span><StatusBadge bookingStatus={detail.status}/></div><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Khởi hành</dt><dd className="mt-1 font-semibold">{date(detail.startsAt)}</dd></div><div><dt className="text-slate-500">Số hành khách</dt><dd className="mt-1 font-semibold">{detail.price.participantCount}</dd></div><div><dt className="text-slate-500">Tổng tiền</dt><dd className="mt-1 font-semibold">{money(detail.price.totalPriceVnd)}</dd></div><div><dt className="text-slate-500">Đã thanh toán</dt><dd className="mt-1 font-semibold">{money(detail.price.paidAmountVnd)}</dd></div><div className="col-span-2"><dt className="text-slate-500">Điểm tập trung</dt><dd className="mt-1 font-semibold">{detail.meetingPoint || 'Chưa cập nhật'}</dd></div></dl><section><h3 className="mb-2 font-bold">Hành khách</h3><ul className="divide-y divide-[#e1e7e2] rounded-lg border border-[#e1e7e2]">{detail.passengers.map(p => <li key={p.id} className="px-4 py-3"><p className="font-semibold">{p.fullName}{p.bookingCustomer ? ' · Người đặt' : ''}</p><p className="text-sm text-slate-600">{p.phone || 'Chưa có số điện thoại'}{p.email ? ` · ${p.email}` : ''}</p></li>)}</ul></section></div>}</aside></div>}
  </div>;
}
