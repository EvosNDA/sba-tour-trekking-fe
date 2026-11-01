import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Compass,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type {
  TourDetailResponse,
} from '../../../features/tours/types/tour.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

// Subcomponents
import { TourNavTabs, NavTabItem } from '../../../features/tours/components/detail/TourNavTabs';
import { TourGallery } from '../../../features/tours/components/detail/TourGallery';
import { TourItinerary } from '../../../features/tours/components/detail/TourItinerary';
import type { ItineraryDay } from '../../../features/tours/components/detail/TourItinerary';
import { apiClient } from '../../../lib/axios';
import { TourDifficultySection } from '../../../features/tours/components/detail/TourDifficultySection';
import { TourServicesSection } from '../../../features/tours/components/detail/TourServicesSection';
import { TourPoliciesSection } from '../../../features/tours/components/detail/TourPoliciesSection';
import { TourBookingFrame } from '../../../features/tours/components/detail/TourBookingFrame';

export interface TourDetailPageProps {
  tourId?: string | number;
  onBookTour?: (tour: any) => void;
  onNavigate?: (screen: any) => void;
}

const NAV_TABS: NavTabItem[] = [
  { id: 'tong-quan', label: 'Chi tiết tour' },
  { id: 'lich-trinh', label: 'Lịch trình' },
  { id: 'thu-vien-anh', label: 'Thư viện ảnh' },
  { id: 'do-kho', label: 'Độ khó' },
  { id: 'dich-vu', label: 'Dịch vụ' },
  { id: 'chinh-sach', label: 'Chính sách & lưu ý' },
];

