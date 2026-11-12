import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';
import { toursApi } from '../../api/tours.api';
import type {
  ScheduleSummaryResponse,
  ScheduleDetailResponse,
  ScheduleAvailabilityResponse,
} from '../../types/tour.types';
import { useAuth } from '../../../../stores/auth.store';
import { navigateTo } from '../../../../lib/navigation';
import { ROUTES } from '../../../../constants/routes';
import { formatVND, formatDate, formatTimeOnly } from '../../../../lib/utils';
import { toast } from '../../../../components/ui/Toast';
import { TourScheduleCalendarPicker } from './TourScheduleCalendarPicker';
import { bookingsApi } from '../../../bookings/api/bookings.api';
import type { BookingSummaryResponse } from '../../../bookings/types/booking.types';
import { ActiveHoldModal, HoldCountdownTimer } from '../../../bookings/components/ActiveHoldModal';

interface TourBookingFrameProps {
  tourId: number;
  tourTitle: string;
  durationDays: number;
}

export const TourBookingFrame: React.FC<TourBookingFrameProps> = ({
  tourId,
  tourTitle,
  durationDays,
}) => {
  const { account, isAuthenticated, setBookingIntent } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSummaryResponse[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Cache detail and availability per schedule ID
  const [scheduleDetails, setScheduleDetails] = useState<Record<number, ScheduleDetailResponse>>({});
  const [availabilityData, setAvailabilityData] = useState<Record<number, ScheduleAvailabilityResponse>>({});
  const [availabilityErrors, setAvailabilityErrors] = useState<
    Record<number, { is403: boolean; message: string }>
  >({});
  const [loadingAvailability, setLoadingAvailability] = useState<Record<number, boolean>>({});

  // Pagination for schedules
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Guest count state
  const [guestCount, setGuestCount] = useState<number>(1);

  // Active holds state
  const [activeHolds, setActiveHolds] = useState<BookingSummaryResponse[]>([]);
  const [isVerifyingHold, setIsVerifyingHold] = useState<boolean>(false);
  const [showHoldModal, setShowHoldModal] = useState<boolean>(false);

  // Last error from the booking CTA, shown inline above the button (toasts disappear too fast)
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchActiveHoldsSilently = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveHolds([]);
      return;
    }
    try {
      const holds = await bookingsApi.getActiveHolds();
      setActiveHolds(holds || []);
    } catch {
      // Passive check ignored
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveHoldsSilently();
  }, [fetchActiveHoldsSilently]);

  // Load upcoming schedules
  const fetchSchedules = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingSchedules(true);
        setSchedulesError(null);
      }

      try {
        const res = await toursApi.getTourSchedules(tourId, {
          page: targetPage,
          size: 100,
          upcomingOnly: true,
        });

        const newItems = res.content || [];
        setTotalPages(res.totalPages || 1);
        setPage(targetPage);

        setSchedules((prev) => {
          const merged = append ? [...prev, ...newItems] : newItems;
          // Auto select first schedule if none selected
          if (!selectedScheduleId && merged.length > 0) {
            setSelectedScheduleId(merged[0].id);
          }
          return merged;
        });
      } catch (err: any) {
        setSchedulesError(
          err?.message || 'Không thể tải danh sách lịch khởi hành. Vui lòng thử lại.'
        );
      } finally {
        setIsLoadingSchedules(false);
        setIsLoadingMore(false);
      }
    },
    [tourId, selectedScheduleId]
  );

  useEffect(() => {
    fetchSchedules(0, false);
  }, [fetchSchedules]);

  // Load schedule detail & availability whenever selectedScheduleId changes
  const loadScheduleInfo = useCallback(
    async (sId: number) => {
      // 1. Load Detail if not cached
      if (!scheduleDetails[sId]) {
        try {
          const detail = await toursApi.getScheduleDetail(tourId, sId);
          setScheduleDetails((prev) => ({ ...prev, [sId]: detail }));
        } catch {
          // Keep summary if detail fails
        }
      }

      // 2. Load Availability if authenticated
      if (isAuthenticated && !availabilityData[sId]) {
        setLoadingAvailability((prev) => ({ ...prev, [sId]: true }));
        setAvailabilityErrors((prev) => {
          const clone = { ...prev };
          delete clone[sId];
          return clone;
        });

        try {
          const avail = await toursApi.getScheduleAvailability(sId);
          setAvailabilityData((prev) => ({ ...prev, [sId]: avail }));
        } catch (err: any) {
          const is403 = err?.response?.status === 403 || err?.status === 403;
          const msg = is403
            ? 'Tài khoản của bạn không có quyền đặt tour (yêu cầu vai trò Khách hàng / CUSTOMER).'
            : err?.message || 'Không thể kiểm tra tình trạng chỗ trống lúc này.';

          setAvailabilityErrors((prev) => ({
            ...prev,
            [sId]: { is403, message: msg },
          }));
        } finally {
          setLoadingAvailability((prev) => ({ ...prev, [sId]: false }));
        }
      }
    },
    [tourId, isAuthenticated, scheduleDetails, availabilityData]
  );

  useEffect(() => {
    if (selectedScheduleId) {
      loadScheduleInfo(selectedScheduleId);
    }
  }, [selectedScheduleId, loadScheduleInfo]);

  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId) || null;
  }, [schedules, selectedScheduleId]);

  const activeDetail = selectedScheduleId ? scheduleDetails[selectedScheduleId] : null;
  const activeAvailability = selectedScheduleId ? availabilityData[selectedScheduleId] : null;
  const activeAvailabilityError = selectedScheduleId ? availabilityErrors[selectedScheduleId] : null;
  const isCheckingAvailability = selectedScheduleId ? !!loadingAvailability[selectedScheduleId] : false;

  // bookable=false does not always mean sold out: the backend also closes booking when the schedule
  // has started/closed or the tour has no effective cancellation policy.
  const isSoldOut = Boolean(activeAvailability && activeAvailability.availableSeats <= 0);
  const isClosed = Boolean(activeAvailability && !activeAvailability.bookable);
  const unavailableReason = !activeAvailability || !isClosed
    ? null
    : isSoldOut
    ? 'Lịch khởi hành này đã hết chỗ. Vui lòng chọn ngày khác.'
    : `Lịch này còn ${activeAvailability.availableSeats} chỗ nhưng chưa mở nhận đặt. Tour có thể chưa áp dụng chính sách huỷ hoặc lịch đã đóng đặt chỗ. Vui lòng chọn ngày khác hoặc liên hệ ban tổ chức.`;
  const inlineError = unavailableReason ?? bookingError;

  useEffect(() => {
    setBookingError(null);
  }, [selectedScheduleId, guestCount]);

  // Max selectable guests
  const maxSeats = useMemo(() => {
    if (activeAvailability && activeAvailability.availableSeats !== undefined) {
      return Math.max(1, activeAvailability.availableSeats);
    }
    return 10;
  }, [activeAvailability]);

  // Clamp guest count if exceeds availableSeats
  useEffect(() => {
    if (activeAvailability && activeAvailability.availableSeats !== undefined) {
      if (activeAvailability.availableSeats > 0 && guestCount > activeAvailability.availableSeats) {
        setGuestCount(activeAvailability.availableSeats);
      }
    }
  }, [activeAvailability, guestCount]);

  // Financial calculations
  const unitPrice = activeDetail?.basePriceVnd ?? activeSchedule?.basePriceVnd ?? 0;
  const totalPrice = unitPrice * guestCount;
  const depositPercent = activeDetail?.depositPercent; // Real percent from API, NO default fallback!
  const depositAmount =
    depositPercent !== undefined && depositPercent !== null && depositPercent > 0
      ? Math.round((totalPrice * Number(depositPercent)) / 100)
      : null;

  const handleGuestChange = (delta: number) => {
    setGuestCount((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxSeats) return maxSeats;
      return next;
    });
  };

  const failBooking = (message: string) => {
    setBookingError(message);
    toast.error(message);
  };

  const handleProceedBooking = async () => {
    setBookingError(null);
    if (!activeSchedule) {
      failBooking('Vui lòng chọn một lịch khởi hành phù hợp.');
      return;
    }

    const targetPath = `${ROUTES.BOOKING.NEW}?tourId=${tourId}&scheduleId=${activeSchedule.id}&guestCount=${guestCount}`;

    setBookingIntent({
      tourId,
      scheduleId: activeSchedule.id,
      tourTitle,
      startsAt: activeSchedule.startsAt,
      endsAt: activeSchedule.endsAt,
      basePriceVnd: unitPrice,
      depositPercent: depositPercent ? Number(depositPercent) : undefined,
      availableSeats: activeAvailability?.availableSeats,
      guestCount,
      returnPath: targetPath,
    });

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt lịch khởi hành đã chọn.');
      navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(targetPath)}`);
      return;
    }

    if (activeAvailabilityError?.is403) {
      failBooking(activeAvailabilityError.message);
      return;
    }

    if (unavailableReason) {
      failBooking(unavailableReason);
      return;
    }

    // Check active holds before initiating booking
    setIsVerifyingHold(true);
    try {
      const freshHolds = await bookingsApi.getActiveHolds();
      setActiveHolds(freshHolds || []);
      if (freshHolds && freshHolds.length > 0) {
        setShowHoldModal(true);
        return;
      }
    } catch (err: any) {
      failBooking(err?.message || 'Không thể kiểm tra trạng thái giữ chỗ. Vui lòng thử lại.');
      return;
    } finally {
      setIsVerifyingHold(false);
    }

    navigateTo(targetPath);
  };

  return (
    <div
      id="khung-dat-tour"
      className="bg-white border border-[#E6E1D8] rounded-3xl p-5 sm:p-6 shadow-md space-y-6"
    >
      {/* Price Header */}
      <div className="pb-4 border-b border-[#E6E1D8]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Giá từ
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#C2410C]">
            {activeSchedule ? formatVND(unitPrice) : isLoadingSchedules ? 'Đang tải giá...' : 'Chưa có giá'}
          </span>
          {activeSchedule && <span className="text-xs sm:text-sm text-[#78716C]">/ khách</span>}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-[#1F4E43]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Cam kết giữ giá & giữ chỗ 15 phút khi tạo đơn</span>
        </div>
      </div>

      {/* Active Hold Reminder on Tour Detail */}
      {activeHolds.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock className="w-4 h-4 text-[#C2410C]" />
              <span>Bạn đang có đơn giữ chỗ chờ thanh toán</span>
            </div>
            <HoldCountdownTimer expiresAt={activeHolds[0].holdExpiresAt} />
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Đơn <strong>#{activeHolds[0].bookingCode}</strong> ({activeHolds[0].tourTitle}). Mỗi tài khoản chỉ được giữ chỗ 1 đơn tại một thời điểm.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.BOOKING.DETAIL(activeHolds[0].id))}
            className="w-full py-2.5 px-3 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Tiếp tục thanh toán #{activeHolds[0].bookingCode}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Schedules Selection Section: Calendar Dropdown matching reference */}
      <div className="space-y-3">
        <TourScheduleCalendarPicker
          schedules={schedules}
          selectedScheduleId={selectedScheduleId}
          onSelectSchedule={(id) => setSelectedScheduleId(id)}
          isLoading={isLoadingSchedules}
        />

        {/* Loading schedules */}
        {isLoadingSchedules && (
          <div className="py-2 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Đang tra cứu các ngày khởi hành thực tế từ hệ thống...</span>
          </div>
        )}

        {/* Error fetching schedules */}
        {schedulesError && !isLoadingSchedules && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2">
            <p className="text-xs text-red-700">{schedulesError}</p>
            <button
              type="button"
              onClick={() => fetchSchedules(0, false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 text-white cursor-pointer hover:bg-red-800"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Empty schedules */}
        {!isLoadingSchedules && !schedulesError && schedules.length === 0 && (
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D8] text-center space-y-2">
            <Calendar className="w-8 h-8 text-[#A8A29E] mx-auto" />
            <p className="text-xs sm:text-sm font-medium text-[#1C2526]">
              Hiện chưa có lịch khởi hành sắp tới
            </p>
            <p className="text-xs text-[#78716C]">
              Vui lòng theo dõi hoặc liên hệ ban tổ chức để nhận lịch mở đoàn mới nhất.
            </p>
          </div>
        )}
      </div>

      {/* Selected Schedule Status & Availability Info */}
      {activeSchedule && (
        <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
            <Clock className="h-3.5 w-3.5 text-[#1F4E43]" />
            <span>Giờ khởi hành: {formatTimeOnly(activeSchedule.startsAt)}</span>
            <span>· Kết thúc: {formatDate(activeSchedule.endsAt)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1C2526]">Tình trạng chỗ trống:</span>
            {isCheckingAvailability ? (
              <span className="inline-flex items-center gap-1 text-[#64748B]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Đang kiểm tra...</span>
              </span>
            ) : activeAvailability ? (
              activeAvailability.bookable && activeAvailability.availableSeats > 0 ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Còn {activeAvailability.availableSeats} chỗ</span>
                </span>
              ) : !isSoldOut ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                  <span>Chưa mở đặt</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <AlertCircle className="w-3 h-3" />
                  <span>Hết chỗ</span>
                </span>
              )
            ) : !isAuthenticated ? (
              <span className="text-[#64748B] italic">Đăng nhập để xem số chỗ còn</span>
            ) : activeAvailabilityError ? (
              <span className="text-rose-600 text-[11px] font-medium">Lỗi kết nối</span>
            ) : (
              <span className="text-[#64748B]">Chưa cập nhật</span>
            )}
          </div>

          {/* Availability error & Retry button (Never convert error into "Hết chỗ") */}
          {activeAvailabilityError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span>{activeAvailabilityError.message}</span>
              </div>
              {!activeAvailabilityError.is403 && (
                <button
                  type="button"
                  onClick={() => loadScheduleInfo(activeSchedule.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F4E43] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Thử kiểm tra lại</span>
                </button>
              )}
            </div>
          )}

          {/* Meeting Point & Phone from Schedule Detail if available */}
          {activeDetail && (activeDetail.meetingPoint || activeDetail.contactPhone) && (
            <div className="pt-2 border-t border-[#E6E1D8]/80 space-y-1.5 text-xs text-[#64748B]">
              {activeDetail.meetingPoint && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1F4E43] shrink-0 mt-0.5" />
                  <span>Điểm hẹn: {activeDetail.meetingPoint}</span>
                </div>
              )}
              {activeDetail.contactPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#1F4E43] shrink-0" />
                  <span>Hotline đoàn: {activeDetail.contactPhone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Guest Stepper */}
      {activeSchedule && <>
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-bold text-[#1C2526] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1F4E43]" />
            <span>Số lượng khách</span>
          </span>
          <span className="text-xs font-normal text-[#64748B]">
            Tối đa: {maxSeats} khách
          </span>
        </label>

        <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] p-1.5">
          <button
            type="button"
            onClick={() => handleGuestChange(-1)}
            disabled={guestCount <= 1}
            className="w-9 h-9 rounded-lg bg-white border border-[#E6E1D8] text-[#1C2526] font-bold flex items-center justify-center hover:bg-[#F7F4EE] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Giảm 1 khách"
          >
            -
          </button>
          <div className="min-w-14 text-center font-mono font-bold text-sm text-[#1C2526]">
            {guestCount} <span className="text-xs font-sans font-normal text-[#64748B]">người</span>
          </div>
          <button
            type="button"
            onClick={() => handleGuestChange(1)}
            disabled={guestCount >= maxSeats}
            className="w-9 h-9 rounded-lg bg-white border border-[#E6E1D8] text-[#1C2526] font-bold flex items-center justify-center hover:bg-[#F7F4EE] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tăng 1 khách"
          >
            +
          </button>
        </div>
      </div>

      {/* Real Price Breakdown (NO fake 30% default fallback!) */}
      <div className="border-t border-[#E6E1D8] pt-4 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center justify-between text-[#64748B]">
          <span>Tổng giá vé ({guestCount} khách)</span>
          <span className="font-semibold text-[#1C2526]">{formatVND(totalPrice)}</span>
        </div>

        {depositPercent !== undefined && depositPercent !== null && depositAmount !== null ? (
          <div className="flex items-center justify-between text-[#1F4E43] font-medium bg-[#B9EADB]/20 p-2.5 rounded-xl border border-[#88D4BC]/40">
            <span>Tiền cọc giữ chỗ ({depositPercent}%)</span>
            <span className="font-bold">{formatVND(depositAmount)}</span>
          </div>
        ) : (
          <div className="text-[11px] text-[#78716C] italic pt-1">
            * Phần trăm đặt cọc áp dụng theo quy định của ban quản lý tour.
          </div>
        )}
      </div>

      </>}
      {/* Action CTA Button */}
      <div className="space-y-2">
        {inlineError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
            <span>{inlineError}</span>
          </p>
        )}
        <button
          type="button"
          onClick={handleProceedBooking}
          disabled={
            isVerifyingHold ||
            !activeSchedule ||
            isClosed
          }
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            !activeSchedule ||
            isClosed
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
              : !isAuthenticated
              ? 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
              : isVerifyingHold
              ? 'bg-[#1F4E43]/80 text-white cursor-wait'
              : 'bg-[#1F4E43] hover:bg-[#15372F] text-white hover:scale-[1.01]'
          }`}
        >
          {isVerifyingHold ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kiểm tra giữ chỗ...</span>
            </>
          ) : !activeSchedule ? (
            <span>Chưa có lịch khởi hành</span>
          ) : isClosed ? (
            <span>{isSoldOut ? 'Lịch khởi hành này đã hết chỗ' : 'Lịch này chưa mở đặt chỗ'}</span>
          ) : !isAuthenticated ? (
            <>
              <span>Đăng nhập để đặt tour</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Tiếp tục đặt tour</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-[#78716C]">
          Thông tin hành khách sẽ được điền ở bước kế tiếp sau khi xác nhận lịch khởi hành.
        </p>
      </div>

      {/* Active Hold Modal if customer already has a pending hold */}
      <ActiveHoldModal
        isOpen={showHoldModal}
        activeHolds={activeHolds}
        onClose={() => setShowHoldModal(false)}
        onRecheck={async () => {
          await fetchActiveHoldsSilently();
        }}
      />
    </div>
  );
};
