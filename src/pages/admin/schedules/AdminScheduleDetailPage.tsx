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
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { attendanceApi } from '../../../features/tours/api/attendance.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type {
  ScheduleDetailResponse,
  TourDetailResponse,
  TourScheduleRangeResponse,
} from '../../../features/tours/types/tour.types';
import type {
  ScheduleGuideSummary,
} from '../../../features/tours/types/attendance.types';
import type {
  BookingSummaryResponse,
  BookingDetailResponse,
} from '../../../features/bookings/types/booking.types';
import type { EquipmentReservationResponse } from '../../../features/equipment/types/equipment.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import {
  formatDateTime,
  formatDate,
  formatTimeOnly,
  formatVND,
} from '../../../lib/utils';

export interface AdminScheduleDetailPageProps {
  scheduleIdProp?: number;
}

export const AdminScheduleDetailPage: React.FC<AdminScheduleDetailPageProps> = ({
  scheduleIdProp,
}) => {
  const scheduleId = useMemo(() => {
    if (scheduleIdProp) return scheduleIdProp;
    const match = window.location.pathname.match(/\/admin\/schedules\/(\d+)/);
    return match ? Number(match[1]) : 0;
  }, [scheduleIdProp]);

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
  const [bookingReservations, setBookingReservations] = useState<Record<number, EquipmentReservationResponse>>({});

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
      if (matched) {
        const detail = await toursApi.getScheduleDetail(matched.tourId, scheduleId);
        setSchedule(detail);

        const tourDetailRes = await toursApi.getTourDetail(matched.tourId);
        setTour(tourDetailRes);
      } else {
        // Fallback: If not in range, search tours
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
  }, [scheduleId]);

  // Fetch confirmed bookings for this schedule
  const fetchBookings = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoadingBookings(true);
    try {
      const searchRes = await bookingsApi.searchBookings({
        scheduleId,
        size: 50,
      });

      const summaryList = searchRes.content || [];
      // Fetch details for bookings to get passengers and equipment
      const details = await Promise.all(
        summaryList.map(async (s) => {
          try {
            return await bookingsApi.getBookingDetail(s.id);
          } catch {
            return null;
          }
        })
      );

      const validDetails = details.filter((d): d is BookingDetailResponse => d !== null);
      setBookings(validDetails);

      // Load equipment reservations for each booking
      validDetails.forEach(async (b) => {
        try {
          const res = await equipmentApi.getBookingEquipmentReservation(b.id);
          setBookingReservations((prev) => ({ ...prev, [b.id]: res }));
        } catch {
          // No reservation
        }
      });
    } catch {
      // Permission or network issue
    } finally {
      setIsLoadingBookings(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchScheduleData();
    fetchBookings();
  }, [fetchScheduleData, fetchBookings]);

  // Load assignments for schedules overlapping this departure so unavailable guides are
  // identified before the admin selects one.
  useEffect(() => {
    if (!schedule) {
      setGuideConflicts({});
      return;
    }

    let cancelled = false;
    const currentStart = new Date(schedule.startsAt).getTime();
    const currentEnd = new Date(schedule.endsAt).getTime();
    const overlapping = allSchedules.filter((candidate) => {
      if (candidate.id === scheduleId || !['SCHEDULED', 'ONGOING'].includes(candidate.status)) return false;
      const candidateStart = new Date(candidate.startsAt).getTime();
      const candidateEnd = new Date(candidate.endsAt).getTime();
      return candidateStart < currentEnd && candidateEnd > currentStart;
    });

    if (overlapping.length === 0) {
      setGuideConflicts({});
      setGuideConflictCheckFailed(false);
      setIsLoadingGuideConflicts(false);
      return () => { cancelled = true; };
    }

    setIsLoadingGuideConflicts(true);
    setGuideConflictCheckFailed(false);
    Promise.allSettled(overlapping.map(async (candidate) => ({
      schedule: candidate,
      guides: await attendanceApi.getAssignedGuides(candidate.id),
    }))).then((results) => {
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

    return () => { cancelled = true; };
  }, [schedule, allSchedules, scheduleId]);

  const selectedGuideConflict = selectedGuideId
    ? guideConflicts[Number(selectedGuideId)] ?? null
    : null;
  const selectedGuideName = allGuides.find((guide) => guide.guideId === Number(selectedGuideId))?.fullName;

  // Hide guides already selected in draftGuides from the select dropdown
  const availableGuidesForSelect = useMemo(
    () => allGuides.filter((g) => !draftGuides.some((d) => d.guideId === g.guideId)),
    [allGuides, draftGuides]
  );

  // Check if draftGuides differs from saved assignedGuides
  const hasUnsavedGuideChanges = useMemo(() => {
    if (draftGuides.length !== assignedGuides.length) return true;
    return draftGuides.some((d) => {
      const saved = assignedGuides.find((a) => a.guideId === d.guideId);
      return !saved || Boolean(saved.isLead) !== Boolean(d.isLead);
    });
  }, [draftGuides, assignedGuides]);

  // Add selected guide into staging list (does not save immediately until user clicks "Xác nhận hoàn tất")
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
      toast.error('Chưa thể xác nhận lịch bận của Guide. Vui lòng thử lại sau khi tải lại trang.');
      return;
    }

    const foundGuide = allGuides.find((g) => g.guideId === gId);
    if (!foundGuide) {
      toast.error('Không tìm thấy thông tin hướng dẫn viên đã chọn.');
      return;
    }

    setDraftGuides((prev) => [
      ...prev.map((g) => ({
        ...g,
        isLead: selectedIsLead ? false : g.isLead,
      })),
      {
        ...foundGuide,
        isLead: selectedIsLead,
      },
    ]);

    setSelectedGuideId('');
    setSelectedIsLead(false);
    setAssignModalOpen(false);
    toast.info('Đã thêm Guide vào danh sách chọn. Bấm "Xác nhận hoàn tất" để lưu phân công.');
  };

  // Toggle Lead Guide status in draft list
  const handleToggleLeadGuide = (gId: number) => {
    setDraftGuides((prev) =>
      prev.map((g) => {
        if (g.guideId === gId) {
          return { ...g, isLead: !g.isLead };
        }
        return { ...g, isLead: false };
      })
    );
  };

  // Remove guide from draft list (requires "Xác nhận hoàn tất" to persist)
  const handleRemoveGuide = (gId: number) => {
    setDraftGuides((prev) => prev.filter((g) => g.guideId !== gId));
  };

  // Discard unsaved draft changes
  const handleDiscardGuideChanges = () => {
    setDraftGuides(assignedGuides);
    toast.info('Đã hoàn tác các thay đổi chưa lưu.');
  };

  // Confirm and save all guide assignments
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
      toast.error(err?.message || 'Không thể lưu phân công hướng dẫn viên. Vui lòng thử lại sau.');
    } finally {
      setIsSavingGuide(false);
    }
  };

  // Aggregate passengers across confirmed bookings
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULES)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản lý Lịch khởi hành</span>
        </button>

        {tour && (
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(tour.id))}
            className="text-xs text-[#1F4E43] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem chi tiết tour</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Schedule Header Card */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F4E43]/30 border-t-[#1F4E43] rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-stone-500">Đang nạp chi tiết lịch khởi hành...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-sm">{errorMessage}</h3>
          <button
            type="button"
            onClick={fetchScheduleData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Info Card */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-stone-500 uppercase">
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
                  }}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm text-stone-700">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[11px] text-stone-500 block">Thời gian diễn ra:</span>
                <div className="font-semibold text-stone-900">
                  {schedule ? formatDateTime(schedule.startsAt) : '—'}
                </div>
                <div className="text-[11px] text-stone-500">
                  Đến: {schedule ? formatDateTime(schedule.endsAt) : '—'}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[11px] text-stone-500 block">Sức chứa & Đặt chỗ:</span>
                <div className="font-semibold text-stone-900">
                  {schedule?.confirmedSeats ?? 0} đã đặt / {schedule?.capacity ?? 0} chỗ
                </div>
                <div className="text-[11px] text-stone-500">
                  Đang giữ chỗ: {schedule?.heldSeats ?? 0} ghế
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[11px] text-stone-500 block">Giá cơ bản / Khách:</span>
                <div className="font-semibold font-mono text-[#1F4E43]">
                  {formatVND(schedule?.basePriceVnd || 0)}
                </div>
                <div className="text-[11px] text-stone-500">
                  Cọc: {schedule?.depositPercent ?? 0}%
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[11px] text-stone-500 block">Điểm tập trung & Liên hệ:</span>
                <div className="font-semibold text-stone-900 truncate">
                  {schedule?.meetingPoint || 'Chưa cập nhật'}
                </div>
                <div className="text-[11px] font-mono text-stone-600">
                  Hotline: {schedule?.contactPhone || '1900 8888'}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 1: PHÂN CÔNG HƯỚNG DẪN VIÊN (GUIDE ASSIGNMENT)         */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1F4E43]" />
                  <span>Phân công Hướng dẫn viên phụ trách chuyến</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
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
                className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Phân công Guide cho lịch</span>
              </button>
            </div>

            {/* Assigned / Draft Guides List */}
            {draftGuides.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-2">
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
                  const isNewlyAdded = !assignedGuides.some((a) => a.guideId === guide.guideId);
                  return (
                    <div
                      key={guide.guideId ?? guide.accountId ?? idx}
                      className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 text-xs ${
                        isNewlyAdded
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-stone-200 bg-stone-50/70 hover:bg-stone-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-stone-900 text-sm">{guide.fullName}</strong>
                          {guide.isLead && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Guide Chính
                            </span>
                          )}
                          {isNewlyAdded && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              Chưa xác nhận
                            </span>
                          )}
                        </div>
                        <div className="text-stone-600 font-mono">
                          {guide.phone ? `SĐT: ${guide.phone}` : `Email: ${guide.email || '—'}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleLeadGuide(guide.guideId)}
                          className="text-[11px] font-semibold text-[#1F4E43] hover:underline cursor-pointer"
                        >
                          {guide.isLead ? 'Bỏ đánh dấu Guide Chính' : 'Đặt làm Guide Chính'}
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

            {/* Confirmation Bar when there are unsaved changes */}
            {hasUnsavedGuideChanges && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-200 bg-amber-50/60 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-amber-900">
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
                    className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveGuides}
                    disabled={isSavingGuide}
                    className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingGuide ? 'Đang lưu...' : 'Xác nhận hoàn tất'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: DANH SÁCH KHÁCH & TIẾN ĐỘ ĐIỂM DANH                 */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2526]">
                  Danh sách hành khách theo Đơn đặt chỗ ({allPassengers.length} khách)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Theo dõi danh sách khách hàng và tiến độ điểm danh thực tế theo từng booking.
                </p>
              </div>

              <div className="text-xs font-mono text-stone-600">
                Tổng đơn: <strong>{bookings.length}</strong>
              </div>
            </div>

            {isLoadingBookings ? (
              <div className="py-8 text-center text-xs text-stone-500">
                Đang nạp danh sách đặt chỗ của lịch...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
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
                            <StatusBadge equipmentReservationStatus={reservation.status} size="sm" />
                          )}
                        </div>

                        <div className="text-xs text-stone-600 font-mono">
                          Số lượng: <strong>{passengers.length} người</strong> • Tổng tiền:{' '}
                          <strong className="text-[#1F4E43]">{formatVND(booking.price?.totalPriceVnd || 0)}</strong>
                        </div>
                      </div>

                      {/* Passengers Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[11px] font-mono text-stone-500 uppercase border-b border-stone-200">
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
                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[10px]">
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
                      {reservation && reservation.items && reservation.items.length > 0 && (
                        <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs space-y-1.5">
                          <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-stone-600" />
                            <span>Thiết bị thuê theo đơn:</span>
                          </span>
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {reservation.items.map((it) => (
                              <span
                                key={it.equipmentId}
                                className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-mono text-[11px] border border-stone-200"
                              >
                                {it.equipmentName}: <strong>{it.quantity}</strong> đặt (Đã giao:{' '}
                                <strong className="text-emerald-700">{it.issuedQuantity}</strong>, Đã trả:{' '}
                                <strong className="text-teal-700">{it.returnedQuantity}</strong>)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl space-y-4 font-sans">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  Phân công Hướng dẫn viên cho lịch
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Chọn Guide đảm nhiệm dẫn đoàn cho lịch khởi hành #{scheduleId}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGuideToDraft} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="select-guide" className="text-xs font-semibold text-stone-700">
                  Chọn Hướng dẫn viên:
                </label>
                <select
                  id="select-guide"
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
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
                      {g.fullName}{guideConflicts[g.guideId]
                        ? ` — Bận: ${guideConflicts[g.guideId].title}, ${formatDateTime(guideConflicts[g.guideId].startsAt)}`
                        : ''}
                    </option>
                  ))}
                </select>
                {isLoadingGuideConflicts && (
                  <p className="text-xs text-stone-500">Đang kiểm tra lịch đã phân công của các Guide…</p>
                )}
                {guideConflictCheckFailed && !isLoadingGuideConflicts && (
                  <p className="text-xs text-amber-800">Chưa kiểm tra được một số lịch trùng. Tải lại trang trước khi phân công.</p>
                )}
                {!isLoadingGuideConflicts && !guideConflictCheckFailed && Object.keys(guideConflicts).length > 0 && (
                  <p className="text-xs text-stone-500">Guide đang bận được hiển thị theo chuyến trùng lịch và không thể chọn.</p>
                )}
              </div>

              {/* Conflict Warning Banner if detected */}
              {selectedGuideConflict && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1 shadow-2xs">
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

              {/* Lead Guide Checkbox */}
              <label className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer pt-1">
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
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedGuideId || Boolean(selectedGuideConflict) || isLoadingGuideConflicts || guideConflictCheckFailed}
                  className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScheduleDetailPage;
