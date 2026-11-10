import { Modal } from '../../../components/ui/Modal';
import { AdminSectionNav } from '../components/AdminSectionNav';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Users,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Boxes,
  RefreshCw,
  ExternalLink,
  ClipboardCheck,
  Camera,
  XCircle,
  Package,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  attendanceApi,
  formatVietnamDateTime,
} from '../../../features/tours/api/attendance.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import {
  equipmentApi,
  aggregateScheduleEquipment,
} from '../../../features/equipment/api/equipment.api';
import type {
  ScheduleDetailResponse,
  TourDetailResponse,
  TourScheduleRangeResponse,
} from '../../../features/tours/types/tour.types';
import type {
  HandoverEquipmentCondition,
  HandoverPhotoRecord,
  ScheduleGuideSummary,
  ScheduleOperationsReport,
} from '../../../features/tours/types/attendance.types';
import type {
  BookingSummaryResponse,
  BookingDetailResponse,
} from '../../../features/bookings/types/booking.types';
import type {
  EquipmentReservationResponse,
  ScheduleEquipmentSummaryResponse,
} from '../../../features/equipment/types/equipment.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { navigateTo, useLocation } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import {
  formatDateTime,
  formatVND,
} from '../../../lib/utils';

export interface AdminScheduleDetailPageProps {
  scheduleIdProp?: number;
}

const ADMIN_CONDITION_BADGES: Record<
  HandoverEquipmentCondition,
  { label: string; className: string }
