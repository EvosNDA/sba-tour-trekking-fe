import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import { FilterToolbar } from '../../../components/ui/FilterToolbar';
import { Pagination } from '../../../components/ui/Pagination';
import { DataTable } from '../../../components/ui/DataTable';
import { DataState } from '../../../components/ui/DataState';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Calendar,
  ArrowRight,
  Info,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  AdminReviewItem,
  ReviewStatusParam,
} from '../../../features/reviews/types/review.types';
import { reviewsApi } from '../../../features/reviews/api/reviews.api';
import { ReviewActionModal } from '../../../features/reviews/components/ReviewActionModal';
import { ReviewDetailModal } from '../../../features/reviews/components/ReviewDetailModal';
import { addOneDay } from '../../../features/dashboard/components/dashboardFormatters';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../components/ui/Toast';
import type { ApiError } from '../../../types/api.types';

export const AdminReviewListPage: React.FC = () => {
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<ReviewStatusParam | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortParam, setSortParam] = useState('createdAt,desc');

  // Pagination States
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Data & Request States
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Modal Action States
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetReview, setTargetReview] = useState<AdminReviewItem | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'restore'>('hide');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailReviewId, setDetailReviewId] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const toExclusive = toDate ? addOneDay(toDate) : undefined;
      const res = await reviewsApi.getReviews({
        page,
        size,
        q: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter !== '' ? Number(ratingFilter) : undefined,
        createdFrom: fromDate || undefined,
        createdTo: toExclusive,
        sort: sortParam,
      });
      setItems(res.items || []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 0);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedSearch, statusFilter, ratingFilter, fromDate, toDate, sortParam]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, ratingFilter, fromDate, toDate, sortParam]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setRatingFilter('');
    setFromDate('');
    setToDate('');
    setSortParam('createdAt,desc');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    searchInput || statusFilter || ratingFilter !== '' || fromDate || toDate || sortParam !== 'createdAt,desc'
  );

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'visible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Đang hiển thị
          </span>
        );
      case 'hidden':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            Đã ẩn
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-600">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
        <span>{rating}/5</span>
      </div>
    );
  };

  const handleOpenAction = (rev: AdminReviewItem, type: 'hide' | 'restore') => {
    setTargetReview(rev);
    setActionType(type);
    setActionError(null);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (reason: string) => {
    if (!targetReview) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      if (actionType === 'hide') {
        await reviewsApi.hideReview(targetReview.id, { reason });
        toast.success(`Đã ẩn đánh giá #${targetReview.id} thành công.`);
      } else {
        await reviewsApi.restoreReview(targetReview.id, { reason });
        toast.success(`Đã khôi phục hiển thị đánh giá #${targetReview.id} thành công.`);
      }

      try {
        const updatedDetail = await reviewsApi.getReviewDetail(targetReview.id);
        setItems((prev) =>
          prev.map((item) =>
            item.id === updatedDetail.id
              ? {
                  ...item,
                  status: updatedDetail.status,
                  moderationReason: updatedDetail.moderationReason,
                  moderatedBy: updatedDetail.moderatedBy,
                }
              : item
          )
        );
      } catch {
        fetchReviews();
      }

      setActionModalOpen(false);
      setTargetReview(null);
    } catch (err: any) {
      setActionError(err);
      if (err?.code === 'REVIEW_NOT_FOUND' || err?.status === 404) {
        toast.error('Đánh giá không tồn tại hoặc đã bị xóa. Đang tải lại danh sách...');
        fetchReviews();
      } else if (err?.code === 'INVALID_REVIEW_TRANSITION' || err?.status === 409) {
        toast.error('Trạng thái đánh giá đã thay đổi trên máy chủ. Đang tải lại...');
        fetchReviews();
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card theo spec chuẩn */}
        <AdminPageHeader title="Kiểm duyệt đánh giá & Phản hồi" description="Theo dõi ý kiến khách hàng, kiểm soát chất lượng dịch vụ và xử lý vi phạm nội dung" actions={<div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchReviews}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1F4E43]' : ''}`}
              />
              <span>Làm mới</span>
            </button>
          </div>} />

        {/* Ghi chú nghiệp vụ Admin */}
        <div className="p-4 bg-stone-100/70 border border-[#E6E1D8] rounded-2xl text-xs text-stone-700 flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 font-semibold">Nguyên tắc quản trị:</strong> Admin chỉ có quyền Ẩn hoặc Khôi phục hiển thị đánh giá; không xóa hay can thiệp sửa đổi nội dung và điểm đánh giá của khách hàng.
          </div>
        </div>

        {/* Filter Toolbar Card theo spec chuẩn */}
        <FilterToolbar>
          {/* Row 1: Search & Dropdowns */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo nội dung, tên khách hàng hoặc tour..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#1F4E43] transition-colors"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Lọc Status */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReviewStatusParam | '')}
                  className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#1F4E43]"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="VISIBLE">Đang hiển thị (VISIBLE)</option>
                  <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
                </select>
              </div>

              {/* Lọc Rating */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : '')}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#1F4E43]"
              >
                <option value="">Tất cả số sao</option>
                <option value="5">★ 5 sao</option>
                <option value="4">★ 4 sao</option>
                <option value="3">★ 3 sao</option>
                <option value="2">★ 2 sao</option>
                <option value="1">★ 1 sao</option>
              </select>

              {/* Sắp xếp */}
              <select
                value={sortParam}
                onChange={(e) => setSortParam(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-[#1F4E43]"
              >
                <option value="createdAt,desc">Mới nhất trước</option>
                <option value="createdAt,asc">Cũ nhất trước</option>
                <option value="rating,desc">Điểm cao nhất (5 → 1)</option>
                <option value="rating,asc">Điểm thấp nhất (1 → 5)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date Filters & Clear button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6E1D8] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-600 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Khoảng ngày tạo:
              </span>
              <input
                type="date"
                lang="vi"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 text-xs"
              />
              <ArrowRight className="w-3 h-3 text-stone-400" />
              <input
                type="date"
                lang="vi"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 text-xs"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </FilterToolbar>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error.message || 'Không thể tải danh sách đánh giá.'}</span>
            </div>
            <button
              type="button"
              onClick={fetchReviews}
              className="px-3.5 py-1.5 bg-white border border-rose-300 rounded-xl text-rose-700 font-semibold hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Table Card theo spec chuẩn */}
        <div className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E6E1D8] md:hidden" aria-busy={isLoading}>
            {isLoading ? <p role="status" className="p-6 text-sm text-stone-600">Đang tải đánh giá…</p> : items.length === 0 ? <DataState title="Không tìm thấy đánh giá" description="Thử thay đổi hoặc xóa bộ lọc để xem kết quả khác." /> : items.map((rev) => <article key={rev.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-base font-semibold">{rev.customerName}</h2><p className="mt-1 break-words text-sm text-stone-600">{rev.tourName}</p></div><div className="shrink-0">{renderStars(rev.rating)}</div></div>
              <p className="break-words text-sm leading-relaxed text-stone-700">{rev.comment || 'Không có nhận xét bằng chữ.'}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">{renderStatusBadge(rev.status)}<time className="text-sm text-stone-500">{formatDate(rev.createdAt)}</time></div>
              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4"><button type="button" onClick={() => { setDetailReviewId(rev.id); setDetailModalOpen(true); }} className="min-h-11 rounded-lg border border-stone-200 px-3 text-sm font-medium">Xem chi tiết</button><button type="button" onClick={() => handleOpenAction(rev, rev.status === 'visible' ? 'hide' : 'restore')} className="min-h-11 rounded-lg border border-stone-200 px-3 text-sm font-medium text-[#1F4E43]">{rev.status === 'visible' ? 'Ẩn đánh giá' : 'Khôi phục'}</button></div>
            </article>)}
          </div>
          <DataTable className="hidden md:block" tableClassName="w-full text-left text-sm border-collapse">
              <thead className="bg-stone-50/80 text-stone-500 border-b border-[#E6E1D8]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Khách hàng</th>
                  <th className="py-3.5 px-4 font-semibold">Tuyến tour</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Điểm</th>
                  <th className="py-3.5 px-4 font-semibold">Nội dung đánh giá</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày tạo</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-stone-700">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-3.5 bg-stone-200 rounded-sm w-28" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3.5 bg-stone-200 rounded-sm w-36" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-4 bg-stone-200 rounded-md w-12 mx-auto" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-stone-200 rounded-sm w-48" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-4 bg-stone-200 rounded-full w-20 mx-auto" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-stone-200 rounded-sm w-20" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-6 bg-stone-200 rounded-lg w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-stone-400">
                      Không tìm thấy đánh giá nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  items.map((rev) => (
                    <tr key={rev.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900 truncate max-w-[140px]" title={rev.customerName}>
                          {rev.customerName}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          #{rev.customerId}
                        </div>
                      </td>

                      {/* Tour */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800 truncate max-w-[180px]" title={rev.tourName}>
                          {rev.tourName}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          Tour #{rev.tourId}
                        </div>
                      </td>

                      {/* Điểm sao */}
                      <td className="py-3 px-4 text-center">
                        {renderStars(rev.rating)}
                      </td>

                      {/* Nội dung comment */}
                      <td className="py-3 px-4">
                        <div
                          className="truncate max-w-[280px] text-stone-700 cursor-pointer hover:text-stone-900"
                          title={rev.comment || 'Không có nhận xét bằng chữ'}
                          onClick={() => {
                            setDetailReviewId(rev.id);
                            setDetailModalOpen(true);
                          }}
                        >
                          {rev.comment ? (
                            rev.comment
                          ) : (
                            <span className="italic text-stone-400">Không có chữ</span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(rev.status)}
                      </td>

                      {/* Ngày tạo */}
                      <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">
                        {formatDate(rev.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailReviewId(rev.id);
                              setDetailModalOpen(true);
                            }}
                            title="Xem chi tiết đánh giá"
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Nút Ẩn / Khôi phục */}
                          {rev.status === 'visible' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(rev, 'hide')}
                              title="Ẩn đánh giá này khỏi trang tour"
                              className="px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              Ẩn
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(rev, 'restore')}
                              title="Khôi phục hiển thị đánh giá này"
                              className="px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Khôi phục
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>

          {/* Pagination Footer */}
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={size} onPageChange={(next) => { if (!isLoading) setPage(next); }} />
        </div>

        {/* Modal xác nhận Ẩn / Khôi phục */}
        <ReviewActionModal
          isOpen={actionModalOpen}
          review={targetReview}
          actionType={actionType}
          isSubmitting={isSubmittingAction}
          error={actionError}
          onClose={() => {
            if (!isSubmittingAction) {
              setActionModalOpen(false);
              setTargetReview(null);
            }
          }}
          onConfirm={handleConfirmAction}
        />

        {/* Modal chi tiết đánh giá */}
        <ReviewDetailModal
          isOpen={detailModalOpen}
          reviewId={detailReviewId}
          onClose={() => {
            setDetailModalOpen(false);
            setDetailReviewId(null);
          }}
          onRequestAction={(revDetail, action) => {
            const itemConverted: AdminReviewItem = {
              id: revDetail.id,
              bookingId: revDetail.bookingId,
              tourId: revDetail.tourId,
              tourName: revDetail.tourName,
              scheduleId: revDetail.scheduleId,
              customerId: revDetail.customerId,
              customerName: revDetail.customerName,
              rating: revDetail.rating,
              comment: revDetail.comment,
              status: revDetail.status,
              moderationReason: revDetail.moderationReason,
              moderatedBy: revDetail.moderatedBy,
              moderatedAt: null,
              createdAt: revDetail.createdAt,
            };
            handleOpenAction(itemConverted, action);
          }}
        />
      </div>
    </div>
  );
};

export default AdminReviewListPage;
