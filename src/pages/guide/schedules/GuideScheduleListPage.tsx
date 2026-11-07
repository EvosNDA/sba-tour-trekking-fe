import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Compass,
  MapPin,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Info,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourScheduleRangeResponse } from '../../../features/tours/types/tour.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import {
  formatDateTime,
  formatDate,
  formatTimeOnly,
  toDateInputString,
} from '../../../lib/utils';

export const GuideScheduleListPage: React.FC = () => {
  const [schedules, setSchedules] = useState<TourScheduleRangeResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Load schedules spanning around current month by default
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const now = new Date();
      // Look back 14 days and look ahead 60 days to cover upcoming and recent trips
      const start = new Date(now.getTime() - 14 * 86400000);
      const end = new Date(now.getTime() + 60 * 86400000);

      const data = await toursApi.listSchedulesInRange(
        start.toISOString(),
        end.toISOString()
      );
      setSchedules(data || []);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Không thể tải danh sách lịch tour. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Filter schedules client-side
  const filteredSchedules = useMemo(() => {
    const now = new Date();
    const todayStr = toDateInputString(now);

    return schedules.filter((s) => {
      // 1. Search term (tour title or ID)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesTitle = (s.title || '').toLowerCase().includes(q);
        const matchesId = String(s.id).includes(q) || String(s.tourId).includes(q);
        if (!matchesTitle && !matchesId) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        if (s.status !== statusFilter) return false;
      }

      // 3. Date filter
      if (dateFilter === 'TODAY') {
        const startDay = toDateInputString(new Date(s.startsAt));
        if (startDay !== todayStr) return false;
      } else if (dateFilter === 'WEEK') {
        const sTime = new Date(s.startsAt).getTime();
        const weekAhead = now.getTime() + 7 * 86400000;
        const weekBehind = now.getTime() - 86400000;
        if (sTime < weekBehind || sTime > weekAhead) return false;
      } else if (dateFilter === 'MONTH') {
        const sTime = new Date(s.startsAt).getTime();
        const monthAhead = now.getTime() + 30 * 86400000;
        const monthBehind = now.getTime() - 86400000;
        if (sTime < monthBehind || sTime > monthAhead) return false;
      }

      return true;
    });
  }, [schedules, searchTerm, statusFilter, dateFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526] tracking-tight">
            Lịch tour được phân công
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Danh sách các đợt khởi hành bạn được chỉ định dẫn đoàn, điểm danh khách và bàn giao thiết bị.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSchedules}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-700 inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên tour, mã chuyến..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30 focus:border-[#1F4E43]"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-stone-500 whitespace-nowrap mr-1">
              Thời gian:
            </span>
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'TODAY', label: 'Hôm nay' },
                { id: 'WEEK', label: '7 ngày tới' },
                { id: 'MONTH', label: '30 ngày' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-[#1F4E43] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">
              Trạng thái:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="ONGOING">Đang diễn ra</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Schedules List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F4E43]/30 border-t-[#1F4E43] rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-stone-500">
            Đang tải lịch khởi hành...
          </p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-sm sm:text-base">
            Không thể tải dữ liệu lịch tour
          </h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
          <button
            type="button"
            onClick={fetchSchedules}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center space-y-3">
          <CalendarCheck className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm sm:text-base">
            Không tìm thấy lịch tour phù hợp
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Không có lịch khởi hành nào khớp với bộ lọc tìm kiếm và mốc thời gian đã chọn.
          </p>
          {(searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setDateFilter('ALL');
              }}
              className="text-xs font-semibold text-[#1F4E43] hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSchedules.map((schedule) => {
            const isToday =
              toDateInputString(new Date(schedule.startsAt)) ===
              toDateInputString(new Date());

            return (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl border border-[#E6E1D8] hover:border-[#1F4E43]/60 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Top Badge strip */}
                <div className="p-4 sm:p-5 border-b border-stone-100 flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] text-stone-500 font-bold block">
                      Mã chuyến #{schedule.id}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-[#1C2526] line-clamp-2 leading-snug">
                      {schedule.title}
                    </h3>
                  </div>
                  <StatusBadge scheduleStatus={schedule.status} size="sm" />
                </div>

                {/* Content details */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 text-xs sm:text-sm text-stone-700">
                  {/* Date & Time */}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-900">
                        {formatDateTime(schedule.startsAt)}
                        {isToday && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        Đến: {formatDateTime(schedule.endsAt)}
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2.5 pt-1 text-stone-600">
                    <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>
                      Trạng thái tour:{' '}
                      <strong className="text-stone-800">
                        {schedule.tourStatus || 'Đang mở'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="p-4 bg-[#FDFBF7] border-t border-stone-100 mt-auto">
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo(ROUTES.GUIDE.SCHEDULE_DETAIL(schedule.id))
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Vào chuyến & Điểm danh</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuideScheduleListPage;
