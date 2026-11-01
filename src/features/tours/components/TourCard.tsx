import React from 'react';
import { Calendar, Mountain, ArrowRight, ImageOff } from 'lucide-react';
import { TourSummaryResponse } from '../types/tour.types';
import { Tour } from '../../../types/expedition';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface TourCardProps {
  tour: TourSummaryResponse | Tour;
  onBook?: (tour: any) => void;
  onViewDetails?: (tour: any) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MODERATE: 'Trung bình',
  HARD: 'Khó',
  EXPERT: 'Chuyên gia',
};

function isApiTour(t: TourSummaryResponse | Tour): t is TourSummaryResponse {
  return 'coverImageUrl' in t || typeof t.id === 'number';
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onViewDetails }) => {
  const apiMode = isApiTour(tour);

  const id = tour.id;
  const title = tour.title;
  const durationDays = tour.durationDays;
  const difficulty = tour.difficulty;
  const coverUrl = apiMode ? tour.coverImageUrl : (tour as Tour).image;

  const handleSelect = () => {
    if (onViewDetails) {
      onViewDetails(tour);
      return;
    }
    navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(id));
  };

  return (
    <article className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xl hover:border-[#D6CEBE] transition-all duration-300 group">
      <div>
        <div
          onClick={handleSelect}
          className="relative h-56 overflow-hidden bg-[#F2EFE9] cursor-pointer"
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#78716C] bg-gradient-to-br from-[#F7F4EE] to-[#E6E1D8]/60 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-white/80 border border-[#E6E1D8] flex items-center justify-center mb-2 text-[#1F4E43]">
                <Mountain className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
                Tuyến Trekking Thiên Nhiên
              </span>
              <span className="text-[11px] text-[#78716C] mt-0.5 flex items-center gap-1">
                <ImageOff className="w-3 h-3" /> Chưa cập nhật ảnh bìa
              </span>
            </div>
          )}

          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
            <StatusBadge difficulty={difficulty} size="sm" className="shadow-xs backdrop-blur-xs bg-white/95" />
          </div>

          <div className="absolute bottom-3 right-3 bg-[#1C2526]/85 backdrop-blur-xs text-white text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FFB59D]" />
            <span>
              {durationDays} ngày {durationDays > 1 ? `${durationDays - 1} đêm` : ''}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#1F4E43] mb-1.5">
            <span className="font-semibold">Trekking có tổ chức</span>
          </div>

          <h3
            onClick={handleSelect}
            className="font-editorial text-xl font-bold text-[#1C2526] line-clamp-2 mb-3 group-hover:text-[#C2410C] transition-colors cursor-pointer leading-snug"
          >
            {title}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#4A5568] bg-[#FDFBF7] p-3 rounded-xl border border-[#E6E1D8]/80">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#78716C] block">Thời lượng</span>
              <strong className="font-semibold text-[#1C2526]">
                {durationDays} Ngày {durationDays > 1 ? `/ ${durationDays - 1} Đêm` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#78716C] block">Cấp độ</span>
              <strong className="font-semibold text-[#1C2526]">
                {DIFFICULTY_LABELS[String(difficulty).toUpperCase()] || difficulty}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={handleSelect}
          className="w-full bg-[#1F4E43] hover:bg-[#15372F] text-white py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/40"
        >
          <span>Xem hành trình</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};
