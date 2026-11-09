import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { GuideScheduleCard } from './GuideScheduleCard';
import { apiClient } from '../../../lib/axios';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  attendanceApi,
  LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY,
} from '../../../features/tours/api/attendance.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { useAuthStore } from '../../../stores/auth.store';
import { cn } from '../../../lib/utils';
import type {
  BatchRoundStatus,
  ScheduleOperationsReport,
} from '../../../features/tours/types/attendance.types';

interface GuideAssignedScheduleCardItem {
  scheduleId: number;
  tourId: number;
  tourTitle: string;
  startsAt: string;
  endsAt: string;
  status: string;
  capacity: number;
  confirmedSeats: number;
  heldSeats: number;
  passengerCount: number;
  isLead: boolean;
  assignedAt: string | null;
  checkInRoundStatus: BatchRoundStatus;
  checkInSubmittedAt: string | null;
  checkInProcessedCount: number;
  checkOutRoundStatus: BatchRoundStatus;
  checkOutSubmittedAt: string | null;
  checkOutProcessedCount: number;
}

type ScheduleFilterTab = 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

const ROUND_STATUS_CONFIG: Record<
  BatchRoundStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
    dotClass: 'bg-stone-400',
  },
  IN_PROGRESS: {
    label: 'Đang nhập',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Gửi lỗi',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

export const GuideScheduleListPage: React.FC = () => {
  const { account, user } = useAuthStore();

  const guideIdentity = useMemo(
    () => ({
      id: account?.id ?? user?.id ?? null,
      email: account?.email ?? user?.email ?? null,
      fullName: account?.fullName ?? user?.name ?? null,
    }),
    [account?.id, account?.email, account?.fullName, user?.id, user?.email, user?.name]
  );

  const [assignedSchedules, setAssignedSchedules] = useState<GuideAssignedScheduleCardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ScheduleFilterTab>('ALL');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const computeRoundProgress = (
    opsReport: ScheduleOperationsReport | null,
    fallbackPassengerCount: number,
    fallbackCheckInStatus?: BatchRoundStatus,
    fallbackCheckOutStatus?: BatchRoundStatus
  ) => {
    const ciParticipants = opsReport?.checkInReport?.participants || [];
    const coParticipants = opsReport?.checkOutReport?.participants || [];
    const totalPassengers =
      ciParticipants.length > 0 ? ciParticipants.length : fallbackPassengerCount;

    const effectiveCiStatus =
      opsReport?.checkInReport?.roundStatus || fallbackCheckInStatus || 'NOT_STARTED';
    const effectiveCoStatus =
      opsReport?.checkOutReport?.roundStatus || fallbackCheckOutStatus || 'NOT_STARTED';

    const checkInProcessedCount =
      effectiveCiStatus === 'CONFIRMED'
        ? totalPassengers
        : ciParticipants.filter((p) => p.status !== 'PENDING').length;

    const checkOutProcessedCount =
      effectiveCoStatus === 'CONFIRMED'
        ? totalPassengers
        : coParticipants.filter((p) => p.status !== 'PENDING').length;

    return {
      totalPassengers,
      checkInProcessedCount,
      checkOutProcessedCount,
    };
  };

  const fetchMyAssignedSchedules = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        try {
          const directItems = await apiClient.get<any[]>(
            '/api/v1/guides/me/schedules',
            { signal }
          );
          if (Array.isArray(directItems)) {
            const enriched: GuideAssignedScheduleCardItem[] = await Promise.all(
              directItems.map(async (item) => {
                const opsReport = await attendanceApi
                  .getScheduleOperationsReport(item.scheduleId, signal)
                  .catch(() => null);
                const ciStatus: BatchRoundStatus =
                  opsReport?.checkInReport?.roundStatus &&
                  opsReport.checkInReport.roundStatus !== 'NOT_STARTED'
                    ? opsReport.checkInReport.roundStatus
                    : (item.checkInRoundStatus as BatchRoundStatus) || 'NOT_STARTED';
                const coStatus: BatchRoundStatus =
                  opsReport?.checkOutReport?.roundStatus &&
                  opsReport.checkOutReport.roundStatus !== 'NOT_STARTED'
                    ? opsReport.checkOutReport.roundStatus
                    : (item.checkOutRoundStatus as BatchRoundStatus) || 'NOT_STARTED';
                const basePassengerCount = Number(item.passengerCount ?? item.confirmedSeats ?? 0);
                const progress = computeRoundProgress(
                  opsReport,
                  basePassengerCount,
                  ciStatus,
                  coStatus
                );

                return {
                  scheduleId: Number(item.scheduleId),
                  tourId: Number(item.tourId || 0),
                  tourTitle: item.tourTitle || `Lịch khởi hành #${item.scheduleId}`,
                  startsAt: item.startsAt,
                  endsAt: item.endsAt,
                  status: item.status || 'SCHEDULED',
                  capacity: Number(item.capacity ?? 20),
                  confirmedSeats: Number(item.confirmedSeats ?? basePassengerCount),
                  heldSeats: Number(item.heldSeats ?? 0),
                  passengerCount: progress.totalPassengers,
                  isLead: Boolean(item.isLead),
                  assignedAt: item.assignedAt ?? null,
                  checkInRoundStatus: ciStatus,
                  checkInSubmittedAt:
                    opsReport?.checkInReport?.submittedAt ?? item.checkInSubmittedAt ?? null,
                  checkInProcessedCount: progress.checkInProcessedCount,
                  checkOutRoundStatus: coStatus,
                  checkOutSubmittedAt:
                    opsReport?.checkOutReport?.submittedAt ?? item.checkOutSubmittedAt ?? null,
                  checkOutProcessedCount: progress.checkOutProcessedCount,
                };
              })
            );
            setAssignedSchedules(
              enriched.sort(
                (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
              )
            );
            return;
          }
        } catch {
          // Fallback sang luồng quét lịch + kiểm tra phân công
        }

        const now = new Date();
        const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        const future = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

        const rawSchedules = await toursApi.listSchedulesInRange(
          past.toISOString(),
          future.toISOString(),
          signal
        );

        const verificationResults = await Promise.all(
          rawSchedules.map(async (schedule) => {
            const verification = await attendanceApi.verifyGuideAssignedToSchedule(
              schedule.id,
              guideIdentity,
              signal
            );
            if (!verification.assigned || !verification.guide) {
              return null;
            }

            const [scheduleDetail, opsReport, bookingsPage] = await Promise.all([
              toursApi.getScheduleDetail(schedule.tourId, schedule.id, signal).catch(() => null),
              attendanceApi.getScheduleOperationsReport(schedule.id, signal).catch(() => null),
              bookingsApi
                .searchBookings({ scheduleId: schedule.id, size: 100 }, signal)
                .catch(() => null),
            ]);

            const confirmedBookings = (bookingsPage?.content || []).filter(
              (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED'
            );
            const countedPassengers =
              confirmedBookings.length > 0
                ? confirmedBookings.reduce((sum, b) => sum + (b.participantCount || 0), 0)
                : scheduleDetail?.confirmedSeats || 0;

            const resolvedReport: ScheduleOperationsReport | null = opsReport;
            const checkInRoundStatus: BatchRoundStatus =
              resolvedReport?.checkInReport?.roundStatus || 'NOT_STARTED';
            const checkOutRoundStatus: BatchRoundStatus =
              resolvedReport?.checkOutReport?.roundStatus || 'NOT_STARTED';
            const progress = computeRoundProgress(resolvedReport, countedPassengers);

            const item: GuideAssignedScheduleCardItem = {
              scheduleId: schedule.id,
              tourId: schedule.tourId,
              tourTitle: schedule.title || `Lịch khởi hành #${schedule.id}`,
              startsAt: schedule.startsAt,
              endsAt: schedule.endsAt,
              status: schedule.status,
              capacity: scheduleDetail?.capacity ?? 20,
              confirmedSeats: scheduleDetail?.confirmedSeats ?? countedPassengers,
              heldSeats: scheduleDetail?.heldSeats ?? 0,
              passengerCount: progress.totalPassengers,
              isLead: Boolean(verification.guide.isLead),
              assignedAt: verification.guide.assignedAt ?? null,
              checkInRoundStatus,
              checkInSubmittedAt: resolvedReport?.checkInReport?.submittedAt ?? null,
              checkInProcessedCount: progress.checkInProcessedCount,
              checkOutRoundStatus,
              checkOutSubmittedAt: resolvedReport?.checkOutReport?.submittedAt ?? null,
              checkOutProcessedCount: progress.checkOutProcessedCount,
            };

            return item;
          })
        );

        const filtered = verificationResults
          .filter((item): item is GuideAssignedScheduleCardItem => item !== null)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

        setAssignedSchedules(filtered);
      } catch (err: any) {
        if (err?.name !== 'CanceledError') {
          setError(err?.message || 'Không thể tải danh sách lịch được phân công.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [guideIdentity]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMyAssignedSchedules(controller.signal);
    return () => controller.abort();
  }, [fetchMyAssignedSchedules]);

  useEffect(() => {
    const handleStorageOrCustomUpdate = (e: Event) => {
      if (
        e.type === 'wetrek-operations-report-updated' ||
        (e instanceof StorageEvent &&
          (e.key === LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY ||
            e.key === 'wetrek_schedule_guides_v1'))
      ) {
        fetchMyAssignedSchedules();
      }
    };
    window.addEventListener('storage', handleStorageOrCustomUpdate);
    window.addEventListener('wetrek-operations-report-updated', handleStorageOrCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageOrCustomUpdate);
      window.removeEventListener('wetrek-operations-report-updated', handleStorageOrCustomUpdate);
    };
  }, [fetchMyAssignedSchedules]);

  const classifyTripStage = useCallback(
    (s: GuideAssignedScheduleCardItem): 'UPCOMING' | 'ONGOING' | 'COMPLETED' => {
      if (
        s.status === 'COMPLETED' ||
        s.status === 'CANCELLED' ||
        s.checkOutRoundStatus === 'CONFIRMED'
      ) {
        return 'COMPLETED';
      }
      const startMs = new Date(s.startsAt).getTime();
      const checkInUnlockMs = startMs - 60 * 60 * 1000;
      if (
        s.status === 'ONGOING' ||
        nowMs >= checkInUnlockMs ||
        s.checkInRoundStatus === 'IN_PROGRESS' ||
        s.checkInRoundStatus === 'CONFIRMED'
      ) {
        return 'ONGOING';
      }
      return 'UPCOMING';
    },
    [nowMs]
  );

  const tabCounts = useMemo(() => {
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;
    assignedSchedules.forEach((s) => {
      const stage = classifyTripStage(s);
      if (stage === 'UPCOMING') upcoming += 1;
      else if (stage === 'ONGOING') ongoing += 1;
      else completed += 1;
    });
    return {
      ALL: assignedSchedules.length,
      UPCOMING: upcoming,
      ONGOING: ongoing,
      COMPLETED: completed,
    };
  }, [assignedSchedules, classifyTripStage]);

  const filteredSchedules = useMemo(() => {
    return assignedSchedules.filter((s) => {
      if (
        searchQuery.trim() &&
        !s.tourTitle.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
        !String(s.scheduleId).includes(searchQuery.trim())
      ) {
        return false;
      }

      if (activeTab === 'ALL') return true;
      return classifyTripStage(s) === activeTab;
    });
  }, [assignedSchedules, searchQuery, activeTab, classifyTripStage]);

  const renderTripStageBadge = (schedule: GuideAssignedScheduleCardItem) => {
    if (schedule.status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 whitespace-nowrap">
          Đã hủy
        </span>
      );
    }
    const stage = classifyTripStage(schedule);
    if (stage === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700 whitespace-nowrap">
          Đã hoàn tất
        </span>
      );
    }
    if (stage === 'ONGOING') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#1F4E43] whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Đang diễn ra
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Sắp khởi hành
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#E6E1D8] px-5 py-4 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#51756a]">
            <span>Nhiệm vụ Hướng dẫn viên</span>
            <span>•</span>
            <span>Múi giờ Việt Nam (GMT+7)</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C2526] mt-0.5">
            Lịch được phân công {!isLoading && !error ? `(${assignedSchedules.length})` : ''}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchMyAssignedSchedules()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#1F4E43]')} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Schedule Table / List Card */}
      <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FDFBF7]/60">
          {/* Status Filter Tabs */}
          <div role="group" aria-label="Lọc lịch theo trạng thái" className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Tất cả', count: tabCounts.ALL },
                { id: 'UPCOMING', label: 'Sắp khởi hành', count: tabCounts.UPCOMING },
                { id: 'ONGOING', label: 'Đang diễn ra', count: tabCounts.ONGOING },
                { id: 'COMPLETED', label: 'Đã hoàn tất', count: tabCounts.COMPLETED },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'min-h-11 px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-[#1F4E43] text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded text-[11px] font-mono',
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              aria-label="Tìm lịch theo tên tour hoặc mã lịch"
              placeholder="Tìm tên tour hoặc mã lịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white min-h-11 py-2 pl-8 pr-3 text-base sm:text-sm text-stone-800 outline-none transition focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15"
            />
          </div>
        </div>

        {/* Content States */}
        {isLoading ? (
          <div role="status" className="py-14 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#1F4E43]" />
            <span>Đang tải danh sách lịch khởi hành được phân công...</span>
          </div>
        ) : error ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">
                Không thể tải lịch được phân công
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchMyAssignedSchedules()}
              className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <CalendarIcon className="w-8 h-8 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">
              {assignedSchedules.length === 0
                ? 'Bạn chưa được phân công lịch khởi hành nào'
                : 'Không có lịch khởi hành phù hợp bộ lọc'}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {assignedSchedules.length === 0
                ? 'Chỉ những lịch khởi hành mà Admin đã phân công trực tiếp cho tài khoản của bạn mới hiển thị tại đây.'
                : 'Hãy thử đổi từ khóa tìm kiếm hoặc chọn trạng thái "Tất cả".'}
            </p>
            {assignedSchedules.length > 0 && <button type="button" onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }} className="mt-3 min-h-11 rounded-lg border border-[#D6CEBE] px-4 py-2 text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F4EE]">Xóa bộ lọc</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 xl:grid-cols-2">
            {filteredSchedules.map((schedule) => (
              <GuideScheduleCard key={schedule.scheduleId} schedule={schedule}
                stageBadge={renderTripStageBadge(schedule)} nowMs={nowMs}
                checkInLabel={ROUND_STATUS_CONFIG[schedule.checkInRoundStatus].label}
                checkOutLabel={ROUND_STATUS_CONFIG[schedule.checkOutRoundStatus].label} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideScheduleListPage;