> = {
  GOOD: {
    label: 'Tốt / Nguyên vẹn',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  NEEDS_INSPECTION: {
    label: 'Cần kiểm tra',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  DAMAGED: {
    label: 'Hư hỏng',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  MISSING: {
    label: 'Thiếu / Chưa trả',
    className: 'bg-red-100 text-red-900 border-red-300',
  },
};

export const AdminScheduleDetailPage: React.FC<AdminScheduleDetailPageProps> = ({
  scheduleIdProp,
}) => {
  const { search } = useLocation();

  const scheduleId = useMemo(() => {
    if (scheduleIdProp) return scheduleIdProp;
    const match = window.location.pathname.match(/\/admin\/schedules\/(\d+)/);
    return match ? Number(match[1]) : 0;
  }, [scheduleIdProp]);

  const queryTourId = useMemo(() => {
    const params = new URLSearchParams(search);
    const val = Number(params.get('tourId'));
    return Number.isFinite(val) && val > 0 ? val : 0;
  }, [search]);

  // Main state
  const [schedule, setSchedule] = useState<ScheduleDetailResponse | null>(null);
  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [allSchedules, setAllSchedules] = useState<TourScheduleRangeResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Guide assignment state
  const [assignedGuides, setAssignedGuides] = useState<ScheduleGuideSummary[]>([]);
  const [draftGuides, setDraftGuides] = useState<ScheduleGuideSummary[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [allGuides, setAllGuides] = useState<ScheduleGuideSummary[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [selectedIsLead, setSelectedIsLead] = useState<boolean>(false);
  const [isSavingGuide, setIsSavingGuide] = useState<boolean>(false);
  const [guideConflicts, setGuideConflicts] = useState<Record<number, TourScheduleRangeResponse>>({});
  const [isLoadingGuideConflicts, setIsLoadingGuideConflicts] = useState<boolean>(false);
  const [guideConflictCheckFailed, setGuideConflictCheckFailed] = useState<boolean>(false);

  // Bookings & Manifest state
  const [bookings, setBookings] = useState<BookingDetailResponse[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState<boolean>(false);
  const [bookingReservations, setBookingReservations] = useState<
    Record<number, EquipmentReservationResponse>
  >({});
  const [remoteEquipmentSummary, setRemoteEquipmentSummary] =
    useState<ScheduleEquipmentSummaryResponse | null>(null);

  // Confirmed Guide Operations Report State (Read-only Supervision for Admin)
  const [confirmedOpsReport, setConfirmedOpsReport] =
    useState<ScheduleOperationsReport | null>(null);
  const [isLoadingOpsReport, setIsLoadingOpsReport] = useState<boolean>(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    photo: HandoverPhotoRecord;
    title: string;
  } | null>(null);

  // Fetch Confirmed Guide Operations Report (Only confirmed rounds)
  const fetchConfirmedOperationsReport = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoadingOpsReport(true);
    try {
      const report = await attendanceApi.getConfirmedScheduleOperationsReport(scheduleId);
      setConfirmedOpsReport(report);
    } catch {
      setConfirmedOpsReport(null);
    } finally {
      setIsLoadingOpsReport(false);
    }
  }, [scheduleId]);

  // Fetch Schedule and related data
  const fetchScheduleData = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Find tourId and all schedules for conflict detection
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 86400000);
      const end = new Date(now.getTime() + 90 * 86400000);
      const range = await toursApi.listSchedulesInRange(start.toISOString(), end.toISOString());
      setAllSchedules(range || []);

      const matched = range.find((s) => s.id === scheduleId);
      const targetTourId = matched?.tourId || queryTourId;

      if (targetTourId) {
        const detail = await toursApi.getScheduleDetail(targetTourId, scheduleId);
        setSchedule(detail);

        const tourDetailRes = await toursApi.getTourDetail(targetTourId);
        setTour(tourDetailRes);
      } else {
        setErrorMessage(`Không tìm thấy thông tin lịch khởi hành #${scheduleId}.`);
      }

      // 2. Fetch assigned guides from database
      try {
        const guides = await attendanceApi.getAssignedGuides(scheduleId);
        const initialGuides = guides || [];
        setAssignedGuides(initialGuides);
        setDraftGuides(initialGuides);
      } catch {
        setAssignedGuides([]);
        setDraftGuides([]);
      }

      // 3. Fetch available guides list from database
      try {
        const guidesList = await attendanceApi.listAllGuides();
        setAllGuides(guidesList || []);
      } catch {
        setAllGuides([]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi khi tải thông tin chi tiết lịch khởi hành.');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId, queryTourId]);

  // Fetch bookings and their equipment reservations for this schedule
  const fetchBookings = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoadingBookings(true);
    setIsLoadingEquipment(true);
    try {
      const firstPage = await bookingsApi.searchBookings({
        scheduleId,
        page: 0,
        size: 100,
      });

      const summaryList: BookingSummaryResponse[] = [...(firstPage.content || [])];
      const totalPages = firstPage.totalPages || 1;
      if (totalPages > 1) {
        const restPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, idx) =>
            bookingsApi
              .searchBookings({ scheduleId, page: idx + 1, size: 100 })
              .then((res) => res.content || [])
              .catch(() => [] as BookingSummaryResponse[])
          )
        );
        restPages.forEach((items) => summaryList.push(...items));
      }

      const scheduleSummaries = summaryList.filter(
        (s) => !s.scheduleId || s.scheduleId === scheduleId
      );

      const details = await Promise.all(
        scheduleSummaries.map(async (s) => {
          try {
            return await bookingsApi.getBookingDetail(s.id);
          } catch {
            return null;
          }
        })
      );

      const validDetails = details.filter(
        (d): d is BookingDetailResponse =>
          d !== null && (!d.scheduleId || d.scheduleId === scheduleId)
      );
      setBookings(validDetails);

      const reservationEntries = await Promise.all(
        validDetails.map(async (b) => {
          if (
            b.equipmentChoice === 'SELF_PROVIDED' &&
            (b.price?.equipmentFeeVnd ?? 0) === 0 &&
            !b.equipmentSnapshot
          ) {
            return null;
          }
          try {
            const res = await equipmentApi.getBookingEquipmentReservation(b.id);
            if (res && (!res.scheduleId || res.scheduleId === scheduleId)) {
              return [b.id, res] as const;
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      const nextReservations: Record<number, EquipmentReservationResponse> = {};
      reservationEntries.forEach((entry) => {
        if (entry) {
          nextReservations[entry[0]] = entry[1];
        }
      });
      setBookingReservations(nextReservations);

      try {
        const remoteSummary = await equipmentApi.getScheduleEquipmentSummary(scheduleId);
        setRemoteEquipmentSummary(remoteSummary);
      } catch {
        setRemoteEquipmentSummary(null);
      }
    } catch {
      setBookings([]);
      setBookingReservations({});
      setRemoteEquipmentSummary(null);
    } finally {
      setIsLoadingBookings(false);
      setIsLoadingEquipment(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchScheduleData();
    fetchBookings();
    fetchConfirmedOperationsReport();
  }, [fetchScheduleData, fetchBookings, fetchConfirmedOperationsReport]);


  // Load assignments for schedules overlapping this departure
  useEffect(() => {
    if (!schedule) {
      setGuideConflicts({});
      return;
    }

    let cancelled = false;
    const currentStart = new Date(schedule.startsAt).getTime();
    const currentEnd = new Date(schedule.endsAt).getTime();
    const overlapping = allSchedules.filter((candidate) => {
      if (candidate.id === scheduleId || !['SCHEDULED', 'ONGOING'].includes(candidate.status))
        return false;
      const candidateStart = new Date(candidate.startsAt).getTime();
      const candidateEnd = new Date(candidate.endsAt).getTime();
      return candidateStart < currentEnd && candidateEnd > currentStart;
    });

    if (overlapping.length === 0) {
      setGuideConflicts({});
      setGuideConflictCheckFailed(false);
      setIsLoadingGuideConflicts(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingGuideConflicts(true);
    setGuideConflictCheckFailed(false);
    Promise.allSettled(
      overlapping.map(async (candidate) => ({
        schedule: candidate,
        guides: await attendanceApi.getAssignedGuides(candidate.id),
      }))
    ).then((results) => {
      if (cancelled) return;
      const conflicts: Record<number, TourScheduleRangeResponse> = {};
      let checkFailed = false;
      results.forEach((result) => {
        if (result.status === 'rejected') {
          checkFailed = true;
          return;
        }
        result.value.guides.forEach((guide) => {
          conflicts[guide.guideId] ??= result.value.schedule;
        });
      });
      setGuideConflicts(conflicts);
      setGuideConflictCheckFailed(checkFailed);
      setIsLoadingGuideConflicts(false);
    });

    return () => {
      cancelled = true;
    };
  }, [schedule, allSchedules, scheduleId]);

  const selectedGuideConflict = selectedGuideId
    ? guideConflicts[Number(selectedGuideId)] ?? null
    : null;
  const selectedGuideName = allGuides.find(
    (guide) => guide.guideId === Number(selectedGuideId)
  )?.fullName;

  const availableGuidesForSelect = useMemo(
    () => allGuides.filter((g) => !draftGuides.some((d) => d.guideId === g.guideId)),
    [allGuides, draftGuides]
  );

  const hasUnsavedGuideChanges = useMemo(() => {
    if (draftGuides.length !== assignedGuides.length) return true;
    return draftGuides.some((d) => {
      const saved = assignedGuides.find((a) => a.guideId === d.guideId);
      return !saved || Boolean(saved.isLead) !== Boolean(d.isLead);
    });
  }, [draftGuides, assignedGuides]);

  const handleAddGuideToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const gId = Number(selectedGuideId);
    if (!gId) {
      toast.error('Vui lòng chọn hướng dẫn viên cần phân công.');
      return;
    }
    if (draftGuides.some((g) => g.guideId === gId)) {
      toast.error('Hướng dẫn viên này đã có trong danh sách chọn.');
      return;
    }
    if (guideConflicts[gId]) {
      toast.error('Hướng dẫn viên này đã có chuyến trùng thời gian. Vui lòng chọn Guide khác.');
      return;
    }
    if (isLoadingGuideConflicts || guideConflictCheckFailed) {
      toast.error(
        'Chưa thể xác nhận lịch bận của Guide. Vui lòng thử lại sau khi tải lại trang.'
      );
      return;
    }

    const foundGuide = allGuides.find((g) => g.guideId === gId);
    if (!foundGuide) {
      toast.error('Không tìm thấy thông tin hướng dẫn viên đã chọn.');
      return;
    }

    setDraftGuides((prev) => {
      const shouldBeLead = selectedIsLead || !prev.some((g) => g.isLead);
      return [
        ...prev.map((g) => ({
          ...g,
          isLead: shouldBeLead ? false : g.isLead,
        })),
        {
          ...foundGuide,
          isLead: shouldBeLead,
        },
      ];
    });

    setSelectedGuideId('');
    setSelectedIsLead(false);
    setAssignModalOpen(false);
    toast.info(
      'Đã thêm Guide vào danh sách chọn. Bấm "Xác nhận hoàn tất" để lưu phân công.'
    );
  };

  const handleToggleLeadGuide = (gId: number) => {
    setDraftGuides((prev) =>
      prev.map((g) => ({
        ...g,
        isLead: g.guideId === gId,
      }))
    );
  };

  const handleRemoveGuide = (gId: number) => {
    setDraftGuides((prev) => {
      const next = prev.filter((g) => g.guideId !== gId);
      if (next.length > 0 && !next.some((g) => g.isLead)) {
        next[0] = { ...next[0], isLead: true };
      }
      return next;
    });
  };

  const handleDiscardGuideChanges = () => {
    setDraftGuides(assignedGuides);
    toast.info('Đã hoàn tác các thay đổi chưa lưu.');
  };

  const handleConfirmSaveGuides = async () => {
    setIsSavingGuide(true);
    try {
      const payload = {
        guides: draftGuides.map((g) => ({
          guideId: g.guideId,
          isLead: Boolean(g.isLead),
        })),
      };

      const saved = await attendanceApi.assignGuidesToSchedule(scheduleId, payload);
      setAssignedGuides(saved);
      setDraftGuides(saved);
      toast.success('Đã xác nhận hoàn tất phân công hướng dẫn viên!');
    } catch (err: any) {
      toast.error(
        err?.message || 'Không thể lưu phân công hướng dẫn viên. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSavingGuide(false);
    }
  };

  // Aggregate passengers across bookings
  const allPassengers = useMemo(() => {
    return bookings.flatMap((b) =>
      (b.passengers || []).map((p) => ({
        ...p,
        bookingId: b.id,
        bookingCode: b.bookingCode,
        bookingStatus: b.status,
      }))
    );
  }, [bookings]);

  // Aggregate equipment across confirmed bookings belonging to this scheduleId
  // and overlay confirmed Guide batch handover counts if present
  const scheduleEquipmentSummary = useMemo(() => {
    const clientBase = aggregateScheduleEquipment(scheduleId, bookings, bookingReservations);
    const base =
      remoteEquipmentSummary && remoteEquipmentSummary.items.length > 0
        ? remoteEquipmentSummary
        : clientBase;
    const confirmedCheckIn = confirmedOpsReport?.checkInReport;
    const confirmedCheckOut = confirmedOpsReport?.checkOutReport;

    if (!confirmedCheckIn && !confirmedCheckOut) {
      return base;
    }

    const issuedByEquipment: Record<number, number> = {};
    const returnedByEquipment: Record<number, number> = {};

    (confirmedCheckIn?.participants || []).forEach((p) => {
      (p.equipmentItems || []).forEach((eq) => {
        issuedByEquipment[eq.equipmentId] =
          (issuedByEquipment[eq.equipmentId] || 0) + (eq.allocatedQuantity || 0);
      });
    });

    (confirmedCheckOut?.participants || []).forEach((p) => {
      (p.equipmentItems || []).forEach((eq) => {
        returnedByEquipment[eq.equipmentId] =
          (returnedByEquipment[eq.equipmentId] || 0) + (eq.returnedQuantity || 0);
      });
    });

    return {
      ...base,
      items: base.items.map((item) => ({
        ...item,
        issuedQuantity: Math.max(
          item.issuedQuantity,
          issuedByEquipment[item.equipmentId] || 0
        ),
        returnedQuantity: Math.max(
          item.returnedQuantity,
          returnedByEquipment[item.equipmentId] || 0
        ),
      })),
    };
  }, [scheduleId, bookings, bookingReservations, remoteEquipmentSummary, confirmedOpsReport]);

  const equipmentTotals = useMemo(() => {
    return scheduleEquipmentSummary.items.reduce(
      (acc, it) => ({
        totalQuantity: acc.totalQuantity + it.totalQuantity,
        issuedQuantity: acc.issuedQuantity + it.issuedQuantity,
        returnedQuantity: acc.returnedQuantity + it.returnedQuantity,
      }),
      { totalQuantity: 0, issuedQuantity: 0, returnedQuantity: 0 }
    );
  }, [scheduleEquipmentSummary.items]);

  const confirmedCheckIn = confirmedOpsReport?.checkInReport || null;
  const confirmedCheckOut = confirmedOpsReport?.checkOutReport || null;

  const checkOutByParticipantId = useMemo(() => {
    const map = new Map<
      number,
      NonNullable<typeof confirmedCheckOut>['participants'][number]
    >();
    (confirmedCheckOut?.participants || []).forEach((p) => {
      map.set(p.participantId, p);
    });
    return map;
  }, [confirmedCheckOut]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            navigateTo(
              queryTourId
                ? ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(queryTourId)
                : ROUTES.ADMIN.SCHEDULES
            )
          }
          className="inline-flex items-center gap-2 text-sm sm:text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {queryTourId
              ? 'Quay lại danh sách lịch khởi hành của tour'
              : 'Quay lại Quản lý Lịch khởi hành'}
          </span>
        </button>

        {tour && (
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(tour.id))}
            className="text-sm text-[#1F4E43] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả lịch của tour này</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Schedule Header Card */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F4E43]/30 border-t-[#1F4E43] rounded-full animate-spin mx-auto" />
          <p className="text-sm sm:text-sm text-stone-500">
            Đang nạp chi tiết lịch khởi hành...
          </p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-sm">{errorMessage}</h3>
          <button
            type="button"
            onClick={fetchScheduleData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-sm cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminSectionNav items={[{ id: 'schedule-overview', label: 'Tổng quan' }, { id: 'schedule-guides', label: 'Hướng dẫn viên' }, { id: 'schedule-equipment', label: 'Thiết bị' }, { id: 'schedule-operations', label: 'Điểm danh & bàn giao' }, { id: 'schedule-bookings', label: 'Đặt chỗ' }]} />
          {/* Overview Info Card */}
          <div id="schedule-overview" className="scroll-mt-48 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-stone-500 uppercase">
                    Chuyến #{schedule?.id} • Tour #{schedule?.tourId}
                  </span>
                  {schedule?.status && (
                    <StatusBadge scheduleStatus={schedule.status} size="sm" />
                  )}
                </div>
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                  {tour?.title || 'Lịch khởi hành tour'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchScheduleData();
                    fetchBookings();
                    fetchConfirmedOperationsReport();
                  }}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-sm font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm sm:text-sm text-stone-700">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-xs text-stone-500 block">
                  Thời gian diễn ra (VN):
                </span>
                <div className="font-semibold text-stone-900">
                  {schedule ? formatVietnamDateTime(schedule.startsAt) : '—'}
                </div>
                <div className="text-xs text-stone-500">
                  Đến: {schedule ? formatVietnamDateTime(schedule.endsAt) : '—'}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-xs text-stone-500 block">
                  Sức chứa & Đặt chỗ:
                </span>
                <div className="font-semibold text-stone-900">
                  {schedule?.confirmedSeats ?? 0} đã đặt / {schedule?.capacity ?? 0} chỗ
                </div>
                <div className="text-xs text-stone-500">
                  Đang giữ chỗ: {schedule?.heldSeats ?? 0} ghế
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-xs text-stone-500 block">
                  Giá cơ bản / Khách:
                </span>
                <div className="font-semibold font-mono text-[#1F4E43]">
                  {formatVND(schedule?.basePriceVnd || 0)}
                </div>
                <div className="text-xs text-stone-500">
                  Cọc: {schedule?.depositPercent ?? 0}%
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-xs text-stone-500 block">
                  Điểm tập trung & Liên hệ:
                </span>
                <div className="font-semibold text-stone-900 truncate">
                  {schedule?.meetingPoint || 'Chưa cập nhật'}
                </div>
                <div className="text-xs font-mono text-stone-600">
                  Hotline: {schedule?.contactPhone || '1900 8888'}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 1: PHÂN CÔNG HƯỚNG DẪN VIÊN (GUIDE ASSIGNMENT)         */}
          {/* ============================================================== */}
          <div id="schedule-guides" className="scroll-mt-48 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1F4E43]" />
                  <span>Phân công Hướng dẫn viên phụ trách chuyến</span>
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Chỉ định một hoặc nhiều Guide cho lịch khởi hành này. Guide được phân công mới có thẩm quyền điểm danh khách.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedGuideId('');
                  setSelectedIsLead(false);
                  setAssignModalOpen(true);
                }}
                disabled={allGuides.length > 0 && availableGuidesForSelect.length === 0}
                className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Phân công Guide cho lịch</span>
              </button>
            </div>

            {draftGuides.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-2">
                <Users className="w-8 h-8 text-stone-400 mx-auto" />
                <p>Lịch khởi hành này chưa được phân công Hướng dẫn viên.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuideId('');
                    setSelectedIsLead(false);
                    setAssignModalOpen(true);
                  }}
                  className="font-semibold text-[#1F4E43] hover:underline cursor-pointer"
                >
                  Bấm vào đây để phân công Guide ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {draftGuides.map((guide, idx) => {
                  const isNewlyAdded = !assignedGuides.some(
                    (a) => a.guideId === guide.guideId
                  );
                  return (
                    <div
                      key={guide.guideId ?? guide.accountId ?? idx}
                      className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 text-sm ${
                        isNewlyAdded
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-stone-200 bg-stone-50/70 hover:bg-stone-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-stone-900 text-sm">
                            {guide.fullName}
                          </strong>
                          {guide.isLead && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              Guide Chính
                            </span>
                          )}
                          {isNewlyAdded && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                              Chưa xác nhận
                            </span>
                          )}
                        </div>
                        <div className="text-stone-600 font-mono">
                          {guide.phone
                            ? `SĐT: ${guide.phone}`
                            : `Email: ${guide.email || '—'}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleLeadGuide(guide.guideId)}
                          className="text-xs font-semibold text-[#1F4E43] hover:underline cursor-pointer"
                        >
                          {guide.isLead
                            ? 'Bỏ đánh dấu Guide Chính'
                            : 'Đặt làm Guide Chính'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGuide(guide.guideId)}
                        title="Xóa khỏi danh sách"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {hasUnsavedGuideChanges && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-200 bg-amber-50/60 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Danh sách phân công có thay đổi chưa lưu. Bạn có thể kiểm tra, đổi Guide chính hoặc xóa bớt trước khi xác nhận hoàn tất.
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDiscardGuideChanges}
                    disabled={isSavingGuide}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveGuides}
                    disabled={isSavingGuide}
                    className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingGuide ? 'Đang lưu...' : 'Xác nhận hoàn tất'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: TỔNG HỢP THIẾT BỊ KHÁCH ĐẶT CỦA LỊCH KHỞI HÀNH       */}
          {/* ============================================================== */}
          <div id="schedule-equipment" className="scroll-mt-48 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526] flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#1F4E43]" />
                  <span>Tổng hợp thiết bị khách đặt</span>
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Cộng gộp số lượng từng thiết bị từ các đơn đặt chỗ đã xác nhận thuộc lịch khởi hành #{scheduleId} (không bao gồm đơn đã hủy, giữ chỗ hết hạn hoặc thiết bị đã giải phóng).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-stone-600 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E1D8]">
                  Đơn thuê thiết bị:{' '}
                  <strong className="text-stone-900">
                    {scheduleEquipmentSummary.totalBookingsWithEquipment}
                  </strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E1D8]">
                  Tổng số món:{' '}
                  <strong className="text-[#1F4E43]">
                    {equipmentTotals.totalQuantity}
                  </strong>
                </span>
              </div>
            </div>

            {isLoadingBookings || isLoadingEquipment ? (
              <div className="py-8 text-center text-sm text-stone-500">
                Đang tổng hợp thiết bị khách đặt cho lịch khởi hành này...
              </div>
            ) : scheduleEquipmentSummary.items.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-1.5">
                <Boxes className="w-7 h-7 text-stone-400 mx-auto" />
                <p className="font-semibold text-stone-700">
                  Chưa có thiết bị nào được đặt cho lịch này
                </p>
                <p className="text-stone-500">
                  Chưa có đơn đặt chỗ xác nhận nào đăng ký thuê thiết bị cho chuyến đi này.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-xs font-mono uppercase tracking-wider text-stone-600">
                      <th className="py-3 px-3.5 font-bold">Tên thiết bị</th>
                      <th className="py-3 px-3.5 font-bold text-center">Số đơn đặt</th>
                      <th className="py-3 px-3.5 font-bold text-center">
                        Tổng khách đã đặt
                      </th>
                      <th className="py-3 px-3.5 font-bold text-center">Đã giao</th>
                      <th className="py-3 px-3.5 font-bold text-center">Đã trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {scheduleEquipmentSummary.items.map((item) => (
                      <tr
                        key={item.equipmentId}
                        className="hover:bg-[#FDFBF7] transition-colors"
                      >
                        <td className="py-3 px-3.5 font-semibold text-stone-900">
                          {item.equipmentName}
                          <span className="ml-2 font-mono text-xs font-normal text-stone-400">
                            #{item.equipmentId}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono text-stone-600">
                          {item.bookingCount} đơn
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-900 font-bold">
                            {item.totalQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-700">
                          {item.issuedQuantity}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-teal-700">
                          {item.returnedQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FAF8F5] border-t border-[#E6E1D8] font-mono text-sm font-bold text-stone-800">
                      <td className="py-3 px-3.5 font-sans">
                        Tổng cộng ({scheduleEquipmentSummary.items.length} loại thiết bị)
                      </td>
                      <td className="py-3 px-3.5 text-center text-stone-600">
                        {scheduleEquipmentSummary.totalBookingsWithEquipment} đơn
                      </td>
                      <td className="py-3 px-3.5 text-center text-[#1F4E43]">
                        {equipmentTotals.totalQuantity}
                      </td>
                      <td className="py-3 px-3.5 text-center text-emerald-700">
                        {equipmentTotals.issuedQuantity}
                      </td>
                      <td className="py-3 px-3.5 text-center text-teal-700">
                        {equipmentTotals.returnedQuantity}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 3 (GIAI ĐOẠN 2): GIÁM SÁT BÁO CÁO CHECK-IN / CHECK-OUT */}
          {/* & BÀN GIAO THIẾT BỊ CỦA GUIDE (CHỈ XEM - READ ONLY)            */}
          {/* ============================================================== */}
          <div id="schedule-operations" className="scroll-mt-48 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526] flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#1F4E43]" />
                    <span>
                      Giám sát báo cáo Check-in / Check-out & Bàn giao Thiết bị của Guide
                    </span>
                  </h2>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  Chỉ hiển thị kết quả sau khi Guide đã bấm xác nhận hoàn tất từng lượt (không hiển thị bản nháp đang nhập dở). Phân biệt rõ thời điểm đánh dấu từng khách/thiết bị và thời điểm xác nhận gửi cả lượt.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchConfirmedOperationsReport}
                disabled={isLoadingOpsReport}
                className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-sm font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingOpsReport ? 'animate-spin' : ''}`}
                />
                <span>Cập nhật báo cáo mới</span>
              </button>
            </div>

            {/* Batch Confirmation Summary Cards (Check-in Round vs Check-out Round) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Round 1: Check-in Summary */}
              <div
                className={`p-4 rounded-xl border space-y-2 text-sm ${
                  confirmedCheckIn
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-stone-900">
                    1. Lượt Check-in & Bàn giao Thiết bị
                  </span>
                  {confirmedCheckIn ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      Đã xác nhận hoàn tất
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold text-xs">
                      Chưa có báo cáo xác nhận
                    </span>
                  )}
                </div>

                {confirmedCheckIn ? (
                  <div className="space-y-1 text-stone-700">
                    <div>
                      Guide thực hiện:{' '}
                      <strong className="text-stone-900">
                        {confirmedCheckIn.submittedByGuideName}
                      </strong>
                      {confirmedCheckIn.submittedByGuideEmail && (
                        <span className="text-stone-500">
                          {' '}
                          ({confirmedCheckIn.submittedByGuideEmail})
                        </span>
                      )}
                    </div>
                    <div>
                      Thời điểm xác nhận gửi cả lượt:{' '}
                      <strong className="font-mono text-emerald-800">
                        {formatVietnamDateTime(confirmedCheckIn.submittedAt, true)}
                      </strong>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 font-semibold text-emerald-800">
                        Có mặt:{' '}
                        {
                          confirmedCheckIn.participants.filter(
                            (p) => p.status === 'PRESENT'
                          ).length
                        }
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-rose-200 font-semibold text-rose-700">
                        Vắng mặt:{' '}
                        {
                          confirmedCheckIn.participants.filter(
                            (p) => p.status === 'ABSENT'
                          ).length
                        }
                      </span>
                    </div>
                    {confirmedCheckIn.generalNote && (
                      <div className="mt-2 p-2 rounded-lg bg-white border border-emerald-200/80 text-stone-700">
                        <strong>Ghi chú chung lượt Check-in:</strong>{' '}
                        {confirmedCheckIn.generalNote}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-stone-500">
                    Guide chưa gửi xác nhận hoàn tất lượt Check-in cho lịch khởi hành này.
                  </p>
                )}
              </div>

              {/* Round 2: Check-out Summary */}
              <div
                className={`p-4 rounded-xl border space-y-2 text-sm ${
                  confirmedCheckOut
                    ? 'border-teal-200 bg-teal-50/40'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-stone-900">
                    2. Lượt Check-out & Nhận lại Thiết bị
                  </span>
                  {confirmedCheckOut ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                      Đã xác nhận hoàn tất
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold text-xs">
                      Chưa có báo cáo xác nhận
                    </span>
                  )}
                </div>

                {confirmedCheckOut ? (
                  <div className="space-y-1 text-stone-700">
                    <div>
                      Guide thực hiện:{' '}
                      <strong className="text-stone-900">
                        {confirmedCheckOut.submittedByGuideName}
                      </strong>
                      {confirmedCheckOut.submittedByGuideEmail && (
                        <span className="text-stone-500">
                          {' '}
                          ({confirmedCheckOut.submittedByGuideEmail})
                        </span>
                      )}
                    </div>
                    <div>
                      Thời điểm xác nhận gửi cả lượt:{' '}
                      <strong className="font-mono text-teal-800">
                        {formatVietnamDateTime(confirmedCheckOut.submittedAt, true)}
                      </strong>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-white border border-teal-200 font-semibold text-teal-800">
                        Hoàn thành chuyến:{' '}
                        {
                          confirmedCheckOut.participants.filter(
                            (p) => p.status === 'COMPLETED'
                          ).length
                        }
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-amber-200 font-semibold text-amber-800">
                        Tách đoàn sớm:{' '}
                        {
                          confirmedCheckOut.participants.filter(
                            (p) => p.status === 'EARLY_DEPARTURE'
                          ).length
                        }
                      </span>
                    </div>
                    {confirmedCheckOut.generalNote && (
                      <div className="mt-2 p-2 rounded-lg bg-white border border-teal-200/80 text-stone-700">
                        <strong>Ghi chú chung lượt Check-out:</strong>{' '}
                        {confirmedCheckOut.generalNote}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-stone-500">
                    Guide chưa gửi xác nhận hoàn tất lượt Check-out cho lịch khởi hành này.
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Per-Participant Supervision Table */}
            {!confirmedCheckIn && !confirmedCheckOut ? (
              <div className="py-10 text-center text-sm text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-1.5">
                <ClipboardCheck className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-700">
                  Chưa có báo cáo điểm danh & bàn giao thiết bị nào được Guide xác nhận hoàn tất
                </p>
                <p className="text-stone-500 max-w-lg mx-auto">
                  Khi Guide hoàn tất và bấm xác nhận từng lượt Check-in hoặc Check-out, chi tiết điểm danh từng khách, thiết bị bàn giao/thu hồi, ảnh hiện trạng và ghi chú sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-xs font-mono uppercase tracking-wider text-stone-600">
                      <th className="py-3 px-3 font-bold">Hành khách & Đơn</th>
                      <th className="py-3 px-3 font-bold">
                        Check-in & Thời điểm đánh dấu
                      </th>
                      <th className="py-3 px-3 font-bold">
                        Thiết bị bàn giao lúc Check-in & Ảnh
                      </th>
                      <th className="py-3 px-3 font-bold">
                        Check-out & Kết thúc chuyến
                      </th>
                      <th className="py-3 px-3 font-bold">
                        Thiết bị nhận lại lúc Check-out & Ảnh
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 align-top">
                    {(confirmedCheckIn?.participants || []).map((ciGuest) => {
                      const coGuest = checkOutByParticipantId.get(
                        ciGuest.participantId
                      );

                      return (
                        <tr
                          key={ciGuest.participantId}
                          className="hover:bg-[#FDFBF7] transition-colors"
                        >
                          {/* Column 1: Guest Info */}
                          <td className="py-3.5 px-3 space-y-1 min-w-[170px]">
                            <div className="font-bold text-stone-900">
                              {ciGuest.fullName}
                            </div>
                            <div className="font-mono text-xs text-stone-500">
                              Đơn #{ciGuest.bookingCode}
                            </div>
                            {ciGuest.phone && (
                              <div className="font-mono text-xs text-stone-500">
                                SĐT: {ciGuest.phone}
                              </div>
                            )}
                          </td>

                          {/* Column 2: Check-in Status & Timestamps */}
                          <td className="py-3.5 px-3 space-y-1.5 min-w-[190px]">
                            <div>
                              {ciGuest.status === 'PRESENT' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Có mặt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                                  <XCircle className="w-3 h-3" />
                                  Vắng mặt
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-600">
                              <div>
                                Đánh dấu khách:{' '}
                                <strong className="font-mono text-stone-900">
                                  {formatVietnamDateTime(ciGuest.markedAt, true)}
                                </strong>
                              </div>
                              <div className="text-stone-500">
                                Gửi lượt:{' '}
                                <span className="font-mono">
                                  {formatVietnamDateTime(
                                    confirmedCheckIn?.submittedAt,
                                    true
                                  )}
                                </span>
                              </div>
                            </div>
                            {ciGuest.note && (
                              <div className="p-1.5 rounded bg-stone-100 text-stone-700 text-xs">
                                Ghi chú: {ciGuest.note}
                              </div>
                            )}
                          </td>

                          {/* Column 3: Equipment Handed Over at Check-in */}
                          <td className="py-3.5 px-3 min-w-[250px]">
                            {!ciGuest.equipmentItems ||
                            ciGuest.equipmentItems.length === 0 ? (
                              <span className="text-stone-400 italic">
                                Không nhận thiết bị
                              </span>
                            ) : (
                              <div className="space-y-2.5">
                                {ciGuest.equipmentItems.map((eq) => (
                                  <div
                                    key={eq.equipmentId}
                                    className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-stone-900">
                                        {eq.equipmentName}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-800">
                                        Giao: {eq.allocatedQuantity}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                      <span
                                        className={`px-2 py-0.5 rounded border font-semibold ${
                                          ADMIN_CONDITION_BADGES[eq.condition]
                                            ?.className || ''
                                        }`}
                                      >
                                        {ADMIN_CONDITION_BADGES[eq.condition]?.label ||
                                          eq.condition}
                                      </span>
                                      <span className="font-mono text-stone-500">
                                        Lúc:{' '}
                                        {formatVietnamDateTime(eq.handedOverAt, true)}
                                      </span>
                                    </div>
                                    {eq.note && (
                                      <div className="text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                        Ghi chú giao: {eq.note}
                                      </div>
                                    )}
                                    {eq.photos && eq.photos.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {eq.photos.map((ph) => (
                                          <button
                                            key={ph.id}
                                            type="button"
                                            onClick={() =>
                                              setSelectedPhotoModal({
                                                photo: ph,
                                                title: `Ảnh bàn giao Check-in: ${eq.equipmentName} (${ciGuest.fullName})`,
                                              })
                                            }
                                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-300 hover:ring-2 hover:ring-[#1F4E43] cursor-pointer"
                                          >
                                            <img
                                              src={ph.url}
                                              alt={ph.fileName}
                                              className="w-full h-full object-cover"
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Column 4: Check-out Status & Timestamps */}
                          <td className="py-3.5 px-3 space-y-1.5 min-w-[190px]">
                            {!coGuest ? (
                              <span className="text-stone-400 italic">
                                Chưa xác nhận lượt Check-out
                              </span>
                            ) : (
                              <>
                                <div>
                                  {coGuest.status === 'COMPLETED' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Hoàn thành chuyến
                                    </span>
                                  ) : coGuest.status === 'EARLY_DEPARTURE' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                                      <AlertTriangle className="w-3 h-3" />
                                      Kết thúc sớm
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold text-xs">
                                      Vắng mặt từ Check-in
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-stone-600">
                                  <div>
                                    Đánh dấu khách:{' '}
                                    <strong className="font-mono text-stone-900">
                                      {formatVietnamDateTime(coGuest.markedAt, true)}
                                    </strong>
                                  </div>
                                  <div className="text-stone-500">
                                    Gửi lượt:{' '}
                                    <span className="font-mono">
                                      {formatVietnamDateTime(
                                        confirmedCheckOut?.submittedAt,
                                        true
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {coGuest.note && (
                                  <div className="p-1.5 rounded bg-stone-100 text-stone-700 text-xs">
                                    Ghi chú: {coGuest.note}
                                  </div>
                                )}
                              </>
                            )}
                          </td>

                          {/* Column 5: Equipment Returned at Check-out */}
                          <td className="py-3.5 px-3 min-w-[260px]">
                            {!coGuest ? (
                              <span className="text-stone-400 italic">
                                Chờ xác nhận Check-out
                              </span>
                            ) : !coGuest.equipmentItems ||
                              coGuest.equipmentItems.length === 0 ? (
                              <span className="text-stone-400 italic">
                                Không có thiết bị cần trả
                              </span>
                            ) : (
                              <div className="space-y-2.5">
                                {coGuest.equipmentItems.map((eq) => {
                                  const isShortage =
                                    eq.returnedQuantity < eq.issuedQuantity;
                                  const hasProblem =
                                    isShortage || eq.condition !== 'GOOD';

                                  return (
                                    <div
                                      key={eq.equipmentId}
                                      className={`p-2.5 rounded-lg border space-y-1.5 ${
                                        hasProblem
                                          ? 'border-rose-300 bg-rose-50/30'
                                          : 'border-stone-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-stone-900">
                                          {eq.equipmentName}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded font-mono font-bold border ${
                                            isShortage
                                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                                              : 'bg-teal-50 text-teal-800 border-teal-200'
                                          }`}
                                        >
                                          Trả: {eq.returnedQuantity}/{eq.issuedQuantity}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                        <span
                                          className={`px-2 py-0.5 rounded border font-semibold ${
                                            ADMIN_CONDITION_BADGES[eq.condition]
                                              ?.className || ''
                                          }`}
                                        >
                                          {ADMIN_CONDITION_BADGES[eq.condition]?.label ||
                                            eq.condition}
                                        </span>
                                        <span className="font-mono text-stone-500">
                                          Lúc:{' '}
                                          {formatVietnamDateTime(eq.returnedAt, true)}
                                        </span>
                                      </div>

                                      {eq.note && (
                                        <div className="text-xs text-rose-900 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium">
                                          Ghi chú thu hồi: {eq.note}
                                        </div>
                                      )}

                                      {eq.photos && eq.photos.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {eq.photos.map((ph) => (
                                            <button
                                              key={ph.id}
                                              type="button"
                                              onClick={() =>
                                                setSelectedPhotoModal({
                                                  photo: ph,
                                                  title: `Ảnh nhận lại Check-out: ${eq.equipmentName} (${ciGuest.fullName})`,
                                                })
                                              }
                                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-300 hover:ring-2 hover:ring-[#1F4E43] cursor-pointer"
                                            >
                                              <img
                                                src={ph.url}
                                                alt={ph.fileName}
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 4: DANH SÁCH KHÁCH & ĐƠN ĐẶT CHỖ                       */}
          {/* ============================================================== */}
          <div id="schedule-bookings" className="scroll-mt-48 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526]">
                  Danh sách hành khách theo Đơn đặt chỗ ({allPassengers.length} khách)
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Theo dõi danh sách khách hàng và thiết bị đặt thuê theo từng booking.
                </p>
              </div>

              <div className="text-sm font-mono text-stone-600">
                Tổng đơn: <strong>{bookings.length}</strong>
              </div>
            </div>

            {isLoadingBookings ? (
              <div className="py-8 text-center text-sm text-stone-500">
                Đang nạp danh sách đặt chỗ của lịch...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-500 bg-stone-50 rounded-xl">
                Chưa có đơn đặt chỗ nào được ghi nhận cho lịch khởi hành này.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const reservation = bookingReservations[booking.id];
                  const passengers = booking.passengers || [];

                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-stone-200 p-4 space-y-3 bg-[#FDFBF7]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">
                            Đặt chỗ #{booking.id} ({booking.bookingCode})
                          </span>
                          <StatusBadge bookingStatus={booking.status} size="sm" />
                          {reservation?.status && (
                            <StatusBadge
                              equipmentReservationStatus={reservation.status}
                              size="sm"
                            />
                          )}
                        </div>

                        <div className="text-sm text-stone-600 font-mono">
                          Số lượng: <strong>{passengers.length} người</strong> • Tổng tiền:{' '}
                          <strong className="text-[#1F4E43]">
                            {formatVND(booking.price?.totalPriceVnd || 0)}
                          </strong>
                        </div>
                      </div>

                      {/* Passengers Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-xs font-mono text-stone-500 uppercase border-b border-stone-200">
                              <th className="py-2 px-2">Họ tên khách</th>
                              <th className="py-2 px-2">Số điện thoại</th>
                              <th className="py-2 px-2">Email</th>
                              <th className="py-2 px-2 text-center">Vai trò</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {passengers.map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 px-2 font-semibold text-stone-900">
                                  {p.fullName}
                                </td>
                                <td className="py-2 px-2 font-mono text-stone-600">
                                  {p.phone || '—'}
                                </td>
                                <td className="py-2 px-2 font-mono text-stone-600">
                                  {p.email || '—'}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {p.bookingCustomer ? (
                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-xs">
                                      Trưởng đoàn
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">Thành viên</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Equipment Reservation Summary if present */}
                      {reservation &&
                        reservation.items &&
                        reservation.items.length > 0 && (
                          <div className="p-3 bg-white rounded-lg border border-stone-200 text-sm space-y-1.5">
                            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                              <Boxes className="w-3.5 h-3.5 text-stone-600" />
                              <span>Thiết bị thuê theo đơn:</span>
                            </span>
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {reservation.items.map((it) => (
                                <span
                                  key={it.equipmentId}
                                  className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-mono text-xs border border-stone-200"
                                >
                                  {it.equipmentName}: <strong>{it.quantity}</strong> đặt (Đã giao:{' '}
                                  <strong className="text-emerald-700">
                                    {it.issuedQuantity}
                                  </strong>
                                  , Đã trả:{' '}
                                  <strong className="text-teal-700">
                                    {it.returnedQuantity}
                                  </strong>
                                  )
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PHÂN CÔNG GUIDE CHO LỊCH KHỞI HÀNH                     */}
      {/* ============================================================== */}
      {assignModalOpen && (
        <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Phân công Hướng dẫn viên" subtitle={`Chọn người dẫn đoàn cho chuyến #${scheduleId}.`} maxWidth="lg"><div className="space-y-4">


            <form onSubmit={handleAddGuideToDraft} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="select-guide"
                  className="text-sm font-semibold text-stone-700"
                >
                  Chọn Hướng dẫn viên:
                </label>
                <select
                  id="select-guide"
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
                  required
                  disabled={availableGuidesForSelect.length === 0}
                >
                  <option key="placeholder" value="">
                    {availableGuidesForSelect.length === 0
                      ? '-- Đã chọn hết tất cả Hướng dẫn viên --'
                      : '-- Chọn Hướng dẫn viên --'}
                  </option>
                  {availableGuidesForSelect.map((g, idx) => (
                    <option
                      key={g.guideId ?? g.accountId ?? idx}
                      value={g.guideId}
                      disabled={Boolean(guideConflicts[g.guideId])}
                    >
                      {g.fullName}
                      {guideConflicts[g.guideId]
                        ? ` — Bận: ${guideConflicts[g.guideId].title}, ${formatDateTime(
                            guideConflicts[g.guideId].startsAt
                          )}`
                        : ''}
                    </option>
                  ))}
                </select>
                {isLoadingGuideConflicts && (
                  <p className="text-sm text-stone-500">
                    Đang kiểm tra lịch đã phân công của các Guide…
                  </p>
                )}
                {guideConflictCheckFailed && !isLoadingGuideConflicts && (
                  <p className="text-sm text-amber-800">
                    Chưa kiểm tra được một số lịch trùng. Tải lại trang trước khi phân công.
                  </p>
                )}
                {!isLoadingGuideConflicts &&
                  !guideConflictCheckFailed &&
                  Object.keys(guideConflicts).length > 0 && (
                    <p className="text-sm text-stone-500">
                      Guide đang bận được hiển thị theo chuyến trùng lịch và không thể chọn.
                    </p>
                  )}
              </div>

              {selectedGuideConflict && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-950 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Cảnh báo trùng lịch làm việc!</span>
                  </div>
                  <p className="leading-relaxed">
                    Hướng dẫn viên <strong>{selectedGuideName || 'đã chọn'}</strong> đang có chuyến trùng thời gian ({selectedGuideConflict.title}) từ ngày{' '}
                    <strong>{formatDateTime(selectedGuideConflict.startsAt)}</strong> đến{' '}
                    <strong>{formatDateTime(selectedGuideConflict.endsAt)}</strong>.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2.5 text-sm text-stone-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={selectedIsLead}
                  onChange={(e) => setSelectedIsLead(e.target.checked)}
                  className="w-4 h-4 text-[#1F4E43] rounded border-stone-300 focus:ring-[#1F4E43]"
                />
                <span className="font-semibold">
                  Đánh dấu là Hướng dẫn viên chính (Lead Guide)
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedGuideId ||
                    Boolean(selectedGuideConflict) ||
                    isLoadingGuideConflicts ||
                    guideConflictCheckFailed
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </form>
          </div></Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: XEM ẢNH HIỆN TRẠNG THIẾT BỊ BÀN GIAO / NHẬN LẠI         */}
      {/* ============================================================== */}
      {selectedPhotoModal && (
        <Modal isOpen={Boolean(selectedPhotoModal)} onClose={() => setSelectedPhotoModal(null)} title={selectedPhotoModal.title} subtitle={formatVietnamDateTime(selectedPhotoModal.photo.capturedAt, true)} maxWidth="3xl">
          <div className="space-y-4">
            <div className="flex justify-center bg-stone-950 rounded-xl overflow-hidden max-h-[75vh]">
              <img
                src={selectedPhotoModal.photo.url}
                alt={selectedPhotoModal.photo.fileName}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div></Modal>
      )}
    </div>
  );
};

export default AdminScheduleDetailPage;
