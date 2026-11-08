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
  const [size, setSize] = useState<number>(20);

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

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const parsedDuration =
        durationDays.trim() !== '' && Number(durationDays) > 0
          ? Number(durationDays)
          : '';

      const res = await toursApi.listTours({
        page,
        size,
        query: appliedQuery,
        difficulty,
        durationDays: parsedDuration,
        status,
      });

      setTours(res.content || []);
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
      <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1F4E43] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
                <span>Hệ thống Quản trị Tour Trekking (ADMIN)</span>
              </div>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                Danh sách Tour Trekking
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Quản lý danh mục cung đường, trạng thái xuất bản, độ khó và thời lượng hành trình.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchTours}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`}
                />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.TOUR_NEW)}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo tour mới</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#1F4E43]" />
                <span>Bộ lọc & Tìm kiếm quản trị</span>
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#C2410C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              {/* Query input */}
              <div className="lg:col-span-4">
                <label
                  htmlFor="admin-filter-query"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Tìm theo tên tour
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-filter-query"
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Nhập tên tour (VD: Tà Năng, Fansipan...)"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#1F4E43]"
                  />
                </div>
              </div>

              {/* Difficulty select */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="admin-filter-difficulty"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Độ khó
                </label>
                <select
                  id="admin-filter-difficulty"
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as DifficultyLevel | '');
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#1F4E43] cursor-pointer"
                >
                  <option value="">Tất cả độ khó</option>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DurationDays input */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="admin-filter-duration"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Thời lượng (ngày)
                </label>
                <input
                  id="admin-filter-duration"
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => {
                    setDurationDays(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Tất cả"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-stone-300 bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#1F4E43]"
                />
              </div>

              {/* Status select */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="admin-filter-status"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Trạng thái
                </label>
                <select
                  id="admin-filter-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as TourStatus | '');
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#1F4E43] cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  {TOUR_STATUS_OPTIONS.filter((option) => option.value === 'DRAFT' || option.value === 'PUBLISHED').map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit button */}
              <div className="lg:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-xl bg-[#C2410C] hover:bg-[#9B2F00] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>
          </form>

          {/* Table / Loading / Empty / Error States */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden shadow-2xs">
              <div className="p-6 space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between gap-4 py-3 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-12 rounded-xl bg-stone-200 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-stone-200 rounded w-1/3" />
                        <div className="h-3 bg-stone-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="h-6 bg-stone-200 rounded-full w-24" />
                    <div className="h-6 bg-stone-200 rounded w-16" />
                    <div className="h-6 bg-stone-200 rounded-full w-24" />
                    <div className="h-8 bg-stone-200 rounded-xl w-32" />
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
                <h2 className="text-lg font-bold text-stone-900">
                  Không thể tải danh sách tour từ máy chủ
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">{error.message}</p>
                {error.code && (
                  <p className="text-[11px] font-mono text-rose-600">Mã lỗi: {error.code}</p>
                )}
              </div>
              <button
                type="button"
                onClick={fetchTours}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="font-editorial text-2xl font-bold text-[#1C2526]">
                  Không tìm thấy tour nào
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
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
                    className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOUR_NEW)}
                  className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo tour mới</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden shadow-2xs">
              {/* Responsive Table for Desktop & Tablet */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                      <th className="py-3.5 px-4 font-bold w-24">Ảnh bìa</th>
                      <th className="py-3.5 px-4 font-bold">Tên tour</th>
                      <th className="py-3.5 px-4 font-bold w-40">Độ khó</th>
                      <th className="py-3.5 px-4 font-bold w-28 text-center">Thời lượng</th>
                      <th className="py-3.5 px-4 font-bold w-40">Trạng thái</th>
                      <th className="py-3.5 px-4 font-bold w-56 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    {tours.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FDFBF7] transition-colors group"
                      >
                        {/* Cover Image */}
                        <td className="py-3.5 px-4">
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageOff
                                className="w-4 h-4 text-stone-400"
                                aria-label="Chưa có ảnh đại diện"
                              />
                            )}
                          </div>
                        </td>

                        {/* Title & ID */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))}
                            className="font-semibold text-[#1C2526] hover:text-[#C2410C] text-left transition-colors block cursor-pointer"
                          >
                            {item.title}
                          </button>
                        </td>

                        {/* Difficulty */}
                        <td className="py-3.5 px-4">
                          <StatusBadge difficulty={item.difficulty} size="sm" />
                        </td>

                        {/* Duration Days */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-mono text-xs font-bold">
                            {item.durationDays} ngày
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge tourStatus={item.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(item.id))}
                              title="Xem chi tiết"
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#1F4E43]" />
                              <span>Chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => navigateTo(ROUTES.ADMIN.TOUR_EDIT(item.id))}
                              title="Chỉnh sửa"
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#C2410C]" />
                              <span>Sửa</span>
                            </button>

                            {item.status === 'DRAFT' && <button type="button" onClick={() => setPublishTourId(item.id)} className="rounded-lg bg-[#1F4E43] px-2.5 py-1.5 text-xs font-semibold text-white">Xuất bản</button>}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setTourToDelete(item);
                              }}
                              title="Xóa tour"
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-xs font-semibold text-rose-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="bg-[#FAF8F5] border-t border-[#E6E1D8] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Tổng số: <strong className="text-stone-900">{totalElements}</strong> tour
                  </span>
                  <span className="text-stone-300">|</span>
                  <label className="inline-flex items-center gap-1.5">
                    <span>Số dòng/trang:</span>
                    <select
                      value={size}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="px-2 py-1 rounded-lg border border-stone-300 bg-white font-mono text-xs text-stone-800 focus:outline-none focus:border-[#1F4E43] cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    Trang <strong>{totalPages > 0 ? currentPage + 1 : 0}</strong> /{' '}
                    {Math.max(totalPages, 1)} (page={currentPage})
                  </span>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      disabled={currentPage <= 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      aria-label="Trang trước"
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={totalPages === 0 || currentPage + 1 >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Trang tiếp theo"
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