export const TourDetailPage: React.FC<TourDetailPageProps> = ({ tourId: propTourId }) => {
  // Extract tourId from props or URL path `/tours/:tourId`
  const resolvedTourId = (() => {
    if (propTourId !== undefined && propTourId !== '') return Number(propTourId);
    const match = window.location.pathname.match(/^\/tours\/(\d+)/);
    return match ? Number(match[1]) : 0;
  })();

  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [activities, setActivities] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Active section for sticky sub-nav
  const [activeTabId, setActiveTabId] = useState<string>('tong-quan');

  const fetchActivities = useCallback(async (tId: number) => {
    setIsLoadingActivities(true);
    setActivitiesError(null);
    try {
      const acts = await apiClient.get<ItineraryDay[]>(`/api/v1/tours/${tId}/itinerary`);
      setActivities(acts || []);
    } catch (err: any) {
      setActivitiesError(err?.message || 'Không thể tải lịch trình chi tiết.');
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    if (!resolvedTourId || isNaN(resolvedTourId)) {
      setError('Mã hành trình không hợp lệ.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    Promise.all([
      toursApi.getTourDetail(resolvedTourId, controller.signal),
      apiClient.get<ItineraryDay[]>(`/api/v1/tours/${resolvedTourId}/itinerary`, { signal: controller.signal }).catch((err) => {
        if (err?.name === 'AbortError') throw err;
        setActivitiesError('Không thể tải lịch trình chi tiết.');
        return [];
      }),
    ])
      .then(([tourDetail, acts]) => {
        if (controller.signal.aborted) return;
        setTour(tourDetail);
        setActivities(acts || []);
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Không thể tải thông tin chi tiết tour.');
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [resolvedTourId, reloadKey]);

  // Handle smooth scroll when clicking sub-nav tabs
  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      const yOffset = -80; // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Scroll to booking frame on mobile
  const handleScrollToBooking = () => {
    const frame = document.getElementById('khung-dat-tour');
    if (frame) {
      frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-40" />
        <div className="h-96 bg-stone-200 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-10 bg-stone-200 rounded w-3/4" />
            <div className="h-40 bg-stone-100 rounded-3xl" />
            <div className="h-60 bg-stone-100 rounded-3xl" />
          </div>
          <div className="lg:col-span-4 h-96 bg-stone-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
          Không tìm thấy thông tin hành trình
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
          {error || 'Tuyến tour này không tồn tại hoặc chưa được xuất bản.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E6E1D8] bg-white hover:bg-[#F7F4EE] text-[#1C2526] cursor-pointer"
          >
            &larr; Quay lại danh sách tour
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1F4E43] text-white hover:bg-[#15372F] cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 xl:px-12 py-6 space-y-8">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2D3748] hover:text-[#C2410C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hành trình</span>
        </button>
      </div>

      {/* Tour Title & Essential Meta Badges */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge difficulty={tour.difficulty} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F7F4EE] text-[#1C2526] border border-[#E6E1D8]">
            <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>
              Thời lượng: {tour.durationDays} ngày{' '}
              {tour.durationDays > 1 ? `${tour.durationDays - 1} đêm` : ''}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#B9EADB]/40 text-[#1F4E43] border border-[#88D4BC]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Giữ chỗ tự động 15 phút</span>
          </span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C2526] leading-tight">
          {tour.title}
        </h1>
      </header>

      {/* Sticky Sub-navigation tabs */}
      <TourNavTabs
        tabs={NAV_TABS}
        activeId={activeTabId}
        onSelectTab={handleSelectTab}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:grid-cols-[minmax(0,1fr)_380px] gap-8 xl:gap-12 items-start">
        {/* Left Column (8 cols): Tour Content Sections */}
        <div className="min-w-0 space-y-10">
          {/* Section 1: Overview & Description */}
          <section id="tong-quan" className="scroll-mt-24 space-y-4">
            <div className="bg-white border border-[#E6E1D8] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="font-editorial text-2xl font-bold text-[#1C2526] flex items-center gap-2">
                <Compass className="w-6 h-6 text-[#C2410C]" />
                <span>Giới thiệu cung đường</span>
              </h2>
              <div className="text-sm sm:text-base text-[#2D3748] leading-relaxed whitespace-pre-line">
                {tour.description || 'Thông tin mô tả chi tiết cho hành trình này đang được ban tổ chức hoàn thiện.'}
              </div>
            </div>
          </section>

          {/* Section 2: Itinerary */}
          <section id="lich-trinh" className="scroll-mt-24">
            <TourItinerary
              days={activities}
              isLoading={isLoadingActivities}
              error={activitiesError}
              onRetry={() => fetchActivities(tour.id)}
            />
          </section>

          {/* Section 3: Media Gallery */}
          <section id="thu-vien-anh" className="scroll-mt-24 space-y-4">
            <div className="bg-white border border-[#E6E1D8] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
              <div className="pb-3 border-b border-[#E6E1D8]">
                <h3 className="font-editorial text-2xl font-bold text-[#1C2526]">
                  Thư viện hình ảnh & video thực địa
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Hình ảnh thực tế cung đường được ghi nhận bởi đội ngũ hướng dẫn viên WeTrek.
                </p>
              </div>

              <TourGallery media={tour.media || []} tourTitle={tour.title} />
            </div>
          </section>

          {/* Section 4: Difficulty Meter */}
          <section id="do-kho" className="scroll-mt-24">
            <TourDifficultySection
              difficulty={tour.difficulty}
              requiredExperience={tour.requiredExperience}
            />
          </section>

          {/* Section 5: Included / Excluded Services */}
          <section id="dich-vu" className="scroll-mt-24">
            <TourServicesSection
              includedServices={tour.includedServices}
              excludedServices={tour.excludedServices}
              routeFileUrl={tour.routeFileUrl}
            />
          </section>

          {/* Section 6: Policies & Notes */}
          <section id="chinh-sach" className="scroll-mt-24">
            <TourPoliciesSection tourId={tour.id} />
          </section>
        </div>

        {/* Right Column (4 cols): Sticky Booking Frame on Desktop */}
        <aside className="min-w-0 lg:sticky lg:top-20 space-y-4">
          <TourBookingFrame
            tourId={tour.id}
            tourTitle={tour.title}
            durationDays={tour.durationDays}
          />
        </aside>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E1D8] px-4 py-3 shadow-lg flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
            Đặt tour ngay
          </div>
          <div className="font-bold text-xs text-[#1C2526] truncate max-w-[180px]">
            {tour.title}
          </div>
        </div>

        <button
          type="button"
          onClick={handleScrollToBooking}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1F4E43] text-white shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span>Xem ngày khởi hành</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TourDetailPage;
