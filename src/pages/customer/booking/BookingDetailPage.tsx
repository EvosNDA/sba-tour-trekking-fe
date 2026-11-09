import { TravelerFields } from '../../../features/bookings/components/TravelerFields';
import { CancelBookingDialog } from '../../../features/bookings/components/CancelBookingDialog';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Users,
  XCircle,
  ShieldAlert,
  Loader2,
  PhoneCall,
  Check,
  Backpack,
} from 'lucide-react';
import { useLocation, useSearchParams, navigateTo } from '../../../lib/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { paymentsApi } from '../../../features/payments/api/payments.api';
import type {
  BookingDetailResponse,
  BookingPassengerResponse,
  BookingCancellationResponse,
  BookingPassengerRequest,
} from '../../../features/bookings/types/booking.types';
import type { PaymentPurpose, PaymentLinkResponse } from '../../../features/payments/types/payment.types';
import type { ApiError } from '../../../types/api.types';
import { BookingStepper } from '../../../features/bookings/components/BookingStepper';
import { PriceSummary } from '../../../features/bookings/components/PriceSummary';
import { PassengerForm, validatePassengers } from '../../../features/bookings/components/PassengerForm';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatDate, formatDateTime, formatVND } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

const LAST_PAYMENT_BOOKING_KEY = 'wetrek_last_payment_booking_id';
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3500;

interface PaymentCallbackScreenProps {
  booking: BookingDetailResponse;
  isCancelledRedirect: boolean;
  isPaymentConfirmed: boolean;
  isPollingWebhook: boolean;
  hasTimedOut: boolean;
  canResumeHold: boolean;
  onCheckStatus: () => void;
}

