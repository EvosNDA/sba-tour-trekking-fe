import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  Lock,
  LogIn,
  RotateCcw,
  ChevronDown,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth.store';
import { navigateTo } from '../../../../lib/navigation';
import { ROUTES } from '../../../../constants/routes';
import {
  CustomerReviewItem,
  TourReviewsResponse,
} from '../../types/customer-review.types';
import {
  customerReviewsApi,
  REQUIRE_AUTH_FOR_REVIEWS,
} from '../../api/customer-reviews.api';
import type { ApiError } from '../../../../types/api.types';

export interface TourReviewsSectionProps {
  tourId: number;
}

export const TourReviewsSection: React.FC<TourReviewsSectionProps> = ({ tourId }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  const [reviewsData, setReviewsData] = useState<TourReviewsResponse | null>(null);
  const [items, setItems] = useState<CustomerReviewItem[]>([]);
  const [page, setPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isAuthBlocked, setIsAuthBlocked] = useState<boolean>(false);

  // Điều hướng đăng nhập kèm redirect về URL hiện tại
  const handleGoToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(currentPath)}`);
  };

  const fetchReviews = useCallback(
    async (pageIndex: number, isLoadMore: boolean = false) => {
      // Nếu yêu cầu đăng nhập mà người dùng chưa đăng nhập -> không gọi API tránh 401
      if (REQUIRE_AUTH_FOR_REVIEWS && !isAuthenticated) {
        setIsAuthBlocked(true);
        return;
      }

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setIsAuthBlocked(false);

      try {
        const res = await customerReviewsApi.getTourReviews({
          tourId,
          page: pageIndex,
          size: 10,
        });

        setReviewsData(res);
        if (isLoadMore) {
          setItems((prev) => [...prev, ...(res.items || [])]);
        } else {
          setItems(res.items || []);
        }
      } catch (err: any) {
        // Nếu API trả 401 bất ngờ -> chuyển sang hiển thị khối đăng nhập thay vì báo lỗi
        if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
          setIsAuthBlocked(true);
        } else {
          setError(err);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [tourId, isAuthenticated]
  );

  useEffect(() => {
    if (isInitializing) return;

    if (REQUIRE_AUTH_FOR_REVIEWS && !isAuthenticated) {
      setIsAuthBlocked(true);
      return;
    }

    setPage(0);
    fetchReviews(0, false);
  }, [fetchReviews, isInitializing, isAuthenticated]);

  const handleLoadMore = () => {
    if (!reviewsData || page >= reviewsData.totalPages - 1 || isLoadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  // Format ngày dd/MM/yyyy
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

  // Xử lý điểm trung bình (hỗ trợ cả string và number từ BigDecimal)
  const numericAverage = (() => {
    if (!reviewsData || reviewsData.averageRating === null || reviewsData.averageRating === undefined) {
      return null;
    }
    const parsed = Number(reviewsData.averageRating);
    return Number.isNaN(parsed) ? null : parsed;
  })();

  const renderStars = (rating: number) => {
    return (
      <div className="inline-flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section id="danh-gia" className="scroll-mt-24 space-y-4">
      <div className="bg-white border border-[#E6E1D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E1D8]">
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[#1C2526] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#1F4E43]" />
              <span>Đánh giá từ khách hàng</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Ý kiến và trải nghiệm thực tế từ những người đã hoàn thành chuyến đi.
            </p>
          </div>

          {/* Average Rating Badge */}
          {!isAuthBlocked && reviewsData && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#F7F4EE] border border-[#E6E1D8]">
              <div className="flex items-center gap-1 font-editorial text-2xl font-bold text-[#1C2526]">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span>
                  {numericAverage !== null ? numericAverage.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-stone-400 font-sans font-normal">/5</span>
              </div>
              <div className="text-[11px] text-[#64748B] border-l border-[#E6E1D8] pl-2.5">
                <span className="font-semibold text-stone-800">
                  {reviewsData.reviewCount ?? reviewsData.totalElements ?? 0}
                </span>{' '}
                đánh giá
              </div>
            </div>
          )}
        </div>

        {/* Khối chưa đăng nhập / Auth Blocked */}
        {isAuthBlocked && (
          <div className="py-10 px-4 text-center rounded-2xl bg-[#FDFBF7] border border-dashed border-[#E6E1D8] space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-[#1C2526]">
                Đăng nhập để xem đánh giá từ khách hàng
              </h4>
              <p className="text-xs text-[#64748B]">
                Vui lòng đăng nhập tài khoản WeTrek để đọc các phản hồi chân thực từ đoàn khách trước đó.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold hover:bg-[#15372F] transition-all shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập ngay</span>
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !isAuthBlocked && (
          <div className="space-y-4 py-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-stone-200 rounded-md w-28" />
                  <div className="h-3 bg-stone-200 rounded-md w-20" />
                </div>
                <div className="h-3 bg-stone-200 rounded-md w-24" />
                <div className="h-4 bg-stone-100 rounded-md w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Lỗi tải */}
        {error && !isAuthBlocked && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error.message || 'Không thể tải danh sách đánh giá.'}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchReviews(0, false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Thử lại
            </button>
          </div>
        )}

        {/* Danh sách reviews */}
        {!isLoading && !isAuthBlocked && !error && (
          <>
            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#64748B] bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E6E1D8]">
                Chưa có đánh giá nào cho hành trình này.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((rev) => (
                  <article
                    key={rev.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FDFBF7] border border-[#E6E1D8] space-y-2.5 transition-all hover:border-[#D6CEBE]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1F4E43] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                          <User className="w-4 h-4 text-[#B9EADB]" />
                        </div>
                        <div>
                          {/* Hiển thị nguyên văn tên khách như backend trả về */}
                          <div className="font-semibold text-xs sm:text-sm text-[#1C2526]">
                            {rev.customerName}
                          </div>
                          <div className="text-[10px] text-[#78716C] font-mono">
                            Khách hàng #{rev.customerId}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div>{renderStars(rev.rating)}</div>
                        <div className="text-[10px] font-mono text-[#78716C] mt-0.5">
                          {formatDate(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed whitespace-pre-wrap pl-10">
                        {rev.comment}
                      </p>
                    ) : (
                      <p className="text-xs italic text-[#78716C] pl-10">
                        (Khách hàng không để lại nhận xét bằng chữ)
                      </p>
                    )}
                  </article>
                ))}

                {/* Nút Xem thêm nếu còn trang */}
                {reviewsData && page < reviewsData.totalPages - 1 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#E6E1D8] bg-white hover:bg-[#F7F4EE] text-xs font-semibold text-[#1C2526] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải thêm...</span>
                        </>
                      ) : (
                        <>
                          <span>Xem thêm đánh giá</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
