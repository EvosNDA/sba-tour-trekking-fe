import React, { useState, useEffect } from 'react';
import {
  Search,
  Mountain,
  Calendar,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { TourSummaryResponse, DifficultyLevel } from '../../../features/tours/types/tour.types';
import { TourCard } from '../../../features/tours/components/TourCard';
import { useSearchParams } from '../../../lib/navigation';
import { useDebounce } from '../../../hooks/useDebounce';

export interface TourListPageProps {
  onBookTour?: (tour: any) => void;
  onNavigate?: (screen: any) => void;
}

export const TourListPage: React.FC<TourListPageProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('query') || '';
  const initialDifficulty = (searchParams.get('difficulty') as DifficultyLevel) || '';
  const initialDuration = searchParams.get('durationDays') || '';
  const initialPage = Number(searchParams.get('page') || 0);

  const [query, setQuery] = useState(initialQuery);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>(initialDifficulty);
  const [durationDays, setDurationDays] = useState<string>(initialDuration);
  const [page, setPage] = useState<number>(isNaN(initialPage) || initialPage < 0 ? 0 : initialPage);
  const pageSize = 20;

  const debouncedQuery = useDebounce(query, 350);

  const [tours, setTours] = useState<TourSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Sync URL search params when filters change
  useEffect(() => {
    setSearchParams(
      {
        query: debouncedQuery || null,
        difficulty: difficulty || null,
        durationDays: durationDays || null,
        page: page > 0 ? page : null,
      },
      true
    );
  }, [debouncedQuery, difficulty, durationDays, page, setSearchParams]);

  // Fetch tours from GET /api/v1/tours
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    toursApi
      .listTours(
        {
          page,
          size: pageSize,
          query: debouncedQuery,
          difficulty,
          durationDays: durationDays ? Number(durationDays) : '',
        },
        controller.signal
      )
      .then((res) => {
        setTours(res.content || []);
        setTotalElements(res.totalElements ?? 0);
        setTotalPages(res.totalPages ?? 0);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Không thể tải danh sách tour từ máy chủ.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [page, pageSize, debouncedQuery, difficulty, durationDays, reloadTrigger]);

  const handleResetFilters = () => {
    setQuery('');
    setDifficulty('');
    setDurationDays('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(query || difficulty || durationDays);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D8] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#1F4E43] font-semibold block mb-1">
            DANH MỤC HÀNH TRÌNH TREKKING
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526]">
            Khám phá các cung đường núi & rừng quốc gia
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Tìm kiếm theo tên tuyến, lọc theo cấp độ thể lực và thời lượng chuyến đi.
          </p>
        </div>

        <div className="text-xs font-mono text-[#78716C] bg-white border border-[#E6E1D8] px-3.5 py-2 rounded-xl self-start md:self-auto">
          Tìm thấy <strong className="text-[#1C2526]">{totalElements}</strong> hành trình
        </div>
      </div>

      {/* Filter Bar */}
      <section
        aria-label="Bộ lọc tìm kiếm tour"
        className="bg-white border border-[#E6E1D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Keyword Search */}
          <div className="md:col-span-5">
            <label
              htmlFor="tours-filter-query"
              className="block text-xs font-semibold text-[#1C2526] mb-1.5"
            >
              Từ khóa tìm kiếm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="tours-filter-query"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Nhập tên tour, đỉnh núi, khu bảo tồn..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F7F4EE] focus:bg-white border border-[#E6E1D8] rounded-xl text-[#1C2526] focus:outline-none focus:border-[#C2410C]"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="md:col-span-3">
            <label
              htmlFor="tours-filter-difficulty"
              className="block text-xs font-semibold text-[#1C2526] mb-1.5"
            >
              Độ khó hành trình
            </label>
            <div className="relative">
              <Mountain className="w-4 h-4 text-[#1F4E43] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="tours-filter-difficulty"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value as DifficultyLevel | '');
                  setPage(0);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F7F4EE] focus:bg-white border border-[#E6E1D8] rounded-xl text-[#1C2526] focus:outline-none focus:border-[#C2410C] cursor-pointer"
              >
                <option value="">Tất cả cấp độ</option>
                <option value="EASY">Dễ</option>
                <option value="MODERATE">Trung bình</option>
                <option value="HARD">Khó</option>
                <option value="EXPERT">Chuyên gia</option>
              </select>
            </div>
          </div>

          {/* Duration Days Filter */}
          <div className="md:col-span-2">
            <label
              htmlFor="tours-filter-duration"
              className="block text-xs font-semibold text-[#1C2526] mb-1.5"
            >
              Thời lượng (Số ngày)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#C2410C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="tours-filter-duration"
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(e) => {
                  setDurationDays(e.target.value);
                  setPage(0);
                }}
                placeholder="Tất cả"
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#F7F4EE] focus:bg-white border border-[#E6E1D8] rounded-xl text-[#1C2526] focus:outline-none focus:border-[#C2410C]"
              />
            </div>
          </div>

          {/* Clear / Refresh Buttons */}
          <div className="md:col-span-2 flex items-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-[#1C2526] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReloadTrigger((t) => t + 1)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#F7F4EE] hover:bg-[#EFECE4] border border-[#E6E1D8] text-[#1F4E43] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick difficulty pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E6E1D8]/70 text-xs">
          <span className="text-[11px] font-mono text-[#78716C] flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3" /> Lọc nhanh:
          </span>
          {(
            [
              { value: '', label: 'Tất cả' },
              { value: 'EASY', label: 'Dễ' },
              { value: 'MODERATE', label: 'Trung bình' },
              { value: 'HARD', label: 'Khó' },
              { value: 'EXPERT', label: 'Chuyên gia' },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setDifficulty(item.value);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                difficulty === item.value
                  ? 'bg-[#1F4E43] text-white font-semibold'
                  : 'bg-[#F7F4EE] text-[#2D3748] hover:bg-[#EFECE4]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-[#E6E1D8] p-4 space-y-4 animate-pulse"
            >
              <div className="h-52 bg-stone-200 rounded-xl" />
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 bg-stone-200 rounded w-4/5" />
              <div className="h-14 bg-stone-100 rounded-xl" />
              <div className="h-10 bg-stone-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
            Lỗi tải danh sách hành trình
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTrigger((t) => t + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9B2F00] text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại ngay</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && tours.length === 0 && (
        <div className="bg-white border border-[#E6E1D8] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F7F4EE] text-[#1F4E43] flex items-center justify-center mx-auto">
            <Mountain className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
            Không tìm thấy hành trình phù hợp
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Không có tuyến tour nào khớp với bộ lọc hiện tại của bạn. Hãy thử thay đổi từ khóa, độ khó hoặc số ngày.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <span>Xóa toàn bộ bộ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && !error && tours.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#E6E1D8]">
              <span className="text-xs font-mono text-[#64748B]">
                Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng {totalElements} tour)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E6E1D8] text-[#1C2526] hover:bg-[#F7F4EE] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trang trước</span>
                </button>

                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E6E1D8] text-[#1C2526] hover:bg-[#F7F4EE] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Trang tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TourListPage;
