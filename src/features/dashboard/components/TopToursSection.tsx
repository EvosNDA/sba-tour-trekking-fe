import React, { useState, useEffect } from 'react';
import { Award, Calendar, ArrowRight } from 'lucide-react';
import { DashboardBasis, TopToursResponse } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { HorizontalBarChart } from './charts/HorizontalBarChart';
import { addOneDay } from './dashboardFormatters';

export interface TopToursSectionProps {
  basis: DashboardBasis;
  refreshTrigger: number;
}

export const TopToursSection: React.FC<TopToursSectionProps> = ({
  basis,
  refreshTrigger,
}) => {
  const [limit, setLimit] = useState<number>(10);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [viewMetric, setViewMetric] = useState<'passengers' | 'bookings'>('passengers');

  const [data, setData] = useState<TopToursResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopTours = async () => {
    // from & to phải cùng có hoặc cùng bỏ
    const hasBoth = Boolean(fromDate && toDate);
    const hasNeither = !fromDate && !toDate;
    if (!hasBoth && !hasNeither) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTopTours({
        limit,
        from: hasBoth ? fromDate : undefined,
        to: hasBoth ? addOneDay(toDate) : undefined,
        basis,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách top tour.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTours();
  }, [limit, basis, refreshTrigger]);

  const chartItems =
    data?.tours.map((t) => ({
      id: t.tourId,
      label: t.tourName,
      value: viewMetric === 'passengers' ? t.passengerCount : t.bookingCount,
      share: t.share,
    })) || [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 mb-8 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Top tour dẫn đầu về thị phần
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Xếp hạng các tuyến trekking có lượng khách và lượt đặt cao nhất
          </p>
        </div>

        {/* Nút chuyển đổi Metric & Giới hạn Limit */}
        <div className="flex flex-wrap items-center gap-2">
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
              Theo lượng khách
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
              Theo số đơn đặt
            </button>
          </div>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-medium text-stone-700"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
        </div>
      </div>

      {/* Lọc khoảng ngày tùy chọn */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 mb-5">
        <div className="flex items-center gap-2 text-stone-600">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>Khoảng ngày (mặc định 30 ngày gần nhất):</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-700 text-xs"
          />
          <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-700 text-xs"
          />
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
            onClick={fetchTopTours}
            className="px-3 py-1 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Lọc
          </button>
        </div>
      </div>

      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={fetchTopTours}
        skeletonHeight="h-64"
      >
        <HorizontalBarChart
          items={chartItems}
          metricLabel={viewMetric === 'passengers' ? 'khách' : 'đơn'}
        />
      </SectionStateWrapper>
    </div>
  );
};
