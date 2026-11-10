import { Modal } from '../../../components/ui/Modal';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Compass,
  Clock,
  ShieldCheck,
  Plus,
  LayoutGrid,
  List,
  ExternalLink,
  MapPin,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourScheduleRangeResponse, TourStatus } from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { CreateScheduleModal } from '../../../features/tours/components/CreateScheduleModal';
import { toast } from '../../../components/ui/Toast';
import type { TourSummaryResponse } from '../../../features/tours/types/tour.types';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import {
  formatOffsetDateTime,
  toDateInputString,
  getMondayOfWeek,
  getSundayOfWeek,
  formatDateTime,
  formatTimeOnly,
  formatDate,
} from '../../../lib/utils';

interface DayColumn {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeekLabel: string; // "Thứ 2", "Thứ 3", ..., "Chủ nhật"
  dayMonthLabel: string; // "26/10"
  fullHeader: string; // "Thứ 2 (26/10)"
  isToday: boolean;
}

function getDayOfWeekLabel(date: Date): string {
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  if (day === 0) return 'Chủ nhật';
  return `Thứ ${day + 1}`;
}

function formatDayMonth(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

/** Số ngày tối đa được hiển thị trên khung TKB để tránh tràn bố cục. */
const MAX_RANGE_DAYS = 10;

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateInputString(d);
}

