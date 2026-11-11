import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  Package,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Send,
  AlertTriangle,
  Lock,
  RefreshCw,
  FileText,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
} from 'lucide-react';
import {
  attendanceApi,
  evaluateCheckInTimeWindow,
  evaluateCheckOutTimeWindow,
  formatVietnamDateTime,
  formatVietnamTimeOnly,
  prepareHandoverPhoto,
} from '../../../features/tours/api/attendance.api';
import { toursApi } from '../../../features/tours/api/tours.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import { useAuthStore } from '../../../stores/auth.store';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { Modal } from '../../../components/ui/Modal';
import { EquipmentHandoverFields } from './EquipmentHandoverFields';
import type {
  BatchRoundStatus,
  GuestCheckInStatus,
  GuestCheckOutStatus,
  HandoverEquipmentCondition,
  ParticipantCheckInRecord,
  ParticipantCheckOutRecord,
  ParticipantEquipmentCheckInItem,
  ParticipantEquipmentCheckOutItem,
  ScheduleCheckInBatchReport,
  ScheduleCheckOutBatchReport,
  ScheduleGuideSummary,
  ScheduleManifestBooking,
  ScheduleManifestResponse,
} from '../../../features/tours/types/attendance.types';

const CONDITION_LABELS: Record<
  HandoverEquipmentCondition,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  GOOD: {
    label: 'Tốt / Nguyên vẹn',
    shortLabel: 'Tốt',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  NEEDS_INSPECTION: {
    label: 'Cần kiểm tra',
    shortLabel: 'Cần KT',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  DAMAGED: {
    label: 'Hư hỏng',
    shortLabel: 'Hư hỏng',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  MISSING: {
    label: 'Thiếu / Chưa trả',
    shortLabel: 'Thiếu',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
  },
};

const ROUND_STATUS_BADGE: Record<
  BatchRoundStatus,
  { label: string; className: string; dotClass: string }
> = {
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    className: 'bg-stone-100 text-stone-700 border-stone-200',
    dotClass: 'bg-stone-400',
  },
  IN_PROGRESS: {
    label: 'Đang nhập (Chưa gửi)',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Gửi lỗi — Thử lại',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

export interface GuideTripDetailPageProps {
  scheduleIdProp?: number;
}

export const GuideTripDetailPage: React.FC<GuideTripDetailPageProps> = ({ scheduleIdProp }) => {
  const numericScheduleId = useMemo(() => {
    if (scheduleIdProp && !Number.isNaN(Number(scheduleIdProp))) {
      return Number(scheduleIdProp);
    }
    const match = window.location.pathname.match(/\/guide\/schedules\/(\d+)/);
    return match ? Number(match[1]) : 0;
  }, [scheduleIdProp]);
  const scheduleId = String(numericScheduleId || '');
  const { account, user } = useAuthStore();

  const guideIdentity = useMemo(
    () => ({
      id: account?.id ?? user?.id ?? null,
      email: account?.email ?? user?.email ?? null,
      fullName: account?.fullName ?? user?.name ?? null,
    }),
    [account?.id, account?.email, account?.fullName, user?.id, user?.email, user?.name]
  );

  // Loading & Authorization State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorizedGuide, setIsAuthorizedGuide] = useState<boolean>(false);
  const [currentGuideRole, setCurrentGuideRole] = useState<ScheduleGuideSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Manifest & Schedule State
  const [manifest, setManifest] = useState<ScheduleManifestResponse | null>(null);

  // Active Operational Stage Tab: 'CHECK_IN' | 'CHECK_OUT'
  const [activeStage, setActiveStage] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [guestSearch, setGuestSearch] = useState<string>('');

  // Collapsible UI states for compact rows
  const [expandedEquipmentRows, setExpandedEquipmentRows] = useState<Record<number, boolean>>({});
  const [expandedNoteRows, setExpandedNoteRows] = useState<Record<string, boolean>>({});
  const [showGeneralNoteInput, setShowGeneralNoteInput] = useState<boolean>(false);

  // Batch Check-in & Check-out Reports
  const [checkInReport, setCheckInReport] = useState<ScheduleCheckInBatchReport | null>(null);
  const [checkOutReport, setCheckOutReport] = useState<ScheduleCheckOutBatchReport | null>(null);

  // Submission & Photo Upload States
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState<boolean>(false);
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState<boolean>(false);
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Live Clock for Time Window Validation (Vietnam Timezone)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleEquipmentRow = (participantId: number) => {
    setExpandedEquipmentRows((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }));
  };

  const toggleNoteRow = (key: string) => {
    setExpandedNoteRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Build initial Check-in Report from Manifest Bookings
  const buildInitialCheckInReport = useCallback(
    (
      schedId: number,
      bookings: ScheduleManifestBooking[],
      existingDraft?: ScheduleCheckInBatchReport | null
    ): ScheduleCheckInBatchReport => {
      const existingByParticipant = new Map<number, ParticipantCheckInRecord>();
      (existingDraft?.participants || []).forEach((p) => {
        existingByParticipant.set(p.participantId, p);
      });

      const participantsList: ParticipantCheckInRecord[] = [];

      bookings.forEach((booking) => {
        const reservationItems = booking.equipmentReservation?.items || [];

        (booking.passengers || []).forEach((passenger) => {
          const prev = existingByParticipant.get(passenger.participantId);
          const prevEqMap = new Map<number, ParticipantEquipmentCheckInItem>();
          (prev?.equipmentItems || []).forEach((eq) => {
            prevEqMap.set(eq.equipmentId, eq);
          });

          // Không tự chia đều số lượng đặt của booking cho từng khách (mặc định = 0)
          const equipmentItems: ParticipantEquipmentCheckInItem[] = reservationItems.map(
            (resItem) => {
              const prevEq = prevEqMap.get(resItem.equipmentId);
              return {
                scheduleId: schedId,
                bookingId: booking.bookingId,
                participantId: passenger.participantId,
                equipmentId: resItem.equipmentId,
                equipmentName: resItem.equipmentName,
                bookingOrderedQuantity: resItem.quantity,
                allocatedQuantity: prevEq ? prevEq.allocatedQuantity : 0,
                condition: prevEq ? prevEq.condition : 'GOOD',
                note: prevEq ? prevEq.note : null,
                photos: prevEq ? prevEq.photos : [],
                handedOverAt: prevEq ? prevEq.handedOverAt : null,
              };
            }
          );

          participantsList.push({
            scheduleId: schedId,
            bookingId: booking.bookingId,
            bookingCode: booking.bookingCode,
            participantId: passenger.participantId,
            fullName: passenger.fullName,
            phone: passenger.phone ?? null,
            email: passenger.email ?? null,
            bookingCustomer: Boolean(passenger.bookingCustomer),
            status: prev ? prev.status : 'PENDING',
            markedAt: prev ? prev.markedAt : null,
            note: prev ? prev.note : null,
            equipmentItems,
          });
        });
      });

      return {
        scheduleId: schedId,
        roundStatus: existingDraft?.roundStatus || 'NOT_STARTED',
        idempotencyKey:
          existingDraft?.idempotencyKey || `checkin-${schedId}-${Date.now()}`,
        startedAt: existingDraft?.startedAt || null,
        submittedAt: existingDraft?.submittedAt || null,
        submittedByGuideId: existingDraft?.submittedByGuideId || null,
        submittedByGuideName: existingDraft?.submittedByGuideName || null,
        submittedByGuideEmail: existingDraft?.submittedByGuideEmail || null,
        generalNote: existingDraft?.generalNote || null,
        lastErrorMessage: existingDraft?.lastErrorMessage || null,
        participants: participantsList,
      };
    },
    []
  );

  // Build Check-out Report from Confirmed Check-in Report
  const buildCheckOutReportFromCheckIn = useCallback(
    (
      schedId: number,
      confirmedCheckIn: ScheduleCheckInBatchReport,
      existingCheckOut?: ScheduleCheckOutBatchReport | null
    ): ScheduleCheckOutBatchReport => {
      const existingByParticipant = new Map<number, ParticipantCheckOutRecord>();
      (existingCheckOut?.participants || []).forEach((p) => {
        existingByParticipant.set(p.participantId, p);
      });

      const participantsList: ParticipantCheckOutRecord[] = confirmedCheckIn.participants.map(
        (ciParticipant) => {
          const prev = existingByParticipant.get(ciParticipant.participantId);
          const prevEqMap = new Map(
            (prev?.equipmentItems || []).map((eq) => [eq.equipmentId, eq])
          );

          const issuedEquipment = (ciParticipant.equipmentItems || []).filter(
            (item) => item.allocatedQuantity > 0
          );

          const equipmentItems = issuedEquipment.map((issuedItem) => {
            const prevEq = prevEqMap.get(issuedItem.equipmentId);
            return {
              scheduleId: schedId,
              bookingId: ciParticipant.bookingId,
              participantId: ciParticipant.participantId,
              equipmentId: issuedItem.equipmentId,
              equipmentName: issuedItem.equipmentName,
              issuedQuantity: issuedItem.allocatedQuantity,
              returnedQuantity:
                prevEq !== undefined
                  ? prevEq.returnedQuantity
                  : issuedItem.allocatedQuantity,
              condition: prevEq ? prevEq.condition : 'GOOD',
              note: prevEq ? prevEq.note : null,
              photos: prevEq ? prevEq.photos : [],
              returnedAt: prevEq ? prevEq.returnedAt : null,
            };
          });

          const defaultStatus: GuestCheckOutStatus =
            ciParticipant.status === 'ABSENT' ? 'ABSENT_AT_CHECKIN' : 'PENDING';

          return {
            scheduleId: schedId,
            bookingId: ciParticipant.bookingId,
            bookingCode: ciParticipant.bookingCode,
            participantId: ciParticipant.participantId,
            fullName: ciParticipant.fullName,
            phone: ciParticipant.phone,
            email: ciParticipant.email,
            bookingCustomer: ciParticipant.bookingCustomer,
            checkInStatus: ciParticipant.status,
            status: prev ? prev.status : defaultStatus,
            markedAt:
              prev?.markedAt ??
              (defaultStatus === 'ABSENT_AT_CHECKIN' ? new Date().toISOString() : null),
            note: prev ? prev.note : null,
            equipmentItems,
          };
        }
      );

      return {
        scheduleId: schedId,
        roundStatus: existingCheckOut?.roundStatus || 'NOT_STARTED',
        idempotencyKey:
          existingCheckOut?.idempotencyKey || `checkout-${schedId}-${Date.now()}`,
        startedAt: existingCheckOut?.startedAt || null,
        submittedAt: existingCheckOut?.submittedAt || null,
        submittedByGuideId: existingCheckOut?.submittedByGuideId || null,
        submittedByGuideName: existingCheckOut?.submittedByGuideName || null,
        submittedByGuideEmail: existingCheckOut?.submittedByGuideEmail || null,
        generalNote: existingCheckOut?.generalNote || null,
        lastErrorMessage: existingCheckOut?.lastErrorMessage || null,
        participants: participantsList,
      };
    },
    []
  );

  // Load Schedule, Verify Assignment, Load Bookings + Equipment & Existing Reports
  const loadTripData = useCallback(
    async (signal?: AbortSignal) => {
      if (!numericScheduleId || Number.isNaN(numericScheduleId)) {
        setLoadError('Mã lịch khởi hành không hợp lệ.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const permission = await attendanceApi.verifyGuideAssignedToSchedule(
          numericScheduleId,
          guideIdentity,
          signal
        );

        if (!permission.assigned || !permission.guide) {
          setIsAuthorizedGuide(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorizedGuide(true);
        setCurrentGuideRole(permission.guide);

        let loadedManifest: ScheduleManifestResponse | null = null;
        try {
          loadedManifest = await attendanceApi.getScheduleManifest(numericScheduleId, signal);
        } catch {
          loadedManifest = null;
        }

        if (!loadedManifest) {
          const now = new Date();
          const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          const future = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
          const rangeSchedules = await toursApi
            .listSchedulesInRange(past.toISOString(), future.toISOString(), signal)
            .catch(() => []);
          const matchedSchedule = rangeSchedules.find((s) => s.id === numericScheduleId);

          let detailSchedule: any = null;
          if (matchedSchedule?.tourId) {
            detailSchedule = await toursApi
              .getScheduleDetail(matchedSchedule.tourId, numericScheduleId, signal)
              .catch(() => null);
          }

          const bookingsPage = await bookingsApi
            .searchBookings({ scheduleId: numericScheduleId, size: 100 }, signal)
            .catch(() => null);

          const activeSummaries = (bookingsPage?.content || []).filter(
            (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED'
          );

          const manifestBookings: ScheduleManifestBooking[] = await Promise.all(
            activeSummaries.map(async (bSummary) => {
              const [bDetail, eqRes] = await Promise.all([
                bookingsApi.getBookingDetail(bSummary.id, signal).catch(() => null),
                equipmentApi.getBookingEquipmentReservation(bSummary.id, signal).catch(() => null),
              ]);

              const passengers = (bDetail?.passengers || []).map((p) => ({
                participantId: p.id,
                bookingId: bSummary.id,
                bookingCode: bSummary.bookingCode,
                fullName: p.fullName,
                phone: p.phone,
                email: p.email,
                bookingCustomer: Boolean(p.bookingCustomer),
                checkedIn: Boolean(p.checkedInAt),
                checkedInAt: p.checkedInAt ?? null,
                checkedInBy: p.checkedInBy ?? null,
                checkedOut: false,
                checkedOutAt: null,
                checkedOutBy: null,
                note: p.checkInNote ?? null,
              }));

              const customerPassenger =
                passengers.find((p) => p.bookingCustomer) || passengers[0];

              return {
                bookingId: bSummary.id,
                bookingCode: bSummary.bookingCode,
                customerName: customerPassenger?.fullName || `Đơn #${bSummary.bookingCode}`,
                customerPhone: customerPassenger?.phone || null,
                customerEmail: customerPassenger?.email || null,
                status: bSummary.status,
                passengers,
                equipmentReservation: eqRes,
              };
            })
          );

          const startsAt =
            detailSchedule?.startsAt ||
            matchedSchedule?.startsAt ||
            new Date().toISOString();
          const endsAt =
            detailSchedule?.endsAt ||
            matchedSchedule?.endsAt ||
            new Date(Date.now() + 24 * 3600_000).toISOString();

          loadedManifest = {
            scheduleId: numericScheduleId,
            tourId: detailSchedule?.tourId || matchedSchedule?.tourId || 0,
            tourTitle: matchedSchedule?.title || `Lịch khởi hành #${numericScheduleId}`,
            startsAt,
            endsAt,
            meetingPoint: detailSchedule?.meetingPoint || 'Điểm tập trung theo thông báo đoàn',
            contactPhone: detailSchedule?.contactPhone || permission.guide.phone || null,
            capacity: detailSchedule?.capacity ?? 20,
            confirmedSeats: detailSchedule?.confirmedSeats ?? 0,
            heldSeats: detailSchedule?.heldSeats ?? 0,
            assignedGuides: permission.assignedGuides,
            bookings: manifestBookings,
          };
        }

        setManifest(loadedManifest);

        const savedOps = await attendanceApi.getScheduleOperationsReport(
          numericScheduleId,
          signal
        );

        const resolvedCheckIn =
          savedOps?.checkInReport?.roundStatus === 'CONFIRMED'
            ? savedOps.checkInReport
            : buildInitialCheckInReport(
                numericScheduleId,
                loadedManifest.bookings,
                savedOps?.checkInReport
              );

        setCheckInReport(resolvedCheckIn);

        if (resolvedCheckIn.roundStatus === 'CONFIRMED') {
          const resolvedCheckOut =
            savedOps?.checkOutReport?.roundStatus === 'CONFIRMED'
              ? savedOps.checkOutReport
              : buildCheckOutReportFromCheckIn(
                  numericScheduleId,
                  resolvedCheckIn,
                  savedOps?.checkOutReport
                );
          setCheckOutReport(resolvedCheckOut);

          if (evaluateCheckOutTimeWindow(loadedManifest.endsAt, Date.now()).allowed) {
            setActiveStage('CHECK_OUT');
          }
        } else {
          setCheckOutReport(savedOps?.checkOutReport || null);
        }
      } catch (err: any) {
        if (err?.name !== 'CanceledError') {
          setLoadError(err?.message || 'Không thể tải dữ liệu chuyến đi.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      numericScheduleId,
      guideIdentity,
      buildInitialCheckInReport,
      buildCheckOutReportFromCheckIn,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadTripData(controller.signal);
    return () => controller.abort();
  }, [loadTripData]);

  // Determine if there are unconfirmed draft changes
  const hasUnconfirmedChanges = useMemo(() => {
    const ciDirty =
      checkInReport?.roundStatus === 'IN_PROGRESS' ||
      checkInReport?.roundStatus === 'FAILED';
    const coDirty =
      checkOutReport?.roundStatus === 'IN_PROGRESS' ||
      checkOutReport?.roundStatus === 'FAILED';
    return Boolean(ciDirty || coDirty);
  }, [checkInReport?.roundStatus, checkOutReport?.roundStatus]);

  // Warn Guide if leaving page with unconfirmed draft changes
  useEffect(() => {
    if (!hasUnconfirmedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'Bạn còn thông tin điểm danh / bàn giao thiết bị chưa bấm xác nhận gửi. Nếu rời trang, báo cáo chưa được gửi lên hệ thống.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnconfirmedChanges]);

  const handleBackNavigation = () => {
    if (hasUnconfirmedChanges) {
      const proceed = window.confirm(
        'Cảnh báo: Bạn đang có nội dung điểm danh / thiết bị chưa bấm "Xác nhận hoàn tất" để gửi báo cáo.\n\nBạn có chắc chắn muốn rời khỏi trang này không?'
      );
      if (!proceed) return;
    }
    navigateTo(ROUTES.GUIDE.SCHEDULES);
  };

  // Time Window Evaluations
  const checkInTimeWindow = useMemo(() => {
    if (!manifest) {
      return {
        allowed: false,
        unlockAtIso: '',
        referenceAtIso: '',
        remainingMs: 0,
        message: '',
      };
    }
    return evaluateCheckInTimeWindow(manifest.startsAt, nowMs);
  }, [manifest, nowMs]);

  const checkOutTimeWindow = useMemo(() => {
    if (!manifest) {
      return {
        allowed: false,
        unlockAtIso: '',
        referenceAtIso: '',
        remainingMs: 0,
        message: '',
      };
    }
    return evaluateCheckOutTimeWindow(manifest.endsAt, nowMs);
  }, [manifest, nowMs]);

  // Booking Ordered Equipment Lookup Map: bookingId -> equipmentId -> { orderedQuantity, equipmentName }
  const bookingOrderedEquipmentMap = useMemo(() => {
    const map: Record<
      number,
      Record<number, { orderedQuantity: number; equipmentName: string }>
    > = {};
    (manifest?.bookings || []).forEach((b) => {
      const items = b.equipmentReservation?.items || [];
      if (items.length > 0) {
        map[b.bookingId] = {};
        items.forEach((item) => {
          map[b.bookingId][item.equipmentId] = {
            orderedQuantity: item.quantity,
            equipmentName: item.equipmentName,
          };
        });
      }
    });
    return map;
  }, [manifest?.bookings]);

  // Total currently allocated per booking during Check-in
  const bookingAllocatedTotalsMap = useMemo(() => {
    const map: Record<number, Record<number, number>> = {};
    (checkInReport?.participants || []).forEach((p) => {
      if (!map[p.bookingId]) map[p.bookingId] = {};
      (p.equipmentItems || []).forEach((eq) => {
        map[p.bookingId][eq.equipmentId] =
          (map[p.bookingId][eq.equipmentId] || 0) + (eq.allocatedQuantity || 0);
      });
    });
    return map;
  }, [checkInReport?.participants]);

  // Persist Draft Helper for Check-in
  const updateCheckInDraft = useCallback(
    (updater: (prev: ScheduleCheckInBatchReport) => ScheduleCheckInBatchReport) => {
      setCheckInReport((prev) => {
        if (!prev || prev.roundStatus === 'CONFIRMED') return prev;
        const nextRaw = updater(prev);
        const nowIso = new Date().toISOString();
        const next: ScheduleCheckInBatchReport = {
          ...nextRaw,
          roundStatus: 'IN_PROGRESS',
          startedAt: nextRaw.startedAt || nowIso,
          lastErrorMessage: null,
        };
        if (manifest) {
          attendanceApi.saveScheduleCheckInDraft(manifest.scheduleId, next, {
            tourId: manifest.tourId,
            tourTitle: manifest.tourTitle,
            startsAt: manifest.startsAt,
            endsAt: manifest.endsAt,
          });
        }
        return next;
      });
    },
    [manifest]
  );

  // Persist Draft Helper for Check-out
  const updateCheckOutDraft = useCallback(
    (updater: (prev: ScheduleCheckOutBatchReport) => ScheduleCheckOutBatchReport) => {
      setCheckOutReport((prev) => {
        if (!prev || prev.roundStatus === 'CONFIRMED') return prev;
        const nextRaw = updater(prev);
        const nowIso = new Date().toISOString();
        const next: ScheduleCheckOutBatchReport = {
          ...nextRaw,
          roundStatus: 'IN_PROGRESS',
          startedAt: nextRaw.startedAt || nowIso,
          lastErrorMessage: null,
        };
        if (manifest) {
          attendanceApi.saveScheduleCheckOutDraft(manifest.scheduleId, next, {
            tourId: manifest.tourId,
            tourTitle: manifest.tourTitle,
            startsAt: manifest.startsAt,
            endsAt: manifest.endsAt,
          });
        }
        return next;
      });
    },
    [manifest]
  );

  // ============================================================================
  // CHECK-IN HANDLERS
  // ============================================================================

  const isCheckInLocked =
    !checkInTimeWindow.allowed ||
    checkInReport?.roundStatus === 'CONFIRMED' ||
    isSubmittingCheckIn;

  const handleMarkGuestCheckIn = (participantId: number, status: GuestCheckInStatus) => {
    if (isCheckInLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              status,
              markedAt: nowIso,
              equipmentItems:
                status === 'ABSENT'
                  ? p.equipmentItems.map((eq) => ({
                      ...eq,
                      allocatedQuantity: 0,
                      handedOverAt: null,
                    }))
                  : p.equipmentItems,
            }
          : p
      ),
    }));
  };

  const handleMarkAllRemainingCheckInPresent = () => {
    if (isCheckInLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.status === 'PENDING' ? { ...p, status: 'PRESENT', markedAt: nowIso } : p
      ),
    }));
  };

  const handleGuestCheckInNoteChange = (participantId: number, note: string) => {
    if (isCheckInLocked) return;
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId ? { ...p, note } : p
      ),
    }));
  };

  const handleEquipmentCheckInQuantityChange = (
    participantId: number,
    bookingId: number,
    equipmentId: number,
    newQty: number
  ) => {
    if (isCheckInLocked) return;
    const orderedMax =
      bookingOrderedEquipmentMap[bookingId]?.[equipmentId]?.orderedQuantity ?? 0;

    let otherGuestsAllocated = 0;
    (checkInReport?.participants || []).forEach((p) => {
      if (p.bookingId === bookingId && p.participantId !== participantId) {
        const found = p.equipmentItems.find((e) => e.equipmentId === equipmentId);
        if (found) otherGuestsAllocated += found.allocatedQuantity;
      }
    });

    const maxAllowedForGuest = Math.max(0, orderedMax - otherGuestsAllocated);
    const clampedQty = Math.max(0, Math.min(newQty, maxAllowedForGuest));
    const nowIso = new Date().toISOString();

    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              status: p.status === 'PENDING' && clampedQty > 0 ? 'PRESENT' : p.status,
              markedAt:
                p.status === 'PENDING' && clampedQty > 0 ? nowIso : p.markedAt,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId
                  ? {
                      ...eq,
                      allocatedQuantity: clampedQty,
                      handedOverAt: clampedQty > 0 ? nowIso : null,
                    }
                  : eq
              ),
            }
          : p
      ),
    }));
  };

  const handleEquipmentCheckInConditionChange = (
    participantId: number,
    equipmentId: number,
    condition: HandoverEquipmentCondition
  ) => {
    if (isCheckInLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId
                  ? {
                      ...eq,
                      condition,
                      handedOverAt: eq.handedOverAt || nowIso,
                    }
                  : eq
              ),
            }
          : p
      ),
    }));
  };

  const handleEquipmentCheckInNoteChange = (
    participantId: number,
    equipmentId: number,
    note: string
  ) => {
    if (isCheckInLocked) return;
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId ? { ...eq, note } : eq
              ),
            }
          : p
      ),
    }));
  };

  const handleUploadCheckInPhoto = async (
    participantId: number,
    equipmentId: number,
    files: FileList | null
  ) => {
    if (isCheckInLocked || !files || files.length === 0 || !manifest) return;
    const key = `ci-${participantId}-${equipmentId}`;
    setUploadingPhotoKey(key);
    try {
      const uploadedRecords = await Promise.all(
        Array.from(files).map((file) =>
          prepareHandoverPhoto(
            file,
            manifest.scheduleId,
            'checkin',
            participantId,
            equipmentId
          )
        )
      );
      const nowIso = new Date().toISOString();
      updateCheckInDraft((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.participantId === participantId
            ? {
                ...p,
                equipmentItems: p.equipmentItems.map((eq) =>
                  eq.equipmentId === equipmentId
                    ? {
                        ...eq,
                        photos: [...(eq.photos || []), ...uploadedRecords],
                        handedOverAt: eq.handedOverAt || nowIso,
                      }
                    : eq
                ),
              }
            : p
        ),
      }));
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err?.message || 'Không thể tải ảnh hiện trạng thiết bị.',
      });
    } finally {
      setUploadingPhotoKey(null);
    }
  };

  const handleRemoveCheckInPhoto = (
    participantId: number,
    equipmentId: number,
    photoId: string
  ) => {
    if (isCheckInLocked) return;
    updateCheckInDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId
                  ? {
                      ...eq,
                      photos: (eq.photos || []).filter((ph) => ph.id !== photoId),
                    }
                  : eq
              ),
            }
          : p
      ),
    }));
  };

  // Pre-confirmation Readiness Checks for Check-in
  const checkInReadiness = useMemo(() => {
    const participants = checkInReport?.participants || [];
    const pendingGuests = participants.filter((p) => p.status === 'PENDING');
    const presentCount = participants.filter((p) => p.status === 'PRESENT').length;
    const absentCount = participants.filter((p) => p.status === 'ABSENT').length;

    const unallocatedEquipmentWarnings: string[] = [];
    const missingIssueNotes: string[] = [];

    Object.entries(bookingOrderedEquipmentMap).forEach(([bIdStr, eqMap]) => {
      const bId = Number(bIdStr);
      const bookingObj = manifest?.bookings.find((b) => b.bookingId === bId);
      const bCode = bookingObj?.bookingCode || `#${bId}`;
      Object.entries(eqMap).forEach(([eqIdStr, meta]) => {
        const eqId = Number(eqIdStr);
        const allocated = bookingAllocatedTotalsMap[bId]?.[eqId] || 0;
        if (allocated < meta.orderedQuantity) {
          unallocatedEquipmentWarnings.push(
            `Đơn ${bCode}: "${meta.equipmentName}" mới phân bổ ${allocated}/${meta.orderedQuantity} món`
          );
        }
      });
    });

    participants.forEach((p) => {
      (p.equipmentItems || []).forEach((eq) => {
        if (
          eq.allocatedQuantity > 0 &&
          (eq.condition === 'DAMAGED' || eq.condition === 'MISSING') &&
          (!eq.note || !eq.note.trim())
        ) {
          missingIssueNotes.push(
            `${p.fullName} — "${eq.equipmentName}" (${CONDITION_LABELS[eq.condition].shortLabel}) thiếu ghi chú`
          );
        }
      });
    });

    const canSubmit =
      participants.length > 0 &&
      pendingGuests.length === 0 &&
      missingIssueNotes.length === 0;

    return {
      totalGuests: participants.length,
      pendingGuests,
      presentCount,
      absentCount,
      unallocatedEquipmentWarnings,
      missingIssueNotes,
      canSubmit,
    };
  }, [
    checkInReport?.participants,
    bookingOrderedEquipmentMap,
    bookingAllocatedTotalsMap,
    manifest?.bookings,
  ]);

  const handleConfirmCheckInBatch = async () => {
    if (!manifest || !checkInReport) return;
    setFeedbackBanner(null);
    setIsSubmittingCheckIn(true);
    try {
      const confirmed = await attendanceApi.submitScheduleCheckInBatch({
        scheduleId: manifest.scheduleId,
        startsAt: manifest.startsAt,
        endsAt: manifest.endsAt,
        tourId: manifest.tourId,
        tourTitle: manifest.tourTitle,
        report: checkInReport,
        bookingOrderedEquipmentMap,
        guideIdentity,
      });

      setCheckInReport(confirmed);
      const initializedCheckOut = buildCheckOutReportFromCheckIn(
        manifest.scheduleId,
        confirmed,
        checkOutReport
      );
      setCheckOutReport(initializedCheckOut);
      setFeedbackBanner({
        type: 'success',
        message: `Đã xác nhận hoàn tất lượt Check-in toàn đoàn lúc ${formatVietnamDateTime(
          confirmed.submittedAt,
          true
        )}!`,
      });
    } catch (err: any) {
      const message =
        err?.message ||
        'Xác nhận lượt check-in thất bại. Nội dung đã nhập vẫn được giữ nguyên để bạn thử lại.';
      setCheckInReport((prev) =>
        prev
          ? {
              ...prev,
              roundStatus: 'FAILED',
              lastErrorMessage: message,
            }
          : prev
      );
      setFeedbackBanner({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // ============================================================================
  // CHECK-OUT HANDLERS
  // ============================================================================

  const isCheckInConfirmed = checkInReport?.roundStatus === 'CONFIRMED';
  const isCheckOutLocked =
    !isCheckInConfirmed ||
    !checkOutTimeWindow.allowed ||
    checkOutReport?.roundStatus === 'CONFIRMED' ||
    isSubmittingCheckOut;

  const handleMarkGuestCheckOut = (participantId: number, status: GuestCheckOutStatus) => {
    if (isCheckOutLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              status,
              markedAt: nowIso,
            }
          : p
      ),
    }));
  };

  const handleMarkAllRemainingCheckOutCompleted = () => {
    if (isCheckOutLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.status === 'PENDING'
          ? {
              ...p,
              status: p.checkInStatus === 'ABSENT' ? 'ABSENT_AT_CHECKIN' : 'COMPLETED',
              markedAt: nowIso,
            }
          : p
      ),
    }));
  };

  const handleGuestCheckOutNoteChange = (participantId: number, note: string) => {
    if (isCheckOutLocked) return;
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId ? { ...p, note } : p
      ),
    }));
  };

  const handleEquipmentCheckOutQuantityChange = (
    participantId: number,
    equipmentId: number,
    newReturnedQty: number
  ) => {
    if (isCheckOutLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => {
        if (p.participantId !== participantId) return p;
        return {
          ...p,
          equipmentItems: p.equipmentItems.map((eq) => {
            if (eq.equipmentId !== equipmentId) return eq;
            const clamped = Math.max(0, Math.min(newReturnedQty, eq.issuedQuantity));
            const autoCondition: HandoverEquipmentCondition =
              clamped < eq.issuedQuantity && eq.condition === 'GOOD'
                ? 'MISSING'
                : clamped === eq.issuedQuantity && eq.condition === 'MISSING'
                ? 'GOOD'
                : eq.condition;
            return {
              ...eq,
              returnedQuantity: clamped,
              condition: autoCondition,
              returnedAt: nowIso,
            };
          }),
        };
      }),
    }));
  };

  const handleEquipmentCheckOutConditionChange = (
    participantId: number,
    equipmentId: number,
    condition: HandoverEquipmentCondition
  ) => {
    if (isCheckOutLocked) return;
    const nowIso = new Date().toISOString();
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId
                  ? {
                      ...eq,
                      condition,
                      returnedAt: eq.returnedAt || nowIso,
                    }
                  : eq
              ),
            }
          : p
      ),
    }));
  };

  const handleEquipmentCheckOutNoteChange = (
    participantId: number,
    equipmentId: number,
    note: string
  ) => {
    if (isCheckOutLocked) return;
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId ? { ...eq, note } : eq
              ),
            }
          : p
      ),
    }));
  };

  const handleUploadCheckOutPhoto = async (
    participantId: number,
    equipmentId: number,
    files: FileList | null
  ) => {
    if (isCheckOutLocked || !files || files.length === 0 || !manifest) return;
    const key = `co-${participantId}-${equipmentId}`;
    setUploadingPhotoKey(key);
    try {
      const uploadedRecords = await Promise.all(
        Array.from(files).map((file) =>
          prepareHandoverPhoto(
            file,
            manifest.scheduleId,
            'checkout',
            participantId,
            equipmentId
          )
        )
      );
      const nowIso = new Date().toISOString();
      updateCheckOutDraft((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.participantId === participantId
            ? {
                ...p,
                equipmentItems: p.equipmentItems.map((eq) =>
                  eq.equipmentId === equipmentId
                    ? {
                        ...eq,
                        photos: [...(eq.photos || []), ...uploadedRecords],
                        returnedAt: eq.returnedAt || nowIso,
                      }
                    : eq
                ),
              }
            : p
        ),
      }));
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err?.message || 'Không thể tải ảnh hiện trạng nhận lại thiết bị.',
      });
    } finally {
      setUploadingPhotoKey(null);
    }
  };

  const handleRemoveCheckOutPhoto = (
    participantId: number,
    equipmentId: number,
    photoId: string
  ) => {
    if (isCheckOutLocked) return;
    updateCheckOutDraft((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.participantId === participantId
          ? {
              ...p,
              equipmentItems: p.equipmentItems.map((eq) =>
                eq.equipmentId === equipmentId
                  ? {
                      ...eq,
                      photos: (eq.photos || []).filter((ph) => ph.id !== photoId),
                    }
                  : eq
              ),
            }
          : p
      ),
    }));
  };

  // Pre-confirmation Readiness Checks for Check-out
  const checkOutReadiness = useMemo(() => {
    const participants = checkOutReport?.participants || [];
    const pendingGuests = participants.filter((p) => p.status === 'PENDING');
    const completedCount = participants.filter((p) => p.status === 'COMPLETED').length;
    const earlyCount = participants.filter((p) => p.status === 'EARLY_DEPARTURE').length;

    const missingReturnNotes: string[] = [];
    let totalIssuedItems = 0;
    let totalReturnedItems = 0;

    participants.forEach((p) => {
      (p.equipmentItems || []).forEach((eq) => {
        totalIssuedItems += eq.issuedQuantity;
        totalReturnedItems += eq.returnedQuantity;
        const isShortage = eq.returnedQuantity < eq.issuedQuantity;
        const isIssueCondition = eq.condition !== 'GOOD';
        if ((isShortage || isIssueCondition) && (!eq.note || !eq.note.trim())) {
          missingReturnNotes.push(
            `${p.fullName} — "${eq.equipmentName}" (${
              isShortage
                ? `Trả ${eq.returnedQuantity}/${eq.issuedQuantity}`
                : CONDITION_LABELS[eq.condition].shortLabel
            }) thiếu ghi chú`
          );
        }
      });
    });

    const canSubmit =
      participants.length > 0 &&
      pendingGuests.length === 0 &&
      missingReturnNotes.length === 0;

    return {
      totalGuests: participants.length,
      pendingGuests,
      completedCount,
      earlyCount,
      totalIssuedItems,
      totalReturnedItems,
      missingReturnNotes,
      canSubmit,
    };
  }, [checkOutReport?.participants]);

  const handleConfirmCheckOutBatch = async () => {
    if (!manifest || !checkOutReport) return;
    setFeedbackBanner(null);
    setIsSubmittingCheckOut(true);
    try {
      const confirmed = await attendanceApi.submitScheduleCheckOutBatch({
        scheduleId: manifest.scheduleId,
        startsAt: manifest.startsAt,
        endsAt: manifest.endsAt,
        tourId: manifest.tourId,
        tourTitle: manifest.tourTitle,
        report: checkOutReport,
        guideIdentity,
      });

      setCheckOutReport(confirmed);
      setFeedbackBanner({
        type: 'success',
        message: `Đã xác nhận hoàn tất lượt Check-out & Thu hồi thiết bị lúc ${formatVietnamDateTime(
          confirmed.submittedAt,
          true
        )}!`,
      });
    } catch (err: any) {
      const message =
        err?.message ||
        'Xác nhận lượt check-out thất bại. Nội dung đã nhập vẫn được giữ nguyên để bạn thử lại.';
      setCheckOutReport((prev) =>
        prev
          ? {
              ...prev,
              roundStatus: 'FAILED',
              lastErrorMessage: message,
            }
          : prev
      );
      setFeedbackBanner({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  // Filtered participant rows by search query
  const filteredCheckInParticipants = useMemo(() => {
    const list = checkInReport?.participants || [];
    if (!guestSearch.trim()) return list;
    const q = guestSearch.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.bookingCode.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [checkInReport?.participants, guestSearch]);

  const filteredCheckOutParticipants = useMemo(() => {
    const list = checkOutReport?.participants || [];
    if (!guestSearch.trim()) return list;
    const q = guestSearch.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.bookingCode.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [checkOutReport?.participants, guestSearch]);

  const renderCheckInEquipment = (participant: ParticipantCheckInRecord, eq: ParticipantEquipmentCheckInItem) => {
    const ordered = bookingOrderedEquipmentMap[participant.bookingId]?.[eq.equipmentId]?.orderedQuantity ?? eq.bookingOrderedQuantity ?? 0;
    const allocated = bookingAllocatedTotalsMap[participant.bookingId]?.[eq.equipmentId] || 0;
    const remaining = Math.max(0, ordered - allocated);
    return <EquipmentHandoverFields key={eq.equipmentId} name={eq.equipmentName}
      quantity={eq.allocatedQuantity} maxQuantity={eq.allocatedQuantity + remaining}
      quantityLabel={`Số lượng giao · còn ${remaining}/${ordered}`}
      condition={eq.condition} note={eq.note || ''} photos={eq.photos || []}
      locked={isCheckInLocked} uploading={uploadingPhotoKey === `ci-${participant.participantId}-${eq.equipmentId}`}
      showDetails={eq.allocatedQuantity > 0} noteRequired={eq.condition === 'DAMAGED' || eq.condition === 'MISSING'}
      onQuantityChange={(value) => handleEquipmentCheckInQuantityChange(participant.participantId, participant.bookingId, eq.equipmentId, value)}
      onConditionChange={(value) => handleEquipmentCheckInConditionChange(participant.participantId, eq.equipmentId, value)}
      onNoteChange={(value) => handleEquipmentCheckInNoteChange(participant.participantId, eq.equipmentId, value)}
      onUpload={(files) => { void handleUploadCheckInPhoto(participant.participantId, eq.equipmentId, files); }}
      onPreview={setPreviewPhotoUrl} onRemove={(id) => handleRemoveCheckInPhoto(participant.participantId, eq.equipmentId, id)} />;
  };

  const renderCheckOutEquipment = (participant: ParticipantCheckOutRecord, eq: ParticipantEquipmentCheckOutItem) => (
    <EquipmentHandoverFields key={eq.equipmentId} name={eq.equipmentName}
      quantity={eq.returnedQuantity} maxQuantity={eq.issuedQuantity} quantityLabel={`Số lượng trả / ${eq.issuedQuantity} đã giao`}
      condition={eq.condition} note={eq.note || ''} photos={eq.photos || []}
      locked={isCheckOutLocked} uploading={uploadingPhotoKey === `co-${participant.participantId}-${eq.equipmentId}`}
      noteRequired={eq.returnedQuantity < eq.issuedQuantity || eq.condition !== 'GOOD'}
      onQuantityChange={(value) => handleEquipmentCheckOutQuantityChange(participant.participantId, eq.equipmentId, value)}
      onConditionChange={(value) => handleEquipmentCheckOutConditionChange(participant.participantId, eq.equipmentId, value)}
      onNoteChange={(value) => handleEquipmentCheckOutNoteChange(participant.participantId, eq.equipmentId, value)}
      onUpload={(files) => { void handleUploadCheckOutPhoto(participant.participantId, eq.equipmentId, files); }}
      onPreview={setPreviewPhotoUrl} onRemove={(id) => handleRemoveCheckOutPhoto(participant.participantId, eq.equipmentId, id)} />
  );

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-[#E6E1D8] shadow-2xs">
        <Loader2 className="w-7 h-7 animate-spin text-[#1F4E43] mx-auto" />
        <p className="text-xs sm:text-sm font-medium text-stone-600">
          Đang kiểm tra phân công và tải danh sách đoàn khách...
        </p>
      </div>
    );
  }

  if (!isAuthorizedGuide) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-editorial text-xl font-bold text-[#1C2526]">
            Không có quyền truy cập lịch #{scheduleId}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Tài khoản Guide của bạn ({guideIdentity.fullName || guideIdentity.email}) không nằm
            trong danh sách được Admin phân công phụ trách lịch khởi hành này.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
          className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Lịch được phân công</span>
        </button>
      </div>
    );
  }

  if (loadError || !manifest) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3 shadow-2xs max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-stone-900">Lỗi tải thông tin chuyến</h3>
        <p className="text-xs text-stone-600">
          {loadError || 'Không tìm thấy thông tin lịch khởi hành.'}
        </p>
        <button
          type="button"
          onClick={() => loadTripData()}
          className="px-4 py-2 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const checkInStatusBadge =
    ROUND_STATUS_BADGE[checkInReport?.roundStatus || 'NOT_STARTED'];
  const checkOutStatusBadge =
    ROUND_STATUS_BADGE[checkOutReport?.roundStatus || 'NOT_STARTED'];

  const activeProcessedCount =
    activeStage === 'CHECK_IN'
      ? checkInReadiness.totalGuests - checkInReadiness.pendingGuests.length
      : checkOutReadiness.totalGuests - checkOutReadiness.pendingGuests.length;
  const activeTotalCount =
    activeStage === 'CHECK_IN'
      ? checkInReadiness.totalGuests
      : checkOutReadiness.totalGuests;
  const activeProgressPct =
    activeTotalCount > 0
      ? Math.min(100, Math.round((activeProcessedCount / activeTotalCount) * 100))
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Bar: Back Button + Unsaved Warning + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="h-8 px-2.5 -ml-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#1F4E43] hover:bg-stone-100/70 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Lịch được phân công</span>
        </button>

        <div className="flex items-center gap-2">
          {hasUnconfirmedChanges && (
            <span className="h-8 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 text-[11px] font-semibold text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Còn thay đổi nháp chưa bấm xác nhận</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => loadTripData()}
            className="h-8 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Compact Trip Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E1D8] px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-stone-500 uppercase">
              Chuyến #{manifest.scheduleId}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#1F4E43]">
              <ShieldCheck className="w-3 h-3" />
              {currentGuideRole?.isLead ? 'Guide Trưởng đoàn' : 'Guide Phụ trách'}
            </span>
            <span className="text-stone-400 hidden sm:inline">•</span>
            <span className="text-stone-600 font-medium">
              {formatVietnamDateTime(manifest.startsAt)} → {formatVietnamDateTime(manifest.endsAt)}
            </span>
          </div>
          <h1 className="font-editorial text-xl sm:text-3xl font-semibold tracking-tight text-[#1C2526] break-words">
            {manifest.tourTitle}
          </h1>
        </div>

        {/* Compact Progress Indicator */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
          <div className="min-w-[180px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">
                Tiến độ {activeStage === 'CHECK_IN' ? 'Check-in' : 'Check-out'}
              </span>
              <span className="font-mono font-bold text-[#1F4E43]">
                {activeProcessedCount}/{activeTotalCount} khách ({activeProgressPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1F4E43] transition-all"
                style={{ width: `${activeProgressPct}%` }}
              />
            </div>
          </div>


        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div role={feedbackBanner.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-semibold',
            feedbackBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : feedbackBanner.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          )}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Desktop 2-Column Layout: Left Sidebar (Trip Info & Equipment Summary) + Right Main Area (Check-in/Check-out List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT SIDEBAR: Trip Logistics, Time Windows & Booking Equipment Summary */}
        <aside className="order-2 lg:order-1 lg:col-span-3 space-y-4 lg:sticky lg:top-16">
          {/* Trip Logistics Card */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-2">
              Thông tin chuyến đi
            </h2>

            <div className="space-y-2.5">
              <div>
                <span className="text-[11px] text-stone-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#1F4E43]" />
                  Khởi hành (VN)
                </span>
                <p className="font-semibold text-stone-900 mt-0.5">
                  {formatVietnamDateTime(manifest.startsAt)}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-stone-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Kết thúc (VN)
                </span>
                <p className="font-semibold text-stone-900 mt-0.5">
                  {formatVietnamDateTime(manifest.endsAt)}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1F4E43]" />
                  Điểm tập trung
                </span>
                <p className="font-semibold text-stone-900 mt-0.5 leading-snug">
                  {manifest.meetingPoint || 'Theo thông báo đoàn'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-stone-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#1F4E43]" />
                  Tổng hành khách:
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {checkInReadiness.totalGuests} / {manifest.capacity} chỗ
                </span>
              </div>

              {manifest.contactPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#1F4E43]" />
                    Liên hệ:
                  </span>
                  <span className="font-mono font-semibold text-stone-800">
                    {manifest.contactPhone}
                  </span>
                </div>
              )}
            </div>

            {manifest.assignedGuides && manifest.assignedGuides.length > 0 && (
              <div className="pt-2.5 border-t border-stone-100 space-y-1.5">
                <span className="text-[11px] text-stone-500 block">Guide phụ trách:</span>
                <div className="flex flex-wrap gap-1.5">
                  {manifest.assignedGuides.map((g) => (
                    <span
                      key={g.id || g.guideId}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                        g.isLead
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      )}
                    >
                      {g.fullName} {g.isLead ? '(Lead)' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Windows Status Card */}
          <details className="group bg-white rounded-2xl border border-[#E6E1D8] p-4 shadow-2xs space-y-3 text-xs">
            <summary className="cursor-pointer list-none flex items-center justify-between font-mono font-bold uppercase tracking-wider text-stone-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1F4E43]" />
                <span>Khung giờ thao tác</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 transition-transform group-open:rotate-180" />
            </summary>

            <div
              className={cn(
                'p-2.5 rounded-xl border space-y-1',
                checkInReport?.roundStatus === 'CONFIRMED'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : checkInTimeWindow.allowed
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/60'
              )}
            >
              <div className="flex items-center justify-between font-bold text-stone-900">
                <span>1. Lượt Check-in</span>
                <span className="text-[11px] font-semibold text-[#1F4E43]">
                  {checkInReport?.roundStatus === 'CONFIRMED'
                    ? 'Đã xác nhận'
                    : checkInTimeWindow.allowed
                    ? 'Đang mở'
                    : 'Chưa mở'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {checkInReport?.roundStatus === 'CONFIRMED'
                  ? `Xác nhận lúc ${formatVietnamDateTime(checkInReport.submittedAt)}`
                  : `Mở từ ${formatVietnamDateTime(checkInTimeWindow.unlockAtIso)} (1 giờ trước khởi hành)`}
              </p>
            </div>

            <div
              className={cn(
                'p-2.5 rounded-xl border space-y-1',
                checkOutReport?.roundStatus === 'CONFIRMED'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : checkOutTimeWindow.allowed && isCheckInConfirmed
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-stone-200 bg-stone-50'
              )}
            >
              <div className="flex items-center justify-between font-bold text-stone-900">
                <span>2. Lượt Check-out</span>
                <span className="text-[11px] font-semibold text-stone-700">
                  {checkOutReport?.roundStatus === 'CONFIRMED'
                    ? 'Đã xác nhận'
                    : checkOutTimeWindow.allowed && isCheckInConfirmed
                    ? 'Đang mở'
                    : 'Đang khóa'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {checkOutReport?.roundStatus === 'CONFIRMED'
                  ? `Xác nhận lúc ${formatVietnamDateTime(checkOutReport.submittedAt)}`
                  : `Mở từ ${formatVietnamDateTime(manifest.endsAt)} (khi kết thúc chuyến)`}
              </p>
            </div>
          </details>

          {/* Booking Equipment Summary Card (if any booking ordered equipment) */}
          {Object.keys(bookingOrderedEquipmentMap).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 shadow-2xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#1F4E43]" />
                  <span>Thiết bị đơn đặt</span>
                </h2>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(bookingOrderedEquipmentMap).map(([bIdStr, eqMap]) => {
                  const bId = Number(bIdStr);
                  const bObj = manifest.bookings.find((b) => b.bookingId === bId);
                  return (
                    <div
                      key={bId}
                      className="rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-stone-800">
                        <span className="truncate">Đơn #{bObj?.bookingCode || bId}</span>
                        <span className="text-stone-500 font-normal shrink-0">
                          {bObj?.passengers.length || 0} khách
                        </span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(eqMap).map(([eqIdStr, meta]) => {
                          const eqId = Number(eqIdStr);
                          const allocated = bookingAllocatedTotalsMap[bId]?.[eqId] || 0;
                          return (
                            <div
                              key={eqId}
                              className="flex items-center justify-between text-[11px]"
                            >
                              <span className="text-stone-700 truncate pr-2">
                                {meta.equipmentName}
                              </span>
                              <span
                                className={cn(
                                  'font-mono font-bold px-1.5 py-0.5 rounded-md',
                                  allocated === meta.orderedQuantity
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                )}
                              >
                                Giao {allocated}/{meta.orderedQuantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN WORKSPACE: Stage Switcher + Passenger Table + Batch Confirmation */}
        <section className="order-1 lg:order-2 lg:col-span-9 min-w-0 space-y-4">
          {/* Stage Tabs & Quick Action Bar */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-3 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Round Switcher */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:inline-flex sm:items-center gap-1 rounded-xl bg-[#F7F4EE] p-1 border border-[#E6E1D8]">
              <button
                type="button"
                aria-pressed={activeStage === 'CHECK_IN'}
                onClick={() => setActiveStage('CHECK_IN')}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer',
                  activeStage === 'CHECK_IN'
                    ? 'bg-[#1F4E43] text-white shadow-2xs'
                    : 'text-stone-700 hover:bg-white/80'
                )}
              >
                <span>1. Check-in & Giao đồ</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold',
                    activeStage === 'CHECK_IN'
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200/80 text-stone-700'
                  )}
                >
                  {checkInReadiness.presentCount + checkInReadiness.absentCount}/
                  {checkInReadiness.totalGuests}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={activeStage === 'CHECK_OUT'}
                onClick={() => setActiveStage('CHECK_OUT')}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer',
                  activeStage === 'CHECK_OUT'
                    ? 'bg-[#1F4E43] text-white shadow-2xs'
                    : 'text-stone-700 hover:bg-white/80'
                )}
              >
                <span>2. Check-out & Thu đồ</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold',
                    activeStage === 'CHECK_OUT'
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200/80 text-stone-700'
                  )}
                >
                  {checkOutReadiness.totalGuests - checkOutReadiness.pendingGuests.length}/
                  {checkOutReadiness.totalGuests}
                </span>
              </button>
            </div>

            {/* Search & Quick Mark All */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  id="guide-guest-search"
                  aria-label="Tìm hành khách theo tên, số điện thoại hoặc mã đặt chỗ"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Tìm tên khách, mã đơn..."
                  className="h-9 w-full rounded-xl border border-stone-300 bg-white pl-8 pr-3 text-xs text-stone-800 outline-none transition-colors focus:border-[#1F4E43]"
                />
              </div>

              {activeStage === 'CHECK_IN' &&
                !isCheckInLocked &&
                checkInReadiness.pendingGuests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRemainingCheckInPresent}
                    className="h-9 px-3 rounded-xl border border-[#1F4E43]/30 bg-emerald-50/80 hover:bg-[#1F4E43] text-[#1F4E43] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Chọn tất cả Có mặt ({checkInReadiness.pendingGuests.length})</span>
                  </button>
                )}

              {activeStage === 'CHECK_OUT' &&
                !isCheckOutLocked &&
                checkOutReadiness.pendingGuests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRemainingCheckOutCompleted}
                    className="h-9 px-3 rounded-xl border border-[#1F4E43]/30 bg-emerald-50/80 hover:bg-[#1F4E43] text-[#1F4E43] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Chọn tất cả Hoàn thành ({checkOutReadiness.pendingGuests.length})</span>
                  </button>
                )}
            </div>
          </div>

          {/* ====================================================================
              STAGE 1: CHECK-IN & EQUIPMENT HANDOVER
             ==================================================================== */}
          {activeStage === 'CHECK_IN' && checkInReport && (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xs overflow-hidden">
              {/* Lock / Status Notice Bar */}
              {!checkInTimeWindow.allowed && checkInReport.roundStatus !== 'CONFIRMED' && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold">Đang khóa thao tác Check-in: </span>
                    <span>{checkInTimeWindow.message}</span>
                  </div>
                </div>
              )}

              {checkInReport.roundStatus === 'CONFIRMED' && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Đã xác nhận hoàn tất lượt Check-in</strong> lúc{' '}
                      {formatVietnamDateTime(checkInReport.submittedAt, true)} bởi{' '}
                      <strong>{checkInReport.submittedByGuideName}</strong>.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-800">
                    Có mặt: {checkInReadiness.presentCount} • Vắng: {checkInReadiness.absentCount}
                  </span>
                </div>
              )}

              {/* DESKTOP TABLE FOR CHECK-IN */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                      <th className="py-3 px-4 font-bold w-[25%]">Hành khách & Đơn</th>
                      <th className="py-3 px-3 font-bold w-[20%]">Trạng thái Check-in</th>
                      <th className="py-3 px-3 font-bold w-[33%]">Thiết bị bàn giao</th>
                      <th className="py-3 px-3 font-bold w-[10%]">Ảnh hiện trạng</th>
                      <th className="py-3 px-4 font-bold w-[12%]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredCheckInParticipants.map((participant, idx) => {
                      const hasBookingEquipment = participant.equipmentItems.length > 0;
                      const allocatedItems = participant.equipmentItems.filter(
                        (eq) => eq.allocatedQuantity > 0
                      );
                      const totalAllocatedQty = allocatedItems.reduce(
                        (sum, eq) => sum + eq.allocatedQuantity,
                        0
                      );
                      const hasDamagedOrMissing = allocatedItems.some(
                        (eq) =>
                          (eq.condition === 'DAMAGED' || eq.condition === 'MISSING') &&
                          (!eq.note || !eq.note.trim())
                      );
                      const isEqExpanded =
                        Boolean(expandedEquipmentRows[participant.participantId]) ||
                        hasDamagedOrMissing;
                      const noteRowKey = `ci-note-${participant.participantId}`;
                      const isNoteExpanded =
                        Boolean(expandedNoteRows[noteRowKey]) || Boolean(participant.note);
                      const allPhotos = participant.equipmentItems.flatMap((eq) =>
                        (eq.photos || []).map((ph) => ({
                          ...ph,
                          equipmentId: eq.equipmentId,
                          equipmentName: eq.equipmentName,
                        }))
                      );

                      return (
                        <React.Fragment key={participant.participantId}>
                          <tr
                            className={cn(
                              'hover:bg-[#FDFBF7] transition-colors align-top',
                              participant.status === 'PENDING' && 'bg-amber-50/15'
                            )}
                          >
                            {/* 1. Passenger Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-bold text-stone-900 text-xs sm:text-sm leading-snug flex items-center gap-1.5 flex-wrap">
                                    <span>{participant.fullName}</span>
                                    {participant.bookingCustomer && (
                                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-semibold">
                                        Đại diện
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-stone-500 font-mono mt-0.5 leading-relaxed">
                                    Đơn #{participant.bookingCode}
                                    {participant.phone ? ` • ${participant.phone}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Check-in Status */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  aria-pressed={participant.status === 'PRESENT'}
                                  disabled={isCheckInLocked}
                                  onClick={() =>
                                    handleMarkGuestCheckIn(participant.participantId, 'PRESENT')
                                  }
                                  className={cn(
                                    'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
                                    participant.status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-400 hover:bg-emerald-50/70'
                                  )}
                                >
                                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span>Có mặt</span>
                                </button>

                                <button
                                  type="button"
                                  aria-pressed={participant.status === 'ABSENT'}
                                  disabled={isCheckInLocked}
                                  onClick={() =>
                                    handleMarkGuestCheckIn(participant.participantId, 'ABSENT')
                                  }
                                  className={cn(
                                    'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
                                    participant.status === 'ABSENT'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-white text-stone-700 border-stone-300 hover:border-rose-400 hover:bg-rose-50/70'
                                  )}
                                >
                                  <UserX className="w-3.5 h-3.5 shrink-0" />
                                  <span>Vắng</span>
                                </button>
                              </div>
                              {participant.markedAt ? (
                                <div className="text-[10px] font-mono text-stone-500 mt-1.5">
                                  Đánh dấu: {formatVietnamTimeOnly(participant.markedAt, true)}
                                </div>
                              ) : (
                                <div className="text-[10px] font-semibold text-amber-700 mt-1.5">
                                  Chưa đánh dấu
                                </div>
                              )}
                            </td>

                            {/* 3. Equipment Handover Summary + Expand Toggle */}
                            <td className="py-3.5 px-3">
                              {!hasBookingEquipment ? (
                                <span className="text-[11px] text-stone-400 italic">
                                  Tự chuẩn bị / Không thuê
                                </span>
                              ) : participant.status === 'ABSENT' ? (
                                <span className="text-[11px] text-stone-400 italic">
                                  Khách vắng mặt (0 món)
                                </span>
                              ) : (
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {participant.equipmentItems.map((eq) => {
                                        const ordered =
                                          bookingOrderedEquipmentMap[participant.bookingId]?.[
                                            eq.equipmentId
                                          ]?.orderedQuantity ??
                                          eq.bookingOrderedQuantity ??
                                          0;
                                        const isAllocated = eq.allocatedQuantity > 0;
                                        return (
                                          <span
                                            key={eq.equipmentId}
                                            className={cn(
                                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                                              isAllocated
                                                ? CONDITION_LABELS[eq.condition].badgeClass
                                                : 'border-amber-200 bg-amber-50/80 text-amber-900'
                                            )}
                                          >
                                            <Package className="w-3 h-3 shrink-0 opacity-75" />
                                            <span className="truncate max-w-[140px]">
                                              {eq.equipmentName}
                                            </span>
                                            <span className="font-mono font-bold">
                                              {eq.allocatedQuantity}/{ordered}
                                            </span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="text-[10px] text-stone-500">
                                      {allocatedItems.length === 0 ? (
                                        <span>
                                          Chưa bàn giao · Đơn đặt {participant.equipmentItems.length}{' '}
                                          loại thiết bị
                                        </span>
                                      ) : (
                                        <span className="text-emerald-700 font-medium">
                                          Đã giao {totalAllocatedQty} món ({allocatedItems.length}/
                                          {participant.equipmentItems.length} loại)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    aria-expanded={isEqExpanded}
                                    onClick={() => toggleEquipmentRow(participant.participantId)}
                                    className={cn(
                                      'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer',
                                      isEqExpanded
                                        ? 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        : 'border border-[#1F4E43]/30 bg-[#1F4E43]/5 text-[#1F4E43] hover:bg-[#1F4E43] hover:text-white'
                                    )}
                                  >
                                    <span>{isEqExpanded ? 'Thu gọn' : 'Giao đồ'}</span>
                                    {isEqExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* 4. Compact Photos Column */}
                            <td className="py-3.5 px-3">
                              {allPhotos.length === 0 ? (
                                <span className="text-[11px] text-stone-400 italic">Chưa có</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {allPhotos.map((photo) => (
                                    <button
                                      type="button"
                                      key={photo.id}
                                      aria-label={`Xem ảnh ${photo.fileName}`}
                                      onClick={() => setPreviewPhotoUrl(photo.url)}
                                      className="h-9 w-9 overflow-hidden rounded-lg border border-[#D6CEBE] hover:border-[#1F4E43] transition-colors cursor-pointer"
                                    >
                                      <img
                                        src={photo.url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* 5. Compact Optional Note Column */}
                            <td className="py-3.5 px-4">
                              {!isNoteExpanded ? (
                                <button
                                  type="button"
                                  aria-expanded={isNoteExpanded}
                                  onClick={() => toggleNoteRow(noteRowKey)}
                                  className="h-8 px-2.5 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 hover:border-[#1F4E43]/40 hover:bg-[#1F4E43]/5 text-xs font-medium text-stone-600 hover:text-[#1F4E43] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Plus className="w-3 h-3 shrink-0" />
                                  <span>Ghi chú</span>
                                </button>
                              ) : (
                                <input
                                  type="text"
                                  disabled={isCheckInLocked}
                                  aria-label={`Ghi chú cho ${participant.fullName}`}
                                  value={participant.note || ''}
                                  onChange={(e) =>
                                    handleGuestCheckInNoteChange(
                                      participant.participantId,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ghi chú khách..."
                                  className="h-8 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-800 outline-none focus:border-[#1F4E43]"
                                />
                              )}
                            </td>
                          </tr>

                          {/* EXPANDED EQUIPMENT DETAIL DRAWER ROW */}
                          {hasBookingEquipment &&
                            participant.status !== 'ABSENT' &&
                            isEqExpanded && (
                              <tr className="bg-[#F7F4EE]/60">
                                <td colSpan={5} className="px-4 py-3.5 border-t border-stone-200/70">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs text-stone-600">
                                      <span className="font-bold text-stone-800">
                                        Phân bổ thiết bị thực tế cho khách: {participant.fullName}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleEquipmentRow(participant.participantId)
                                        }
                                        className="text-xs font-medium text-stone-500 hover:text-stone-800 underline cursor-pointer"
                                      >
                                        Đóng chi tiết
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                                      {participant.equipmentItems.map((eq) =>
                                        renderCheckInEquipment(participant, eq)
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TABLET & MOBILE COMPACT CARDS FOR CHECK-IN */}
              <div className="md:hidden divide-y divide-stone-200">
                {filteredCheckInParticipants.map((participant, idx) => {
                  const hasBookingEquipment = participant.equipmentItems.length > 0;
                  const allocatedItems = participant.equipmentItems.filter(
                    (eq) => eq.allocatedQuantity > 0
                  );
                  const isEqExpanded = Boolean(expandedEquipmentRows[participant.participantId]);
                  const noteRowKey = `ci-note-${participant.participantId}`;
                  const isNoteExpanded =
                    Boolean(expandedNoteRows[noteRowKey]) || Boolean(participant.note);
                  const allPhotos = participant.equipmentItems.flatMap((eq) =>
                    (eq.photos || []).map((ph) => ({
                      ...ph,
                      equipmentId: eq.equipmentId,
                      equipmentName: eq.equipmentName,
                    }))
                  );

                  return (
                    <div key={participant.participantId} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-stone-900 text-sm">
                            {idx + 1}. {participant.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-stone-500">
                            Đơn #{participant.bookingCode}
                            {participant.phone ? ` • ${participant.phone}` : ''}
                          </div>
                        </div>
                        {participant.markedAt && (
                          <span className="text-[10px] font-mono text-stone-500">
                            {formatVietnamTimeOnly(participant.markedAt)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          aria-pressed={participant.status === 'PRESENT'}
                          disabled={isCheckInLocked}
                          onClick={() =>
                            handleMarkGuestCheckIn(participant.participantId, 'PRESENT')
                          }
                          className={cn(
                            'h-9 rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors',
                            participant.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-stone-700 border-stone-300'
                          )}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Có mặt</span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={participant.status === 'ABSENT'}
                          disabled={isCheckInLocked}
                          onClick={() =>
                            handleMarkGuestCheckIn(participant.participantId, 'ABSENT')
                          }
                          className={cn(
                            'h-9 rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors',
                            participant.status === 'ABSENT'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-stone-700 border-stone-300'
                          )}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Vắng mặt</span>
                        </button>
                      </div>

                      {hasBookingEquipment && participant.status !== 'ABSENT' && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {participant.equipmentItems.map((eq) => {
                            const ordered =
                              bookingOrderedEquipmentMap[participant.bookingId]?.[eq.equipmentId]
                                ?.orderedQuantity ??
                              eq.bookingOrderedQuantity ??
                              0;
                            const isAllocated = eq.allocatedQuantity > 0;
                            return (
                              <span
                                key={eq.equipmentId}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                  isAllocated
                                    ? CONDITION_LABELS[eq.condition].badgeClass
                                    : 'border-amber-200 bg-amber-50/80 text-amber-900'
                                )}
                              >
                                <Package className="w-3 h-3 shrink-0 opacity-75" />
                                <span>{eq.equipmentName}</span>
                                <span className="font-mono font-bold">
                                  {eq.allocatedQuantity}/{ordered}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Equipment & Note Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        {hasBookingEquipment && participant.status !== 'ABSENT' ? (
                          <button
                            type="button"
                            aria-expanded={isEqExpanded}
                            onClick={() => toggleEquipmentRow(participant.participantId)}
                            className="h-8 px-2.5 rounded-lg border border-[#1F4E43]/30 bg-[#1F4E43]/5 text-xs font-semibold text-[#1F4E43] inline-flex items-center gap-1"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>
                              {isEqExpanded
                                ? 'Thu gọn'
                                : `Giao đồ (${allocatedItems.length}/${participant.equipmentItems.length})`}
                            </span>
                            {isEqExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400">Không giao thiết bị</span>
                        )}

                        <button
                          type="button"
                          aria-expanded={isNoteExpanded}
                          onClick={() => toggleNoteRow(noteRowKey)}
                          className="h-8 px-2.5 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 text-xs font-medium text-stone-600 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isNoteExpanded ? 'Ẩn ghi chú' : 'Ghi chú'}</span>
                        </button>
                      </div>

                      {isNoteExpanded && (
                        <input
                          type="text"
                          disabled={isCheckInLocked}
                          aria-label={`Ghi chú cho ${participant.fullName}`}
                          value={participant.note || ''}
                          onChange={(e) =>
                            handleGuestCheckInNoteChange(
                              participant.participantId,
                              e.target.value
                            )
                          }
                          placeholder="Nhập ghi chú check-in cho khách..."
                          className="w-full rounded-xl border border-stone-300 px-3 h-9 text-xs sm:text-sm"
                        />
                      )}

                      {hasBookingEquipment && participant.status !== 'ABSENT' && isEqExpanded && (
                        <div className="space-y-2 rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                          {participant.equipmentItems.map((eq) =>
                            renderCheckInEquipment(participant, eq)
                          )}
                        </div>
                      )}

                      {allPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {allPhotos.map((ph) => (
                            <button
                              type="button"
                              key={ph.id}
                              aria-label={`Xem ảnh ${ph.fileName}`}
                              onClick={() => setPreviewPhotoUrl(ph.url)}
                              className="w-9 h-9 rounded-lg overflow-hidden border border-stone-300"
                            >
                              <img src={ph.url} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BATCH CHECK-IN CONFIRMATION FOOTER */}
              <div className="border-t border-[#E6E1D8] bg-[#F7F4EE]/70 p-4 space-y-3">
                {/* Readiness Reasons */}
                {(checkInReadiness.pendingGuests.length > 0 ||
                  checkInReadiness.missingIssueNotes.length > 0 ||
                  checkInReadiness.unallocatedEquipmentWarnings.length > 0) &&
                  checkInReport.roundStatus !== 'CONFIRMED' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {(checkInReadiness.pendingGuests.length > 0 ||
                        checkInReadiness.missingIssueNotes.length > 0) && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Chưa thể xác nhận lượt Check-in:</span>
                          </div>
                          {checkInReadiness.pendingGuests.length > 0 && (
                            <p className="text-[11px]">
                              • Còn <strong>{checkInReadiness.pendingGuests.length} khách</strong>{' '}
                              chưa chọn Có mặt / Vắng:{' '}
                              {checkInReadiness.pendingGuests.map((p) => p.fullName).join(', ')}
                            </p>
                          )}
                          {checkInReadiness.missingIssueNotes.map((msg, i) => (
                            <p key={i} className="text-[11px]">
                              • {msg}
                            </p>
                          ))}
                        </div>
                      )}

                      {checkInReadiness.unallocatedEquipmentWarnings.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Lưu ý phân bổ thiết bị theo đơn:</span>
                          </div>
                          {checkInReadiness.unallocatedEquipmentWarnings.map((w, i) => (
                            <p key={i} className="text-[11px]">
                              • {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {/* Optional General Note Toggle + Single Batch Confirm Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    {!showGeneralNoteInput && !checkInReport.generalNote ? (
                      <button
                        type="button"
                        onClick={() => setShowGeneralNoteInput(true)}
                        className="h-9 px-3 rounded-xl border border-stone-300 bg-white hover:border-[#1F4E43] text-xs font-semibold text-stone-700 hover:text-[#1F4E43] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>+ Thêm ghi chú chung toàn đoàn (tùy chọn)</span>
                      </button>
                    ) : (
                      <input
                        type="text"
                        disabled={isCheckInLocked}
                        aria-label="Ghi chú chung lượt check-in"
                        value={checkInReport.generalNote || ''}
                        onChange={(e) =>
                          updateCheckInDraft((prev) => ({
                            ...prev,
                            generalNote: e.target.value,
                          }))
                        }
                        placeholder="Ghi chú chung lượt Check-in toàn đoàn..."
                        className="h-9 w-full max-w-md rounded-xl border border-stone-300 bg-white px-3 text-xs sm:text-sm text-stone-800 outline-none focus:border-[#1F4E43]"
                      />
                    )}
                  </div>

                  {checkInReport.roundStatus !== 'CONFIRMED' ? (
                    <button
                      type="button"
                      disabled={isCheckInLocked || !checkInReadiness.canSubmit}
                      onClick={handleConfirmCheckInBatch}
                      className="h-10 px-5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isSubmittingCheckIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi báo cáo Check-in...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Xác nhận hoàn tất check-in</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã gửi xác nhận lượt Check-in</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              STAGE 2: CHECK-OUT & EQUIPMENT RETURN
             ==================================================================== */}
          {activeStage === 'CHECK_OUT' && (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xs overflow-hidden">
              {!isCheckInConfirmed ? (
                <div className="p-8 text-center space-y-3">
                  <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Cần hoàn tất lượt Check-in trước khi mở Check-out
                  </h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Dữ liệu nhận lại thiết bị lúc Check-out được đối chiếu trực tiếp từ số lượng đã
                    bàn giao cho từng khách ở lượt Check-in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveStage('CHECK_IN')}
                    className="h-9 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Chuyển sang lượt Check-in
                  </button>
                </div>
              ) : checkOutReport ? (
                <>
                  {/* Lock / Status Notice Bar */}
                  {!checkOutTimeWindow.allowed && checkOutReport.roundStatus !== 'CONFIRMED' && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-900">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold">Chưa đến giờ mở Check-out: </span>
                        <span>{checkOutTimeWindow.message}</span>
                      </div>
                    </div>
                  )}

                  {checkOutReport.roundStatus === 'CONFIRMED' && (
                    <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Đã xác nhận hoàn tất lượt Check-out</strong> lúc{' '}
                          {formatVietnamDateTime(checkOutReport.submittedAt, true)} bởi{' '}
                          <strong>{checkOutReport.submittedByGuideName}</strong>.
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-800">
                        Hoàn thành: {checkOutReadiness.completedCount} • Thiết bị trả:{' '}
                        {checkOutReadiness.totalReturnedItems}/{checkOutReadiness.totalIssuedItems}
                      </span>
                    </div>
                  )}

                  {/* DESKTOP TABLE FOR CHECK-OUT */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                          <th className="py-3 px-4 font-bold w-[25%]">Hành khách & Đơn</th>
                          <th className="py-3 px-3 font-bold w-[22%]">Trạng thái kết thúc</th>
                          <th className="py-3 px-3 font-bold w-[31%]">Đối chiếu thiết bị trả</th>
                          <th className="py-3 px-3 font-bold w-[10%]">Ảnh nhận lại</th>
                          <th className="py-3 px-4 font-bold w-[12%]">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {filteredCheckOutParticipants.map((participant, idx) => {
                          const hasIssuedEquipment = participant.equipmentItems.length > 0;
                          const hasShortageOrIssue = participant.equipmentItems.some(
                            (eq) =>
                              eq.returnedQuantity < eq.issuedQuantity || eq.condition !== 'GOOD'
                          );
                          const isEqExpanded =
                            Boolean(expandedEquipmentRows[participant.participantId]) ||
                            hasShortageOrIssue;
                          const noteRowKey = `co-note-${participant.participantId}`;
                          const isNoteExpanded =
                            Boolean(expandedNoteRows[noteRowKey]) || Boolean(participant.note);
                          const allPhotos = participant.equipmentItems.flatMap((eq) =>
                            (eq.photos || []).map((ph) => ({
                              ...ph,
                              equipmentId: eq.equipmentId,
                              equipmentName: eq.equipmentName,
                            }))
                          );

                          return (
                            <React.Fragment key={participant.participantId}>
                              <tr
                                className={cn(
                                  'hover:bg-[#FDFBF7] transition-colors align-top',
                                  participant.status === 'PENDING' && 'bg-amber-50/15'
                                )}
                              >
                                {/* 1. Passenger */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                                        {participant.fullName}
                                      </div>
                                      <div className="text-[11px] text-stone-500 font-mono mt-0.5 leading-relaxed">
                                        Đơn #{participant.bookingCode} • CI:{' '}
                                        {participant.checkInStatus === 'PRESENT'
                                          ? 'Có mặt'
                                          : 'Vắng'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Check-out Status */}
                                <td className="py-3.5 px-3">
                                  {participant.checkInStatus === 'ABSENT' ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                                      Vắng từ lúc Check-in
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        aria-pressed={participant.status === 'COMPLETED'}
                                        disabled={isCheckOutLocked}
                                        onClick={() =>
                                          handleMarkGuestCheckOut(
                                            participant.participantId,
                                            'COMPLETED'
                                          )
                                        }
                                        className={cn(
                                          'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
                                          participant.status === 'COMPLETED'
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                            : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-400 hover:bg-emerald-50/70'
                                        )}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>Hoàn thành</span>
                                      </button>

                                      <button
                                        type="button"
                                        aria-pressed={participant.status === 'EARLY_DEPARTURE'}
                                        disabled={isCheckOutLocked}
                                        onClick={() =>
                                          handleMarkGuestCheckOut(
                                            participant.participantId,
                                            'EARLY_DEPARTURE'
                                          )
                                        }
                                        className={cn(
                                          'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
                                          participant.status === 'EARLY_DEPARTURE'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                            : 'bg-white text-stone-700 border-stone-300 hover:border-amber-400 hover:bg-amber-50/70'
                                        )}
                                      >
                                        <span>Về sớm / Tách đoàn</span>
                                      </button>
                                    </div>
                                  )}
                                  {participant.markedAt && (
                                    <div className="text-[10px] font-mono text-stone-500 mt-1.5">
                                      Đánh dấu: {formatVietnamTimeOnly(participant.markedAt, true)}
                                    </div>
                                  )}
                                </td>

                                {/* 3. Returned Equipment Summary */}
                                <td className="py-3.5 px-3">
                                  {!hasIssuedEquipment ? (
                                    <span className="text-[11px] text-stone-400 italic">
                                      Không nhận thiết bị lúc Check-in
                                    </span>
                                  ) : (
                                    <div className="flex items-start justify-between gap-2.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {participant.equipmentItems.map((eq) => (
                                          <span
                                            key={eq.equipmentId}
                                            className={cn(
                                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                              eq.returnedQuantity < eq.issuedQuantity ||
                                                eq.condition !== 'GOOD'
                                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            )}
                                          >
                                            <Package className="w-3 h-3 shrink-0 opacity-75" />
                                            <span>{eq.equipmentName}</span>
                                            <span className="font-mono font-bold">
                                              {eq.returnedQuantity}/{eq.issuedQuantity}
                                            </span>
                                          </span>
                                        ))}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleEquipmentRow(participant.participantId)
                                        }
                                        className={cn(
                                          'h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer',
                                          isEqExpanded
                                            ? 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                                            : 'border border-[#1F4E43]/30 bg-[#1F4E43]/5 text-[#1F4E43] hover:bg-[#1F4E43] hover:text-white'
                                        )}
                                      >
                                        <span>{isEqExpanded ? 'Thu gọn' : 'Thu đồ'}</span>
                                        {isEqExpanded ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* 4. Return Photos */}
                                <td className="py-3.5 px-3">
                                  {allPhotos.length === 0 ? (
                                    <span className="text-[11px] text-stone-400 italic">
                                      Chưa có
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {allPhotos.map((photo) => (
                                        <button
                                          type="button"
                                          key={photo.id}
                                          aria-label={`Xem ảnh ${photo.fileName}`}
                                          onClick={() => setPreviewPhotoUrl(photo.url)}
                                          className="h-9 w-9 overflow-hidden rounded-lg border border-[#D6CEBE] hover:border-[#1F4E43] transition-colors cursor-pointer"
                                        >
                                          <img
                                            src={photo.url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </td>

                                {/* 5. Optional Note */}
                                <td className="py-3.5 px-4">
                                  {!isNoteExpanded ? (
                                    <button
                                      type="button"
                                      aria-expanded={isNoteExpanded}
                                      onClick={() => toggleNoteRow(noteRowKey)}
                                      className="h-8 px-2.5 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 hover:border-[#1F4E43]/40 hover:bg-[#1F4E43]/5 text-xs font-medium text-stone-600 hover:text-[#1F4E43] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <Plus className="w-3 h-3 shrink-0" />
                                      <span>Ghi chú</span>
                                    </button>
                                  ) : (
                                    <input
                                      type="text"
                                      disabled={isCheckOutLocked}
                                      aria-label={`Ghi chú cho ${participant.fullName}`}
                                      value={participant.note || ''}
                                      onChange={(e) =>
                                        handleGuestCheckOutNoteChange(
                                          participant.participantId,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Ghi chú kết thúc..."
                                      className="h-8 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-800 outline-none focus:border-[#1F4E43]"
                                    />
                                  )}
                                </td>
                              </tr>

                              {/* EXPANDED CHECK-OUT EQUIPMENT DRAWER */}
                              {hasIssuedEquipment && isEqExpanded && (
                                <tr className="bg-[#F7F4EE]/60">
                                  <td colSpan={5} className="px-4 py-3.5 border-t border-stone-200/70">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                                      {participant.equipmentItems.map((eq) =>
                                        renderCheckOutEquipment(participant, eq)
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* TABLET & MOBILE COMPACT CARDS FOR CHECK-OUT */}
                  <div className="md:hidden divide-y divide-stone-200">
                    {filteredCheckOutParticipants.map((participant, idx) => {
                      const hasIssuedEquipment = participant.equipmentItems.length > 0;
                      const noteRowKey = `co-note-${participant.participantId}`;
                      const isNoteExpanded =
                        Boolean(expandedNoteRows[noteRowKey]) || Boolean(participant.note);
                      const isEqExpanded = Boolean(
                        expandedEquipmentRows[participant.participantId]
                      );

                      return (
                        <div key={participant.participantId} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-stone-900 text-sm">
                                {idx + 1}. {participant.fullName}
                              </div>
                              <div className="text-[11px] font-mono text-stone-500">
                                Đơn #{participant.bookingCode}
                              </div>
                            </div>
                          </div>

                          {participant.checkInStatus === 'ABSENT' ? (
                            <div className="rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600 font-semibold">
                              Khách vắng mặt từ lượt Check-in
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                aria-pressed={participant.status === 'COMPLETED'}
                                disabled={isCheckOutLocked}
                                onClick={() =>
                                  handleMarkGuestCheckOut(participant.participantId, 'COMPLETED')
                                }
                                className={cn(
                                  'h-9 rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors',
                                  participant.status === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-stone-700 border-stone-300'
                                )}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hoàn thành</span>
                              </button>
                              <button
                                type="button"
                                aria-pressed={participant.status === 'EARLY_DEPARTURE'}
                                disabled={isCheckOutLocked}
                                onClick={() =>
                                  handleMarkGuestCheckOut(
                                    participant.participantId,
                                    'EARLY_DEPARTURE'
                                  )
                                }
                                className={cn(
                                  'h-9 rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors',
                                  participant.status === 'EARLY_DEPARTURE'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-stone-700 border-stone-300'
                                )}
                              >
                                <span>Về sớm</span>
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            {hasIssuedEquipment ? (
                              <button
                                type="button"
                                aria-expanded={isEqExpanded}
                                onClick={() => toggleEquipmentRow(participant.participantId)}
                                className="h-8 px-2.5 rounded-lg border border-[#1F4E43]/30 bg-[#1F4E43]/5 text-xs font-semibold text-[#1F4E43] inline-flex items-center gap-1"
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>
                                  {isEqExpanded
                                    ? 'Thu gọn'
                                    : `Thu đồ (${participant.equipmentItems.length} món)`}
                                </span>
                                {isEqExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400">
                                Không nhận thiết bị
                              </span>
                            )}

                            <button
                              type="button"
                              aria-expanded={isNoteExpanded}
                              onClick={() => toggleNoteRow(noteRowKey)}
                              className="h-8 px-2.5 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 text-xs font-medium text-stone-600 inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isNoteExpanded ? 'Ẩn ghi chú' : 'Ghi chú'}</span>
                            </button>
                          </div>

                          {isNoteExpanded && (
                            <input
                              type="text"
                              disabled={isCheckOutLocked}
                              aria-label={`Ghi chú kết thúc cho ${participant.fullName}`}
                              value={participant.note || ''}
                              onChange={(e) =>
                                handleGuestCheckOutNoteChange(
                                  participant.participantId,
                                  e.target.value
                                )
                              }
                              placeholder="Ghi chú kết thúc..."
                              className="w-full h-9 rounded-xl border border-stone-300 bg-white px-3 text-xs sm:text-sm text-stone-800 outline-none focus:border-[#1F4E43]"
                            />
                          )}

                          {hasIssuedEquipment && isEqExpanded && (
                            <div className="space-y-2 rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                              {participant.equipmentItems.map((eq) =>
                                renderCheckOutEquipment(participant, eq)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* BATCH CHECK-OUT CONFIRMATION FOOTER */}
                  <div className="border-t border-[#E6E1D8] bg-[#F7F4EE]/70 p-4 space-y-3">
                    {(checkOutReadiness.pendingGuests.length > 0 ||
                      checkOutReadiness.missingReturnNotes.length > 0) &&
                      checkOutReport.roundStatus !== 'CONFIRMED' && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Chưa thể xác nhận lượt Check-out:</span>
                          </div>
                          {checkOutReadiness.pendingGuests.length > 0 && (
                            <p className="text-[11px]">
                              • Còn <strong>{checkOutReadiness.pendingGuests.length} khách</strong>{' '}
                              chưa chọn trạng thái kết thúc chuyến:{' '}
                              {checkOutReadiness.pendingGuests.map((p) => p.fullName).join(', ')}
                            </p>
                          )}
                          {checkOutReadiness.missingReturnNotes.map((msg, i) => (
                            <p key={i} className="text-[11px]">
                              • {msg}
                            </p>
                          ))}
                        </div>
                      )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          disabled={isCheckOutLocked}
                          aria-label="Ghi chú chung lượt check-out"
                          value={checkOutReport.generalNote || ''}
                          onChange={(e) =>
                            updateCheckOutDraft((prev) => ({
                              ...prev,
                              generalNote: e.target.value,
                            }))
                          }
                          placeholder="Ghi chú tổng kết cuối hành trình (tùy chọn)..."
                          className="h-9 w-full max-w-md rounded-xl border border-stone-300 bg-white px-3 text-xs sm:text-sm text-stone-800 outline-none focus:border-[#1F4E43]"
                        />
                      </div>

                      {checkOutReport.roundStatus !== 'CONFIRMED' ? (
                        <button
                          type="button"
                          disabled={isCheckOutLocked || !checkOutReadiness.canSubmit}
                          onClick={handleConfirmCheckOutBatch}
                          className="h-10 px-5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {isSubmittingCheckOut ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang gửi báo cáo Check-out...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Xác nhận hoàn tất check-out</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Đã gửi xác nhận lượt Check-out</span>
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={Boolean(previewPhotoUrl)} onClose={() => setPreviewPhotoUrl(null)} title="Ảnh hiện trạng thiết bị" maxWidth="2xl">
        {previewPhotoUrl && <img src={previewPhotoUrl} alt="Ảnh hiện trạng thiết bị" className="mx-auto max-h-[70vh] max-w-full object-contain" />}
      </Modal>
    </div>
  );
};

export default GuideTripDetailPage;
