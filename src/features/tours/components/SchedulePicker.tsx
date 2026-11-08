import React from 'react';
import {
  ScheduleSummaryResponse,
  ScheduleDetailResponse,
  ScheduleAvailabilityResponse,
} from '../types/tour.types';
import { AvailabilityBadge } from './AvailabilityBadge';
import { formatDateTime, formatVND, formatDate, formatTimeOnly } from '../../../lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Percent,
  CheckCircle2,
  ArrowRight,
  Lock,
  RefreshCw,
} from 'lucide-react';

export interface EnrichedScheduleItem {
  summary: ScheduleSummaryResponse;
  detail?: ScheduleDetailResponse;
  availability?: ScheduleAvailabilityResponse;
  availabilityError?: string;
  isLoadingAvailability?: boolean;
}

export interface SchedulePickerProps {
  schedules: EnrichedScheduleItem[];
  durationDays: number;
  selectedScheduleId?: number | null;
  isAuthenticated: boolean;
  onSelectSchedule: (item: EnrichedScheduleItem) => void;
  onRefreshAvailability?: () => void;
  isRefreshing?: boolean;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  schedules,
  durationDays,
  selectedScheduleId,
  isAuthenticated,
  onSelectSchedule,
  onRefreshAvailability,
  isRefreshing = false,
}) => {
  if (schedules.length === 0) {
    return (
      <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 text-center space-y-2">
        <Calendar className="w-8 h-8 text-[#78716C] mx-auto" />
        <h4 className="font-editorial text-lg font-bold text-[#1C2526]">
          Chưa có lịch khởi hành sắp tới
        </h4>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">
          Tuyến trekking này hiện chưa mở lịch khởi hành mới. Vui lòng quay lại sau hoặc khám phá các hành trình khác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#1F4E43] font-semibold block">
            LỊCH KHỞI HÀNH SẮP TỚI (GIỜ VIỆT NAM)
          </span>
          <p className="text-xs text-[#64748B]">
            Chọn ngày khởi hành phù hợp để giữ chỗ trong 15 phút và tiến hành đặt cọc.
          </p>
        </div>
        {onRefreshAvailability && (
          <button
            type="button"
            onClick={onRefreshAvailability}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F4E43] bg-[#F7F4EE] hover:bg-[#EFECE4] border border-[#E6E1D8] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Cập nhật chỗ trống</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {schedules.map((item) => {
          const { summary, detail, availability, isLoadingAvailability } = item;
          const isSelected = selectedScheduleId === summary.id;
          const depositPercent = detail?.depositPercent ?? 30;
          const basePrice = detail?.basePriceVnd ?? summary.basePriceVnd;

          // Availability API is the single source of truth when available.
          // If unauthenticated and availability endpoint returned 401, we still allow the user to click
          // "Chọn lịch này" to log in and verify real-time availability on the booking wizard.
          const hasApiAvailability = availability !== undefined;
          const availableSeats = availability?.availableSeats;
          const bookable = availability?.bookable;

          const canBookWhenAuthed = hasApiAvailability && bookable === true && (availableSeats ?? 0) > 0;
          const canProceedToLogin = !isAuthenticated && summary.status === 'SCHEDULED';
          const isActionEnabled = isAuthenticated ? canBookWhenAuthed : canProceedToLogin;

          return (
            <div
              key={summary.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                isSelected
                  ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-md'
                  : 'border-[#E6E1D8] hover:border-[#C2410C]/60 shadow-xs'
              }`}
            >
              {/* Top row: Status Badge & Duration */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E6E1D8]/70 pb-3">
                <AvailabilityBadge
                  availableSeats={availableSeats}
                  capacity={availability?.capacity ?? summary.capacity}
                  bookable={bookable}
                  isLoading={isLoadingAvailability}
                  size="md"
                />

                <span className="text-xs text-stone-500 font-medium">
                  Hành trình {durationDays} ngày {durationDays > 1 ? `${durationDays - 1} đêm` : ''}
                </span>
              </div>

              {/* Date & Time Block */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E6E1D8]">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Khởi hành</span>
                  </span>
                  <div className="font-mono text-base font-bold text-stone-900 leading-tight">
                    {formatTimeOnly(summary.startsAt)}
                  </div>
                  <div className="text-xs text-stone-600 font-medium">
                    {formatDate(summary.startsAt)}
                  </div>
                </div>

                <div className="space-y-1 border-l border-[#E6E1D8] pl-3">
                  <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1F4E43]" />
                    <span>Kết thúc</span>
                  </span>
                  <div className="font-mono text-base font-bold text-stone-900 leading-tight">
                    {formatTimeOnly(summary.endsAt)}
                  </div>
                  <div className="text-xs text-stone-600 font-medium">
                    {formatDate(summary.endsAt)}
                  </div>
                </div>
              </div>

              {/* Logistics: Meeting Point & Balance Due */}
              {(detail?.meetingPoint || detail?.balanceDueAt) && (
                <div className="space-y-1.5 text-xs text-stone-600 pt-0.5">
                  {detail.meetingPoint && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1F4E43] shrink-0 mt-0.5" />
                      <span>
                        Điểm đón: <strong className="text-stone-900">{detail.meetingPoint}</strong>
                      </span>
                    </div>
                  )}
                  {detail.balanceDueAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        Hạn thanh toán: <strong className="font-mono text-stone-900">{formatDateTime(detail.balanceDueAt)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price & Action Row */}
              <div className="pt-3.5 border-t border-[#E6E1D8] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block leading-none">
                    Giá trọn gói / khách
                  </span>
                  <div className="font-editorial text-2xl font-bold text-[#C2410C] font-mono leading-tight mt-1">
                    {formatVND(basePrice)}
                  </div>
                  <span className="text-xs text-[#1F4E43] font-medium block mt-0.5">
                    Đặt cọc {depositPercent}%: <strong className="font-mono">{formatVND(Math.round((basePrice * depositPercent) / 100))}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!isActionEnabled || isLoadingAvailability}
                  onClick={() => onSelectSchedule(item)}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 ${
                    isSelected
                      ? 'bg-[#1F4E43] text-white shadow-sm'
                      : isActionEnabled
                      ? 'bg-[#C2410C] hover:bg-[#9B2F00] text-white'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isAuthenticated ? (
                    canBookWhenAuthed ? (
                      <>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        <span>{isSelected ? 'Đã chọn lịch' : 'Chọn lịch này'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <span>Không còn chỗ</span>
                    )
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Chọn lịch này</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