function diffDays(startStr: string, endStr: string): number {
  const s = new Date(startStr + 'T00:00:00').getTime();
  const e = new Date(endStr + 'T00:00:00').getTime();
  return Math.round((e - s) / 86400000);
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export const AdminScheduleListPage: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [chosenTour, setChosenTour] = useState<TourSummaryResponse | null>(null);
  const [tourQuery, setTourQuery] = useState('');
  const [tourPage, setTourPage] = useState(0);
  const [tourPages, setTourPages] = useState(0);
  const [tourChoices, setTourChoices] = useState<TourSummaryResponse[]>([]);
  const [tourLoading, setTourLoading] = useState(false);
  const [tourError, setTourError] = useState('');
  const [tourReload, setTourReload] = useState(0);

  useEffect(() => {
    if (!createOpen || chosenTour) return;
    let active = true;
    setTourLoading(true);
    setTourError('');
    const timer = window.setTimeout(() => {
      toursApi.listTours({ query: tourQuery, page: tourPage, size: 20 })
        .then(result => { if (active) { setTourChoices(result.content); setTourPages(result.totalPages); } })
        .catch(() => { if (active) setTourError('Không tải được danh sách tour. Vui lòng thử lại.'); })
        .finally(() => { if (active) setTourLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [createOpen, chosenTour, tourQuery, tourPage, tourReload]);

  const closeCreate = () => { setCreateOpen(false); setChosenTour(null); setTourQuery(''); setTourPage(0); };

  // Current week defaults (Monday -> Sunday)
  const [startDate, setStartDate] = useState<string>(() =>
    toDateInputString(getMondayOfWeek(new Date()))
  );
  const [endDate, setEndDate] = useState<string>(() =>
    toDateInputString(getSundayOfWeek(new Date()))
  );

  // View preferences
  const [viewMode, setViewMode] = useState<'tkb' | 'list'>('tkb');
  const [displayMode, setDisplayMode] = useState<'departure_only' | 'full_span'>('departure_only');

  const [schedules, setSchedules] = useState<TourScheduleRangeResponse[]>([]);
  const [tourStatusMap, setTourStatusMap] = useState<Record<number, TourStatus>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Fetch tour status lookup map (DRAFT vs PUBLISHED)
  useEffect(() => {
    toursApi
      .listTours({ size: 100 })
      .then((res) => {
        const map: Record<number, TourStatus> = {};
        (res.content || []).forEach((t) => {
          map[t.id] = t.status;
        });
        setTourStatusMap(map);
      })
      .catch(() => {});
  }, []);

  // Fetch schedules overlapping the selected date range
  const fetchSchedules = useCallback(async () => {
    if (!startDate || !endDate) return;

    const startObj = new Date(startDate + 'T00:00:00');
    // Backend end date is exclusive, so add 1 day to include full endDate
    const endObj = new Date(endDate + 'T00:00:00');
    endObj.setDate(endObj.getDate() + 1);

    if (endObj.getTime() <= startObj.getTime()) {
      setError({
        code: 'INVALID_RANGE',
        message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startParam = formatOffsetDateTime(startObj);
      const endParam = formatOffsetDateTime(endObj);

      const list = await toursApi.listSchedulesInRange(startParam, endParam);
      setSchedules(list || []);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.SCHEDULES)}`,
          { replace: true }
        );
        return;
      }
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    const s = new Date(startDate + 'T00:00:00');
    s.setDate(s.getDate() - 7);
    const e = new Date(endDate + 'T00:00:00');
    e.setDate(e.getDate() - 7);
    setStartDate(toDateInputString(s));
    setEndDate(toDateInputString(e));
  };

  const handleNextWeek = () => {
    const s = new Date(startDate + 'T00:00:00');
    s.setDate(s.getDate() + 7);
    const e = new Date(endDate + 'T00:00:00');
    e.setDate(e.getDate() + 7);
    setStartDate(toDateInputString(s));
    setEndDate(toDateInputString(e));
  };

  const handleCurrentWeek = () => {
    const monday = getMondayOfWeek(new Date());
    const sunday = getSundayOfWeek(new Date());
    setStartDate(toDateInputString(monday));
    setEndDate(toDateInputString(sunday));
    setRangeNotice(null);
  };

  const [rangeNotice, setRangeNotice] = useState<string | null>(null);

  // Đổi "Từ ngày": nếu khoảng vượt quá 10 ngày hoặc đảo ngược thì tự điều chỉnh "Đến ngày"
  const handleStartDateChange = (value: string) => {
    if (!value) return;
    setStartDate(value);
    const span = diffDays(value, endDate);
    if (span < 0) {
      setEndDate(value);
      setRangeNotice(null);
    } else if (span > MAX_RANGE_DAYS - 1) {
      setEndDate(addDaysToDateStr(value, MAX_RANGE_DAYS - 1));
      setRangeNotice(`Chỉ xem tối đa ${MAX_RANGE_DAYS} ngày, "Đến ngày" đã được điều chỉnh tự động.`);
    } else {
      setRangeNotice(null);
    }
  };

  // Đổi "Đến ngày": nếu khoảng vượt quá 10 ngày hoặc đảo ngược thì tự điều chỉnh "Từ ngày"
  const handleEndDateChange = (value: string) => {
    if (!value) return;
    setEndDate(value);
    const span = diffDays(startDate, value);
    if (span < 0) {
      setStartDate(value);
      setRangeNotice(null);
    } else if (span > MAX_RANGE_DAYS - 1) {
      setStartDate(addDaysToDateStr(value, -(MAX_RANGE_DAYS - 1)));
      setRangeNotice(`Chỉ xem tối đa ${MAX_RANGE_DAYS} ngày, "Từ ngày" đã được điều chỉnh tự động.`);
    } else {
      setRangeNotice(null);
    }
  };

  // Generate list of days between startDate and endDate
  const dayColumns = useMemo<DayColumn[]>(() => {
    if (!startDate || !endDate) return [];
    const list: DayColumn[] = [];
    const startObj = new Date(startDate + 'T00:00:00');
    const endObj = new Date(endDate + 'T00:00:00');
    const today = new Date();

    const cur = new Date(startObj);
    while (cur.getTime() <= endObj.getTime() && list.length < MAX_RANGE_DAYS) {
      const dateCopy = new Date(cur);
      list.push({
        date: dateCopy,
        dateStr: toDateInputString(dateCopy),
        dayOfWeekLabel: getDayOfWeekLabel(dateCopy),
        dayMonthLabel: formatDayMonth(dateCopy),
        fullHeader: `${getDayOfWeekLabel(dateCopy)} (${formatDayMonth(dateCopy)})`,
        isToday: isSameDay(dateCopy, today),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [startDate, endDate]);

  // Map schedules to each day based on departure_only or full_span mode
  const schedulesByDay = useMemo(() => {
    const map: Record<string, TourScheduleRangeResponse[]> = {};
    dayColumns.forEach((col) => {
      map[col.dateStr] = [];
    });

    schedules.forEach((sch) => {
      const schStart = new Date(sch.startsAt);
      const schEnd = new Date(sch.endsAt);

      dayColumns.forEach((col) => {
        if (displayMode === 'departure_only') {
          // Only show on the departure date
          if (isSameDay(schStart, col.date)) {
            map[col.dateStr].push(sch);
          }
        } else {
          // Show on all days the tour spans across
          const dayStart = new Date(col.dateStr + 'T00:00:00');
          const dayEnd = new Date(col.dateStr + 'T23:59:59.999');
          if (schStart.getTime() <= dayEnd.getTime() && schEnd.getTime() >= dayStart.getTime()) {
            map[col.dateStr].push(sch);
          }
        }
      });
    });

    // Sort schedules of each day by startsAt ascending
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
    });

    return map;
  }, [dayColumns, schedules, displayMode]);

  // Max number of slots needed (at least 1 to show the empty row like the user screenshot)
  const maxSlots = useMemo(() => {
    let max = 1;
    Object.values(schedulesByDay).forEach((list) => {
      if (list.length > max) {
        max = list.length;
      }
    });
    return max;
  }, [schedulesByDay]);

  const visibleMobileSchedules = useMemo(() => {
    if (viewMode !== 'tkb') return schedules;
    const uniqueSchedules = new Map<number, TourScheduleRangeResponse>();
    Object.values(schedulesByDay).forEach((daySchedules) => {
      daySchedules.forEach((schedule) => uniqueSchedules.set(schedule.id, schedule));
    });
    return [...uniqueSchedules.values()].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  }, [schedules, schedulesByDay, viewMode]);

  // Human-readable date range summary
  const rangeSummaryText = useMemo(() => {
    if (!startDate || !endDate) return '';
    try {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      const formatter = new Intl.DateTimeFormat('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${formatter.format(s)} — ${formatter.format(e)}`;
    } catch {
      return `${startDate} đến ${endDate}`;
    }
  }, [startDate, endDate]);

  return (
    <AdminAccessGuard forbiddenError={error?.status === 403}>
      {createOpen && !chosenTour && <Modal isOpen onClose={closeCreate} title="Add departure" subtitle="Choose a tour for this departure." maxWidth="3xl"><label htmlFor="schedule-tour-search" className="mt-5 text-base font-semibold">Tìm tour</label>
          <input id="schedule-tour-search" autoFocus type="search" value={tourQuery} onChange={e => { setTourQuery(e.target.value); setTourPage(0); }} placeholder="Nhập tên tour..." className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-base focus:border-[#1F4E43] focus:outline-none" />
          <div className="mt-4 min-h-32 flex-1 space-y-2 overflow-y-auto">
            {tourLoading ? <p className="p-4 text-base text-stone-600">Đang tải danh sách tour...</p> : tourError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-base text-red-700">{tourError} <button type="button" onClick={() => setTourReload(v => v + 1)} className="underline">Thử lại</button></p> : tourChoices.length === 0 ? <p className="p-4 text-base text-stone-600">Không tìm thấy tour phù hợp.</p> : tourChoices.map(tour => <button key={tour.id} type="button" onClick={() => setChosenTour(tour)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-stone-200 px-4 py-4 text-left hover:border-[#1F4E43] hover:bg-emerald-50"><span><span className="block text-base font-bold text-stone-900">{tour.title}</span><span className="mt-1 block text-sm text-stone-600">{tour.durationDays} ngày · {tour.status === 'PUBLISHED' ? 'Đã xuất bản' : tour.status === 'DRAFT' ? 'Bản nháp' : tour.status}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-[#1F4E43]" /></button>)}
          </div>
          {tourPages > 1 && <div className="mt-4 flex items-center justify-end gap-4 text-base"><button type="button" disabled={tourPage === 0 || tourLoading} onClick={() => setTourPage(p => p - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Trước</button><span>{tourPage + 1} / {tourPages}</span><button type="button" disabled={tourPage + 1 >= tourPages || tourLoading} onClick={() => setTourPage(p => p + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Sau</button></div>}
        </Modal>}
      {createOpen && chosenTour && <CreateScheduleModal tourId={chosenTour.id} title={chosenTour.title} durationDays={chosenTour.durationDays} onClose={closeCreate} onCreated={(startsAt) => { const date = new Date(startsAt); const monday = toDateInputString(getMondayOfWeek(date)); const sunday = toDateInputString(getSundayOfWeek(date)); closeCreate(); toast.success('Đã thêm lịch khởi hành.'); if (startDate === monday && endDate === sunday) fetchSchedules(); else { setStartDate(monday); setEndDate(sunday); } }} />}
      <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Card */}
          <AdminPageHeader title="Lịch Khởi Hành Tour Trekking" description="Theo dõi các đợt xuất phát theo khung thời khóa biểu (TKB) tuần trực quan." actions={<div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchSchedules}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`}
                />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="px-5 py-3 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lịch khởi hành</span>
              </button>
            </div>} />

          {/* Time Navigation & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Week Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Tuần trước</span>
                </button>

                <button
                  type="button"
                  onClick={handleCurrentWeek}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#1F4E43]" />
                  <span>Về tuần hiện tại</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Tuần sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Date Range Picker */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="schedule-filter-start" className="text-xs font-semibold text-stone-600">
                    Từ ngày:
                  </label>
                  <input
                    id="schedule-filter-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 bg-[#FDFBF7] text-xs font-mono text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#1F4E43]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="schedule-filter-end" className="text-xs font-semibold text-stone-600">
                    Đến ngày:
                  </label>
                  <input
                    id="schedule-filter-end"
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={addDaysToDateStr(startDate, MAX_RANGE_DAYS - 1)}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 bg-[#FDFBF7] text-xs font-mono text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#1F4E43]"
                  />
                </div>
                <span className="text-xs text-stone-400">(tối đa {MAX_RANGE_DAYS} ngày)</span>
              </div>

              {/* View Switchers */}
              <div className="flex items-center gap-2 shrink-0">
                {/* TKB vs List Tabs */}
                <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('tkb')}
                    className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'tkb'
                        ? 'bg-white text-[#1F4E43] shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Khung TKB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#1F4E43] shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Danh sách</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Info summary & Filter toggle */}
            {rangeNotice && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                {rangeNotice}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-2 text-stone-600 font-medium">
                <Calendar className="w-4 h-4 text-[#1F4E43]" />
                <span>Khoảng thời gian:</span>
                <strong className="text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-md font-mono">
                  {rangeSummaryText}
                </strong>
                <span className="text-stone-400">•</span>
                <span className="text-stone-500">
                  Tổng cộng: <strong className="text-stone-900">{schedules.length}</strong> chuyến
                </span>
              </div>

              {/* Departure-only vs Full-span toggle */}
              {viewMode === 'tkb' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 font-medium">Chế độ xếp lịch:</span>
                  <div className="inline-flex rounded-lg border border-stone-200 bg-[#FDFBF7] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('departure_only')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        displayMode === 'departure_only'
                          ? 'bg-[#1F4E43] text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Ngày khởi hành
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('full_span')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        displayMode === 'full_span'
                          ? 'bg-[#1F4E43] text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Toàn bộ hành trình
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Chú thích trạng thái nút tròn và màu sắc hành trình */}
            {viewMode === 'tkb' && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600 border-t border-stone-200/80 pt-3">
                <span className="font-semibold text-stone-700 text-xs uppercase tracking-wide">
                  Chú thích:
                </span>
                <span className="inline-flex items-center gap-1.5" title="Bản nháp: Nút tròn không màu">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-stone-400 bg-white shadow-2xs" />
                  <span className="text-stone-600 text-xs">Tour Bản nháp</span>
                </span>
                <span className="inline-flex items-center gap-1.5" title="Đã xuất bản: Nút tròn màu xanh">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs ring-2 ring-emerald-200" />
                  <span className="text-stone-600 text-xs">Tour Đã xuất bản</span>
                </span>
                {displayMode === 'full_span' && (
                  <>
                    <span className="text-stone-300">|</span>
                    <span className="inline-flex items-center gap-1.5" title="Ngày bắt đầu: Màu xanh">
                      <span className="w-3 h-2 rounded-sm bg-emerald-500" />
                      <span className="text-stone-700 font-medium text-xs">Màu xanh: Ngày bắt đầu</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5" title="Ngày kết thúc: Màu đỏ">
                      <span className="w-3 h-2 rounded-sm bg-rose-500" />
                      <span className="text-stone-700 font-medium text-xs">Màu đỏ: Ngày kết thúc</span>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3 shadow-2xs"
            >
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="text-base font-bold text-stone-900">
                  Không thể tải lịch khởi hành từ máy chủ
                </h2>
                <p className="text-xs text-stone-600">{error.message}</p>
              </div>
              <button
                type="button"
                onClick={fetchSchedules}
                className="px-4 py-2 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="space-y-3 md:hidden" aria-busy={isLoading}>
            <h2 className="text-lg font-semibold">Lịch khởi hành</h2>
            {isLoading ? <p role="status" className="rounded-xl border border-[#E6E1D8] bg-white p-5 text-sm text-stone-600">Đang tải lịch khởi hành…</p> : visibleMobileSchedules.length === 0 ? <p className="rounded-xl border border-[#E6E1D8] bg-white p-5 text-sm text-stone-600">Không có lịch khởi hành trong khoảng ngày đã chọn.</p> : visibleMobileSchedules.map((item) => <article key={item.id} className="space-y-4 rounded-xl border border-[#E6E1D8] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-stone-500">Chuyến #{item.id}</span><StatusBadge scheduleStatus={item.status} /></div>
              <h3 className="break-words text-base font-semibold">{item.title}</h3>
              <dl className="space-y-2 text-sm"><div><dt className="text-stone-500">Khởi hành</dt><dd className="mt-0.5 font-medium">{formatDateTime(item.startsAt)}</dd></div><div><dt className="text-stone-500">Kết thúc</dt><dd className="mt-0.5">{formatDateTime(item.endsAt)}</dd></div></dl>
              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4"><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(item.id))} className="min-h-11 rounded-lg bg-[#1F4E43] px-3 text-sm font-medium text-white">Quản lý chuyến</button><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.tourId))} className="min-h-11 rounded-lg border border-stone-200 px-3 text-sm font-medium">Xem tour</button></div>
            </article>)}
          </div>
          {/* MAIN VIEW: KHUNG THỜI KHÓA BIỂU (TKB) */}
          {viewMode === 'tkb' && (
            <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse table-fixed"
                  style={{ minWidth: `${dayColumns.length * 130}px` }}
                >
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-stone-200">
                      {/* Day Column Headers */}
                      {dayColumns.map((day) => (
                        <th
                          key={day.dateStr}
                          className={`py-3 px-2 text-center border-r border-stone-200 last:border-r-0 transition-colors ${
                            day.isToday
                              ? 'bg-[#DEF7EC] text-emerald-800'
                              : 'text-stone-800'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span
                              className={`text-xs whitespace-nowrap ${
                                day.isToday ? 'font-bold text-[#0D9488]' : 'font-semibold'
                              }`}
                            >
                              {day.dayOfWeekLabel}
                            </span>
                            <span
                              className={`text-xs font-mono ${
                                day.isToday ? 'text-[#0D9488]' : 'text-stone-500'
                              }`}
                            >
                              {day.dayMonthLabel}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-200">
                    {isLoading ? (
                      // Skeleton Loading inside TKB Grid
                      <tr>
                        {dayColumns.map((day) => (
                          <td
                            key={day.dateStr}
                            className={`p-3 border-r border-stone-200 last:border-r-0 ${
                              day.isToday ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-stone-200 rounded w-2/3" />
                              <div className="h-3 bg-stone-200 rounded w-1/2" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ) : (
                      // Render rows based on maxSlots (minimum 1 row)
                      Array.from({ length: maxSlots }).map((_, slotIndex) => (
                        <tr
                          key={slotIndex}
                          className="hover:bg-stone-50/30 transition-colors"
                        >
                          {/* Day Cells */}
                          {dayColumns.map((day) => {
                            const dayList = schedulesByDay[day.dateStr] || [];
                            const schedule = dayList[slotIndex];

                            return (
                              <td
                                key={day.dateStr}
                                className={`p-2 align-top border-r border-stone-200 last:border-r-0 transition-colors ${
                                  day.isToday ? 'bg-emerald-50/15' : ''
                                }`}
                              >
                                {schedule ? (() => {
                                  const effectiveTourStatus =
                                    schedule.tourStatus || tourStatusMap[schedule.tourId] || 'DRAFT';
                                  const isPublished = effectiveTourStatus === 'PUBLISHED';

                                  const schStart = new Date(schedule.startsAt);
                                  const schEnd = new Date(schedule.endsAt);
                                  const isStartDay = isSameDay(schStart, day.date);
                                  const isEndDay = isSameDay(schEnd, day.date);

                                  let timePillClass =
                                    'bg-[#B9EADB]/40 text-[#1F4E43] border border-emerald-300';
                                  let timeIcon = <Clock className="w-3 h-3 shrink-0 text-[#1F4E43]" />;
                                  let timeText = formatTimeOnly(schedule.startsAt);
                                  let cardBorderClass =
                                    'border-stone-200 hover:border-[#1F4E43]';

                                  if (displayMode === 'full_span') {
                                    if (isEndDay && !isStartDay) {
                                      // Ngày kết thúc: MÀU ĐỎ
                                      timePillClass =
                                        'bg-rose-50 text-rose-700 border border-rose-300';
                                      timeIcon = (
                                        <CheckCircle2 className="w-3 h-3 shrink-0 text-rose-600" />
                                      );
                                      timeText = `Kết thúc ${formatTimeOnly(schedule.endsAt)}`;
                                      cardBorderClass =
                                        'border-rose-200 hover:border-rose-500 border-l-4 border-l-rose-500';
                                    } else if (isStartDay && !isEndDay) {
                                      // Ngày bắt đầu: MÀU XANH
                                      timePillClass =
                                        'bg-emerald-50 text-[#1F4E43] border border-emerald-300';
                                      timeIcon = (
                                        <Clock className="w-3 h-3 shrink-0 text-[#1F4E43]" />
                                      );
                                      timeText = `Bắt đầu ${formatTimeOnly(schedule.startsAt)}`;
                                      cardBorderClass =
                                        'border-emerald-200 hover:border-emerald-600 border-l-4 border-l-emerald-600';
                                    } else if (isStartDay && isEndDay) {
                                      timePillClass =
                                        'bg-emerald-50 text-[#1F4E43] border border-emerald-300';
                                      timeIcon = (
                                        <Clock className="w-3 h-3 shrink-0 text-[#1F4E43]" />
                                      );
                                      timeText = `${formatTimeOnly(schedule.startsAt)} - ${formatTimeOnly(schedule.endsAt)}`;
                                      cardBorderClass =
                                        'border-emerald-200 hover:border-emerald-600 border-l-4 border-l-emerald-600';
                                    } else {
                                      timePillClass =
                                        'bg-stone-100 text-stone-600 border border-stone-200';
                                      timeIcon = (
                                        <Compass className="w-3 h-3 shrink-0 text-stone-500" />
                                      );
                                      timeText = 'Trên đường đi';
                                      cardBorderClass =
                                        'border-stone-200 hover:border-stone-400 border-l-4 border-l-stone-300';
                                    }
                                  }

                                  return (
                                    <div
                                      onClick={() =>
                                        navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(schedule.id))
                                      }
                                      title={`${schedule.title} • Trạng thái tour: ${
                                        isPublished
                                          ? 'Đã xuất bản'
                                          : 'Bản nháp'
                                      } • ${formatDateTime(schedule.startsAt)} → ${formatDateTime(schedule.endsAt)} • Bấm để xem chi tiết & phân công Guide`}
                                      className={`p-2.5 rounded-xl border bg-white hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group shadow-2xs min-w-0 ${cardBorderClass}`}
                                    >
                                      {/* Header: Time Badge + Round Status Dot */}
                                      <div className="flex items-center justify-between gap-1">
                                        <span
                                          className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 leading-none ${timePillClass}`}
                                        >
                                          {timeIcon}
                                          <span>{timeText}</span>
                                        </span>

                                        {/* Nút tròn: Không màu là draft, màu xanh là xuất bản */}
                                        <span
                                          title={
                                            isPublished
                                              ? 'Tour đã xuất bản'
                                              : 'Tour bản nháp'
                                          }
                                          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110 ${
                                            isPublished
                                              ? 'bg-emerald-500 shadow-2xs ring-2 ring-emerald-200'
                                              : 'border-2 border-stone-400 bg-white ring-1 ring-stone-200'
                                          }`}
                                        />
                                      </div>

                                      {/* Tour Title */}
                                      <h4 className="font-bold text-xs text-stone-900 group-hover:text-[#C2410C] transition-colors line-clamp-2 leading-snug break-words">
                                        {schedule.title}
                                      </h4>

                                      {/* Status */}
                                      <div>
                                        <StatusBadge
                                          scheduleStatus={schedule.status}
                                          size="sm"
                                          className="whitespace-nowrap"
                                        />
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  // Empty cell
                                  <div className="flex items-center justify-center min-h-[85px] text-stone-400 font-medium text-sm select-none">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALTERNATIVE VIEW: DANH SÁCH CHI TIẾT (LIST/TABLE VIEW) */}
          {viewMode === 'list' && (
            <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  Đang tải danh sách lịch khởi hành...
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-500 space-y-2">
                  <Calendar className="w-6 h-6 text-stone-400 mx-auto" />
                  <p>Không có lịch khởi hành nào trong khoảng thời gian đã chọn.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-xs font-mono uppercase tracking-wider text-stone-600">
                        <th className="py-3.5 px-4 font-bold w-16">Mã</th>
                        <th className="py-3.5 px-4 font-bold">Tên tour trekking</th>
                        <th className="py-3.5 px-4 font-bold w-52">Thời gian bắt đầu</th>
                        <th className="py-3.5 px-4 font-bold w-52">Thời gian kết thúc</th>
                        <th className="py-3.5 px-4 font-bold w-36">Trạng thái</th>
                        <th className="py-3.5 px-4 font-bold w-32 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-sm">
                      {schedules.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer"
                          onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.tourId))}
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-stone-500">
                            #{item.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                title={
                                  (item.tourStatus || tourStatusMap[item.tourId]) === 'PUBLISHED'
                                    ? 'Tour đã xuất bản'
                                    : 'Tour bản nháp'
                                }
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  (item.tourStatus || tourStatusMap[item.tourId]) === 'PUBLISHED'
                                    ? 'bg-emerald-500 shadow-2xs ring-2 ring-emerald-200'
                                    : 'border-2 border-stone-400 bg-white ring-1 ring-stone-200'
                                }`}
                              />
                              <span className="font-semibold text-[#1C2526] group-hover:text-[#C2410C] transition-colors block">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-stone-400 block ml-4.5">
                              Mã tour: #{item.tourId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-stone-800">
                              <Clock className="w-3.5 h-3.5 text-[#1F4E43] shrink-0" />
                              <span className="font-medium">{formatDateTime(item.startsAt)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-stone-600">
                              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{formatDateTime(item.endsAt)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge scheduleStatus={item.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(item.id));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Phân công Guide</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.tourId));
                                }}
                                className="px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Tour</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminAccessGuard>
  );
};

export default AdminScheduleListPage;
