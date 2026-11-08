import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, Calendar, ArrowRight } from 'lucide-react';
import {
  DashboardBasis,
  DashboardGranularity,
  BookingTrendResponse,
} from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { BarLineChart, ChartSeries } from './charts/BarLineChart';
import { formatNumberVi, addOneDay } from './dashboardFormatters';

export interface TrendSectionProps {
  basis: DashboardBasis;
  tourId: number | undefined;
  refreshTrigger: number;
}

export const TrendSection: React.FC<TrendSectionProps> = ({
  basis,
  tourId,
  refreshTrigger,
}) => {
  const [granularity, setGranularity] = useState<DashboardGranularity>('MONTH');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMetric, setViewMetric] = useState<'passengers' | 'bookings'>('passengers');

  const [data, setData] = useState<BookingTrendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = async () => {
    // Chỉ gửi from/to nếu cả 2 cùng có
    const hasBoth = Boolean(fromDate && toDate);
    const hasNeither = !fromDate && !toDate;
    if (!hasBoth && !hasNeither) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getBookingTrend({
        granularity,
        from: hasBoth ? fromDate : undefined,
        to: hasBoth ? addOneDay(toDate) : undefined,
        basis,
        tourId,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải biểu đồ xu hướng đặt chỗ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrend();
  }, [granularity, basis, tourId, refreshTrigger]);

  // Chuẩn bị categories và data cho BarLineChart
  const categories = data?.points.map((p) => p.periodLabel || p.periodKey) || [];

  // Đồng bộ Series và Legend:
  // - Cột xanh Emerald: "Lượng khách" (nếu viewMetric === 'passengers') hoặc "Số đơn đặt" (nếu viewMetric === 'bookings')
  // - Đường đỏ Rose: "Đơn đã hủy" (cancelledCount)
  const chartSeries: ChartSeries[] = [
    {
      key: viewMetric === 'passengers' ? 'passengerCount' : 'bookingCount',
      name: viewMetric === 'passengers' ? 'Lượng khách' : 'Số đơn đặt',
      type: 'bar',
      color: '#047857', // Emerald-700
    },
    {
      key: 'cancelledCount',
      name: 'Đơn đã hủy',
      type: 'line',
      color: '#E11D48', // Rose-600
    },
  ];

  const chartData =
    data?.points.map((p) => ({
      passengerCount: p.passengerCount,
      bookingCount: p.bookingCount,
      cancelledCount: p.cancelledCount,
    })) || [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 mb-8 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-emerald-800" />
            Biểu đồ xu hướng lượng khách & đơn đặt
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Theo dõi khối lượng khách thực tế và số lượt đơn hủy qua các mốc thời gian
          </p>
        </div>

        {/* Các nút chọn granularity & Metric */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn xem theo Khách hay Đơn */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMetric('passengers')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMetric === 'passengers'
                  ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lượng khách (Pax)
            </button>
            <button
              type="button"
              onClick={() => setViewMetric('bookings')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMetric === 'bookings'
                  ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Số đơn đặt
            </button>
          </div>

          {/* Chọn granularity */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs">
            {(
              [
                ['WEEK', 'Tuần'],
                ['MONTH', 'Tháng'],
                ['QUARTER', 'Quý'],
                ['YEAR', 'Năm'],
              ] as const
            ).map(([gKey, gLabel]) => (
              <button
                key={gKey}
                type="button"
                onClick={() => setGranularity(gKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  granularity === gKey
                    ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {gLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lọc khoảng ngày tùy chọn */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 mb-5">
        <div className="flex items-center gap-2 text-stone-600">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>Khoảng ngày tùy chọn (bỏ trống để lấy theo mặc định backend):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2 py-1">
            <span className="text-[11px] text-stone-400 font-medium">Từ ngày:</span>
            <input
              type="date"
              lang="vi"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-stone-700 text-xs focus:outline-hidden"
            />
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2 py-1">
            <span className="text-[11px] text-stone-400 font-medium">Đến ngày:</span>
            <input
              type="date"
              lang="vi"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              className="bg-transparent text-stone-700 text-xs focus:outline-hidden"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="px-2 py-1 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
            >
              Xóa
            </button>
          )}
          <button
            type="button"
            onClick={fetchTrend}
            className="px-3 py-1 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>

      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={fetchTrend}
        skeletonHeight="h-72"
      >
        <BarLineChart
          categories={categories}
          series={chartSeries}
          data={chartData}
          height={320}
          emptyMessage="Không tìm thấy dữ liệu điểm xu hướng nào trong khoảng này."
          formatValue={(val, key) =>
            val !== null && val !== undefined
              ? `${formatNumberVi(val)} ${key === 'cancelledCount' ? 'đơn hủy' : viewMetric === 'passengers' ? 'khách' : 'đơn'}`
              : '—'
          }
        />
      </SectionStateWrapper>
    </div>
  );
};