const PaymentCallbackScreen: React.FC<PaymentCallbackScreenProps> = ({
  booking,
  isCancelledRedirect,
  isPaymentConfirmed,
  isPollingWebhook,
  hasTimedOut,
  canResumeHold,
  onCheckStatus,
}) => {
  const isCancelled = isCancelledRedirect && !isPaymentConfirmed;
  const isSuccess = isPaymentConfirmed;
  const title = isSuccess
    ? 'Thanh toán đã được xác nhận'
    : isCancelled
      ? canResumeHold
        ? 'Bạn đã hủy thanh toán trên PayOS'
        : 'Đơn giữ chỗ đã hết hạn'
      : hasTimedOut
        ? 'Chưa nhận được xác nhận thanh toán'
        : 'Đang xác nhận giao dịch';

  const message = isSuccess
    ? `Đơn #${booking.bookingCode} đã được hệ thống xác nhận từ thông báo thanh toán của PayOS.`
    : isCancelled
      ? canResumeHold
        ? 'Đơn vẫn đang được giữ. Bạn sẽ quay lại trang đặt cọc để có thể tiếp tục thanh toán.'
        : 'Thời gian giữ chỗ 15 phút đã hết. Bạn sẽ được đưa về danh sách đặt chỗ; không tiếp tục dùng liên kết thanh toán cũ.'
      : hasTimedOut
        ? 'WeTrek chưa nhận được xác nhận từ máy chủ. Bạn có thể kiểm tra lại trạng thái hoặc xem đơn trong tài khoản.'
        : 'Đã quay lại từ PayOS. WeTrek đang chờ thông báo máy chủ để xác nhận giao dịch; trạng thái trên URL chưa được xem là đã thanh toán.';

  const accent = isSuccess
    ? { panel: 'border-emerald-200 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-950', iconComponent: <CheckCircle2 className="w-7 h-7" /> }
    : isCancelled || hasTimedOut
      ? { panel: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-700', title: 'text-amber-950', iconComponent: <AlertTriangle className="w-7 h-7" /> }
      : { panel: 'border-[#B7D2C8] bg-[#F1F7F3]', icon: 'bg-[#DDEDE5] text-[#1F4E43]', title: 'text-[#173B32]', iconComponent: <Loader2 className={`w-7 h-7 ${isPollingWebhook ? 'animate-spin' : ''}`} /> };

  const primaryLabel = isCancelled
    ? canResumeHold ? 'Quay lại trang đặt cọc' : 'Về đặt chỗ của tôi'
    : isSuccess ? 'Xem chi tiết đơn' : 'Kiểm tra trạng thái';

  const handlePrimaryAction = () => {
    if (isCancelled) {
      navigateTo(canResumeHold ? ROUTES.BOOKING.DETAIL(booking.id) : ROUTES.ACCOUNT.BOOKINGS, { replace: true });
    } else if (isSuccess) {
      navigateTo(ROUTES.BOOKING.DETAIL(booking.id));
    } else {
      onCheckStatus();
    }
  };

  return (
    <main className="min-h-[75vh] bg-[#FDFBF7] px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E6E1D8] bg-white shadow-lg">
        <div className={`border-b p-7 sm:p-9 ${accent.panel}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.icon}`}>
              {accent.iconComponent}
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#C2410C]">
                CẬP NHẬT THANH TOÁN WETREK
              </p>
              <h1 className={`font-editorial text-2xl font-bold sm:text-3xl ${accent.title}`}>{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{message}</p>
            </div>
          </div>
          {isCancelled && (
            <p className="mt-5 rounded-xl border border-white/80 bg-white/75 px-4 py-3 text-xs text-stone-600">
              {canResumeHold ? 'Đang đưa bạn về đơn đặt cọc…' : 'Đang đưa bạn về danh sách đặt chỗ…'}
            </p>
          )}
          {!isCancelled && !isSuccess && isPollingWebhook && (
            <p className="mt-5 rounded-xl border border-white/80 bg-white/75 px-4 py-3 text-xs text-stone-600">
              Đang chờ xác nhận từ máy chủ. Thường mất vài giây.
            </p>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Mã đặt chỗ</p>
              <p className="mt-1 font-mono text-sm font-bold text-[#1C2526]">#{booking.bookingCode}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
              className="text-xs font-semibold text-[#1F4E43] hover:underline"
            >
              Tất cả đặt chỗ
            </button>
          </div>

          <h2 className="font-editorial text-xl font-bold text-[#1C2526]">
            {booking.tourTitle || `Tour Trekking #${booking.tourId}`}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-3">
              <p className="font-mono text-[10px] uppercase text-stone-500">Khởi hành</p>
              <p className="mt-1 text-xs font-semibold text-stone-800">{formatDateTime(booking.startsAt)}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-3">
              <p className="font-mono text-[10px] uppercase text-stone-500">Tổng giá trị</p>
              <p className="mt-1 text-xs font-semibold text-stone-800">{formatVND(booking.price.totalPriceVnd)}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-3">
              <p className="font-mono text-[10px] uppercase text-stone-500">Đã ghi nhận</p>
              <p className="mt-1 text-xs font-semibold text-[#1F4E43]">{formatVND(booking.price.paidAmountVnd)}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {!isCancelled && (
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
                className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                Về đặt chỗ của tôi
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F4E43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#163830]"
            >
              {!isCancelled && !isSuccess && <RefreshCw className="h-4 w-4" />}
              <span>{primaryLabel}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export interface BookingDetailPageProps {
  bookingIdProp?: number;
}

export const BookingDetailPage: React.FC<BookingDetailPageProps> = ({ bookingIdProp }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isInitializing } = useAuth();

  // Extract bookingId from prop, URL path `/booking/:bookingId`, query param `bookingId`, or sessionStorage (for `/payment/result` & `/payment/cancel`)
  const resolvedBookingId = React.useMemo(() => {
    if (bookingIdProp && Number.isFinite(bookingIdProp)) return bookingIdProp;
    const match = pathname.match(/^\/booking\/(\d+)/);
    if (match) return Number(match[1]);
    const qId = Number(searchParams.get('bookingId'));
    if (Number.isFinite(qId) && qId > 0) return qId;
    try {
      const saved = Number(sessionStorage.getItem(LAST_PAYMENT_BOOKING_KEY));
      if (Number.isFinite(saved) && saved > 0) return saved;
    } catch {
      // ignore
    }
    return null;
  }, [bookingIdProp, pathname, searchParams]);

  const isPaymentReturnRoute =
    pathname === ROUTES.BOOKING.PAYMENT_RESULT ||
    pathname === ROUTES.BOOKING.PAYMENT_CANCEL ||
    searchParams.has('orderCode') ||
    searchParams.has('cancel') ||
    searchParams.has('payment');

  const isCancelledRedirect =
    pathname === ROUTES.BOOKING.PAYMENT_CANCEL || searchParams.get('cancel') === 'true';

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  // Hold countdown state
  const [remainingHoldSeconds, setRemainingHoldSeconds] = useState<number | null>(null);

  // Payment creation state
  const [selectedPurpose, setSelectedPurpose] = useState<PaymentPurpose>('DEPOSIT');
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkResponse | null>(null);
  const [paymentError, setPaymentError] = useState<ApiError | null>(null);

  // Webhook polling state when returning from PayOS
  const [isPollingWebhook, setIsPollingWebhook] = useState<boolean>(false);
  const [pollCount, setPollCount] = useState<number>(0);
  const pollTimerRef = useRef<number | null>(null);

  // Single participant inline edit state (PATCH)
  const [editingParticipantId, setEditingParticipantId] = useState<number | null>(null);
  const [participantDraft, setParticipantDraft] = useState<{
    fullName: string;
    phone: string;
    email: string;
  }>({ fullName: '', phone: '', email: '' });
  const [participantErrors, setParticipantErrors] = useState<Record<string, string>>({});
  const [isSavingParticipant, setIsSavingParticipant] = useState<boolean>(false);

  // Full passenger list replacement modal state (PUT)
  const [isReplacingPassengers, setIsReplacingPassengers] = useState<boolean>(false);
  const [replaceDraft, setReplaceDraft] = useState<BookingPassengerRequest[]>([]);
  const [replaceErrors, setReplaceErrors] = useState<Record<string, string>>({});
  const [isSavingReplace, setIsSavingReplace] = useState<boolean>(false);

  // Cancel booking modal state (POST /cancel)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancellationResult, setCancellationResult] =
    useState<BookingCancellationResponse | null>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      const returnUrl = resolvedBookingId
        ? ROUTES.BOOKING.DETAIL(resolvedBookingId)
        : ROUTES.ACCOUNT.BOOKINGS;
      navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(returnUrl)}`, {
        replace: true,
      });
    }
  }, [isInitializing, isAuthenticated, resolvedBookingId]);

  const fetchBookingDetail = useCallback(
    async (silent = false) => {
      if (!resolvedBookingId || !isAuthenticated) {
        setIsLoading(false);
        return null;
      }

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);

      try {
        const data = await bookingsApi.getBookingDetail(resolvedBookingId);
        setBooking(data);

        // Set default payment purpose based on booking status and remaining balance
        if (data.status === 'PENDING_PAYMENT') {
          setSelectedPurpose('DEPOSIT');
        } else if (data.status === 'CONFIRMED' && data.price.remainingAmountVnd > 0) {
          setSelectedPurpose('BALANCE');
        }

        return data;
      } catch (err) {
        setLoadError(err as ApiError);
        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [resolvedBookingId, isAuthenticated]
  );

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      fetchBookingDetail(false);
    }
  }, [isInitializing, isAuthenticated, fetchBookingDetail]);

  // Bounded polling when user returns from PayOS checkout
  useEffect(() => {
    if (!isPaymentReturnRoute || !booking || !isAuthenticated) return;

    // Stop polling if booking is already in a terminal or confirmed state
    const shouldStop =
      (booking.status === 'CONFIRMED' &&
        (booking.price.paymentState === 'DEPOSIT_PAID' ||
          booking.price.paymentState === 'FULLY_PAID')) ||
      booking.status === 'EXPIRED' ||
      booking.status === 'CANCELLED' ||
      booking.price.paymentState === 'FULLY_PAID';

    if (shouldStop || isCancelledRedirect) {
      setIsPollingWebhook(false);
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
      return;
    }

    if (pollCount >= MAX_POLL_ATTEMPTS) {
      setIsPollingWebhook(false);
      return;
    }

    setIsPollingWebhook(true);
    pollTimerRef.current = window.setTimeout(async () => {
      await fetchBookingDetail(true);
      setPollCount((c) => c + 1);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [
    isPaymentReturnRoute,
    isCancelledRedirect,
    booking,
    isAuthenticated,
    pollCount,
    fetchBookingDetail,
  ]);

  // Live countdown timer for 15-minute holdExpiresAt when PENDING_PAYMENT
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT' || !booking.holdExpiresAt) {
      setRemainingHoldSeconds(null);
      return;
    }

    const updateTimer = () => {
      const expiresMs = new Date(booking.holdExpiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setRemainingHoldSeconds(diffSec);
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [booking]);

  const isHoldExpired =
    booking?.status === 'EXPIRED' ||
    (booking?.status === 'PENDING_PAYMENT' &&
      remainingHoldSeconds !== null &&
      remainingHoldSeconds <= 0);

  const isPaymentConfirmed = Boolean(
    booking &&
      ((booking.status === 'CONFIRMED' &&
        (booking.price.paymentState === 'DEPOSIT_PAID' || booking.price.paymentState === 'FULLY_PAID')) ||
        booking.price.paymentState === 'FULLY_PAID')
  );
  const canResumeHold = Boolean(
    booking && booking.status === 'PENDING_PAYMENT' &&
      new Date(booking.holdExpiresAt).getTime() > Date.now()
  );

  // A PayOS checkout cancellation returns to the deposit page while the hold is live,
  // otherwise it goes to the customer's booking list.
  useEffect(() => {
    if (!isCancelledRedirect || !booking || isPaymentConfirmed) return;
    const timer = window.setTimeout(() => {
      navigateTo(
        canResumeHold ? ROUTES.BOOKING.DETAIL(booking.id) : ROUTES.ACCOUNT.BOOKINGS,
        { replace: true }
      );
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isCancelledRedirect, booking, isPaymentConfirmed, canResumeHold]);

  const isBeforeStartsAt = React.useMemo(() => {
    if (!booking?.startsAt) return false;
    return new Date(booking.startsAt).getTime() > Date.now();
  }, [booking?.startsAt]);

  // Rule: PUT /api/v1/bookings/{bookingId}/passengers only when PENDING_PAYMENT, !priceLockedAt, and !isHoldExpired
  const canReplaceAllPassengers = Boolean(
    booking &&
      booking.status === 'PENDING_PAYMENT' &&
      !booking.priceLockedAt &&
      !isHoldExpired
  );

  // Rule: PATCH /api/v1/bookings/{bookingId}/passengers/{participantId} when PENDING_PAYMENT or CONFIRMED before startsAt
  const canEditIndividualParticipant = Boolean(
    booking &&
      (booking.status === 'PENDING_PAYMENT' || booking.status === 'CONFIRMED') &&
      isBeforeStartsAt
  );

  // Rule: POST /api/v1/bookings/{bookingId}/cancel when PENDING_PAYMENT or CONFIRMED
  const canCancelBooking = Boolean(
    booking && (booking.status === 'PENDING_PAYMENT' || booking.status === 'CONFIRMED')
  );

  // Rule: Can pay when (PENDING_PAYMENT and !isHoldExpired and remainingAmountVnd > 0) or (CONFIRMED and remainingAmountVnd > 0)
  const canInitiatePayment = Boolean(
    booking &&
      booking.price.remainingAmountVnd > 0 &&
      booking.price.paymentState !== 'FULLY_PAID' &&
      ((booking.status === 'PENDING_PAYMENT' && !isHoldExpired) ||
        booking.status === 'CONFIRMED')
  );

  const handleCreatePaymentLink = async () => {
    if (!booking || !canInitiatePayment) return;

    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      const res = await paymentsApi.createPaymentLink(booking.id, {
        provider: 'PAYOS',
        purpose: selectedPurpose,
      });
      setPaymentLink(res);

      // Save bookingId so return route /payment/result or /payment/cancel knows which booking to query
      try {
        sessionStorage.setItem(LAST_PAYMENT_BOOKING_KEY, String(booking.id));
      } catch {
        // ignore
      }

      toast.info('Đã tạo liên kết thanh toán. Đang chuyển hướng...');
      window.setTimeout(() => {
        window.location.assign(res.checkoutUrl);
      }, 900);
    } catch (err) {
      const apiErr = err as ApiError;
      setPaymentError(apiErr);
      toast.error(apiErr.message || 'Không thể khởi tạo thanh toán trực tuyến.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleStartEditParticipant = (p: BookingPassengerResponse) => {
    setEditingParticipantId(p.id);
    setParticipantErrors({});
    setParticipantDraft({
      fullName: p.fullName,
      phone: p.phone || '',
      email: p.email || '',
    });
  };

  const handleSaveParticipant = async (participantId: number) => {
    if (!booking) return;
    const validation = validatePassengers([{ ...participantDraft, bookingCustomer: false }]);
    if (Object.keys(validation).length > 0) {
      setParticipantErrors({
        fullName: validation['passengers[0].fullName'],
        phone: validation['passengers[0].phone'],
        email: validation['passengers[0].email'],
      });
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setParticipantErrors({});

    setIsSavingParticipant(true);
    try {
      const updated = await bookingsApi.updatePassenger(booking.id, participantId, {
        fullName: participantDraft.fullName.trim(),
        phone: participantDraft.phone.trim(),
        email: participantDraft.email.trim(),
      });
      setBooking(updated);
      setEditingParticipantId(null);
      toast.success('Đã cập nhật thông tin hành khách.');
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || 'Không thể cập nhật thông tin hành khách.');
    } finally {
      setIsSavingParticipant(false);
    }
  };

  const handleOpenReplacePassengers = () => {
    if (!booking) return;
    setReplaceDraft(
      booking.passengers.map((p) => ({
        fullName: p.fullName,
        phone: p.phone || '',
        email: p.email || '',
        bookingCustomer: p.bookingCustomer,
      }))
    );
    setReplaceErrors({});
    setIsReplacingPassengers(true);
  };

  const handleSaveReplacePassengers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    const errors = validatePassengers(replaceDraft);
    if (Object.keys(errors).length > 0) {
      setReplaceErrors(errors);
      return;
    }

    setIsSavingReplace(true);
    try {
      const updated = await bookingsApi.replacePassengers(booking.id, {
        passengers: replaceDraft.map((p) => ({
          fullName: p.fullName.trim(),
          phone: (p.phone || '').trim(),
          email: (p.email || '').trim(),
          bookingCustomer: Boolean(p.bookingCustomer),
        })),
      });
      setBooking(updated);
      setIsReplacingPassengers(false);
      toast.success('Đã cập nhật danh sách đoàn và tính lại chi phí.');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) setReplaceErrors(apiErr.fieldErrors);
      toast.error(apiErr.message || 'Không thể thay đổi danh sách hành khách.');
    } finally {
      setIsSavingReplace(false);
    }
  };

  const handleConfirmCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsCancelling(true);
    try {
      const res = await bookingsApi.cancelBooking(booking.id, {
        reason: cancelReason.trim() || 'Khách hàng yêu cầu hủy đặt chỗ',
      });
      setCancellationResult(res);
      setIsCancelModalOpen(false);
      toast.info('Đặt chỗ đã được hủy thành công.');
      await fetchBookingDetail(true);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || 'Không thể hủy đặt chỗ lúc này.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-14 bg-stone-200/70 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-48 bg-stone-200/70 rounded-2xl" />
              <div className="h-64 bg-stone-200/70 rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-stone-200/70 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friendly 404 or missing booking state
  if (!resolvedBookingId || loadError?.status === 404 || loadError?.status === 403) {
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
            Không tìm thấy đặt chỗ
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            Mã đặt chỗ không tồn tại hoặc không thuộc tài khoản đang đăng nhập của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Về Đặt chỗ của tôi
            </button>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Khám phá tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
            Không thể tải thông tin đặt chỗ
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            {loadError?.message || 'Đã có lỗi mạng xảy ra khi kết nối đến máy chủ.'}
          </p>
          <button
            type="button"
            onClick={() => fetchBookingDetail(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  const depositRequiredVnd =
    booking.price.depositAmountVnd ||
    Math.round((booking.price.totalPriceVnd * booking.price.depositPercent) / 100);

  if (isPaymentReturnRoute) {
    return (
      <PaymentCallbackScreen
        booking={booking}
        isCancelledRedirect={isCancelledRedirect}
        isPaymentConfirmed={isPaymentConfirmed}
        isPollingWebhook={isPollingWebhook}
        hasTimedOut={!isPollingWebhook && !isCancelledRedirect && !isPaymentConfirmed && pollCount >= MAX_POLL_ATTEMPTS}
        canResumeHold={canResumeHold}
        onCheckStatus={() => {
          setPollCount(0);
          fetchBookingDetail(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-[#1F4E43] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tất cả đặt chỗ của tôi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPollCount(0);
              fetchBookingDetail(true);
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1F4E43]' : ''}`} />
            <span>Kiểm tra trạng thái</span>
          </button>
        </div>

        {/* Stepper (Step 3: Thanh toán & Xác nhận) */}
        <div className="mb-8">
          <BookingStepper currentStep={3} />
        </div>

        {/* Webhook Verification Banner when returning from PayOS */}
        {isPaymentReturnRoute && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isCancelledRedirect
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : booking.status === 'CONFIRMED' || booking.price.paymentState === 'FULLY_PAID'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-[#1F4E43]/8 border-[#1F4E43]/25 text-[#1C2526]'
            }`}
          >
            <div className="flex items-start gap-3">
              {isCancelledRedirect ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : booking.status === 'CONFIRMED' || booking.price.paymentState === 'FULLY_PAID' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2
                  className={`w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5 ${
                    isPollingWebhook ? 'animate-spin' : ''
                  }`}
                />
              )}
              <div className="text-xs sm:text-sm">
                {isCancelledRedirect ? (
                  <>
                    <p className="font-bold">Bạn đã rời trang thanh toán trực tuyến</p>
                    <p className="text-xs mt-1">
                      Nếu vẫn còn thời gian giữ chỗ, bạn có thể tạo lại liên kết thanh toán bên dưới.
                    </p>
                  </>
                ) : booking.status === 'CONFIRMED' || booking.price.paymentState === 'FULLY_PAID' ? (
                  <>
                    <p className="font-bold">
                      Hệ thống đã xác nhận thanh toán từ máy chủ!
                    </p>
                    <p className="text-xs mt-1">
                      Đặt chỗ <strong>#{booking.bookingCode}</strong> đã được xác nhận giữ chỗ chính thức.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#1F4E43]">
                      Đang đồng bộ trạng thái xác nhận thanh toán...
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Hệ thống chỉ xác nhận giữ chỗ dựa trên dữ liệu máy chủ sau khi nhận thông báo thanh toán thành công. Vui lòng đợi trong giây lát hoặc bấm <strong>"Kiểm tra trạng thái"</strong>.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPollCount(0);
                fetchBookingDetail(true);
              }}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Kiểm tra trạng thái</span>
            </button>
          </div>
        )}

        {/* Hold Countdown Banner when PENDING_PAYMENT */}
        {booking.status === 'PENDING_PAYMENT' && !isHoldExpired && remainingHoldSeconds !== null && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  Đang giữ chỗ tạm thời (15 phút) — Vui lòng hoàn tất đặt cọc
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Hạn giữ chỗ đến <strong>{formatDateTime(booking.holdExpiresAt)}</strong>. Sau khi nhận đủ tiền cọc ({booking.price.depositPercent}%), đặt chỗ sẽ chuyển sang trạng thái <strong>Đã xác nhận</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-300 shrink-0">
              <span className="text-xs text-amber-800 font-medium">Còn lại:</span>
              <span className="font-mono text-lg font-bold text-[#C2410C]">
                {formatCountdown(remainingHoldSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Hold Expired Alert */}
        {isHoldExpired && (
          <div
            role="alert"
            className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-rose-950">
                  Đặt chỗ đã hết thời gian giữ chỗ 15 phút
                </h2>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Vui lòng không tiếp tục thanh toán bằng liên kết cũ đã hết hạn. Bạn có thể quay lại trang tour để kiểm tra chỗ trống và tạo đặt chỗ mới.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(booking.tourId))}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              Đặt lại trên trang Tour
            </button>
          </div>
        )}

        {/* Cancellation Result Notice */}
        {(cancellationResult ||
          booking.status === 'CANCELLED' ||
          booking.status === 'EXPIRED') && (
          <div className="mb-6 rounded-2xl bg-stone-100 border border-stone-300 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <PhoneCall className="w-4 h-4 text-[#1F4E43]" />
              <span>Thông tin đối soát & hỗ trợ hoàn tiền</span>
            </div>
            {cancellationResult && (
              <p className="text-xs text-stone-700">
                Trạng thái hoàn tiền:{' '}
                <strong>
                  {cancellationResult.refundRequired
                    ? 'Cần đối soát hoàn tiền theo chính sách'
                    : 'Không phát sinh hoàn tiền'}
                </strong>{' '}
                • Số tiền đã ghi nhận: <strong>{formatVND(cancellationResult.paidAmountVnd)}</strong>.
              </p>
            )}
            <p className="text-xs text-stone-600 leading-relaxed">
              Nếu giao dịch thanh toán được thực hiện sau khi đặt chỗ đã bị hủy hoặc hết hạn giữ chỗ, hoặc cần đối soát hoàn tiền, vui lòng liên hệ bộ phận điều phối WeTrek kèm mã đặt chỗ{' '}
              <strong className="font-mono">#{booking.bookingCode}</strong> để được kiểm tra và xử lý chính thức.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Booking Details & Passengers */}
          <div className="lg:col-span-8 space-y-6">
            {/* Booking Header Card */}
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
                    <span>MÃ ĐẶT CHỖ:</span>
                    <span className="font-bold text-[#1C2526] bg-stone-100 px-2 py-0.5 rounded">
                      #{booking.bookingCode}
                    </span>
                  </div>
                  <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                    {booking.tourTitle || `Tour Trekking #${booking.tourId}`}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge bookingStatus={booking.status} />
                  <StatusBadge paymentState={booking.price.paymentState} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Khởi hành (Giờ VN)</p>
                    <p className="font-semibold text-stone-900">
                      {formatDateTime(booking.startsAt)}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Kết thúc: {formatDate(booking.endsAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Điểm tập trung</p>
                    <p className="font-semibold text-stone-900">
                      {booking.meetingPoint || 'Theo thông báo của đoàn'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Hạn thanh toán phần còn lại</p>
                    <p className="font-semibold text-stone-900">
                      {booking.balanceDueAt
                        ? formatDateTime(booking.balanceDueAt)
                        : 'Trước ngày khởi hành'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Trang bị: {booking.equipmentChoice === 'TOUR_PACKAGE' || booking.price.equipmentFeeVnd > 0 ? 'Thuê trang bị từ tour' : 'Tự chuẩn bị trang bị cá nhân'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Snapshot Section */}
            {(() => {
              const snapshot = booking.equipmentSnapshot;
              const isTourPackage =
                booking.equipmentChoice === 'TOUR_PACKAGE' || booking.price.equipmentFeeVnd > 0;
              const packages = Array.isArray(snapshot?.packages) ? snapshot.packages : [];
              const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
              const singlePackageTitle = snapshot?.title;
              const singlePackageQty = snapshot?.packageQuantity || 1;
              const singlePackagePrice = snapshot?.unitPriceVnd || 0;

              if (isTourPackage) {
                return (
                  <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Backpack className="w-5 h-5 text-[#1F4E43]" />
                        <h2 className="text-base font-bold text-[#1C2526]">
                          Trang thiết bị & Dịch vụ thuê kèm
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#1F4E43]">
                        Tổng phí: {formatVND(booking.price.equipmentFeeVnd)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {packages.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                            Gói combo đã đăng ký
                          </h3>
                          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden text-xs">
                            {packages.map((pkg: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="font-semibold text-stone-900">[Combo] {pkg.title}</span>
                                  {Array.isArray(pkg.components) && pkg.components.length > 0 && (
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                      Thành phần: {pkg.components.map((c: any) => `${c.name} × ${c.quantityInPackage || 1}`).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <div className="font-mono text-stone-700 shrink-0 sm:text-right">
                                  <span>{pkg.quantity} combo × {formatVND(pkg.unitPriceVnd || 0)} = </span>
                                  <strong className="text-[#1F4E43] font-bold">
                                    {formatVND((pkg.quantity || 1) * (pkg.unitPriceVnd || 0))}
                                  </strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {packages.length === 0 && singlePackageTitle && (
                        <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex justify-between text-xs">
                          <div>
                            <span className="font-semibold text-stone-900">[Combo] {singlePackageTitle}</span>
                          </div>
                          <div className="font-mono text-stone-700">
                            <span>{singlePackageQty} combo × {formatVND(singlePackagePrice)} = </span>
                            <strong className="text-[#1F4E43] font-bold">
                              {formatVND(singlePackageQty * singlePackagePrice)}
                            </strong>
                          </div>
                        </div>
                      )}

                      {items.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                            Thiết bị thuê lẻ
                          </h3>
                          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden text-xs">
                            {items.map((item: any, idx: number) => {
                              const qty = item.selectedQuantity || item.quantity || 1;
                              const price = item.unitPriceVnd || 0;
                              return (
                                <div
                                  key={idx}
                                  className="p-3 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <span className="font-semibold text-stone-900">[Thiết bị lẻ] {item.name}</span>
                                  <div className="font-mono text-stone-700 shrink-0 sm:text-right">
                                    <span>{qty} món × {formatVND(price)} = </span>
                                    <strong className="text-[#1F4E43] font-bold">
                                      {formatVND(qty * price)}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {packages.length === 0 && items.length === 0 && !singlePackageTitle && (
                        <p className="text-xs text-stone-600">
                          Đã đăng ký thuê thiết bị từ đơn vị tổ chức. Chi phí thiết bị:{' '}
                          <strong className="font-mono text-[#1F4E43]">
                            {formatVND(booking.price.equipmentFeeVnd)}
                          </strong>.
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-xs flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Backpack className="w-4 h-4 text-[#1F4E43]" />
                    <div>
                      <span className="font-semibold text-stone-900 block">Trang bị cá nhân: Tự chuẩn bị</span>
                      <span className="text-stone-500">Đoàn tự chuẩn bị đồ dùng cá nhân theo danh mục khuyến nghị.</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-stone-600 shrink-0">0 ₫</span>
                </div>
              );
            })()}

            {/* Payment Section (PayOS) */}
            {canInitiatePayment && (
              <div className="bg-white rounded-2xl border-2 border-[#1F4E43] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-[#1F4E43]" />
                    <div>
                      <h2 className="text-base font-bold text-[#1C2526]">
                        Thanh toán trực tuyến
                      </h2>
                      <p className="text-xs text-stone-500">
                        Hỗ trợ quét mã VietQR ngân hàng nội địa — Tự động xác nhận giao dịch
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#1F4E43]/10 text-[#1F4E43]">
                    VIETQR
                  </span>
                </div>

                {/* Purpose Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {booking.status === 'PENDING_PAYMENT' && (
                    <label
                      className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedPurpose === 'DEPOSIT'
                          ? 'border-[#1F4E43] bg-[#1F4E43]/5 ring-1 ring-[#1F4E43]'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPurpose"
                        value="DEPOSIT"
                        checked={selectedPurpose === 'DEPOSIT'}
                        onChange={() => setSelectedPurpose('DEPOSIT')}
                        className="mt-1 text-[#1F4E43] focus:ring-[#1F4E43]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-stone-900">
                            Đặt cọc giữ chỗ ({booking.price.depositPercent}%)
                          </span>
                          <span className="font-mono text-sm font-bold text-[#1F4E43]">
                            {formatVND(depositRequiredVnd)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Xác nhận giữ chỗ ngay lập tức. Phần còn lại thanh toán trước ngày đi.
                        </p>
                      </div>
                    </label>
                  )}

                  {booking.status === 'CONFIRMED' && booking.price.remainingAmountVnd > 0 && (
                    <label
                      className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedPurpose === 'BALANCE'
                          ? 'border-[#1F4E43] bg-[#1F4E43]/5 ring-1 ring-[#1F4E43]'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPurpose"
                        value="BALANCE"
                        checked={selectedPurpose === 'BALANCE'}
                        onChange={() => setSelectedPurpose('BALANCE')}
                        className="mt-1 text-[#1F4E43] focus:ring-[#1F4E43]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-stone-900">
                            Tất toán số dư còn lại (BALANCE)
                          </span>
                          <span className="font-mono text-sm font-bold text-[#1F4E43]">
                            {formatVND(booking.price.remainingAmountVnd)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Thanh toán phần chi phí còn lại của đặt chỗ đã xác nhận.
                        </p>
                      </div>
                    </label>
                  )}

                  <label
                    className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                      selectedPurpose === 'FULL'
                        ? 'border-[#1F4E43] bg-[#1F4E43]/5 ring-1 ring-[#1F4E43]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPurpose"
                      value="FULL"
                      checked={selectedPurpose === 'FULL'}
                      onChange={() => setSelectedPurpose('FULL')}
                      className="mt-1 text-[#1F4E43] focus:ring-[#1F4E43]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-900">
                          Thanh toán toàn bộ
                        </span>
                        <span className="font-mono text-sm font-bold text-[#1F4E43]">
                          {formatVND(booking.price.remainingAmountVnd)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Thanh toán 100% số tiền cần trả trong một lần duy nhất.
                      </p>
                    </div>
                  </label>
                </div>

                {paymentError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                    <p className="font-semibold">{paymentError.message}</p>
                    {paymentError.code && (
                      <p className="font-mono text-[11px] text-rose-600 mt-0.5">
                        Mã lỗi: {paymentError.code}
                      </p>
                    )}
                  </div>
                )}

                {paymentLink && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Đã tạo liên kết thanh toán trực tuyến</span>
                      <span className="font-mono font-bold text-sm text-emerald-800">
                        {formatVND(paymentLink.amountVnd)}
                      </span>
                    </div>
                    <p className="text-emerald-800">
                      Mã tham chiếu: <span className="font-mono">{paymentLink.merchantReference}</span>
                      {paymentLink.expiresAt && (
                        <> • Hạn liên kết: {formatDateTime(paymentLink.expiresAt)}</>
                      )}
                    </p>
                    <a
                      href={paymentLink.checkoutUrl}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1F4E43] underline mt-1"
                    >
                      <span>Nhấn vào đây nếu trình duyệt không tự động chuyển hướng</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCreatePaymentLink}
                    disabled={isCreatingPayment}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#C2410C] hover:bg-[#9B2F00] disabled:bg-stone-300 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kết nối cổng thanh toán...</span>
                      </>
                    ) : (
                      <>
                        <span>Tiến hành thanh toán</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Passengers List & Edit Section */}
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1F4E43]" />
                  <div>
                    <h2 className="text-base font-bold text-[#1C2526]">
                      Danh sách hành khách ({booking.passengers.length} người)
                    </h2>
                    <p className="text-xs text-stone-500">
                      {canEditIndividualParticipant
                        ? 'Bạn có thể cập nhật thông tin liên hệ của từng thành viên trước giờ khởi hành.'
                        : 'Danh sách hành khách đã chốt cho chuyến đi.'}
                    </p>
                  </div>
                </div>

                {canReplaceAllPassengers && !isReplacingPassengers && (
                  <button
                    type="button"
                    onClick={handleOpenReplacePassengers}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1F4E43]/30 text-[#1F4E43] hover:bg-[#1F4E43]/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Thay đổi số lượng / danh sách khách</span>
                  </button>
                )}
              </div>

              {isReplacingPassengers ? (
                <form onSubmit={handleSaveReplacePassengers} className="space-y-4 pt-2">
                  <PassengerForm
                    passengers={replaceDraft}
                    onChange={setReplaceDraft}
                    maxSeats={100}
                    fieldErrors={replaceErrors}
                    disabled={isSavingReplace}
                  />
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setIsReplacingPassengers(false)}
                      disabled={isSavingReplace}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingReplace}
                      className="px-5 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSavingReplace ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Lưu danh sách mới</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
                  {booking.passengers.map((p, idx) => {
                    const isEditingThis = editingParticipantId === p.id;
                    return (
                      <div key={p.id || idx} className="p-4 bg-white">
                        {isEditingThis ? (
                          <form noValidate onSubmit={(event) => { event.preventDefault(); handleSaveParticipant(p.id); }} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1F4E43]">
                                Chỉnh sửa hành khách #{idx + 1}
                              </span>
                            </div>
                            <TravelerFields
                              idPrefix={`booking-${booking.id}-participant-${p.id}`}
                              value={participantDraft}
                              errors={participantErrors}
                              onChange={(field, value) => { setParticipantDraft((draft) => ({ ...draft, [field]: value })); setParticipantErrors({}); }}
                              disabled={isSavingParticipant}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingParticipantId(null)}
                                disabled={isSavingParticipant}
                                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingParticipant}
                                className="px-3.5 py-1.5 rounded-lg bg-[#1F4E43] hover:bg-[#163830] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {isSavingParticipant ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Lưu</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-stone-900">
                                  {idx + 1}. {p.fullName}
                                </span>
                                {p.bookingCustomer && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1F4E43]/10 text-[#1F4E43]">
                                    Người đặt chỗ
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5">
                                SĐT: {p.phone || '—'} • Email: {p.email || '—'}
                              </p>
                            </div>

                            {canEditIndividualParticipant && (
                              <button
                                type="button"
                                onClick={() => handleStartEditParticipant(p)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C] hover:underline self-start sm:self-center cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sửa thông tin</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cancel Booking Action Card */}
            {canCancelBooking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Hủy đặt chỗ này?</h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Chỉ hỗ trợ hủy khi đặt chỗ đang ở trạng thái Chờ thanh toán hoặc Đã xác nhận.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  Yêu cầu hủy đặt chỗ
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Price Breakdown */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <PriceSummary
              participantCount={booking.price.participantCount || booking.passengers.length}
              basePriceVnd={booking.price.basePriceVnd}
              depositPercent={booking.price.depositPercent}
              serverPrice={booking.price}
            />
          </div>
        </div>
      </div>

      <CancelBookingDialog
        isOpen={isCancelModalOpen}
        bookingCode={booking.bookingCode}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onClose={() => setIsCancelModalOpen(false)}
        onSubmit={handleConfirmCancelBooking}
        isSubmitting={isCancelling}
      />
    </div>
  );
};

export default BookingDetailPage;
