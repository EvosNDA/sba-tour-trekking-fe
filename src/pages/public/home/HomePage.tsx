import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Search,
  Mountain,
  Calendar,
  Compass,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Backpack,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { TourSummaryResponse, DifficultyLevel } from '../../../features/tours/types/tour.types';
import { TourCard } from '../../../features/tours/components/TourCard';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../stores/auth.store';
import heroRidgeImg from '../../../assets/images/fansipan_cloud_ridge_1792001300725.jpg';
import trailImg from '../../../assets/images/ta_xua_ridge_walk_1792001302386.jpg';

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
        if (controller.signal.aborted || err?.name === 'AbortError') return;
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
  }, [reloadKey, isInitializing, isAdmin, isGuide]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (difficulty) params.set('difficulty', difficulty);
    if (durationDays) params.set('durationDays', durationDays);

    const qs = params.toString();
    navigateTo(`${ROUTES.PUBLIC.TOURS}${qs ? `?${qs}` : ''}`);
  };

  if (!isInitializing && (isAdmin || isGuide)) {
    return null;
  }

  const primaryAction = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9B2F00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C2410C] cursor-pointer';
  const fieldClass = 'mt-1 block min-h-11 w-full rounded-lg bg-transparent px-2 text-base text-[#1C2526] placeholder:text-[#78716C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4E43]';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526]">
      <section aria-labelledby="home-heading" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
        <div className="grid items-center gap-9 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="py-2 lg:py-8"
          >
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1F4E43]">
              <span className="h-px w-8 bg-[#C2410C]" aria-hidden="true" />
              WeTrek · Hành trình ngoài thiên nhiên
            </p>
            <h1 id="home-heading" className="font-editorial text-[clamp(2.75rem,5.4vw,4.8rem)] font-bold leading-[1.1] tracking-[-0.045em] text-[#1F4E43]">
              Rời phố thị.<br />
              <span className="text-[#C2410C]">Chạm thiên nhiên.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#5C645E] sm:text-lg sm:leading-8">
              Những cung đường giữa núi rừng, những bình minh trên biển mây. Tìm hành trình phù hợp và bắt đầu câu chuyện của riêng bạn.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className={primaryAction}>
                Khám phá hành trình <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <a href="#how-it-works" onClick={(event) => {
                event.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth' });
              }} className="inline-flex min-h-12 items-center gap-2 rounded-md text-sm font-semibold text-[#1F4E43] underline decoration-[#D6CEBE] underline-offset-8 transition-colors hover:text-[#C2410C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F4E43]">
                Bắt đầu như thế nào? <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#E6E1D8] pt-5 text-sm text-[#5C645E]">
              <span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-[#1F4E43]" aria-hidden="true" /> Nhiều cấp độ trekking</span>
              <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-[#1F4E43]" aria-hidden="true" /> Chủ động lịch khởi hành</span>
            </div>
          </motion.div>

          <motion.figure
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65 }}
            className="relative isolate overflow-hidden rounded-2xl bg-[#E6E1D8] lg:rounded-t-[6rem] lg:rounded-b-2xl"
          >
            <img src={heroRidgeImg} alt="Cung đường trekking trên sống núi giữa biển mây lúc bình minh" className="aspect-[5/4] w-full object-cover sm:aspect-[4/3] lg:aspect-[6/7]" fetchPriority="high" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#14231F]/95 to-transparent px-6 pb-6 pt-20 text-white sm:px-8 sm:pb-8">
              <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#E6E1D8]"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Những cung đường Việt Nam</p>
              <p className="font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">Một bước chân. Một góc nhìn mới.</p>
            </figcaption>
          </motion.figure>
        </div>

        <form onSubmit={handleSearchSubmit} aria-label="Tìm kiếm hành trình trekking" className="mt-10 rounded-2xl border border-[#D6CEBE] bg-white p-5 sm:p-6 lg:mt-12 lg:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1F4E43] lg:hidden"><Search className="h-4 w-4" aria-hidden="true" /> Tìm chuyến đi của bạn</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end lg:gap-6">
            <div className="min-w-0">
              <label htmlFor="home-search-query" className="px-2 text-xs font-semibold text-[#5C645E]">Bạn muốn đi đâu?</label>
              <input id="home-search-query" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên cung đường, đỉnh núi…" className={fieldClass} />
            </div>
            <div className="min-w-0 lg:border-l lg:border-[#E6E1D8] lg:pl-4">
              <label htmlFor="home-search-difficulty" className="px-2 text-xs font-semibold text-[#5C645E]">Cấp độ thử thách</label>
              <select id="home-search-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | '')} className={`${fieldClass} cursor-pointer`}>
                <option value="">Tất cả độ khó</option>
                <option value="EASY">Dễ · Người mới</option>
                <option value="MODERATE">Trung bình</option>
                <option value="HARD">Khó · Có kinh nghiệm</option>
                <option value="EXPERT">Chuyên gia</option>
              </select>
            </div>
            <div className="min-w-0 lg:border-l lg:border-[#E6E1D8] lg:pl-4">
              <label htmlFor="home-search-duration" className="px-2 text-xs font-semibold text-[#5C645E]">Thời gian dành cho chuyến đi</label>
              <select id="home-search-duration" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className={`${fieldClass} cursor-pointer`}>
                <option value="">Mọi thời lượng</option>
                <option value="1">1 ngày</option>
                <option value="2">2 ngày 1 đêm</option>
                <option value="3">3 ngày 2 đêm</option>
                <option value="4">4 ngày 3 đêm</option>
                <option value="5">5 ngày 4 đêm</option>
              </select>
            </div>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F4E43] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15372F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F4E43] cursor-pointer">
              <Search className="h-4 w-4" aria-hidden="true" /> Tìm hành trình
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2410C]">Chọn một điểm đến</p>
            <h2 id="featured-heading" className="font-editorial text-3xl font-bold leading-tight tracking-tight text-[#1F4E43] sm:text-4xl">Hành trình cho bước chân tiếp theo.</h2>
            <p className="mt-4 text-base leading-7 text-[#5C645E]">
              {!isLoading && !error && totalElements > 0 ? `${totalElements} cung đường để khám phá. ` : ''}Từ chuyến đi đầu tiên đến những thử thách mới giữa đại ngàn.
            </p>
          </div>
          <button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg border border-[#D6CEBE] px-4 py-2.5 text-sm font-semibold text-[#1F4E43] transition-colors hover:border-[#1F4E43] hover:bg-[#F2EFE7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F4E43] sm:self-auto cursor-pointer">
            Tất cả hành trình <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div aria-busy={isLoading} aria-live="polite">
          {isLoading && (
            <div role="status">
              <span className="sr-only">Đang tải các hành trình…</span>
              <div aria-hidden="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white motion-safe:animate-pulse">
                    <div className="h-56 bg-[#E6E1D8]" />
                    <div className="space-y-4 p-6"><div className="h-4 w-1/3 rounded bg-[#E6E1D8]" /><div className="h-6 w-3/4 rounded bg-[#E6E1D8]" /><div className="h-12 rounded bg-[#F7F4EE]" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isLoading && error && (
            <div className="rounded-2xl border border-[#E6E1D8] bg-white px-6 py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-7 w-7 text-[#C2410C]" aria-hidden="true" />
              <h3 className="text-xl font-semibold">Chưa thể tải các hành trình</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5C645E]">Kết nối đang gặp gián đoạn. Bạn có thể thử lại để xem các cung đường.</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#1F4E43] underline underline-offset-4 hover:bg-[#F7F4EE] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F4E43] cursor-pointer"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Thử tải lại</button>
            </div>
          )}
          {!isLoading && !error && featuredTours.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D6CEBE] px-6 py-12 text-center">
              <Mountain className="mx-auto mb-4 h-8 w-8 text-[#1F4E43]" aria-hidden="true" />
              <h3 className="text-xl font-semibold">Những hành trình mới đang được chuẩn bị</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5C645E]">Hiện chưa có tour để khám phá. Hãy quay lại sau để chọn cung đường phù hợp với bạn.</p>
            </div>
          )}
          {!isLoading && !error && featuredTours.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {featuredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="prepare-heading" className="border-y border-[#E6E1D8] bg-[#F2EFE7]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1fr] lg:gap-20 lg:px-8">
          <figure className="overflow-hidden rounded-2xl">
            <img src={trailImg} alt="Những người trekking đi dọc sống núi xanh giữa tầng mây" loading="lazy" className="aspect-[4/3] w-full object-cover lg:aspect-[5/6]" />
          </figure>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2410C]">Đi xa, chuẩn bị từ những điều nhỏ</p>
            <h2 id="prepare-heading" className="max-w-lg font-editorial text-3xl font-bold leading-tight tracking-tight text-[#1F4E43] sm:text-4xl">Một chuyến đi đáng nhớ bắt đầu từ sự phù hợp.</h2>
            <p className="mt-5 text-base leading-7 text-[#5C645E]">Không cần chọn đỉnh núi cao nhất. Hãy chọn cung đường dành cho bạn, với thông tin rõ ràng trước mỗi bước chân.</p>
            <div className="mt-8 divide-y divide-[#D6CEBE]">
              {[
                { icon: Mountain, title: 'Hiểu cung đường trước khi đi', text: 'Xem độ khó, thời lượng và lịch trình để chọn chuyến đi phù hợp với thể lực.' },
                { icon: Backpack, title: 'Biết cần mang theo những gì', text: 'Đọc các dịch vụ và trang bị được bao gồm trong từng tour để chủ động chuẩn bị.' },
                { icon: ShieldCheck, title: 'Nắm rõ thông tin đặt chỗ', text: 'Kiểm tra lịch khởi hành, chi phí và chính sách hủy trước khi xác nhận hành trình.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 py-5 first:pt-0">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-[#1F4E43]" aria-hidden="true" />
                  <div><h3 className="text-base font-semibold text-[#1C2526]">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#5C645E]">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="steps-heading" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2410C]">Từ ý tưởng đến bước chân đầu tiên</p>
          <h2 id="steps-heading" className="font-editorial text-3xl font-bold tracking-tight text-[#1F4E43] sm:text-4xl">Lên kế hoạch. Rồi lên đường.</h2>
        </div>
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {[
            { title: 'Tìm cung đường', text: 'Lọc theo điểm đến, độ khó và thời lượng. Đọc lịch trình để tìm hành trình bạn muốn trải nghiệm.' },
            { title: 'Chọn ngày khởi hành', text: 'Xem các lịch còn chỗ và điền thông tin thành viên tham gia chuyến đi.' },
            { title: 'Xác nhận đặt chỗ', text: 'Kiểm tra chi phí, lựa chọn thanh toán và làm theo hướng dẫn để hoàn tất đặt tour.' },
            { title: 'Sẵn sàng lên đường', text: 'Theo dõi vé và thông tin chuyến đi trong tài khoản. Chuẩn bị hành trang cho ngày khởi hành.' },
          ].map((step, index) => (
            <li key={step.title} className="border-t border-[#D6CEBE] pt-5">
              <span className="font-mono-numbers text-sm font-semibold text-[#C2410C]">0{index + 1}</span>
              <h3 className="mt-5 text-lg font-semibold text-[#1F4E43]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#5C645E]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="cta-heading" className="bg-[#1F4E43] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D6CEBE]">Chuyến đi tiếp theo đang chờ</p>
            <h2 id="cta-heading" className="font-editorial text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Dành một khoảng trời cho chính mình.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#E6E1D8]">Bắt đầu từ một cung đường bạn yêu thích. Những trải nghiệm mới sẽ đến từ bước chân đầu tiên.</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4">
            <button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className={`${primaryAction} focus-visible:outline-white`}>Tìm chuyến đi của bạn <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
            {!isAuthenticated && <button type="button" onClick={() => navigateTo(ROUTES.AUTH.REGISTER)} className="min-h-11 rounded-md px-1 text-sm text-[#E6E1D8] underline decoration-white/40 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white cursor-pointer">Chưa có tài khoản? Đăng ký WeTrek</button>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
