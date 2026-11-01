import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  AlertTriangle,
  Backpack,
  Info,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Package,
  Wrench,
  X,
} from 'lucide-react';
import { useSearchParams, navigateTo } from '../../../lib/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { toursApi } from '../../../features/tours/api/tours.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import type {
  TourDetailResponse,
  ScheduleDetailResponse,
  ScheduleAvailabilityResponse,
  TourEquipmentResponse,
  TourRentalPackage,
  TourRentalItem,
} from '../../../features/tours/types/tour.types';
import type {
  BookingPassengerRequest,
  CreateBookingRequest,
  BookingSummaryResponse,
} from '../../../features/bookings/types/booking.types';
import type { ApiError } from '../../../types/api.types';
import { BookingStepper } from '../../../features/bookings/components/BookingStepper';
import { PassengerForm, validatePassengers } from '../../../features/bookings/components/PassengerForm';
import { PriceSummary } from '../../../features/bookings/components/PriceSummary';
import {
  ActiveHoldModal,
  ActiveHoldView,
} from '../../../features/bookings/components/ActiveHoldModal';
import { AvailabilityBadge } from '../../../features/tours/components/AvailabilityBadge';
import { formatDate, formatDateTime, formatVND, generateUUID } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

export const BookingWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { account, isAuthenticated, isInitializing, bookingIntent, setBookingIntent } = useAuth();

  const queryTourId = Number(searchParams.get('tourId'));
  const queryScheduleId = Number(searchParams.get('scheduleId'));
  const queryGuestCount = Number(searchParams.get('guestCount'));

  const resolvedTourId =
    Number.isFinite(queryTourId) && queryTourId > 0
      ? queryTourId
      : bookingIntent?.tourId ?? null;
  const resolvedScheduleId =
    Number.isFinite(queryScheduleId) && queryScheduleId > 0
      ? queryScheduleId
      : bookingIntent?.scheduleId ?? null;
  const resolvedGuestCount =
    Number.isFinite(queryGuestCount) && queryGuestCount > 0
      ? queryGuestCount
      : bookingIntent?.guestCount && bookingIntent.guestCount > 0
        ? bookingIntent.guestCount
        : 1;

  const [step, setStep] = useState<1 | 2>(1);
  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDetailResponse | null>(null);
  const [availability, setAvailability] = useState<ScheduleAvailabilityResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  // Active holds state
  const [activeHolds, setActiveHolds] = useState<BookingSummaryResponse[] | null>(null);
  const [isLoadingHolds, setIsLoadingHolds] = useState<boolean>(true);
  const [holdsError, setHoldsError] = useState<ApiError | null>(null);
  const [showHoldModal, setShowHoldModal] = useState<boolean>(false);

  // Equipment rental state
  const [equipmentData, setEquipmentData] = useState<TourEquipmentResponse | null>(null);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState<boolean>(true);
  const [equipmentError, setEquipmentError] = useState<ApiError | null>(null);
  const [selectedPackageQuantities, setSelectedPackageQuantities] = useState<Record<number, number>>({});
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<number, number>>({});

  const [passengers, setPassengers] = useState<BookingPassengerRequest[]>(() => {
    const list: BookingPassengerRequest[] = [
      {
        fullName: account?.fullName || '',
        phone: account?.phone || '',
        email: account?.email || '',
        bookingCustomer: true,
      },
    ];
    for (let i = 1; i < resolvedGuestCount; i++) {
      list.push({
        fullName: '',
        phone: '',
        email: '',
        bookingCustomer: false,
      });
    }
    return list;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Generate idempotencyKey once per schedule booking intent and retain across retries
  const idempotencyKeyRef = useRef<string | null>(null);
  const getOrCreateIdempotencyKey = useCallback((scheduleId: number): string => {
    if (idempotencyKeyRef.current) {
      return idempotencyKeyRef.current;
    }
    const storageKey = `wetrek_idempotency_${scheduleId}`;
    try {
      const existing = sessionStorage.getItem(storageKey);
      if (existing) {
        idempotencyKeyRef.current = existing;
        return existing;
      }
      const created = generateUUID();
      sessionStorage.setItem(storageKey, created);
      idempotencyKeyRef.current = created;
      return created;
    } catch {
      const created = generateUUID();
      idempotencyKeyRef.current = created;
      return created;
    }
  }, []);

  // Prefill first passenger from /me account when available if still blank
  useEffect(() => {
    if (!account) return;
    setPassengers((prev) => {
      if (prev.length === 1 && !prev[0].fullName && !prev[0].email && !prev[0].phone) {
        return [
          {
            fullName: account.fullName || '',
            phone: account.phone || '',
            email: account.email || '',
            bookingCustomer: true,
          },
        ];
      }
      return prev;
    });
  }, [account]);

  // Redirect unauthenticated users to login while preserving booking intent
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      if (resolvedTourId && resolvedScheduleId) {
        const returnPath = `${ROUTES.BOOKING.NEW}?tourId=${resolvedTourId}&scheduleId=${resolvedScheduleId}${resolvedGuestCount > 1 ? `&guestCount=${resolvedGuestCount}` : ''}`;
        setBookingIntent({
          tourId: resolvedTourId,
          scheduleId: resolvedScheduleId,
          tourTitle: bookingIntent?.tourTitle,
          guestCount: resolvedGuestCount,
          returnPath,
        });
        navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(returnPath)}`, {
          replace: true,
        });
      } else {
        navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.PUBLIC.TOURS)}`, {
          replace: true,
        });
      }
    }
  }, [
    isInitializing,
    isAuthenticated,
    resolvedTourId,
    resolvedScheduleId,
    bookingIntent?.tourTitle,
    resolvedGuestCount,
    setBookingIntent,
  ]);

  const fetchBookingContext = useCallback(async () => {
    if (!resolvedTourId || !resolvedScheduleId || !isAuthenticated) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [tourData, scheduleData, availData] = await Promise.all([
        toursApi.getTourDetail(resolvedTourId),
        toursApi.getScheduleDetail(resolvedTourId, resolvedScheduleId),
        toursApi.getScheduleAvailability(resolvedScheduleId),
      ]);
      setTour(tourData);
      setSchedule(scheduleData);
      setAvailability(availData);
    } catch (err) {
      setLoadError(err as ApiError);
    } finally {
      setIsLoadingData(false);
    }
  }, [resolvedTourId, resolvedScheduleId, isAuthenticated]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      fetchBookingContext();
    }
  }, [isInitializing, isAuthenticated, fetchBookingContext]);

  // Check active holds for logged in customer before proceeding with booking flow
  const verifyActiveHolds = useCallback(async () => {
    if (!isAuthenticated || isInitializing) {
      setIsLoadingHolds(false);
      return;
    }
    setIsLoadingHolds(true);
    setHoldsError(null);
    try {
      const holds = await bookingsApi.getActiveHolds();
      setActiveHolds(holds || []);
    } catch (err) {
      setHoldsError(err as ApiError);
    } finally {
      setIsLoadingHolds(false);
    }
  }, [isAuthenticated, isInitializing]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      verifyActiveHolds();
    }
  }, [isInitializing, isAuthenticated, verifyActiveHolds]);

  // Fetch equipment for current tour
  const fetchEquipment = useCallback(async (tourId: number) => {
    setIsLoadingEquipment(true);
    setEquipmentError(null);
    try {
      const data = await toursApi.getTourEquipment(tourId);
      setEquipmentData(data);
      // Prune selections if IDs don't exist in newly loaded equipmentData
      const validPkgIds = new Set((data.packages ?? []).map((p) => p.id));
      const validItemIds = new Set(
        (data.individualItems ?? data.items ?? []).map((i) => i.id)
      );
      setSelectedPackageQuantities((prev) => {
        const next: Record<number, number> = {};
        for (const [idStr, q] of Object.entries(prev)) {
          const id = Number(idStr);
          if (validPkgIds.has(id) && q > 0) next[id] = q;
        }
        return next;
      });
      setSelectedItemQuantities((prev) => {
        const next: Record<number, number> = {};
        for (const [idStr, q] of Object.entries(prev)) {
          const id = Number(idStr);
          if (validItemIds.has(id) && q > 0) next[id] = q;
        }
        return next;
      });
    } catch (err) {
      setEquipmentError(err as ApiError);
    } finally {
      setIsLoadingEquipment(false);
    }
  }, []);

  const lastTourIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!resolvedTourId || isInitializing || !isAuthenticated) return;
    if (lastTourIdRef.current !== resolvedTourId) {
      lastTourIdRef.current = resolvedTourId;
      // Tour changed: clear selections and fetch equipment for new tour
      setSelectedPackageQuantities({});
      setSelectedItemQuantities({});
      fetchEquipment(resolvedTourId);
    }
  }, [resolvedTourId, isInitializing, isAuthenticated, fetchEquipment]);

  const availablePackages: TourRentalPackage[] = useMemo(() => {
    return equipmentData?.packages ?? [];
  }, [equipmentData]);

  const availableItems: TourRentalItem[] = useMemo(() => {
    const list = equipmentData?.individualItems ?? equipmentData?.items ?? [];
    return list.filter((i) => i.individualRentalPriceVnd != null);
  }, [equipmentData]);

  const hasEquipmentCatalog = availablePackages.length > 0 || availableItems.length > 0;

  // Equipment fee is calculated per booking (whole trip), NOT multiplied by passenger count
  const totalEquipmentFee = useMemo(() => {
    let fee = 0;
    for (const pkg of availablePackages) {
      const q = selectedPackageQuantities[pkg.id] || 0;
      if (q > 0 && pkg.rentalPriceVnd != null) {
        fee += pkg.rentalPriceVnd * q;
      }
    }
    for (const item of availableItems) {
      const q = selectedItemQuantities[item.id] || 0;
      if (q > 0 && item.individualRentalPriceVnd != null) {
        fee += item.individualRentalPriceVnd * q;
      }
    }
    return fee;
  }, [availablePackages, availableItems, selectedPackageQuantities, selectedItemQuantities]);

  const hasRentalSelected =
    totalEquipmentFee > 0 ||
    Object.values(selectedPackageQuantities).some((q) => q > 0) ||
    Object.values(selectedItemQuantities).some((q) => q > 0);

  const handleUpdatePackageQty = (pkgId: number, delta: number) => {
    setSelectedPackageQuantities((prev) => {
      const current = prev[pkgId] || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[pkgId];
        return copy;
      }
      return { ...prev, [pkgId]: nextQty };
    });
  };

  const handleSetPackageQty = (pkgId: number, val: string) => {
    const parsed = parseInt(val, 10);
    const safeQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setSelectedPackageQuantities((prev) => {
      if (safeQty === 0) {
        const copy = { ...prev };
        delete copy[pkgId];
        return copy;
      }
      return { ...prev, [pkgId]: safeQty };
    });
  };

  const handleUpdateItemQty = (itemId: number, delta: number) => {
    setSelectedItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const handleSetItemQty = (itemId: number, val: string) => {
    const parsed = parseInt(val, 10);
    const safeQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setSelectedItemQuantities((prev) => {
      if (safeQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: safeQty };
    });
  };

  const handleSelectSelfProvided = () => {
    setSelectedPackageQuantities({});
    setSelectedItemQuantities({});
  };

  const maxAllowedPassengers = availability
    ? Math.min(Math.max(availability.availableSeats, 1), 100)
    : 100;

  const isScheduleBookable = Boolean(
    availability && availability.bookable && availability.availableSeats > 0
  );

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isScheduleBookable) {
      toast.error('Lịch khởi hành này hiện không còn chỗ trống hoặc đã đóng nhận khách.');
      return;
    }

    if (availability && passengers.length > availability.availableSeats) {
      setFieldErrors({
        passengers: `Số lượng hành khách (${passengers.length}) vượt quá số chỗ còn lại (${availability.availableSeats} chỗ).`,
      });
      return;
    }

    const validationErrors = validatePassengers(passengers);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      toast.warning('Vui lòng kiểm tra lại thông tin hành khách.');
      return;
    }

    setFieldErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateBooking = async () => {
    if (!resolvedScheduleId || !isScheduleBookable) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = getOrCreateIdempotencyKey(resolvedScheduleId);

    const cleanedPackageQuantities: Record<number, number> = {};
    for (const [idStr, q] of Object.entries(selectedPackageQuantities)) {
      const pkgId = Number(idStr);
      const safeQ = Math.max(0, Math.floor(q || 0));
      if (safeQ > 0 && pkgId > 0) {
        cleanedPackageQuantities[pkgId] = safeQ;
      }
    }

    const cleanedItemQuantities: Record<number, number> = {};
    for (const [idStr, q] of Object.entries(selectedItemQuantities)) {
      const itemId = Number(idStr);
      const safeQ = Math.max(0, Math.floor(q || 0));
      if (safeQ > 0 && itemId > 0) {
        cleanedItemQuantities[itemId] = safeQ;
      }
    }

    const hasRental =
      Object.keys(cleanedPackageQuantities).length > 0 ||
      Object.keys(cleanedItemQuantities).length > 0;

    const payload: CreateBookingRequest = {
      idempotencyKey,
      scheduleId: resolvedScheduleId,
      equipmentChoice: hasRental ? 'TOUR_PACKAGE' : 'SELF_PROVIDED',
      packageQuantities:
        hasRental && Object.keys(cleanedPackageQuantities).length > 0
          ? cleanedPackageQuantities
          : undefined,
      itemQuantities:
        hasRental && Object.keys(cleanedItemQuantities).length > 0
          ? cleanedItemQuantities
          : undefined,
      passengers: passengers.map((p) => ({
        fullName: p.fullName.trim(),
        phone: (p.phone || '').trim(),
        email: (p.email || '').trim(),
        bookingCustomer: Boolean(p.bookingCustomer),
      })),
    };

    try {
      const response = await bookingsApi.createBooking(payload);

      // Clear temporary idempotency key and booking intent once booking is created
      try {
        sessionStorage.removeItem(`wetrek_idempotency_${resolvedScheduleId}`);
      } catch {
        // ignore storage errors
      }
      setBookingIntent(null);

      toast.success(
        `Đã tạo đặt chỗ #${response.bookingCode}. Chỗ của bạn được giữ trong 15 phút.`
      );
      navigateTo(ROUTES.BOOKING.DETAIL(response.id), { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'ACTIVE_BOOKING_HOLD_EXISTS') {
        const responseHolds =
          apiErr.activeHolds && apiErr.activeHolds.length > 0
            ? apiErr.activeHolds
            : null;
        if (responseHolds) {
          setActiveHolds(responseHolds);
        } else {
          try {
            const fresh = await bookingsApi.getActiveHolds();
            setActiveHolds(fresh || []);
          } catch {
            // ignore
          }
        }
        setShowHoldModal(true);
        toast.warning(
          apiErr.message ||
            'Bạn đang có đơn đặt chỗ giữ chỗ chờ thanh toán chưa hoàn tất. Vui lòng thanh toán hoặc hoàn tất đơn hiện tại trước khi tạo đơn mới.'
        );
        return;
      }

      setSubmitError(apiErr);
      if (apiErr.code === 'IDEMPOTENCY_KEY_REUSED') {
        idempotencyKeyRef.current = null;
        try {
          sessionStorage.removeItem(`wetrek_idempotency_${resolvedScheduleId}`);
        } catch {
          // ignore
        }
      }
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      toast.error(apiErr.message || 'Không thể tạo đặt chỗ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing || isLoadingData || isLoadingHolds) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-14 bg-stone-200/70 rounded-2xl w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-44 bg-stone-200/70 rounded-2xl" />
              <div className="h-80 bg-stone-200/70 rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-72 bg-stone-200/70 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If customer already has active hold(s), block creating new bookings and show ActiveHoldView
  if (activeHolds && activeHolds.length > 0) {
    return <ActiveHoldView activeHolds={activeHolds} onRecheck={verifyActiveHolds} />;
  }

  // Error checking holds
  if (holdsError) {
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
            Không thể kiểm tra trạng thái giữ chỗ
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            {holdsError.message || 'Đã có lỗi xảy ra khi kiểm tra đơn đặt chỗ giữ chỗ.'}
          </p>
          <button
            type="button"
            onClick={verifyActiveHolds}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  if (!resolvedTourId || !resolvedScheduleId) {
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
            Chưa chọn lịch khởi hành
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            Vui lòng chọn một cung đường trekking và lịch khởi hành còn chỗ trước khi tiến hành đặt chỗ.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
            className="w-full py-3 px-5 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Khám phá danh sách tour
          </button>
        </div>
      </div>
    );
  }

  if (loadError || !tour || !schedule) {
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
            Không thể tải thông tin lịch trình
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            {loadError?.message || 'Đã xảy ra lỗi khi tải thông tin tour và tình trạng chỗ.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={fetchBookingContext}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(resolvedTourId))}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Quay lại trang tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const basePricePerPerson = schedule.basePriceVnd ?? 0;
  const depositPercent = schedule.depositPercent ?? 30;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                setStep(1);
              } else {
                setBookingIntent(null);
                navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(tour.id));
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-[#1F4E43] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {step === 2 ? 'Quay lại chỉnh sửa hành khách & trang bị' : `Quay lại tour ${tour.title}`}
            </span>
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <BookingStepper currentStep={step} />
        </div>

        {/* Unbookable Schedule Warning */}
        {!isScheduleBookable && (
          <div
            role="alert"
            className="mb-8 rounded-2xl bg-rose-50 border border-rose-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-rose-900">
                  Lịch khởi hành này hiện không thể đặt chỗ
                </h2>
                <p className="text-xs text-rose-700 mt-1">
                  Tình trạng chỗ từ hệ thống cho biết lịch này đã hết chỗ hoặc đã đóng đăng ký. Vui lòng chọn lịch khởi hành khác.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingIntent(null);
                navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(tour.id));
              }}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              Chọn lịch khác
            </button>
          </div>
        )}

        {/* API Error Alert */}
        {submitError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-rose-800">
                <p className="font-bold text-sm text-rose-900">{submitError.message}</p>
                {submitError.code && (
                  <p className="font-mono text-[11px] text-rose-600 mt-0.5">
                    Mã lỗi: {submitError.code}
                  </p>
                )}
                {submitError.fieldErrors && Object.keys(submitError.fieldErrors).length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {Object.entries(submitError.fieldErrors).map(([field, msg]) => (
                      <li key={field}>
                        <span className="font-semibold">{field}:</span> {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
              >
                Quay lại sửa lựa chọn
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Selected Tour & Schedule Card */}
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
                    Hành trình đã chọn
                  </span>
                  <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526] mt-0.5">
                    {tour.title}
                  </h1>
                </div>
                <AvailabilityBadge
                  availableSeats={availability?.availableSeats}
                  capacity={availability?.capacity}
                  bookable={availability?.bookable}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Khởi hành (Giờ VN)</p>
                    <p className="font-semibold text-stone-900">
                      {formatDateTime(schedule.startsAt)}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Kết thúc: {formatDate(schedule.endsAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Điểm tập trung</p>
                    <p className="font-semibold text-stone-900">
                      {schedule.meetingPoint || 'Theo thông báo của đoàn'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-stone-500">Số chỗ khả dụng</p>
                    <p className="font-semibold text-stone-900">
                      {availability
                        ? `${availability.availableSeats} / ${availability.capacity} chỗ`
                        : 'Đang kiểm tra'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Đặt cọc giữ chỗ: {depositPercent}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleProceedToConfirm} noValidate className="space-y-6">
                {/* Equipment Choice Section */}
                <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2.5">
                      <Backpack className="w-5 h-5 text-[#1F4E43]" />
                      <h2 className="text-base font-bold text-[#1C2526]">
                        Trang thiết bị &amp; Dịch vụ thuê kèm
                      </h2>
                    </div>
                    {totalEquipmentFee > 0 && (
                      <span className="text-xs font-mono font-bold text-[#1F4E43] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                        Tổng phí thuê: {formatVND(totalEquipmentFee)}
                      </span>
                    )}
                  </div>

                  {isLoadingEquipment ? (
                    <div className="py-8 text-center text-stone-500 space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#1F4E43] mx-auto" />
                      <p className="text-xs">Đang tải danh sách thiết bị và gói combo của tour...</p>
                    </div>
                  ) : equipmentError ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-rose-900">Không thể tải danh sách thiết bị</p>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {equipmentError.message || 'Đã xảy ra lỗi khi tải cấu hình thiết bị của tour.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => resolvedTourId && fetchEquipment(resolvedTourId)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : !hasEquipmentCatalog ? (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="equipment-self-only"
                          checked={true}
                          readOnly
                          className="mt-1 w-4 h-4 text-[#1F4E43] focus:ring-[#1F4E43]"
                        />
                        <div>
                          <label htmlFor="equipment-self-only" className="text-sm font-bold text-[#1C2526] block">
                            Tự chuẩn bị trang bị cá nhân
                          </label>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            Tour này hiện không cung cấp dịch vụ thuê thiết bị bổ sung. Hành khách vui lòng tự chuẩn bị đồ dùng cá nhân theo danh mục khuyến nghị của tour. Lều trại và trang bị đoàn đã bao gồm theo mô tả tour.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Option 1: Self-provided quick select */}
                      <div
                        onClick={handleSelectSelfProvided}
                        className={`rounded-xl border-2 p-4 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                          !hasRentalSelected
                            ? 'border-[#1F4E43] bg-[#1F4E43]/5 ring-1 ring-[#1F4E43]'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            id="equipment-self-provided"
                            name="equipmentOption"
                            checked={!hasRentalSelected}
                            onChange={handleSelectSelfProvided}
                            className="mt-1 w-4 h-4 text-[#1F4E43] focus:ring-[#1F4E43] cursor-pointer"
                          />
                          <div>
                            <label
                              htmlFor="equipment-self-provided"
                              className="text-sm font-bold text-[#1C2526] block cursor-pointer"
                            >
                              Tự chuẩn bị trang bị cá nhân
                            </label>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                              Tôi và các thành viên tự túc trang bị cá nhân (giày, balo, túi ngủ...). Không đăng ký thuê thêm đồ dùng từ ban tổ chức.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#1F4E43] shrink-0">
                          0 ₫
                        </span>
                      </div>

                      {/* Option 2: Rental packages and items */}
                      <div className="space-y-4 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                              <span>Thuê thiết bị bổ sung cho chuyến đi</span>
                            </h3>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Có thể chọn đồng thời nhiều combo và nhiều món lẻ. Đơn giá thuê tính trọn gói cho toàn chuyến đi (không nhân theo số khách).
                            </p>
                          </div>
                          {hasRentalSelected && (
                            <button
                              type="button"
                              onClick={handleSelectSelfProvided}
                              className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Bỏ chọn thuê thiết bị</span>
                            </button>
                          )}
                        </div>

                        {/* Combos section */}
                        {availablePackages.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-[#1F4E43] flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5" />
                              <span>Gói combo thiết bị ({availablePackages.length} gói có sẵn)</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {availablePackages.map((pkg) => {
                                const qty = selectedPackageQuantities[pkg.id] || 0;
                                const unitPrice = pkg.rentalPriceVnd ?? 0;
                                const lineTotal = unitPrice * qty;
                                const isSelected = qty > 0;

                                return (
                                  <div
                                    key={pkg.id}
                                    className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                                      isSelected
                                        ? 'border-[#1F4E43] bg-emerald-50/40 ring-1 ring-[#1F4E43]'
                                        : 'border-stone-200 bg-white hover:border-stone-300'
                                    }`}
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-sm text-stone-900 leading-snug">
                                          {pkg.title}
                                        </h5>
                                        <div className="text-right shrink-0">
                                          <span className="font-mono text-xs font-bold text-[#1F4E43]">
                                            {unitPrice > 0 ? formatVND(unitPrice) : 'Miễn phí'}
                                          </span>
                                          <span className="text-[10px] text-stone-500 block">/ combo</span>
                                        </div>
                                      </div>

                                      {pkg.includedItems && (
                                        <p className="text-xs text-stone-600 leading-relaxed">
                                          <span className="font-medium text-stone-800">Bao gồm: </span>
                                          <span>{pkg.includedItems}</span>
                                        </p>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-stone-600 font-medium">Số lượng:</span>
                                        <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdatePackageQty(pkg.id, -1)}
                                            disabled={qty <= 0}
                                            className="p-1 px-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                                            aria-label={`Giảm số lượng ${pkg.title}`}
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <input
                                            type="number"
                                            min="0"
                                            value={qty}
                                            onChange={(e) => handleSetPackageQty(pkg.id, e.target.value)}
                                            aria-label={`Số lượng combo ${pkg.title}`}
                                            className="w-12 text-center text-xs font-mono font-semibold py-1 focus:outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleUpdatePackageQty(pkg.id, 1)}
                                            className="p-1 px-2 text-stone-600 hover:bg-stone-100 cursor-pointer"
                                            aria-label={`Tăng số lượng ${pkg.title}`}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="text-right font-mono text-xs">
                                        {isSelected ? (
                                          <>
                                            <span className="text-[11px] text-stone-500 block">Thành tiền:</span>
                                            <strong className="font-bold text-[#1F4E43]">{formatVND(lineTotal)}</strong>
                                          </>
                                        ) : (
                                          <span className="text-stone-400 text-[11px]">Chưa chọn</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Individual items section */}
                        {availableItems.length > 0 && (
                          <div className="space-y-2.5 pt-2">
                            <h4 className="text-xs font-bold text-[#1F4E43] flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Thiết bị thuê lẻ ({availableItems.length} món có sẵn)</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {availableItems.map((item) => {
                                const qty = selectedItemQuantities[item.id] || 0;
                                const unitPrice = item.individualRentalPriceVnd ?? 0;
                                const lineTotal = unitPrice * qty;
                                const isSelected = qty > 0;

                                return (
                                  <div
                                    key={item.id}
                                    className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                                      isSelected
                                        ? 'border-[#1F4E43] bg-emerald-50/40 ring-1 ring-[#1F4E43]'
                                        : 'border-stone-200 bg-white hover:border-stone-300'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                                          {item.name}
                                        </h5>
                                        <span className="font-mono text-xs font-bold text-[#1F4E43] shrink-0">
                                          {formatVND(unitPrice)}
                                        </span>
                                      </div>
                                      {item.description && (
                                        <p className="text-[11px] text-stone-500 line-clamp-1">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateItemQty(item.id, -1)}
                                          disabled={qty <= 0}
                                          className="p-1 px-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                                          aria-label={`Giảm số lượng ${item.name}`}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          value={qty}
                                          onChange={(e) => handleSetItemQty(item.id, e.target.value)}
                                          aria-label={`Số lượng món ${item.name}`}
                                          className="w-10 text-center text-xs font-mono font-semibold py-1 focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateItemQty(item.id, 1)}
                                          className="p-1 px-2 text-stone-600 hover:bg-stone-100 cursor-pointer"
                                          aria-label={`Tăng số lượng ${item.name}`}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <div className="text-right font-mono text-xs">
                                        {isSelected ? (
                                          <strong className="font-bold text-[#1F4E43]">{formatVND(lineTotal)}</strong>
                                        ) : (
                                          <span className="text-stone-400 text-[11px]">0 ₫</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Note */}
                        <div className="flex items-start gap-2 text-xs text-stone-600 bg-stone-50 rounded-xl p-3 border border-stone-200">
                          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          <p>
                            Thiết bị sẽ được đối tác bàn giao tại điểm tập trung vào ngày khởi hành. Bạn có thể kiểm tra kỹ tình trạng đồ trước khi ký nhận.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passenger Form */}
                <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs">
                  <PassengerForm
                    passengers={passengers}
                    onChange={(updated) => {
                      setPassengers(updated);
                      if (Object.keys(fieldErrors).length > 0) {
                        setFieldErrors({});
                      }
                    }}
                    maxSeats={maxAllowedPassengers}
                    fieldErrors={fieldErrors}
                    disabled={!isScheduleBookable}
                  />
                </div>

                {/* Step 1 Actions */}
                <div className="flex items-center justify-end gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={!isScheduleBookable}
                    className="px-6 py-3.5 rounded-xl bg-[#C2410C] hover:bg-[#9B2F00] disabled:bg-stone-300 disabled:text-stone-500 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Tiếp tục xác nhận thông tin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Confirmation Review */
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#1F4E43] font-semibold">
                        Kiểm tra lần cuối
                      </span>
                      <h2 className="font-editorial text-2xl font-bold text-[#1C2526]">
                        Xác nhận thông tin đặt chỗ
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
                    >
                      Chỉnh sửa thông tin
                    </button>
                  </div>

                  {/* Passengers Review List */}
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold mb-3">
                      Danh sách hành khách ({passengers.length} người)
                    </h3>
                    <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
                      {passengers.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900">
                                {idx + 1}. {p.fullName}
                              </span>
                              {p.bookingCustomer && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1F4E43]/10 text-[#1F4E43]">
                                  Người đại diện đặt chỗ
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5">
                              SĐT: {p.phone} • Email: {p.email}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-stone-500">
                            {formatVND(basePricePerPerson)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equipment Review Section */}
                  {hasRentalSelected ? (
                    <div className="rounded-xl bg-emerald-50/50 border border-emerald-200 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Backpack className="w-4 h-4 text-[#1F4E43]" />
                          <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Danh sách thiết bị thuê cho chuyến đi
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-[#C2410C] font-semibold hover:underline cursor-pointer"
                        >
                          Sửa lựa chọn
                        </button>
                      </div>

                      <div className="divide-y divide-emerald-100 text-xs">
                        {/* Selected Combos */}
                        {availablePackages
                          .filter((p) => (selectedPackageQuantities[p.id] || 0) > 0)
                          .map((pkg) => {
                            const qty = selectedPackageQuantities[pkg.id] || 0;
                            const unit = pkg.rentalPriceVnd ?? 0;
                            return (
                              <div key={pkg.id} className="py-2.5 flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-semibold text-stone-900">[Combo] {pkg.title}</span>
                                  {pkg.includedItems && (
                                    <p className="text-[11px] text-stone-500 mt-0.5">{pkg.includedItems}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <span className="text-stone-600">{qty} × {formatVND(unit)} = </span>
                                  <strong className="text-[#1F4E43] font-bold">{formatVND(qty * unit)}</strong>
                                </div>
                              </div>
                            );
                          })}

                        {/* Selected Individual Items */}
                        {availableItems
                          .filter((i) => (selectedItemQuantities[i.id] || 0) > 0)
                          .map((item) => {
                            const qty = selectedItemQuantities[item.id] || 0;
                            const unit = item.individualRentalPriceVnd ?? 0;
                            return (
                              <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-semibold text-stone-900">[Thiết bị lẻ] {item.name}</span>
                                  {item.description && (
                                    <p className="text-[11px] text-stone-500 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <span className="text-stone-600">{qty} × {formatVND(unit)} = </span>
                                  <strong className="text-[#1F4E43] font-bold">{formatVND(qty * unit)}</strong>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">Tổng phụ phí thiết bị (tính cho cả đoàn):</span>
                        <strong className="font-mono text-sm font-bold text-[#1F4E43]">
                          {formatVND(totalEquipmentFee)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-stone-800 mb-1">
                          Trang bị đi kèm
                        </p>
                        <p className="text-xs text-stone-600">
                          Tự chuẩn bị trang bị cá nhân (Không đăng ký thuê thiết bị từ tour)
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-700 shrink-0">0 ₫</span>
                    </div>
                  )}

                  {/* Hold Policy Notice */}
                  <div className="rounded-xl bg-[#1F4E43]/5 border border-[#1F4E43]/20 p-4">
                    <p className="text-xs font-semibold text-[#1F4E43] mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Quy định giữ chỗ & hủy đặt chỗ</span>
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Sau khi xác nhận, hệ thống giữ chỗ cho đoàn trong <strong>15 phút</strong> ở trạng thái chờ thanh toán để thanh toán tiền cọc ({depositPercent}%) hoặc toàn bộ trực tuyến.
                    </p>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Quay lại bước trước
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={isSubmitting || !isScheduleBookable}
                    className="px-7 py-3.5 rounded-xl bg-[#1F4E43] hover:bg-[#163830] disabled:bg-stone-300 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang khởi tạo đặt chỗ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác nhận & Giữ chỗ (15 phút)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Price Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <PriceSummary
              participantCount={passengers.length}
              basePriceVnd={basePricePerPerson}
              depositPercent={depositPercent}
              equipmentFeeVnd={totalEquipmentFee}
            />
          </div>
        </div>
      </div>

      {/* Active Hold Modal on 409 conflict */}
      <ActiveHoldModal
        isOpen={showHoldModal}
        activeHolds={activeHolds || []}
        onClose={() => setShowHoldModal(false)}
        onRecheck={verifyActiveHolds}
      />
    </div>
  );
};

export default BookingWizardPage;
