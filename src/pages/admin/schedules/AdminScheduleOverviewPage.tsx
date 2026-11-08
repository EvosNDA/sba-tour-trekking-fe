import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { ROUTES } from '../../../constants/routes';
import { toursApi } from '../../../features/tours/api/tours.api';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { CreateScheduleModal } from '../../../features/tours/components/CreateScheduleModal';
import type {
  ScheduleSummaryResponse,
  TourDetailResponse,
  TourScheduleOverviewResponse,
} from '../../../features/tours/types/tour.types';
import { navigateTo, useLocation } from '../../../lib/navigation';
import { formatDateTime, formatVND } from '../../../lib/utils';
import type { ApiError } from '../../../types/api.types';

const OVERVIEW_PAGE_SIZE = 20;
const SCHEDULE_PAGE_SIZE = 10;

export interface AdminScheduleOverviewPageProps {
  tourIdProp?: number;
}

export const AdminScheduleOverviewPage: React.FC<AdminScheduleOverviewPageProps> = ({
  tourIdProp,
}) => {
  const { pathname } = useLocation();

  const resolvedTourId = useMemo(() => {
    if (tourIdProp && Number.isFinite(tourIdProp)) return tourIdProp;
    const match = pathname.match(/^\/admin\/schedules\/overview\/(\d+)\/?$/);
    if (match) return Number(match[1]);
    return null;
  }, [tourIdProp, pathname]);

  // =========================================================================
  // 1. OVERVIEW LIST STATE (when no tour is selected)
  // =========================================================================
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTours, setTotalTours] = useState(0);
  const [tours, setTours] = useState<TourScheduleOverviewResponse[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [overviewForbidden, setOverviewForbidden] = useState(false);
  const [reloadOverview, setReloadOverview] = useState(0);

  useEffect(() => {
    if (resolvedTourId) return;

    const controller = new AbortController();
    setLoadingOverview(true);
    setOverviewError('');
    setOverviewForbidden(false);

    const timer = window.setTimeout(async () => {
      try {
        const result = await toursApi.listScheduleOverview(
          { page, size: OVERVIEW_PAGE_SIZE, query: query.trim() },
          controller.signal
        );
        if (controller.signal.aborted) return;
        setTours(result.content || []);
        setTotalPages(result.totalPages || 0);
        setTotalTours(result.totalElements || 0);
      } catch (err) {
        if (controller.signal.aborted) return;
        const apiErr = err as ApiError;
        if (apiErr?.status === 401) {
          navigateTo(
            `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.SCHEDULE_OVERVIEW)}`,
            { replace: true }
          );
          return;
        }
        if (apiErr?.status === 403) {
          setOverviewForbidden(true);
        }
        setOverviewError('Không thể tải tổng quan lịch. Vui lòng thử lại.');
      } finally {
        if (!controller.signal.aborted) setLoadingOverview(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [resolvedTourId, page, query, reloadOverview]);

  // =========================================================================
  // 2. SELECTED TOUR SCHEDULES STATE (when a tour is selected)
  // =========================================================================
  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [isLoadingTour, setIsLoadingTour] = useState<boolean>(false);
  const [tourError, setTourError] = useState<ApiError | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulePage, setSchedulePage] = useState(0);
  const [scheduleTotalPages, setScheduleTotalPages] = useState(0);
  const [scheduleTotal, setScheduleTotal] = useState(0);
  const [scheduleError, setScheduleError] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSummaryResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(false);

  // Reset schedule pagination when switching tours
  useEffect(() => {
    setSchedulePage(0);
    setScheduleOpen(false);
  }, [resolvedTourId]);

  const fetchTourDetail = useCallback(async () => {
    if (!resolvedTourId) return;
    setIsLoadingTour(true);
    setTourError(null);
    try {
      const detail = await toursApi.getTourDetail(resolvedTourId);
      setTour(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(
            ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(resolvedTourId)
          )}`,
          { replace: true }
        );
        return;
      }
      setTourError(apiErr);
    } finally {
      setIsLoadingTour(false);
    }
  }, [resolvedTourId]);

  const fetchSchedules = useCallback(async () => {
    if (!resolvedTourId) return;
    setIsLoadingSchedules(true);
    setScheduleError('');
    try {
      const res = await toursApi.getTourSchedules(resolvedTourId, {
        page: schedulePage,
        size: SCHEDULE_PAGE_SIZE,
        upcomingOnly: false,
      });
      setSchedules(res.content || []);
      setScheduleTotalPages(res.totalPages || 0);
      setScheduleTotal(res.totalElements || 0);
    } catch {
      setScheduleError('Không thể tải lịch khởi hành. Vui lòng thử lại.');
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [resolvedTourId, schedulePage]);

  useEffect(() => {
    if (!resolvedTourId) return;
    fetchTourDetail();
  }, [resolvedTourId, fetchTourDetail]);

  useEffect(() => {
    if (!resolvedTourId) return;
    fetchSchedules();
  }, [resolvedTourId, fetchSchedules]);

  // Fallback tour summary from overview cache if tour detail is still loading
  const cachedOverviewTour = useMemo(
    () => (resolvedTourId ? tours.find((t) => t.tourId === resolvedTourId) ?? null : null),
    [resolvedTourId, tours]
  );

  // =========================================================================
  // RENDER: SELECTED TOUR SCHEDULE LIST VIEW
  // =========================================================================
  if (resolvedTourId) {
    const displayTitle = tour?.title || cachedOverviewTour?.title || `Tour #${resolvedTourId}`;
    const displayStatus = tour?.status || cachedOverviewTour?.status;

    return (
      <AdminAccessGuard forbiddenError={tourError?.status === 403}>
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#1F4E43] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Tổng quan lịch</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    fetchTourDetail();
                    fetchSchedules();
                  }}
                  disabled={isLoadingTour || isLoadingSchedules}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isLoadingTour || isLoadingSchedules ? 'animate-spin text-[#1F4E43]' : ''
                    }`}
                  />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Selected Tour Context Banner */}
            <div className="bg-white rounded-2xl border border-[#E6E1D8] px-6 py-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#51756a]">
                  Lịch khởi hành theo tour • #{resolvedTourId}
                </p>
                <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C2526]">
                  {displayTitle}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {displayStatus && <StatusBadge tourStatus={displayStatus} size="sm" />}
                {tour?.difficulty && <StatusBadge difficulty={tour.difficulty} size="sm" />}
                {tour?.durationDays && (
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-mono text-xs font-bold">
                    {tour.durationDays} ngày
                  </span>
                )}
              </div>
            </div>

            {tourError && !tour ? (
              <div
                role="alert"
                className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h2 className="font-editorial text-xl font-bold text-[#1C2526]">
                    {tourError.status === 404
                      ? 'Không tìm thấy tour này'
                      : 'Không thể tải thông tin tour'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    {tourError.message || 'Tour không tồn tại hoặc đã bị xóa khỏi hệ thống.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      fetchTourDetail();
                      fetchSchedules();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Thử lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                  >
                    Quay lại Tổng quan lịch
                  </button>
                </div>
              </div>
            ) : (
              /* Main Card: Departure Schedules List of the Selected Tour */
              <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1F4E43]" />
                      <span>Danh sách lịch khởi hành của tour ({scheduleTotal})</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Các đợt xuất phát đã được lên lịch và mở đặt chỗ cho chuyến đi này.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!tour}
                      onClick={() => setScheduleOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm lịch khởi hành</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULES)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Xem lịch tuần chung</span>
                    </button>
                  </div>
                </div>

                {isLoadingSchedules ? (
                  <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1F4E43]" />
                    <span>Đang tải danh sách lịch khởi hành...</span>
                  </div>
                ) : scheduleError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {scheduleError}{' '}
                    <button
                      type="button"
                      onClick={fetchSchedules}
                      className="underline font-semibold cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <Calendar className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                    <span>Tour này hiện chưa có lịch khởi hành nào.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                          <th className="py-3 px-3.5 font-bold">Bắt đầu</th>
                          <th className="py-3 px-3.5 font-bold">Kết thúc</th>
                          <th className="py-3 px-3.5 font-bold text-center">Sức chứa</th>
                          <th className="py-3 px-3.5 font-bold text-center">Đã đặt / Giữ</th>
                          <th className="py-3 px-3.5 font-bold">Giá cơ bản</th>
                          <th className="py-3 px-3.5 font-bold">Trạng thái</th>
                          <th className="py-3 px-3.5 font-bold text-right">Quản lý</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {schedules.map((s) => (
                          <tr key={s.id} className="hover:bg-[#FDFBF7] transition-colors">
                            <td className="py-3 px-3.5 font-medium text-stone-900 whitespace-nowrap">
                              {formatDateTime(s.startsAt)}
                            </td>
                            <td className="py-3 px-3.5 text-stone-700 whitespace-nowrap">
                              {formatDateTime(s.endsAt)}
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold">
                                {s.capacity} chỗ
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono text-stone-600 whitespace-nowrap">
                              {s.confirmedSeats} / {s.heldSeats} giữ
                            </td>
                            <td className="py-3 px-3.5 font-mono font-semibold text-[#1F4E43] whitespace-nowrap">
                              {formatVND(s.basePriceVnd)}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <StatusBadge scheduleStatus={s.status} size="sm" />
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  navigateTo(
                                    `${ROUTES.ADMIN.SCHEDULE_DETAIL(s.id)}?tourId=${resolvedTourId}`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <span>Guide & Khách</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {scheduleTotalPages > 1 && (
                  <div className="flex items-center justify-end gap-3 text-sm pt-2">
                    <button
                      type="button"
                      disabled={schedulePage === 0}
                      onClick={() => setSchedulePage((p) => p - 1)}
                      className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40 cursor-pointer"
                    >
                      Trước
                    </button>
                    <span>
                      {schedulePage + 1} / {scheduleTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={schedulePage + 1 >= scheduleTotalPages}
                      onClick={() => setSchedulePage((p) => p + 1)}
                      className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40 cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {scheduleOpen && tour && (
          <CreateScheduleModal
            tourId={tour.id}
            title={tour.title}
            durationDays={tour.durationDays}
            onClose={() => setScheduleOpen(false)}
            onCreated={() => {
              setScheduleOpen(false);
              toast.success('Đã thêm lịch khởi hành.');
              const targetPage = Math.floor(scheduleTotal / SCHEDULE_PAGE_SIZE);
              if (schedulePage !== targetPage) {
                setSchedulePage(targetPage);
              } else {
                fetchSchedules();
              }
              setReloadOverview((v) => v + 1);
            }}
          />
        )}
      </AdminAccessGuard>
    );
  }

  // =========================================================================
  // RENDER: SCHEDULE OVERVIEW LIST (all tours + scheduleCount)
  // =========================================================================
  return (
    <AdminAccessGuard forbiddenError={overviewForbidden}>
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#51756a]">
              Lịch khởi hành
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#1C2526]">Tổng quan lịch</h1>
            <p className="mt-2 text-sm text-stone-500">
              Xem tổng số lịch khởi hành của từng tour. Chọn một tour để mở danh sách lịch khởi hành thuộc tour đó.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULES)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F4E43] hover:bg-stone-50 cursor-pointer"
          >
            Xem lịch tuần chung
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5">
            <div>
              <h2 className="font-bold text-[#1C2526]">Danh sách tour</h2>
              <p className="mt-1 text-xs text-stone-500">
                {loadingOverview ? 'Đang tải...' : `${totalTours} tour`}
              </p>
            </div>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Tìm tên tour</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                maxLength={200}
                placeholder="Tìm theo tên tour"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#1F4E43]"
              />
            </label>
          </div>

          {loadingOverview ? (
            <div role="status" className="p-12 text-center text-sm text-stone-500">
              Đang tải danh sách tour...
            </div>
          ) : overviewError ? (
            <div role="alert" className="space-y-3 p-12 text-center text-sm text-red-700">
              <p>{overviewError}</p>
              <button
                type="button"
                onClick={() => setReloadOverview((value) => value + 1)}
                className="inline-flex items-center gap-2 font-semibold underline cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Thử lại
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="p-12 text-center text-sm text-stone-500">
              {query.trim() ? 'Không tìm thấy tour phù hợp.' : 'Chưa có tour nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F5] text-xs text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tour</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 font-semibold">Tổng lịch</th>
                    <th className="px-5 py-3 text-right font-semibold">Lịch khởi hành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {tours.map((item) => (
                    <tr
                      key={item.tourId}
                      onClick={() =>
                        navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(item.tourId))
                      }
                      className="hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(item.tourId));
                          }}
                          className="font-semibold text-[#1C2526] group-hover:text-[#1F4E43] text-left cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <span className="ml-2 text-xs text-stone-400">#{item.tourId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tourStatus={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 font-semibold text-[#1F4E43]">
                          <CalendarDays className="h-4 w-4" />
                          {item.scheduleCount} lịch
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW_TOUR(item.tourId));
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#1F4E43] hover:underline cursor-pointer"
                        >
                          <span>Xem lịch khởi hành</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingOverview && !overviewError && totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-stone-100 p-4 text-sm text-stone-600">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <span>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </section>
        <p className="text-xs text-stone-500">
          Tổng lịch bao gồm tất cả lịch khởi hành của tour, kể cả lịch đã hoàn thành hoặc đã hủy.
        </p>
      </div>
    </AdminAccessGuard>
  );
};

export default AdminScheduleOverviewPage;
