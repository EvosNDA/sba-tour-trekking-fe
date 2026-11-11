import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Backpack,
  CalendarDays,
  ChevronDown,
  Compass,
  Heart,
  Leaf,
  Map,
  Mountain,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { DIFFICULTY_OPTIONS, DifficultyLevel, TourSummaryResponse } from '../../../features/tours/types/tour.types';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../stores/auth.store';
import heroScrapbook from '../../../assets/images/home/hero-scrapbook.jpg';
import heroMountainDoodle from '../../../assets/images/home/hero-mountain-doodle-trim.png';
import journalPassport from '../../../assets/images/home/journal-passport.jpg';
import ctaPanorama from '../../../assets/images/home/cta-panorama.jpg';
import './home-page.css';

const howSteps = [
  { icon: Map, title: 'Chọn cung đường', body: 'Khám phá hành trình trekking phù hợp với thể lực và sở thích của bạn.' },
  { icon: CalendarDays, title: 'Đặt chỗ online', body: 'Chọn ngày khởi hành, kiểm tra chỗ trống và giữ chỗ trực tuyến.' },
  { icon: Backpack, title: 'Chuẩn bị lên đường', body: 'Theo dõi thông tin chuyến đi và chuẩn bị hành trang cần thiết.' },
];

const trustItems = [
  { icon: ShieldCheck, title: 'An toàn', body: 'Đội ngũ đồng hành' },
  { icon: UsersRound, title: 'Hướng dẫn viên', body: 'Am hiểu cung đường' },
  { icon: Heart, title: 'Cộng đồng', body: 'Chia sẻ trải nghiệm' },
  { icon: Leaf, title: 'Vì thiên nhiên', body: 'Tôn trọng môi trường' },
];

