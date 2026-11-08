import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Search,
  Mountain,
  Calendar,
  Compass,
  ShieldCheck,
  Clock,
  CreditCard,
  Headphones,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { TourSummaryResponse, DifficultyLevel } from '../../../features/tours/types/tour.types';
import { TourCard } from '../../../features/tours/components/TourCard';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../stores/auth.store';
import heroRidgeImg from '../../../assets/images/fansipan_cloud_ridge_1792001300725.jpg';

export interface HomePageProps {
  onBookTour?: (tour: any) => void;
  onNavigate?: (screen: any) => void;
}

export const HomePage: React.FC<HomePageProps> = () => {
  const { account, user, xRole, isAuthenticated, isInitializing } = useAuthStore();
  const isAdmin =
    (isAuthenticated &&
      (xRole === 'ADMIN' ||
        user?.role === 'admin' ||
        account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'))) ||
    (!isInitializing && xRole === 'ADMIN');

  const isGuide =
    (isAuthenticated &&
      (xRole === 'GUIDE' ||
        user?.role === 'guide' ||
        account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'GUIDE'))) ||
    (!isInitializing && xRole === 'GUIDE');

  useEffect(() => {
    if (!isInitializing) {
      if (isAdmin) {
        navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else if (isGuide) {
        navigateTo(ROUTES.GUIDE.SCHEDULES, { replace: true });
      }
    }
  }, [isInitializing, isAdmin, isGuide]);

  const prefersReducedMotion = useReducedMotion();

  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('');
  const [durationDays, setDurationDays] = useState<string>('');

  const [featuredTours, setFeaturedTours] = useState<TourSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isInitializing && (isAdmin || isGuide)) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    toursApi
      .listTours({ page: 0, size: 6 }, controller.signal)
      .then((pageData) => {
        setFeaturedTours(pageData.content || []);
        setTotalElements(pageData.totalElements ?? (pageData.content?.length || 0));
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Không thể tải danh sách tour nổi bật.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (difficulty) params.set('difficulty', difficulty);
    if (durationDays) params.set('durationDays', durationDays);

    const qs = params.toString();
    navigateTo(`${ROUTES.PUBLIC.TOURS}${qs ? `?${qs}` : ''}`);
  };

  // Prioritize real API cover image for hero if available; fallback to high-res local mountain landscape
  const heroTourImage =
    featuredTours.find((t) => Boolean(t.coverImageUrl))?.coverImageUrl || heroRidgeImg;

  if (!isInitializing && (isAdmin || isGuide)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#E6E1D8]">
        <div className="absolute inset-0 z-0">
          <img
            src={heroTourImage}
            alt="Phong cảnh núi rừng trekking Việt Nam"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14231F]/90 via-[#14231F]/75 to-[#14231F]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14231F] via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-20 md:pt-20 md:pb-24">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl text-white space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-mono text-[#B9EADB]">
              <Mountain className="w-4 h-4 text-[#FFB59D]" />
              <span className="uppercase tracking-wider font-semibold">
                KHÁM PHÁ THIÊN NHIÊN & TREKKING CÓ TỔ CHỨC
              </span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-white">
              Chinh phục những cung đường rừng & đỉnh cao hùng vĩ.
            </h1>

            <p className="text-sm sm:text-base text-stone-200 max-w-2xl leading-relaxed">
              Lịch khởi hành minh bạch, kiểm tra tình trạng chỗ trống theo thời gian thực, giữ chỗ 15 phút và xác nhận đặt cọc nhanh chóng trực tuyến.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
                className="bg-[#C2410C] hover:bg-[#9B2F00] text-white font-semibold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>Tìm chuyến đi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/30 font-semibold px-5 py-3.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Quy trình đặt chỗ
              </button>
            </div>
          </motion.div>

          {/* Simple Search Bar: Keyword, Difficulty, DurationDays */}
          <motion.form
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            onSubmit={handleSearchSubmit}
            aria-label="Tìm kiếm hành trình trekking"
            className="mt-10 bg-white border border-[#E6E1D8] rounded-2xl shadow-xl p-3 sm:p-4 max-w-5xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              {/* Keyword */}
              <div className="lg:col-span-5 p-2 rounded-xl hover:bg-[#F7F4EE] transition-colors">
                <label
                  htmlFor="home-search-query"
                  className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] mb-1"
                >
                  <Search className="w-3 h-3 inline mr-1 text-[#C2410C]" /> Từ khóa tuyến đường
                </label>
                <input
                  id="home-search-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tên đỉnh núi, cung đường (VD: Fansipan, Tà Xùa...)"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1C2526] placeholder:text-stone-400 placeholder:font-normal focus:outline-none"
                />
              </div>

              {/* Difficulty */}
              <div className="lg:col-span-3 p-2 rounded-xl hover:bg-[#F7F4EE] transition-colors sm:border-l border-[#E6E1D8]">
                <label
                  htmlFor="home-search-difficulty"
                  className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] mb-1"
                >
                  <Mountain className="w-3 h-3 inline mr-1 text-[#1F4E43]" /> Độ khó
                </label>
                <select
                  id="home-search-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | '')}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1C2526] focus:outline-none cursor-pointer"
                >
                  <option value="">Tất cả độ khó</option>
                  <option value="EASY">Dễ</option>
                  <option value="MODERATE">Trung bình</option>
                  <option value="HARD">Khó</option>
                  <option value="EXPERT">Chuyên gia</option>
                </select>
              </div>

              {/* Duration Days */}
              <div className="lg:col-span-2 p-2 rounded-xl hover:bg-[#F7F4EE] transition-colors lg:border-l border-[#E6E1D8]">
                <label
                  htmlFor="home-search-duration"
                  className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] mb-1"
                >
                  <Calendar className="w-3 h-3 inline mr-1 text-[#C2410C]" /> Số ngày
                </label>
                <select
                  id="home-search-duration"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1C2526] focus:outline-none cursor-pointer"
                >
                  <option value="">Mọi thời lượng</option>
                  <option value="1">1 ngày</option>
                  <option value="2">2 ngày 1 đêm</option>
                  <option value="3">3 ngày 2 đêm</option>
                  <option value="4">4 ngày 3 đêm</option>
                  <option value="5">5 ngày</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="lg:col-span-2 flex items-center">
                <button
                  type="submit"
                  className="w-full bg-[#1F4E43] hover:bg-[#15372F] text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm chuyến đi</span>
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* 2. FEATURED TOURS FROM REAL API */}
      <section className="py-14 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#1F4E43] mb-1">
              <Compass className="w-4 h-4 text-[#C2410C]" />
              <span className="uppercase tracking-wider font-semibold">TUYẾN TREKKING NỔI BẬT</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526]">
              Hành trình đang mở đăng ký
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Dữ liệu trực tiếp từ hệ thống điều hành tour ({totalElements} tuyến hiện có).
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C2410C] hover:text-[#9B2F00] cursor-pointer"
          >
            <span>Xem tất cả hành trình</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden p-4 space-y-4 animate-pulse"
              >
                <div className="h-52 bg-stone-200 rounded-xl" />
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-14 bg-stone-100 rounded-xl" />
                <div className="h-10 bg-stone-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Network Error State */}
        {!isLoading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
              Không thể tải danh sách tour
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử tải lại</span>
            </button>
          </div>
        )}

        {/* Empty State (No hardcoded fake results when API returns empty) */}
        {!isLoading && !error && featuredTours.length === 0 && (
          <div className="bg-white border border-[#E6E1D8] rounded-2xl p-10 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F4EE] text-[#1F4E43] flex items-center justify-center mx-auto">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
              Hiện chưa có tour nào được xuất bản
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Hệ thống hiện chưa có dữ liệu tour ở trạng thái PUBLISHED. Vui lòng quay lại sau khi ban điều hành cập nhật lịch trình mới.
            </p>
          </div>
        )}

        {/* Real Tour Cards */}
        {!isLoading && !error && featuredTours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* 3. HOW IT WORKS, SAFETY & SUPPORT */}
      <section id="how-it-works" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold block mb-1">
            QUY TRÌNH ĐẶT CHỖ & AN TOÀN
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526]">
            Trải nghiệm đặt tour minh bạch trong 4 bước
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
            Mọi trạng thái giữ chỗ và thanh toán đều được đồng bộ trực tiếp với máy chủ, giúp đoàn của bạn yên tâm chuẩn bị thể lực và hành trang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#B9EADB]/50 text-[#1F4E43] flex items-center justify-center mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-2">
                Chọn cung đường & Lịch khởi hành
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Xem chi tiết độ khó, thời lượng, dịch vụ bao gồm và số chỗ còn trống thực tế của từng đợt khởi hành.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6E1D8] text-[11px] font-mono text-[#1F4E43] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Giờ khởi hành chuẩn Việt Nam
            </div>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-2">
                Đăng ký hành khách & Giữ chỗ 15 phút
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Nhập danh sách thành viên đoàn. Khi tạo booking, hệ thống khóa chỗ tạm thời trong 15 phút ở trạng thái <code className="font-mono text-[11px]">PENDING_PAYMENT</code>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6E1D8] text-[11px] font-mono text-amber-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Chống trùng lặp bằng Idempotency Key
            </div>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-2">
                Đặt cọc hoặc Thanh toán trực tuyến
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Lựa chọn thanh toán tiền cọc hoặc thanh toán toàn bộ chuyến đi. Ngay khi giao dịch hoàn tất, hệ thống sẽ tự động xác nhận đặt chỗ chính thức.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6E1D8] text-[11px] font-mono text-[#C2410C] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Xác thực giao dịch tự động
            </div>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#1C2526] flex items-center justify-center mb-4">
                <Headphones className="w-5 h-5 text-[#1F4E43]" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-2">
                Quản lý hành khách & Hỗ trợ 24/7
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Dễ dàng cập nhật thông tin liên hệ của các thành viên đoàn, thanh toán phần dư còn lại trước hạn hoặc yêu cầu hủy theo chính sách tour.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E6E1D8] text-[11px] font-mono text-[#1F4E43] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Đồng hành xuyên suốt chuyến đi
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
