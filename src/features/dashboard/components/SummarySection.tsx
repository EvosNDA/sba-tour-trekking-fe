import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Users,
  BookmarkCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  DashboardBasis,
  DashboardSummaryResponse,
  SummaryPeriod,
  DashboardTrendDirection,
} from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import {
  formatNumberVi,
  formatPercentVi,
  formatDateVi,
  addOneDay,
  getBookingCount,
  getPassengerCount,
} from './dashboardFormatters';

export interface SummarySectionProps {
  basis: DashboardBasis;
  refreshTrigger: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  basis,
  refreshTrigger,
}) => {
  const [period, setPeriod] = useState<SummaryPeriod>('THIS_MONTH');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    // Nếu chọn CUSTOM mà chưa điền đủ from / to thì chưa gọi
    if (period === 'CUSTOM' && (!customFrom || !customTo)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Backend to là exclusive: ngày kết thúc gửi lên cần +1 ngày
      const toExclusive = period === 'CUSTOM' && customTo ? addOneDay(customTo) : undefined;
      const res = await dashboardApi.getSummary({
        period,
        from: period === 'CUSTOM' ? customFrom : undefined,
        to: toExclusive,
        basis,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải tổng quan chỉ số.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [period, basis, refreshTrigger]);

  const renderTrendBadge = (
    pct: number | null | undefined,
    trend: DashboardTrendDirection | undefined,
    label: string
  ) => {
    if (trend === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
          <Sparkles className="w-3 h-3" /> Mới
        </span>
      );
    }
    if (pct === null || pct === undefined || !trend) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
          <Minus className="w-3 h-3" /> — ({label})
        </span>
      );
    }

    const isUp = trend === 'UP';
    const isDown = trend === 'DOWN';
    const colorClass = isUp
      ? 'text-emerald-700 bg-emerald-50'
      : isDown
      ? 'text-rose-700 bg-rose-50'
      : 'text-stone-600 bg-stone-100';

    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${colorClass}`}
        title={`So với ${label}`}
      >
        <Icon className="w-3 h-3" />
        {formatPercentVi(pct, { showPlus: true })}
        <span className="text-[10px] text-stone-500 font-normal">({label})</span>
      </span>
    );
  };

  return (
    <div className="mb-8">
      {/* Thanh điều khiển kỳ báo cáo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-editorial text-lg font-bold text-stone-900">
            Chỉ số hiệu quả tổng quan
          </h3>
          {data?.partial && (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
              Kỳ đang diễn ra
            </span>
          )}
          {data?.future && (
            <span className="text-[11px] font-medium text-sky-800 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full">
              Kỳ tương lai
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs">
            {(
              [
                ['TODAY', 'Hôm nay'],
                ['THIS_WEEK', 'Tuần này'],
                ['THIS_MONTH', 'Tháng này'],
                ['THIS_QUARTER', 'Quý này'],
                ['THIS_YEAR', 'Năm nay'],
                ['CUSTOM', 'Tùy chọn'],
              ] as const
            ).map(([pKey, pLabel]) => (
              <button
                key={pKey}
                type="button"
                onClick={() => setPeriod(pKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  period === pKey
                    ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {pLabel}
              </button>
            ))}
          </div>

          {/* Khoảng thời gian CUSTOM */}
          {period === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-stone-200">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              />
              <span className="text-stone-400">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
              />
              <button
                type="button"
                onClick={fetchSummary}
                className="px-2.5 py-1 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={fetchSummary}
        skeletonHeight="h-56"
      >
        {data && (
          <div className="space-y-4">
            {/* Hàng 1: Hai chỉ số chính - Số khách & Tỷ lệ hủy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thẻ Số khách hợp lệ */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                  <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    Lượng khách hợp lệ (Pax)
                  </span>
                  <span className="font-mono text-[11px] text-stone-400">
                    {formatDateVi(data.periodStart)} – {formatDateVi(data.periodEnd)}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 my-2">
                  <span className="font-editorial text-3xl font-bold text-stone-900">
                    {formatNumberVi(data.passengerCount?.passengerCount ?? 0)}
                  </span>
                  <span className="text-xs text-stone-500">khách</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                  {renderTrendBadge(
                    data.passengerCount?.previousPeriod?.changePercent,
                    data.passengerCount?.previousPeriod?.trend,
                    'kỳ trước'
                  )}
                  {renderTrendBadge(
                    data.passengerCount?.samePeriodLastYear?.changePercent,
                    data.passengerCount?.samePeriodLastYear?.trend,
                    'cùng kỳ năm ngoái'
                  )}
                </div>
              </div>

              {/* Thẻ Tỷ lệ hủy đơn */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                  <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Tỷ lệ hủy booking
                  </span>
                  <span className="font-mono text-[11px] text-stone-400">
                    {formatDateVi(data.periodStart)} – {formatDateVi(data.periodEnd)}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 my-2">
                  <span className="font-editorial text-3xl font-bold text-stone-900">
                    {formatPercentVi(data.cancellationRate?.value, { isRatio: true })}
                  </span>
                  <span className="text-xs text-stone-500">
                    ({formatNumberVi(getBookingCount(data.cancelled))} đơn đã hủy)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                  {renderTrendBadge(
                    data.cancellationRate?.previousPeriod?.changePercent,
                    data.cancellationRate?.previousPeriod?.trend,
                    'kỳ trước'
                  )}
                  {renderTrendBadge(
                    data.cancellationRate?.samePeriodLastYear?.changePercent,
                    data.cancellationRate?.samePeriodLastYear?.trend,
                    'cùng kỳ năm ngoái'
                  )}
                </div>
              </div>
            </div>

            {/* Hàng 2: Các trạng thái đơn đặt chỗ (6 thẻ nhỏ) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Tổng đơn */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-stone-500 flex items-center gap-1 mb-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-stone-600" /> Tổng đơn
                </div>
                <div className="text-xl font-bold font-editorial text-stone-900">
                  {formatNumberVi(data.totalBookings)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.totalBookings) > 0
                    ? `${formatNumberVi(getPassengerCount(data.totalBookings))} khách`
                    : 'toàn bộ đơn tạo'}
                </div>
              </div>

              {/* Đã xác nhận */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã xác nhận
                </div>
                <div className="text-xl font-bold font-editorial text-emerald-900">
                  {formatNumberVi(data.confirmed)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.confirmed) > 0
                    ? `${formatNumberVi(getPassengerCount(data.confirmed))} khách`
                    : 'đã cọc / thanh toán'}
                </div>
              </div>

              {/* Chờ thanh toán */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ thanh toán
                </div>
                <div className="text-xl font-bold font-editorial text-amber-900">
                  {formatNumberVi(data.pendingPayment)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.pendingPayment) > 0
                    ? `${formatNumberVi(getPassengerCount(data.pendingPayment))} khách`
                    : 'đang giữ chỗ'}
                </div>
              </div>

              {/* Hoàn tất */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-sky-700 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Hoàn tất
                </div>
                <div className="text-xl font-bold font-editorial text-sky-900">
                  {formatNumberVi(data.completed)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.completed) > 0
                    ? `${formatNumberVi(getPassengerCount(data.completed))} khách`
                    : 'tour đã kết thúc'}
                </div>
              </div>

              {/* Hết hạn giữ chỗ */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-stone-500 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-stone-400" /> Hết hạn
                </div>
                <div className="text-xl font-bold font-editorial text-stone-700">
                  {formatNumberVi(data.expired)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.expired) > 0
                    ? `${formatNumberVi(getPassengerCount(data.expired))} khách`
                    : 'quá 15p giữ chỗ'}
                </div>
              </div>

              {/* Đã hủy */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs">
                <div className="text-[11px] font-medium text-rose-700 flex items-center gap-1 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Đã hủy
                </div>
                <div className="text-xl font-bold font-editorial text-rose-900">
                  {formatNumberVi(data.cancelled)}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {getPassengerCount(data.cancelled) > 0
                    ? `${formatNumberVi(getPassengerCount(data.cancelled))} khách`
                    : 'khách hoặc admin hủy'}
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionStateWrapper>
    </div>
  );
};
