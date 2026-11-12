import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  LayoutGrid,
  List,
  Search,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { GuideScheduleCard } from './GuideScheduleCard';
import { apiClient } from '../../../lib/axios';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  attendanceApi,
  formatVietnamDateTime,
  LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY,
} from '../../../features/tours/api/attendance.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { useAuthStore } from '../../../stores/auth.store';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
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
type WorkspaceViewMode = 'GRID' | 'TABLE';

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
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('GRID');
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
          const directItems = await apiClient.get<any[]>('/api/v1/guides/me/schedules', {
            signal,
          });
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
        const cancelled =
          signal?.aborted ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED';
        if (!cancelled) {
          setError(err?.message || 'Không thể tải danh sách lịch được phân công.');
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
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
      const endMs = new Date(s.endsAt).getTime();
      if (nowMs >= endMs) return 'COMPLETED';
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

  const getScheduleSortPriority = useCallback(
    (s: GuideAssignedScheduleCardItem): number => {
      const stage = classifyTripStage(s);
      if (stage === 'ONGOING') return 0; // Đang diễn ra / đang mở check-in
      if (stage === 'UPCOMING') return 1; // Chưa khởi hành / sắp khởi hành
      return s.status === 'CANCELLED' ? 3 : 2; // Đã kết thúc / hoàn tất (hủy ở cuối)
    },
    [classifyTripStage]
  );

  const compareSchedules = useCallback(
    (a: GuideAssignedScheduleCardItem, b: GuideAssignedScheduleCardItem): number => {
      const rankDiff = getScheduleSortPriority(a) - getScheduleSortPriority(b);
      if (rankDiff !== 0) return rankDiff;

      const rawStartA = new Date(a.startsAt).getTime();
      const rawStartB = new Date(b.startsAt).getTime();
      const startA = Number.isFinite(rawStartA) ? rawStartA : 0;
      const startB = Number.isFinite(rawStartB) ? rawStartB : 0;

      const stage = classifyTripStage(a);
      if (stage === 'ONGOING' || stage === 'UPCOMING') {
        // Chuyến đang diễn ra hoặc sắp khởi hành: ngày khởi hành gần nhất lên trước
        if (startA !== startB) return startA - startB;
      } else {
        // Chuyến đã kết thúc: chuyến vừa kết thúc gần đây lên trước
        if (startA !== startB) return startB - startA;
      }

      return a.scheduleId - b.scheduleId;
    },
    [classifyTripStage, getScheduleSortPriority]
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

  const workspaceStats = useMemo(() => {
    const totalPassengers = assignedSchedules.reduce((sum, s) => sum + s.passengerCount, 0);
    const totalCheckedIn = assignedSchedules.reduce((sum, s) => sum + s.checkInProcessedCount, 0);
    const leadCount = assignedSchedules.filter((s) => s.isLead).length;

    const sortedAll = [...assignedSchedules].sort(compareSchedules);
    const ongoingSchedules = sortedAll.filter((s) => classifyTripStage(s) === 'ONGOING');
    const upcomingSchedules = sortedAll.filter((s) => classifyTripStage(s) === 'UPCOMING');

    const prioritySchedule = ongoingSchedules[0] || upcomingSchedules[0] || sortedAll[0] || null;

    return {
      totalPassengers,
      totalCheckedIn,
      leadCount,
      nextUpcoming: upcomingSchedules[0] || null,
      prioritySchedule,
    };
  }, [assignedSchedules, classifyTripStage, compareSchedules]);

  const filteredSchedules = useMemo(() => {
    return assignedSchedules
      .filter((s) => {
        if (
          searchQuery.trim() &&
          !s.tourTitle.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
          !String(s.scheduleId).includes(searchQuery.trim())
        ) {
          return false;
        }

        if (activeTab === 'ALL') return true;
        return classifyTripStage(s) === activeTab;
      })
      .sort(compareSchedules);
  }, [assignedSchedules, searchQuery, activeTab, classifyTripStage, compareSchedules]);

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
          {schedule.status === 'COMPLETED' || schedule.checkOutRoundStatus === 'CONFIRMED'
            ? 'Đã hoàn tất'
            : 'Đã kết thúc'}
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
      {/* ====================================================================
          1. GUIDE WORKSPACE HEADER + OPERATIONAL KPI STRIP
         ==================================================================== */}
      <section className="rounded-2xl border border-[#E6E1D8] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1F4E43]">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF0E9] px-2 py-0.5 text-[11px]">
                <Compass className="h-3.5 w-3.5" />
                <span>Không gian làm việc Hướng dẫn viên</span>
              </span>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-[11px] text-stone-500">
                GMT+7: {formatVietnamDateTime(new Date(nowMs).toISOString())}
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#1C2526]">
              Bàn điều phối & Lịch được phân công{' '}
              {!isLoading && !error ? `(${assignedSchedules.length})` : ''}
            </h1>

            <p className="text-xs text-stone-600">
              Hướng dẫn viên:{' '}
              <strong className="text-stone-900">
                {guideIdentity.fullName || guideIdentity.email || 'Đang trực'}
              </strong>{' '}
              • Điểm danh hành khách, bàn giao và thu hồi thiết bị theo từng chặng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* View Switcher */}
            <div
              role="group"
              aria-label="Chế độ hiển thị lịch"
              className="inline-flex items-center rounded-xl border border-stone-200 bg-[#F7F4EE] p-1"
            >
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer',
                  viewMode === 'GRID'
                    ? 'bg-white text-[#1F4E43] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Thẻ tác nghiệp</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer',
                  viewMode === 'TABLE'
                    ? 'bg-white text-[#1F4E43] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span>Bảng điều phối</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchMyAssignedSchedules()}
              disabled={isLoading}
              className="h-9 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#1F4E43]')}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 4 Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('ONGOING')}
            className={cn(
              'text-left rounded-xl border p-3.5 transition-all cursor-pointer',
              activeTab === 'ONGOING'
                ? 'border-[#1F4E43] bg-[#1F4E43]/[0.05] ring-1 ring-[#1F4E43]/20'
                : 'border-[#E6E1D8] bg-[#FDFBF7] hover:border-[#1F4E43]/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-stone-500">
                Đang diễn ra / Mở cổng
              </span>
              <span className="h-7 w-7 rounded-lg bg-emerald-100 text-[#1F4E43] flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold text-stone-900">
                {tabCounts.ONGOING}
              </span>
              <span className="text-xs text-stone-500">chuyến cần xử lý</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 font-medium truncate">
              {tabCounts.ONGOING > 0
                ? 'Đang trong khung giờ Check-in / dẫn đoàn'
                : 'Chưa có chuyến mở cổng ngay lúc này'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UPCOMING')}
            className={cn(
              'text-left rounded-xl border p-3.5 transition-all cursor-pointer',
              activeTab === 'UPCOMING'
                ? 'border-[#1F4E43] bg-[#1F4E43]/[0.05] ring-1 ring-[#1F4E43]/20'
                : 'border-[#E6E1D8] bg-[#FDFBF7] hover:border-[#1F4E43]/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-stone-500">
                Sắp khởi hành
              </span>
              <span className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold text-stone-900">
                {tabCounts.UPCOMING}
              </span>
              <span className="text-xs text-stone-500">lịch chuẩn bị xuất phát</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 truncate">
              {workspaceStats.nextUpcoming
                ? `Gần nhất: ${formatVietnamDateTime(workspaceStats.nextUpcoming.startsAt)}`
                : 'Không có lịch sắp tới'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'text-left rounded-xl border p-3.5 transition-all cursor-pointer',
              activeTab === 'ALL'
                ? 'border-[#1F4E43] bg-[#1F4E43]/[0.05] ring-1 ring-[#1F4E43]/20'
                : 'border-[#E6E1D8] bg-[#FDFBF7] hover:border-[#1F4E43]/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-stone-500">
                Hành khách phụ trách
              </span>
              <span className="h-7 w-7 rounded-lg bg-stone-200/80 text-stone-700 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold text-stone-900">
                {workspaceStats.totalPassengers}
              </span>
              <span className="text-xs text-stone-500">khách xác nhận</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 truncate">
              Đã điểm danh Check-in: {workspaceStats.totalCheckedIn}/
              {workspaceStats.totalPassengers} khách
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={cn(
              'text-left rounded-xl border p-3.5 transition-all cursor-pointer',
              activeTab === 'COMPLETED'
                ? 'border-[#1F4E43] bg-[#1F4E43]/[0.05] ring-1 ring-[#1F4E43]/20'
                : 'border-[#E6E1D8] bg-[#FDFBF7] hover:border-[#1F4E43]/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-stone-500">
                Đã hoàn tất
              </span>
              <span className="h-7 w-7 rounded-lg bg-stone-200/80 text-[#1F4E43] flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold text-stone-900">
                {tabCounts.COMPLETED}
              </span>
              <span className="text-xs text-stone-500">chuyến đã đóng</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500 truncate">
              Trưởng đoàn {workspaceStats.leadCount}/{assignedSchedules.length} chuyến
            </p>
          </button>
        </div>
      </section>

      {/* ====================================================================
          2. WORKSPACE 2-COLUMN LAYOUT (MAIN SCHEDULE LIST + QUICK OPS SIDEBAR)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / MAIN WORKSPACE AREA */}
        <section className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-[#E6E1D8] shadow-2xs overflow-hidden">
          {/* Filter & Search Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7]/80">
            {/* Status Filter Tabs */}
            <div
              role="group"
              aria-label="Lọc lịch theo trạng thái"
              className="flex flex-wrap items-center gap-1.5"
            >
              {(
                [
                  { id: 'ALL', label: 'Tất cả', count: tabCounts.ALL },
                  { id: 'ONGOING', label: 'Đang diễn ra', count: tabCounts.ONGOING },
                  { id: 'UPCOMING', label: 'Sắp khởi hành', count: tabCounts.UPCOMING },
                  { id: 'COMPLETED', label: 'Đã kết thúc', count: tabCounts.COMPLETED },
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
                      'h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer',
                      isActive
                        ? 'bg-[#1F4E43] text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none',
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
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                aria-label="Tìm lịch theo tên tour hoặc mã lịch"
                placeholder="Tìm tên tour, mã chuyến..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-stone-300 bg-white pl-8 pr-3 text-xs text-stone-800 outline-none transition focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15"
              />
            </div>
          </div>

          {/* Content States */}
          {isLoading ? (
            <div
              role="status"
              className="py-16 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2"
            >
              <Loader2 className="w-6 h-6 animate-spin text-[#1F4E43]" />
              <span>Đang đồng bộ dữ liệu lịch khởi hành và trạng thái đoàn...</span>
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
                className="h-9 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="py-14 px-4 text-center space-y-2.5">
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
              {assignedSchedules.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('ALL');
                  }}
                  className="mt-2 h-9 rounded-xl border border-[#D6CEBE] px-4 text-xs font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {filteredSchedules.map((schedule) => (
                <GuideScheduleCard
                  key={schedule.scheduleId}
                  schedule={schedule}
                  stageBadge={renderTripStageBadge(schedule)}
                  nowMs={nowMs}
                  checkInLabel={ROUND_STATUS_CONFIG[schedule.checkInRoundStatus].label}
                  checkOutLabel={ROUND_STATUS_CONFIG[schedule.checkOutRoundStatus].label}
                />
              ))}
            </div>
          ) : (
            /* TABLE VIEW FOR QUICK DISPATCH */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                    <th className="py-3 px-4 font-bold">Chuyến & Cung đường</th>
                    <th className="py-3 px-3 font-bold">Lịch trình (GMT+7)</th>
                    <th className="py-3 px-3 font-bold">Quân số</th>
                    <th className="py-3 px-3 font-bold">1. Check-in</th>
                    <th className="py-3 px-3 font-bold">2. Check-out</th>
                    <th className="py-3 px-4 font-bold text-right">Tác nghiệp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredSchedules.map((schedule) => {
                    const ciConfig = ROUND_STATUS_CONFIG[schedule.checkInRoundStatus];
                    const coConfig = ROUND_STATUS_CONFIG[schedule.checkOutRoundStatus];
                    const href = ROUTES.GUIDE.SCHEDULE_DETAIL(schedule.scheduleId);

                    return (
                      <tr
                        key={schedule.scheduleId}
                        className="hover:bg-[#FDFBF7] transition-colors align-middle"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-bold text-stone-600">
                              #{schedule.scheduleId}
                            </span>
                            <span
                              className={cn(
                                'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                                schedule.isLead
                                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                                  : 'border-stone-200 bg-stone-50 text-stone-600'
                              )}
                            >
                              {schedule.isLead ? 'Trưởng đoàn' : 'Phụ trách'}
                            </span>
                            {renderTripStageBadge(schedule)}
                          </div>
                          <a
                            href={href}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo(href);
                            }}
                            className="font-bold text-sm text-stone-900 hover:text-[#1F4E43] hover:underline block"
                          >
                            {schedule.tourTitle}
                          </a>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[11px] text-stone-700 space-y-0.5 whitespace-nowrap">
                          <div>Đi: {formatVietnamDateTime(schedule.startsAt)}</div>
                          <div className="text-stone-500">
                            Về: {formatVietnamDateTime(schedule.endsAt)}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-stone-800">
                            <Users className="h-3.5 w-3.5 text-[#1F4E43]" />
                            {schedule.passengerCount}/{schedule.capacity}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                              ciConfig.badgeClass
                            )}
                          >
                            <span>{ciConfig.label}</span>
                            <span className="font-mono">
                              ({schedule.checkInProcessedCount}/{schedule.passengerCount})
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                              coConfig.badgeClass
                            )}
                          >
                            <span>{coConfig.label}</span>
                            <span className="font-mono">
                              ({schedule.checkOutProcessedCount}/{schedule.passengerCount})
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigateTo(href)}
                            className="h-8 px-3 rounded-lg bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Mở chuyến</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR: PRIORITY TRIP & GUIDE SOP WORKFLOW */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
          {/* Priority Trip Quick Action Card */}
          {workspaceStats.prioritySchedule && (
            <div className="rounded-2xl border border-[#1F4E43]/30 bg-gradient-to-br from-[#1F4E43] to-[#163830] p-4 text-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                  <Sparkles className="h-3 w-3" />
                  <span>Chuyến trọng tâm</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-100/90">
                  #{workspaceStats.prioritySchedule.scheduleId}
                </span>
              </div>

              <div>
                <h2 className="font-editorial text-lg font-bold leading-snug text-white">
                  {workspaceStats.prioritySchedule.tourTitle}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-emerald-100/90">
                  Khởi hành: {formatVietnamDateTime(workspaceStats.prioritySchedule.startsAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/10 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-100/80 block">Hành khách</span>
                  <span className="font-mono font-bold text-white">
                    {workspaceStats.prioritySchedule.passengerCount}/
                    {workspaceStats.prioritySchedule.capacity} chỗ
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-100/80 block">Bước hiện tại</span>
                  <span className="font-semibold text-amber-200">
                    {workspaceStats.prioritySchedule.checkOutRoundStatus === 'CONFIRMED'
                      ? 'Đã hoàn tất'
                      : workspaceStats.prioritySchedule.checkInRoundStatus === 'CONFIRMED'
                      ? '2. Check-out'
                      : '1. Check-in'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigateTo(
                    ROUTES.GUIDE.SCHEDULE_DETAIL(workspaceStats.prioritySchedule!.scheduleId)
                  )
                }
                className="h-9 w-full rounded-xl bg-white text-[#1F4E43] hover:bg-emerald-50 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Mở bàn làm việc chuyến này</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Guide Operations SOP Checklist */}
          <div className="rounded-2xl border border-[#E6E1D8] bg-white p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
                Quy trình tác nghiệp HDV
              </h2>
              <ShieldCheck className="h-4 w-4 text-[#1F4E43]" />
            </div>

            <ol className="space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F4E43]/10 font-mono text-[11px] font-bold text-[#1F4E43]">
                  1
                </span>
                <div>
                  <p className="font-bold text-stone-800">Check-in & Giao đồ (-60 phút)</p>
                  <p className="mt-0.5 text-[11px] text-stone-500 leading-relaxed">
                    Cổng mở trước giờ khởi hành 60 phút. Điểm danh <strong>Có mặt / Vắng</strong>{' '}
                    và đối chiếu thiết bị khách đã đặt theo đơn.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F4E43]/10 font-mono text-[11px] font-bold text-[#1F4E43]">
                  2
                </span>
                <div>
                  <p className="font-bold text-stone-800">Ghi nhận hiện trạng thiết bị</p>
                  <p className="mt-0.5 text-[11px] text-stone-500 leading-relaxed">
                    Nếu thiết bị <strong>Hư hỏng</strong> hoặc <strong>Thiếu</strong>, bắt buộc
                    nhập ghi chú và chụp ảnh minh chứng trước khi xác nhận.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F4E43]/10 font-mono text-[11px] font-bold text-[#1F4E43]">
                  3
                </span>
                <div>
                  <p className="font-bold text-stone-800">Check-out & Thu hồi đồ</p>
                  <p className="mt-0.5 text-[11px] text-stone-500 leading-relaxed">
                    Khi kết thúc chuyến, kiểm đếm số lượng đồ khách trả so với số đã phát lúc
                    Check-in và gửi báo cáo hoàn tất đoàn.
                  </p>
                </div>
              </li>
            </ol>

            <div className="rounded-xl border border-stone-200 bg-[#F7F4EE]/70 p-2.5 text-[11px] text-stone-600 flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-[#1F4E43] shrink-0 mt-0.5" />
              <span>
                Mọi thao tác nháp được tự động lưu trên trình duyệt cho đến khi bạn bấm{' '}
                <strong className="text-stone-800">Xác nhận hoàn tất</strong>.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GuideScheduleListPage;
