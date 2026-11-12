import { CancelBookingDialog } from '../../../features/bookings/components/CancelBookingDialog';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  RefreshCw,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import type {
  BookingSummaryResponse,
  BookingStatus,
  BookingCancellationResponse,
} from '../../../features/bookings/types/booking.types';
import type { ApiError } from '../../../types/api.types';
import { BookingCard } from '../../../features/bookings/components/BookingCard';
import { RefundDestinationFields } from '../../../features/bookings/components/RefundDestinationFields';
import { formatVND } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

export interface MyBookingsPageProps {
  booking?: any;
  onUpdateBooking?: (updated: any) => void;
  onNavigate?: (screen: any) => void;
  onOpenAIRanger?: () => void;
}

const STATUS_FILTER_OPTIONS: Array<{ value: BookingStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'EXPIRED', label: 'Hết hạn giữ chỗ' },
  { value: 'NO_SHOW', label: 'Vắng mặt' },
];

const REFUND_STATUS_LABEL: Record<string, string> = {
  requested: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  processing: 'Đang chuyển khoản',
  completed: 'Đã hoàn tiền',
  failed: 'Chưa chuyển được',
  rejected: 'Không được duyệt',
};

export const MyBookingsPage: React.FC<MyBookingsPageProps> = () => {
  const { isAuthenticated, isInitializing, account } = useAuth();

  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(20);

  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Cancel modal state
  const [bookingToCancel, setBookingToCancel] = useState<BookingSummaryResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [requestRefund, setRequestRefund] = useState<boolean>(true);
  const [refundBankBin, setRefundBankBin] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountHolder, setRefundAccountHolder] = useState('');
  const [lastCancellationResult, setLastCancellationResult] =
    useState<BookingCancellationResponse | null>(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ACCOUNT.BOOKINGS)}`, {
        replace: true,
      });
    }
  }, [isInitializing, isAuthenticated]);

  const fetchMyBookings = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.getMyBookings({
        status: statusFilter,
        page,
        size,
      });
      setBookings(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, statusFilter, page, size]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      fetchMyBookings();
    }
  }, [isInitializing, isAuthenticated, fetchMyBookings]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      const res = await bookingsApi.cancelBooking(bookingToCancel.id, {
        reason: cancelReason.trim() || 'Khách hàng yêu cầu hủy đặt chỗ',
        ...(requestRefund && new Date(bookingToCancel.startsAt).getTime() > Date.now() && bookingToCancel.paidAmountVnd > 0 && bookingToCancel.paymentState !== 'FULLY_REFUNDED'
          ? { refundRequest: {
              bankBin: refundBankBin.trim(),
              accountNumber: refundAccountNumber.trim(),
              accountHolderName: refundAccountHolder.trim(),
            } }
          : {}),
      });
      setLastCancellationResult(res);
      setBookingToCancel(null);
      setCancelReason('');
      setRefundBankBin('');
      setRefundAccountNumber('');
      setRefundAccountHolder('');
      toast.info(`Đã hủy đặt chỗ #${bookingToCancel.bookingCode}.`);
      await fetchMyBookings();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || 'Không thể hủy đặt chỗ.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6E1D8] pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
              Tài khoản cá nhân {account?.fullName ? `• ${account.fullName}` : ''}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526] mt-1">
              Đặt chỗ của tôi
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Theo dõi trạng thái xác nhận, thanh toán số dư, cập nhật thông tin đoàn hoặc hủy đặt chỗ.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMyBookings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-700 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`} />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {/* Cancellation Reconciliation Notice */}
        {lastCancellationResult && (
          <div className="rounded-2xl bg-stone-100 border border-stone-300 p-5 flex items-start justify-between gap-4">
            <div className="space-y-1 text-xs text-stone-700">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <PhoneCall className="w-4 h-4 text-[#1F4E43]" />
                <span>Đã ghi nhận hủy đặt chỗ #{lastCancellationResult.bookingCode}</span>
              </div>
              <p>
                Yêu cầu hoàn tiền:{' '}
                <strong>
                  {lastCancellationResult.refundRequired
                    ? lastCancellationResult.refundRequest ? 'Đã gửi yêu cầu hoàn tiền' : 'Đã thanh toán nhưng chưa gửi yêu cầu hoàn tiền'
                    : 'Không phát sinh hoàn tiền'}
                </strong>{' '}
                • Số tiền đã trả: <strong>{formatVND(lastCancellationResult.paidAmountVnd)}</strong>.
              </p>
              {lastCancellationResult.refundRequired && (
                <p className="text-stone-600">
                  Nhân viên sẽ kiểm tra yêu cầu và liên hệ với bạn qua email hoặc số điện thoại đăng ký.
                </p>
              )}
              {lastCancellationResult.refundRequest && (
                <p className="text-stone-700">
                  Yêu cầu #{lastCancellationResult.refundRequest.id} đang ở trạng thái{' '}
                  <strong>{REFUND_STATUS_LABEL[lastCancellationResult.refundRequest.status] || lastCancellationResult.refundRequest.status}</strong>; số tiền dự kiến{' '}
                  <strong>{formatVND(lastCancellationResult.refundRequest.requestedAmountVnd)}</strong>, tài khoản ····{lastCancellationResult.refundRequest.recipientAccountLast4 || '—'}.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLastCancellationResult(null)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E6E1D8] p-4 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-stone-400 shrink-0 mr-1" />
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value || 'ALL'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(0);
                  }}
                  className={`min-h-11 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1F4E43] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <span role="status" className="text-sm text-stone-500 shrink-0">
            {isLoading ? 'Đang tải đặt chỗ…' : error ? 'Chưa thể tải đặt chỗ' : <>Tổng cộng: <strong>{totalElements}</strong> đặt chỗ</>}
          </span>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white border border-stone-200 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between">
                  <div className="h-5 bg-stone-200 rounded w-1/3" />
                  <div className="h-5 bg-stone-200 rounded w-24" />
                </div>
                <div className="h-4 bg-stone-200 rounded w-1/2" />
                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <div className="h-6 bg-stone-200 rounded w-32" />
                  <div className="h-9 bg-stone-200 rounded-xl w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Không thể tải danh sách đặt chỗ
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {error.message || 'Đã xảy ra lỗi khi kết nối với máy chủ.'}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchMyBookings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="font-editorial text-2xl font-bold text-[#1C2526]">
                {statusFilter
                  ? 'Không có đặt chỗ nào ở trạng thái này'
                  : 'Bạn chưa có chuyến đi nào được đặt'}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                Khám phá các cung đường trekking rừng nguyên sinh và đỉnh núi cao cùng đội ngũ dẫn đường chuyên nghiệp.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {statusFilter && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('')}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
                className="px-6 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9B2F00] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Khám phá các cung đường
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onSelect={(item) => navigateTo(ROUTES.BOOKING.DETAIL(item.id))}
                onCancel={(item) => {
                  setBookingToCancel(item);
                  setCancelReason('');
                  setRequestRefund(true);
                  setRefundBankBin('');
                  setRefundAccountNumber('');
                  setRefundAccountHolder('');
                }}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-stone-500">
                  Trang <strong>{page + 1}</strong> / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="p-2 rounded-xl border border-stone-300 bg-white disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-xl border border-stone-300 bg-white disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                    aria-label="Trang tiếp"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CancelBookingDialog
        isOpen={Boolean(bookingToCancel)}
        bookingCode={bookingToCancel?.bookingCode || ''}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onClose={() => setBookingToCancel(null)}
        onSubmit={handleConfirmCancel}
        isSubmitting={isCancelling}
      >
        {bookingToCancel && bookingToCancel.paidAmountVnd > 0 && bookingToCancel.paymentState !== 'FULLY_REFUNDED' && new Date(bookingToCancel.startsAt).getTime() > Date.now() && (
          <RefundDestinationFields
            idPrefix="booking-list-refund"
            enabled={requestRefund}
            setEnabled={setRequestRefund}
            bankBin={refundBankBin}
            setBankBin={setRefundBankBin}
            accountNumber={refundAccountNumber}
            setAccountNumber={setRefundAccountNumber}
            accountHolderName={refundAccountHolder}
            setAccountHolderName={setRefundAccountHolder}
          />
        )}
      </CancelBookingDialog>
    </div>
  );
};

export default MyBookingsPage;
