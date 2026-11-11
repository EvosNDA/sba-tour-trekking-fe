import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import { FilterToolbar } from '../../../components/ui/FilterToolbar';
import { DataTable } from '../../../components/ui/DataTable';
import { DataState } from '../../../components/ui/DataState';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  AlertTriangle,
  Compass,
  Filter,
  RotateCcw,
  ShieldCheck,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  TourSummaryResponse,
  DifficultyLevel,
  TourStatus,
  DIFFICULTY_OPTIONS,
  TOUR_STATUS_OPTIONS,
} from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { TourDeleteModal } from '../../../features/tours/components/TourDeleteModal';
import { TourPublishModal } from '../../../features/tours/components/TourPublishModal';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';

export const AdminTourListPage: React.FC = () => {
  const [publishTourId, setPublishTourId] = useState<number | null>(null);
  // Search & filter state
  const [queryInput, setQueryInput] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('');
  const [durationDays, setDurationDays] = useState<string>('');
  const [status, setStatus] = useState<TourStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(4);

  // Data state from Spring Page response
  const [tours, setTours] = useState<TourSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Delete confirmation modal state
  const [tourToDelete, setTourToDelete] = useState<TourSummaryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [activeTourMenuId, setActiveTourMenuId] = useState<number | null>(null);

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const parsedDuration =
        durationDays.trim() !== '' && Number(durationDays) > 0
          ? Number(durationDays)
          : '';

      const [res, scheduleOverview] = await Promise.all([
        toursApi.listTours({
        page,
        size,
        query: appliedQuery,
        difficulty,
        durationDays: parsedDuration,
        status,
        }),
        toursApi.listScheduleOverview({ page: 0, size: 100, query: appliedQuery }).catch(() => null),
      ]);

      const scheduleCounts = new Map((scheduleOverview?.content || []).map(item => [item.tourId, item.scheduleCount]));
      setTours((res.content || []).map(tour => ({ ...tour, scheduleCount: scheduleCounts.get(tour.id) ?? 0 })));
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setCurrentPage(res.number ?? page);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.TOURS)}`,
          { replace: true }
        );
        return;
      }
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, appliedQuery, difficulty, durationDays, status]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedQuery(queryInput.trim());
  };

  const handleResetFilters = () => {
    setQueryInput('');
    setAppliedQuery('');
    setDifficulty('');
    setDurationDays('');
    setStatus('');
    setPage(0);
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await toursApi.deleteTour(tourToDelete.id);
      toast.success(`Đã xóa tour "${tourToDelete.title}" thành công.`);
      setTourToDelete(null);

      // If deleting the last item on a non-zero page, go back one page
      if (tours.length === 1 && page > 0) {
        setPage((p) => Math.max(0, p - 1));
      } else {
        await fetchTours();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.TOURS)}`,
          { replace: true }
        );
        return;
      }
      setDeleteError(apiErr);
      toast.error(apiErr.message || 'Không thể xóa tour.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    appliedQuery || difficulty || durationDays.trim() || status
  );

  return (
    <AdminAccessGuard forbiddenError={error?.status === 403}>
      <div className="min-h-full px-4 py-6 text-[#172033] sm:px-7 lg:px-8">
        <div className="mx-auto max-w-[1500px] space-y-5">
          {/* Top Dashboard Header */}
          <AdminPageHeader className="admin-tour-list-header" title="Tour trekking" actions={<div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.TOUR_NEW)}
                className="rounded-xl bg-[#0B7058] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#075743]"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo tour</span>
              </button>
            </div>} />

          <form onSubmit={handleSearchSubmit} className="grid gap-3 md:grid-cols-[1.55fr_.75fr_.8fr]">
            <label className="relative block"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input id="admin-filter-query" type="search" value={queryInput} onChange={e => setQueryInput(e.target.value)} placeholder="Tìm theo tên cung đường..." className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base"/></label>
            <select id="admin-filter-difficulty" aria-label="Độ khó" value={difficulty} onChange={e => {setDifficulty(e.target.value as DifficultyLevel | '');setPage(0);}} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"><option value="">Độ khó</option>{DIFFICULTY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <select id="admin-filter-status" aria-label="Trạng thái" value={status} onChange={e => {setStatus(e.target.value as TourStatus | '');setPage(0);}} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base"><option value="">Trạng thái</option>{TOUR_STATUS_OPTIONS.filter(option => option.value === 'DRAFT' || option.value === 'PUBLISHED').map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </form>
          {/* Table / Loading / Empty / Error States */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#E0E6EE] overflow-hidden shadow-2xs">
              <div className="p-6 space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-12 rounded-xl bg-slate-200 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                    <div className="h-6 bg-slate-200 rounded w-16" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                    <div className="h-8 bg-slate-200 rounded-xl w-32" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Không thể tải danh sách tour từ máy chủ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">{error.message}</p>
                {error.code && (
                  <p className="text-xs font-mono text-rose-600">Mã lỗi: {error.code}</p>
                )}
              </div>
              <button
                type="button"
                onClick={fetchTours}
                className="px-5 py-2.5 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0E6EE] p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#0B7058]/10 text-[#0B7058] flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="font-sans text-2xl font-bold text-[#172033]">
                  Không tìm thấy tour nào
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {hasActiveFilters
                    ? 'Không có tour nào khớp với điều kiện tìm kiếm và bộ lọc hiện tại.'
                    : 'Hệ thống hiện chưa có dữ liệu tour trekking nào. Hãy bắt đầu bằng cách tạo tour đầu tiên.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOUR_NEW)}
                  className="px-5 py-2.5 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo tour mới</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E0E6EE] overflow-hidden shadow-2xs">
              <div className="divide-y divide-[#E0E6EE] md:hidden">
                {tours.map((item) => (
                  <article key={item.id} className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      {item.coverImageUrl && <img src={item.coverImageUrl} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
                      <div className="min-w-0 space-y-2">
                        <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))} className="text-left text-base font-semibold text-[#172033] hover:text-[#C2410C]">{item.title}</button>
                        <p className="text-sm text-slate-600">{item.durationDays} ngày</p>
                        <div className="flex flex-wrap gap-2"><StatusBadge difficulty={item.difficulty} /><StatusBadge tourStatus={item.status} /></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium">Chi tiết</button>
                      <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_EDIT(item.id))} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium">Chỉnh sửa</button>
                      {item.status === 'DRAFT' && <button type="button" onClick={() => setPublishTourId(item.id)} className="min-h-11 rounded-lg bg-[#0B7058] px-3 text-sm font-medium text-white">Xuất bản</button>}
                      <button type="button" onClick={() => { setDeleteError(null); setTourToDelete(item); }} className="min-h-11 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700">Xóa</button>
                    </div>
                  </article>
                ))}
              </div>
              {/* Responsive Table for Desktop & Tablet */}
              <DataTable className="hidden md:block" tableClassName="w-full min-w-[900px] border-collapse text-left">
                <thead><tr className="bg-[#F0F1F0] text-sm text-slate-800"><th className="rounded-l-lg px-4 py-3 font-semibold">Cung đường</th><th className="px-4 py-3 font-semibold">Độ khó</th><th className="px-4 py-3 font-semibold">Thời lượng</th><th className="px-4 py-3 font-semibold">Trạng thái</th><th className="px-4 py-3 text-center font-semibold">Số lịch khởi hành</th><th className="rounded-r-lg px-4 py-3 text-right font-semibold">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-[#E4E7E5] text-sm">
                  {tours.map(item => <tr key={item.id} className="transition-colors hover:bg-[#F7F8F6]">
                    <td className="px-4 py-5"><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))} className="block cursor-pointer text-left font-semibold text-[#172033] hover:text-[#0B7058]">{item.title}</button></td>
                    <td className="px-4 py-5"><StatusBadge difficulty={item.difficulty} size="sm"/></td>
                    <td className="whitespace-nowrap px-4 py-5">{item.durationDays} ngày{item.durationDays > 1 ? ` ${item.durationDays - 1} đêm` : ''}</td>
                    <td className="px-4 py-5"><StatusBadge tourStatus={item.status} size="sm"/></td>
                    <td className="px-4 py-5 text-center tabular-nums">{item.scheduleCount ?? 0}</td>
                    <td className="px-4 py-5 text-right"><div className="inline-flex items-center justify-end gap-1">
                      <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_EDIT(item.id))} title="Chỉnh sửa" aria-label={`Chỉnh sửa ${item.title}`} className="rounded-lg p-2 text-[#164536] hover:bg-[#E7F1EB]"><Edit3 className="h-5 w-5"/></button>
                      <button type="button" onClick={() => navigateTo(`${ROUTES.ADMIN.TOUR_NEW}?duplicate=${item.id}`)} title="Nhân bản tour" aria-label={`Nhân bản ${item.title}`} className="rounded-lg p-2 text-[#164536] hover:bg-[#E7F1EB]"><Copy className="h-5 w-5"/></button>
                      <div className="relative"><button type="button" title="Thao tác khác" aria-label={`Thao tác khác: ${item.title}`} aria-expanded={activeTourMenuId === item.id} onClick={() => setActiveTourMenuId(id => id === item.id ? null : item.id)} className="rounded-lg p-2 text-[#164536] hover:bg-[#E7F1EB]"><MoreVertical className="h-5 w-5"/></button>{activeTourMenuId === item.id && <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg"><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))} className="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-50">Xem chi tiết</button>{item.status === 'DRAFT' && <button type="button" onClick={() => {setActiveTourMenuId(null);setPublishTourId(item.id);}} className="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-50">Xuất bản</button>}<button type="button" onClick={() => {setActiveTourMenuId(null);setDeleteError(null);setTourToDelete(item);}} className="block w-full rounded-md px-3 py-2 text-left text-rose-700 hover:bg-rose-50">Xóa tour</button></div>}</div>
                    </div></td>
                  </tr>)}
                </tbody>
              </DataTable>

              {/* Pagination Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E0E6EE] px-5 py-4 text-sm text-slate-600"><span>Hiển thị {totalElements ? currentPage * size + 1 : 0}–{Math.min((currentPage + 1) * size, totalElements)} trong {totalElements} tour</span><nav aria-label="Phân trang tour" className="flex items-center gap-2"><button type="button" disabled={currentPage === 0 || isLoading} onClick={() => setPage(p => Math.max(0,p-1))} aria-label="Trang trước" className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button>{Array.from({length: Math.min(totalPages, 6)}, (_,index) => index).map(index => <button type="button" key={index} onClick={() => setPage(index)} aria-current={currentPage === index ? 'page' : undefined} className={`h-10 min-w-10 rounded-lg border border-slate-300 px-3 ${currentPage === index ? 'bg-[#0B7058] text-white' : 'bg-white hover:bg-slate-50'}`}>{index+1}</button>)}{totalPages > 6 && <><span>…</span><button type="button" onClick={() => setPage(totalPages-1)} className="h-10 min-w-10 rounded-lg border border-slate-300 bg-white px-3">{totalPages}</button></>}<button type="button" disabled={currentPage + 1 >= totalPages || isLoading} onClick={() => setPage(p => Math.min(totalPages-1,p+1))} aria-label="Trang sau" className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></nav></div>
            </div>
          )}
        </div>
        <p className="mt-2 text-right text-sm italic text-slate-500">Dữ liệu minh họa</p>
      </div>

      {publishTourId !== null && <TourPublishModal tourId={publishTourId} onClose={() => setPublishTourId(null)} onPublished={() => { setPublishTourId(null); toast.success('Đã xuất bản tour.'); void fetchTours(); }} />}
      {/* Delete Confirmation Modal */}
      <TourDeleteModal
        isOpen={Boolean(tourToDelete)}
        tourId={tourToDelete?.id ?? null}
        tourTitle={tourToDelete?.title ?? ''}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) {
            setTourToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </AdminAccessGuard>
  );
};

export default AdminTourListPage;
