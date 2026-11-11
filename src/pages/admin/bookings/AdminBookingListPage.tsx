import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import type {
  BookingSearchCriteria,
  BookingStatus,
  BookingSummaryResponse,
} from '../../../features/bookings/types/booking.types';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourSummaryResponse } from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { formatDate, formatDateTime, formatOffsetDateTime, formatVND } from '../../../lib/utils';

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'EXPIRED', label: 'Hết hạn giữ chỗ' },
  { value: 'NO_SHOW', label: 'Vắng mặt' },
];

/** Form state: every field is a raw string from an input, converted to criteria on submit. */
interface FilterForm {
  status: BookingStatus | '';
  tourId: string;
  scheduleId: string;
  customerId: string;
  createdFrom: string; // YYYY-MM-DD
  createdTo: string; // YYYY-MM-DD (inclusive in UI, exclusive +1 day for API)
}

const EMPTY_FILTERS: FilterForm = {
  status: '',
  tourId: '',
  scheduleId: '',
  customerId: '',
  createdFrom: '',
  createdTo: '',
};

function toPositiveId(value: string): number | undefined {
  const n = Number(value.trim());
  return value.trim() !== '' && Number.isInteger(n) && n > 0 ? n : undefined;
}

function toCriteria(form: FilterForm): BookingSearchCriteria {
  const criteria: BookingSearchCriteria = {};
  if (form.status) criteria.status = form.status;
  const tourId = toPositiveId(form.tourId);
  if (tourId) criteria.tourId = tourId;
  const scheduleId = toPositiveId(form.scheduleId);
  if (scheduleId) criteria.scheduleId = scheduleId;
  const customerId = toPositiveId(form.customerId);
  if (customerId) criteria.customerId = customerId;
  if (form.createdFrom) {
    criteria.createdFrom = formatOffsetDateTime(new Date(`${form.createdFrom}T00:00:00`));
  }
  if (form.createdTo) {
    // Backend interval is [createdFrom, createdTo): add one day so the chosen end date is included.
    const end = new Date(`${form.createdTo}T00:00:00`);
    end.setDate(end.getDate() + 1);
    criteria.createdTo = formatOffsetDateTime(end);
  }
  return criteria;
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:border-[#1F4E43]';
const labelClass = 'block text-xs font-semibold text-stone-600 mb-1.5';

export const AdminBookingListPage: React.FC = () => {
  const [form, setForm] = useState<FilterForm>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FilterForm>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [tours, setTours] = useState<TourSummaryResponse[]>([]);

  useEffect(() => {
    toursApi
      .listTours({ size: 100 })
      .then((res) => setTours(res.content || []))
      .catch(() => setTours([]));
  }, []);

  const rangeInvalid =
    form.createdFrom !== '' && form.createdTo !== '' && form.createdTo < form.createdFrom;

  const fetchBookings = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await bookingsApi.searchBookings({ ...toCriteria(applied), page, size }, signal);
        setBookings(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        const apiErr = err as ApiError;
        if (apiErr.status === 401) {
          navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.BOOKINGS)}`, {
            replace: true,
          });
          return;
        }
        setError(apiErr);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [applied, page, size]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings(controller.signal);
    return () => controller.abort();
  }, [fetchBookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rangeInvalid) return;
    setPage(0);
    setApplied({ ...form });
  };

  const handleReset = () => {
    setForm(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const hasActiveFilters = Object.values(applied).some((v) => v !== '');
  const tourTitleById = new Map(tours.map((t) => [t.id, t.title]));

  return (
    <AdminAccessGuard forbiddenError={error?.status === 403}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1F4E43] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
                <span>Quản trị viên • Đặt chỗ</span>
              </div>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                Quản lý booking
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Tra cứu toàn bộ đơn đặt chỗ theo trạng thái, tour, lịch khởi hành, khách hàng và ngày tạo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchBookings()}
              disabled={isLoading}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Filters */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-2xs space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bk-status" className={labelClass}>Trạng thái</label>
                <select
                  id="bk-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookingStatus | '' }))}
                  className={`${inputClass} cursor-pointer`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bk-tour" className={labelClass}>Tour</label>
                <select
                  id="bk-tour"
                  value={form.tourId}
                  onChange={(e) => setForm((f) => ({ ...f, tourId: e.target.value }))}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Tất cả tour</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bk-schedule" className={labelClass}>Mã lịch khởi hành</label>
                  <input
                    id="bk-schedule"
                    inputMode="numeric"
                    value={form.scheduleId}
                    onChange={(e) => setForm((f) => ({ ...f, scheduleId: e.target.value.replace(/\D/g, '') }))}
                    placeholder="VD: 12"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="bk-customer" className={labelClass}>Mã khách hàng</label>
                  <input
                    id="bk-customer"
                    inputMode="numeric"
                    value={form.customerId}
                    onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value.replace(/\D/g, '') }))}
                    placeholder="VD: 5"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bk-from" className={labelClass}>Tạo từ ngày</label>
                <input
                  id="bk-from"
                  type="date"
                  value={form.createdFrom}
                  onChange={(e) => setForm((f) => ({ ...f, createdFrom: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="bk-to" className={labelClass}>Đến ngày</label>
                <input
                  id="bk-to"
                  type="date"
                  value={form.createdTo}
                  min={form.createdFrom || undefined}
                  onChange={(e) => setForm((f) => ({ ...f, createdTo: e.target.value }))}
                  aria-invalid={rangeInvalid}
                  className={`${inputClass} ${rangeInvalid ? 'border-rose-400' : ''}`}
                />
                {rangeInvalid && (
                  <p className="mt-1 text-xs text-rose-700">"Đến ngày" phải sau hoặc bằng "Tạo từ ngày".</p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={rangeInvalid}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm kiếm</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-700 cursor-pointer"
                >
                  Xóa lọc
                </button>
              </div>
            </div>
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 space-y-4 animate-pulse shadow-2xs">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex items-center gap-4 py-2">
                  <div className="h-4 bg-stone-200 rounded w-28" />
                  <div className="h-4 bg-stone-200 rounded flex-1" />
                  <div className="h-6 bg-stone-200 rounded-full w-24" />
                  <div className="h-4 bg-stone-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="text-lg font-bold text-stone-900">Không thể tải danh sách booking</h2>
                <p className="text-xs sm:text-sm text-stone-600">{error.message}</p>
                {error.code && <p className="text-[11px] font-mono text-rose-600">Mã lỗi: {error.code}</p>}
              </div>
              <button
                type="button"
                onClick={() => fetchBookings()}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="font-editorial text-2xl font-bold text-[#1C2526]">Không có booking nào</h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  {hasActiveFilters
                    ? 'Không có booking nào khớp với bộ lọc hiện tại.'
                    : 'Hệ thống chưa ghi nhận đơn đặt chỗ nào.'}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[960px]">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                      <th className="py-3.5 px-4 font-bold">Mã booking</th>
                      <th className="py-3.5 px-4 font-bold">Tour / Khởi hành</th>
                      <th className="py-3.5 px-4 font-bold text-center">Khách</th>
                      <th className="py-3.5 px-4 font-bold text-right">Tổng tiền</th>
                      <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                      <th className="py-3.5 px-4 font-bold">Ngày tạo</th>
                      <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-[#1C2526]">{b.bookingCode}</span>
                          <span className="block text-[11px] text-stone-500">#{b.id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#1C2526] block">
                            {b.tourTitle || tourTitleById.get(b.tourId) || `Tour #${b.tourId}`}
                          </span>
                          <span className="block text-xs text-stone-500">
                            Khởi hành {formatDate(b.startsAt)} · Lịch #{b.scheduleId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="block text-xs font-semibold text-stone-800">KH #{b.customerId}</span>
                          <span className="block text-[11px] text-stone-500">{b.participantCount} người</span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="block font-semibold text-[#1C2526] tabular-nums">{formatVND(b.totalPriceVnd)}</span>
                          <span className="block text-[11px] text-stone-500 tabular-nums">Đã trả {formatVND(b.paidAmountVnd)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge bookingStatus={b.status} size="sm" />
                            <StatusBadge paymentState={b.paymentState} size="sm" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-600 whitespace-nowrap">
                          {formatDateTime(b.createdAt)}
                          {b.status === 'PENDING_PAYMENT' && b.holdExpiresAt && (
                            <span className="block text-[11px] text-amber-700">Giữ chỗ đến {formatDateTime(b.holdExpiresAt)}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigateTo(ROUTES.BOOKING.DETAIL(b.id))}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1F4E43]" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-[#FAF8F5] border-t border-[#E6E1D8] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Tổng số: <strong className="text-stone-900">{totalElements}</strong> booking
                  </span>
                  <span className="text-stone-300">|</span>
                  <label className="inline-flex items-center gap-1.5">
                    <span>Số dòng/trang:</span>
                    <select
                      value={size}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="px-2 py-1 rounded-lg border border-stone-300 bg-white font-mono text-xs text-stone-800 focus:outline-none focus:border-[#1F4E43] cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    Trang <strong>{totalPages > 0 ? page + 1 : 0}</strong> / {Math.max(totalPages, 1)}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      disabled={page <= 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      aria-label="Trang trước"
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={totalPages === 0 || page + 1 >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Trang tiếp theo"
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAccessGuard>
  );
};

export default AdminBookingListPage;