const difficultyLabel = (value: DifficultyLevel) =>
  DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const HomePage: React.FC = () => {
  const { account, user, xRole, isAuthenticated, isInitializing } = useAuthStore();
  const isAdmin = isAuthenticated && (xRole === 'ADMIN' || user?.role === 'admin' || account?.roles?.some((role) => role.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'));
  const isGuide = isAuthenticated && (xRole === 'GUIDE' || user?.role === 'guide' || account?.roles?.some((role) => role.toUpperCase().replace(/^ROLE_/, '') === 'GUIDE'));
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('');
  const [durationDays, setDurationDays] = useState('');
  const [tours, setTours] = useState<TourSummaryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (isAdmin || isGuide) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    toursApi.listTours({ page: 0, size: 6 }, controller.signal)
      .then((page) => {
        const published = (page.content ?? []).filter((tour) => tour.status === 'PUBLISHED');
        setTours(published);
        setTotal(page.totalElements ?? published.length);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách cung đường.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isAdmin, isGuide, reload]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (difficulty) params.set('difficulty', difficulty);
    if (durationDays) params.set('durationDays', durationDays);
    const search = params.toString();
    navigateTo(`${ROUTES.PUBLIC.TOURS}${search ? `?${search}` : ''}`);
  };

  if (!isInitializing && (isAdmin || isGuide)) return null;

  return (
    <div className="wetrek-home">
      <section className="home-hero">
        <div className="home-hero-paper" />
        <div className="home-hero-collage">
          <img src={heroScrapbook} alt="Hộ chiếu trekking trên bản đồ hành trình" />
        </div>
        <div className="home-hero-copy">
          <p className="home-eyebrow">Thu thập dấu mốc · chinh phục cung đường</p>
          <h1>Sưu tập<br />hành trình Việt Nam</h1>
          <p className="home-hero-description">Mỗi cung đường là một dấu mốc. Mở chuyến đi mới, khám phá, trải nghiệm và hoàn thành bộ sưu tập trekking của riêng bạn.</p>
          <button className="home-button home-button-forest" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}>
            Khám phá tất cả cung đường <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <img className="home-hero-note-slot" src={heroMountainDoodle} alt="" aria-hidden="true" />
        <p className="home-hero-note" aria-hidden="true">Đi để<br />lưu giữ<br />dấu mốc<br />đẹp nhất</p>
      </section>

      <section className="home-routes" id="featured-routes">
        <div className="home-section-heading">
          <div><h2>Những cung đường nổi bật</h2><span className="home-route-count">{total} hành trình</span></div>
          <button className="home-text-link" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}>Xem tất cả <ArrowRight size={14} /></button>
        </div>
        {loading ? <div className="home-tour-grid" aria-label="Đang tải cung đường">{Array.from({ length: 6 }, (_, i) => <div key={i} className="home-tour-skeleton" />)}</div> : null}
        {error ? <div className="home-state"><p>{error}</p><button className="home-text-link" onClick={() => setReload((value) => value + 1)}>Tải lại <ArrowRight size={14} /></button></div> : null}
        {!loading && !error && tours.length === 0 ? <div className="home-state home-state-empty">Chưa có cung đường được xuất bản.</div> : null}
        {!loading && !error && tours.length > 0 ? (
          <div className="home-tour-grid">
            {tours.map((tour) => (
              <button key={tour.id} className="home-tour-card" onClick={() => navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(tour.id))}>
                <div className="home-tour-image">{tour.coverImageUrl ? <img src={tour.coverImageUrl} alt={tour.title} /> : null}</div>
                <div className="home-tour-details">
                  <h3>{tour.title}</h3>
                  <p><Mountain size={12} aria-hidden="true" /> {difficultyLabel(tour.difficulty)}</p>
                  <p><CalendarDays size={12} aria-hidden="true" /> {tour.durationDays} ngày{tour.durationDays > 1 ? ` / ${tour.durationDays - 1} đêm` : ''}</p>
                  <span className="home-tour-open" aria-hidden="true"><ArrowRight size={13} /></span>
                  <span className="home-tour-seal" aria-hidden="true"><Compass size={16} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <form className="home-search" onSubmit={submitSearch} aria-label="Tìm kiếm cung đường trekking">
          <label className="home-search-field home-search-keyword"><span><Search size={14} /> Tìm cung đường</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nhập cung đường, điểm đến, tỉnh, thành..." /></label>
          <label className="home-search-field"><span><Mountain size={14} /> Độ khó</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyLevel | '')}><option value="">Mọi cấp độ</option>{DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></label>
          <label className="home-search-field"><span><CalendarDays size={14} /> Thời gian</span><select value={durationDays} onChange={(event) => setDurationDays(event.target.value)}><option value="">Tất cả</option>{[1, 2, 3, 4, 5].map((days) => <option key={days} value={days}>{days} ngày</option>)}</select><ChevronDown size={14} /></label>
          <button className="home-button home-button-forest home-search-submit" type="submit"><Search size={15} /> Tìm kiếm</button>
        </form>
      </section>

      <section className="home-process" id="how-it-works">
        <h2>Một hành trình, ba dấu mốc</h2><p className="home-process-subtitle">Đơn giản, minh bạch, sẵn sàng cho những trải nghiệm tuyệt vời.</p>
        <div className="home-process-grid">{howSteps.map(({ icon: Icon, title, body }, index) => <article className="home-process-step" key={title}><span className="home-step-number">{index + 1}</span><Icon className="home-step-icon" size={25} /><h3>{title}</h3><p>{body}</p>{index < howSteps.length - 1 ? <ArrowRight className="home-step-arrow" size={16} aria-hidden="true" /> : null}</article>)}</div>
      </section>

      <section className="home-journal">
        <div className="home-journal-images">
          <img className="home-journal-collage-img" src={journalPassport} alt="Sổ hành trình cùng những khoảnh khắc trekking" />
        </div>
        <div className="home-journal-copy"><p className="home-eyebrow">Nhật ký hành trình · Niềm tin từ cộng đồng</p><h2>Nhật ký hành trình – Niềm tin từ cộng đồng</h2><p>Mỗi chuyến đi được chuẩn bị chu đáo để trở thành kỷ niệm đáng nhớ, từ trang sổ đầu tiên đến dấu mốc cuối cùng.</p><div className="home-trust-grid">{trustItems.map(({ icon: Icon, title, body }) => <div key={title}><Icon size={20} /><strong>{title}</strong><span>{body}</span></div>)}</div></div>
      </section>

      <section className="home-closing">
        <img className="home-closing-image" src={ctaPanorama} alt="Người trekking ngắm bình minh trên dãy núi" />
        <div><p className="home-eyebrow">Dấu mốc tiếp theo đang chờ bạn</p><h2>Bắt đầu hành trình<br />của riêng bạn</h2><p>Chọn một cung đường mới và viết tiếp cuốn hộ chiếu trekking của bạn.</p><button className="home-button home-button-light" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}>Khám phá ngay <ArrowRight size={14} /></button></div>
      </section>
    </div>
  );
};

export default HomePage;
