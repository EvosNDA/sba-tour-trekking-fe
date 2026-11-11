import { Modal } from '../../../components/ui/Modal';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  ArrowRight,
  Compass,
  Clock,
  ShieldCheck,
  Plus,
  List,
  ExternalLink,
  MapPin,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourScheduleRangeResponse, TourStatus, ScheduleDetailResponse } from '../../../features/tours/types/tour.types';
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

type ScheduleListItem = TourScheduleRangeResponse & Pick<ScheduleDetailResponse, 'capacity' | 'confirmedSeats' | 'heldSeats'>;

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
const MAX_RANGE_DAYS = 31;

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
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return toDateInputString(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return toDateInputString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });

  // View preferences
  const [viewMode, setViewMode] = useState<'tkb' | 'list'>('list');
  const [displayMode, setDisplayMode] = useState<'departure_only' | 'full_span'>('departure_only');

  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [tourFilter, setTourFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortDescending, setSortDescending] = useState(false);
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
      const detailed = await Promise.all((list || []).map(async (item): Promise<ScheduleListItem> => {
        try {
          const detail = await toursApi.getScheduleDetail(item.tourId, item.id);
          return { ...item, capacity: detail.capacity, confirmedSeats: detail.confirmedSeats, heldSeats: detail.heldSeats };
        } catch {
          return { ...item, capacity: 0, confirmedSeats: 0, heldSeats: 0 };
        }
      }));
      setSchedules(detailed);
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

  const filteredSchedules = useMemo(() => schedules
    .filter(item => (!tourFilter || item.tourId === Number(tourFilter)) && (!statusFilter || item.status === statusFilter))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) * (sortDescending ? -1 : 1)), [schedules, tourFilter, statusFilter, sortDescending]);
  const totalCapacity = filteredSchedules.reduce((sum, item) => sum + item.capacity, 0);
  const totalConfirmed = filteredSchedules.reduce((sum, item) => sum + item.confirmedSeats, 0);
  const totalHeld = filteredSchedules.reduce((sum, item) => sum + item.heldSeats, 0);
  const openScheduleCount = filteredSchedules.filter(item => item.status === 'SCHEDULED').length;

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCurrentWeek = () => {
    const now = new Date();
    setStartDate(toDateInputString(new Date(now.getFullYear(), now.getMonth(), 1)));
    setEndDate(toDateInputString(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
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

  return (
    <AdminAccessGuard forbiddenError={error?.status === 403}>
      {createOpen && !chosenTour && <Modal isOpen onClose={closeCreate} title="Thêm lịch khởi hành" subtitle="Chọn tour để tạo lịch khởi hành mới." maxWidth="3xl"><label htmlFor="schedule-tour-search" className="mt-5 text-base font-semibold">Tìm tour</label>
          <input id="schedule-tour-search" autoFocus type="search" value={tourQuery} onChange={e => { setTourQuery(e.target.value); setTourPage(0); }} placeholder="Nhập tên tour..." className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-[#0B7058] focus:outline-none" />
          <div className="mt-4 min-h-32 flex-1 space-y-2 overflow-y-auto">
            {tourLoading ? <p className="p-4 text-base text-slate-600">Đang tải danh sách tour...</p> : tourError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-base text-red-700">{tourError} <button type="button" onClick={() => setTourReload(v => v + 1)} className="underline">Thử lại</button></p> : tourChoices.length === 0 ? <p className="p-4 text-base text-slate-600">Không tìm thấy tour phù hợp.</p> : tourChoices.map(tour => <button key={tour.id} type="button" onClick={() => setChosenTour(tour)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4 text-left hover:border-[#0B7058] hover:bg-emerald-50"><span><span className="block text-base font-bold text-slate-900">{tour.title}</span><span className="mt-1 block text-sm text-slate-600">{tour.durationDays} ngày · {tour.status === 'PUBLISHED' ? 'Đã xuất bản' : tour.status === 'DRAFT' ? 'Bản nháp' : tour.status}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-[#0B7058]" /></button>)}
          </div>
          {tourPages > 1 && <div className="mt-4 flex items-center justify-end gap-4 text-base"><button type="button" disabled={tourPage === 0 || tourLoading} onClick={() => setTourPage(p => p - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Trước</button><span>{tourPage + 1} / {tourPages}</span><button type="button" disabled={tourPage + 1 >= tourPages || tourLoading} onClick={() => setTourPage(p => p + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Sau</button></div>}
        </Modal>}
      {createOpen && chosenTour && <CreateScheduleModal tourId={chosenTour.id} title={chosenTour.title} durationDays={chosenTour.durationDays} onClose={closeCreate} onCreated={(startsAt) => { const date = new Date(startsAt); const monday = toDateInputString(getMondayOfWeek(date)); const sunday = toDateInputString(getSundayOfWeek(date)); closeCreate(); toast.success('Đã thêm lịch khởi hành.'); if (startDate === monday && endDate === sunday) fetchSchedules(); else { setStartDate(monday); setEndDate(sunday); } }} />}
      <div className="min-h-full text-[#172033] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Card */}
          <AdminPageHeader title="Lịch khởi hành" description="Quản lý ngày đi, sức chứa và tình trạng chỗ theo tour." actions={<div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="px-5 py-3 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lịch khởi hành</span>
              </button>
            </div>} />

          <div className="flex items-center gap-0 border-b border-slate-300">
            <button type="button" onClick={() => setViewMode('list')} className={`inline-flex min-h-12 items-center gap-2 rounded-t-xl px-6 text-base font-semibold ${viewMode === 'list' ? 'bg-[#0B7058] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}><List className="h-5 w-5"/>Danh sách</button>
            <button type="button" onClick={() => setViewMode('tkb')} className={`inline-flex min-h-12 items-center gap-2 rounded-t-xl border-l border-slate-200 px-6 text-base font-semibold ${viewMode === 'tkb' ? 'bg-[#0B7058] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}><Calendar className="h-5 w-5"/>Lịch</button>
          </div>

          {/* Time Navigation & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E0E6EE] p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative inline-flex min-h-12 min-w-[250px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800">
                <Calendar className="h-5 w-5 shrink-0" />
                <span>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(startDate + 'T00:00:00')).slice(0, 2)}–{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(endDate + 'T00:00:00')).slice(0, 2)} tháng {new Date(startDate + 'T00:00:00').getMonth() + 1}, {new Date(startDate + 'T00:00:00').getFullYear()}</span>
                <ChevronDown className="ml-auto h-4 w-4" />
                <input
                  type="month"
                  aria-label="Tháng hiển thị"
                  value={startDate.slice(0, 7)}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    const [year, month] = event.target.value.split('-').map(Number);
                    setStartDate(toDateInputString(new Date(year, month - 1, 1)));
                    setEndDate(toDateInputString(new Date(year, month, 0)));
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Filter className="h-4 w-4"/>Bộ lọc{(tourFilter || statusFilter) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600"/>}</button>
                <button type="button" onClick={() => setSortDescending(value => !value)} aria-label={`Sắp xếp ngày khởi hành ${sortDescending ? 'tăng dần' : 'giảm dần'}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowUpDown className="h-4 w-4"/>Sắp xếp</button>
              </div>
            </div>
            {filtersOpen && <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <select aria-label="Lọc theo tour" value={tourFilter} onChange={e => setTourFilter(e.target.value)} className="max-w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <option value="">Tất cả tour trekking</option>
                  {[...new Map(schedules.map(item => [item.tourId, item.title])).entries()].map(([id, title]) => <option key={id} value={id}>{title}</option>)}
                </select>
                <select aria-label="Lọc theo trạng thái" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <option value="">Tất cả trạng thái</option>
                  <option value="SCHEDULED">Đang mở</option>
                  <option value="ONGOING">Đang diễn ra</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
            </div>}

            {/* Info summary & Filter toggle */}
            {rangeNotice && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                {rangeNotice}
              </div>
            )}
            {viewMode === 'tkb' && <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">

              {/* Departure-only vs Full-span toggle */}
              <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Chế độ xếp lịch:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-[#F3F6FA] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('departure_only')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        displayMode === 'departure_only'
                          ? 'bg-[#0B7058] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ngày khởi hành
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('full_span')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        displayMode === 'full_span'
                          ? 'bg-[#0B7058] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Toàn bộ hành trình
                    </button>
                  </div>
              </div>
            </div>}

            {/* Chú thích trạng thái nút tròn và màu sắc hành trình */}
            {viewMode === 'tkb' && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 border-t border-slate-200/80 pt-3">
                <span className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                  Chú thích:
                </span>
                <span className="inline-flex items-center gap-1.5" title="Bản nháp: Nút tròn không màu">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white shadow-2xs" />
                  <span className="text-slate-600 text-xs">Tour Bản nháp</span>
                </span>
                <span className="inline-flex items-center gap-1.5" title="Đã xuất bản: Nút tròn màu xanh">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs ring-2 ring-emerald-200" />
                  <span className="text-slate-600 text-xs">Tour Đã xuất bản</span>
                </span>
                {displayMode === 'full_span' && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1.5" title="Ngày bắt đầu: Màu xanh">
                      <span className="w-3 h-2 rounded-sm bg-emerald-500" />
                      <span className="text-slate-700 font-medium text-xs">Màu xanh: Ngày bắt đầu</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5" title="Ngày kết thúc: Màu đỏ">
                      <span className="w-3 h-2 rounded-sm bg-rose-500" />
                      <span className="text-slate-700 font-medium text-xs">Màu đỏ: Ngày kết thúc</span>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs lg:grid-cols-4">
            {[{ label: 'lịch đang mở', value: openScheduleCount, Icon: Calendar, color: 'text-[#0B7058]' }, { label: 'chỗ', value: totalCapacity, Icon: Users, color: 'text-slate-700' }, { label: 'đã đặt', value: totalConfirmed, Icon: CheckCircle2, color: 'text-[#0B7058]' }, { label: 'đang giữ', value: totalHeld, Icon: Clock, color: 'text-amber-700' }].map(({ label, value, Icon, color }) => (
              <div key={label} className="flex items-center justify-center gap-3 border-slate-200 py-2 lg:border-r last:border-r-0">
                <Icon className={`h-6 w-6 ${color}`} />
                <div><strong className={`text-xl ${color}`}>{value}</strong><span className="ml-2 text-sm font-medium text-slate-600">{label}</span></div>
              </div>
            ))}
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
                <h2 className="text-base font-bold text-slate-900">
                  Không thể tải lịch khởi hành từ máy chủ
                </h2>
                <p className="text-xs text-slate-600">{error.message}</p>
              </div>
              <button
                type="button"
                onClick={fetchSchedules}
                className="px-4 py-2 rounded-xl bg-[#0B7058] text-white text-xs font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="space-y-3 md:hidden" aria-busy={isLoading}>
            <h2 className="text-lg font-semibold">Lịch khởi hành</h2>
            {isLoading ? <p role="status" className="rounded-xl border border-[#E0E6EE] bg-white p-5 text-sm text-slate-600">Đang tải lịch khởi hành…</p> : visibleMobileSchedules.length === 0 ? <p className="rounded-xl border border-[#E0E6EE] bg-white p-5 text-sm text-slate-600">Không có lịch khởi hành trong khoảng ngày đã chọn.</p> : visibleMobileSchedules.map((item) => <article key={item.id} className="space-y-4 rounded-xl border border-[#E0E6EE] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500">Chuyến #{item.id}</span><StatusBadge scheduleStatus={item.status} /></div>
              <h3 className="break-words text-base font-semibold">{item.title}</h3>
              <dl className="space-y-2 text-sm"><div><dt className="text-slate-500">Khởi hành</dt><dd className="mt-0.5 font-medium">{formatDateTime(item.startsAt)}</dd></div><div><dt className="text-slate-500">Kết thúc</dt><dd className="mt-0.5">{formatDateTime(item.endsAt)}</dd></div></dl>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(item.id))} className="min-h-11 rounded-lg bg-[#0B7058] px-3 text-sm font-medium text-white">Quản lý chuyến</button><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.tourId))} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium">Xem tour</button></div>
            </article>)}
          </div>
          {/* MAIN VIEW: KHUNG THỜI KHÓA BIỂU (TKB) */}
          {viewMode === 'tkb' && (
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse table-fixed"
                  style={{ minWidth: `${dayColumns.length * 130}px` }}
                >
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200">
                      {/* Day Column Headers */}
                      {dayColumns.map((day) => (
                        <th
                          key={day.dateStr}
                          className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 transition-colors ${
                            day.isToday
                              ? 'bg-[#DEF7EC] text-emerald-800'
                              : 'text-slate-800'
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
                                day.isToday ? 'text-[#0D9488]' : 'text-slate-500'
                              }`}
                            >
                              {day.dayMonthLabel}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                      // Skeleton Loading inside TKB Grid
                      <tr>
                        {dayColumns.map((day) => (
                          <td
                            key={day.dateStr}
                            className={`p-3 border-r border-slate-200 last:border-r-0 ${
                              day.isToday ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-slate-200 rounded w-2/3" />
                              <div className="h-3 bg-slate-200 rounded w-1/2" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ) : (
                      // Render rows based on maxSlots (minimum 1 row)
                      Array.from({ length: maxSlots }).map((_, slotIndex) => (
                        <tr
                          key={slotIndex}
                          className="hover:bg-slate-50/30 transition-colors"
                        >
                          {/* Day Cells */}
                          {dayColumns.map((day) => {
                            const dayList = schedulesByDay[day.dateStr] || [];
                            const schedule = dayList[slotIndex];

                            return (
                              <td
                                key={day.dateStr}
                                className={`p-2 align-top border-r border-slate-200 last:border-r-0 transition-colors ${
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
                                    'bg-[#B9EADB]/40 text-[#0B7058] border border-emerald-300';
                                  let timeIcon = <Clock className="w-3 h-3 shrink-0 text-[#0B7058]" />;
                                  let timeText = formatTimeOnly(schedule.startsAt);
                                  let cardBorderClass =
                                    'border-slate-200 hover:border-[#0B7058]';

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
                                        'border-rose-200 hover:border-rose-500';
                                    } else if (isStartDay && !isEndDay) {
                                      // Ngày bắt đầu: MÀU XANH
                                      timePillClass =
                                        'bg-emerald-50 text-[#0B7058] border border-emerald-300';
                                      timeIcon = (
                                        <Clock className="w-3 h-3 shrink-0 text-[#0B7058]" />
                                      );
                                      timeText = `Bắt đầu ${formatTimeOnly(schedule.startsAt)}`;
                                      cardBorderClass =
                                        'border-emerald-200 hover:border-emerald-600';
                                    } else if (isStartDay && isEndDay) {
                                      timePillClass =
                                        'bg-emerald-50 text-[#0B7058] border border-emerald-300';
                                      timeIcon = (
                                        <Clock className="w-3 h-3 shrink-0 text-[#0B7058]" />
                                      );
                                      timeText = `${formatTimeOnly(schedule.startsAt)} - ${formatTimeOnly(schedule.endsAt)}`;
                                      cardBorderClass =
                                        'border-emerald-200 hover:border-emerald-600';
                                    } else {
                                      timePillClass =
                                        'bg-slate-100 text-slate-600 border border-slate-200';
                                      timeIcon = (
                                        <Compass className="w-3 h-3 shrink-0 text-slate-500" />
                                      );
                                      timeText = 'Trên đường đi';
                                      cardBorderClass =
                                        'border-slate-200 hover:border-slate-400';
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
                                              : 'border-2 border-slate-400 bg-white ring-1 ring-stone-200'
                                          }`}
                                        />
                                      </div>

                                      {/* Tour Title */}
                                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#C2410C] transition-colors line-clamp-2 leading-snug break-words">
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
                                  <div className="flex items-center justify-center min-h-[85px] text-slate-400 font-medium text-sm select-none">
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
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Đang tải danh sách lịch khởi hành...
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                  <p>Không có lịch khởi hành nào trong khoảng thời gian đã chọn.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[980px]">
                    <thead>
                      <tr className="bg-[#F3F6FA] border-b border-[#E0E6EE] text-xs font-semibold text-slate-600">
                        <th className="py-3.5 px-4 font-bold">Tour</th>
                        <th className="py-3.5 px-4 font-bold">Ngày khởi hành</th>
                        <th className="py-3.5 px-4 font-bold">Kết thúc</th>
                        <th className="py-3.5 px-4 font-bold">Sức chứa</th>
                        <th className="py-3.5 px-4 font-bold text-center">Đã xác nhận</th>
                        <th className="py-3.5 px-4 font-bold text-center">Đang giữ</th>
                        <th className="py-3.5 px-4 font-bold text-center">Còn chỗ</th>
                        <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredSchedules.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F3F6FA] transition-colors group cursor-pointer"
                          onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(item.id))}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                title={
                                  (item.tourStatus || tourStatusMap[item.tourId]) === 'PUBLISHED'
                                    ? 'Tour đã xuất bản'
                                    : 'Tour bản nháp'
                                }
                                className={`h-10 w-10 rounded-xl shrink-0 ${
                                  (item.tourStatus || tourStatusMap[item.tourId]) === 'PUBLISHED'
                                    ? 'bg-[#E7F4E8]'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              ><Compass className="m-auto mt-2 h-6 w-6 text-[#0B7058]" /></span>
                              <span className="font-semibold text-[#172033] group-hover:text-[#0B7058] transition-colors block">{item.title}<small className="mt-1 block text-xs font-normal text-slate-500">Tour #{item.tourId}</small></span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong>{formatDate(item.startsAt)}</strong><small className="block text-slate-500">{new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(new Date(item.startsAt))}</small>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong>{formatDate(item.endsAt)}</strong><small className="block text-slate-500">{new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(new Date(item.endsAt))}</small>
                          </td>
                          <td className="min-w-48 py-3.5 px-4">
                            <div className="flex items-center gap-2"><strong>{item.capacity}</strong><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><span className={`block h-full rounded-full ${item.capacity && item.confirmedSeats / item.capacity >= .9 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{width:`${item.capacity ? Math.min(100,Math.round(item.confirmedSeats / item.capacity * 100)) : 0}%`}} /></div><small>{item.capacity ? Math.round(item.confirmedSeats / item.capacity * 100) : 0}%</small></div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-emerald-800">{item.confirmedSeats}</td>
                          <td className="py-3.5 px-4 text-center font-semibold text-amber-700">{item.heldSeats}</td>
                          <td className="py-3.5 px-4 text-center font-semibold">{Math.max(0,item.capacity-item.confirmedSeats-item.heldSeats)}</td>
                          <td className="py-3.5 px-4"><StatusBadge scheduleStatus={item.status} size="sm" /></td>
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
