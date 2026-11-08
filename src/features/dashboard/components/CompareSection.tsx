import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  DashboardBasis,
  DashboardGranularity,
  BookingCompareResponse,
  DashboardTrendDirection,
} from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { BarLineChart, ChartSeries } from './charts/BarLineChart';
import { formatNumberVi, formatPercentVi } from './dashboardFormatters';

export interface CompareSectionProps {
  basis: DashboardBasis;
  tourId: number | undefined;
  refreshTrigger: number;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CompareSection: React.FC<CompareSectionProps> = ({
  basis,
  tourId,
  refreshTrigger,
}) => {
  const currentYear = new Date().getFullYear();
  const [granularity, setGranularity] = useState<DashboardGranularity>('MONTH');
  const [baseYear, setBaseYear] = useState<number>(currentYear);
  const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // rỗng = cả 12 tháng
  const [viewMetric, setViewMetric] = useState<'passengers' | 'bookings'>('passengers');

  const [data, setData] = useState<BookingCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Chuỗi query param months: vd "10,11" hoặc undefined
  const monthsParam =
    granularity === 'MONTH' && selectedMonths.length > 0 && selectedMonths.length < 12
      ? [...selectedMonths].sort((a, b) => a - b).join(',')
      : undefined;

  const fetchCompare = async () => {
    if (baseYear === compareYear) {
      setValidationError('Năm gốc và năm so sánh không được trùng nhau.');
      return;
    }
    setValidationError(null);
    setIsLoading(true);
    setError(null);

    try {
      const res = await dashboardApi.getBookingCompare({
        granularity,
        baseYear,
        compareYear,
        months: monthsParam,
        basis,
        tourId,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải so sánh cùng kỳ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompare();
  }, [granularity, baseYear, compareYear, monthsParam, basis, tourId, refreshTrigger]);

  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) => {
      if (prev.includes(m)) {
        return prev.filter((item) => item !== m);
      }
      return [...prev, m];
    });
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths(ALL_MONTHS);
  };

  const handleClearMonths = () => {
    setSelectedMonths([]);
  };

  const renderTrendBadge = (
    pct: number | null | undefined,
    trend: DashboardTrendDirection | undefined
  ) => {
    if (trend === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
          <Sparkles className="w-3 h-3" /> Mới
        </span>
      );
    }
    if (pct === null || pct === undefined || !trend) {
      return <span className="text-stone-400 font-mono text-xs">—</span>;
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
      >
        <Icon className="w-3 h-3" />
        {formatPercentVi(pct, { showPlus: true })}
      </span>
    );
  };

  // Chuẩn bị series chart cho 2 năm cạnh nhau
  const chartSeries: ChartSeries[] = [
    {
      key: 'baseValue',
      name: `Năm ${baseYear}`,
      type: 'bar',
      color: '#047857', // Emerald-700
    },
    {
      key: 'compareValue',
      name: `Năm ${compareYear}`,
      type: 'bar',
      color: '#94A3B8', // Slate-400
    },
  ];

  const categories = data?.rows.map((r) => r.period) || [];
  const chartData =
    data?.rows.map((r) => ({
      baseValue:
        viewMetric === 'passengers'
          ? r.baseValue.passengerCount
          : r.baseValue.bookingCount,
      compareValue:
        viewMetric === 'passengers'
          ? r.compareValue.passengerCount
          : r.compareValue.bookingCount,
    })) || [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 mb-8 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-800" />
            So sánh tăng trưởng cùng kỳ
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            So sánh số lượng đặt chỗ và hành khách giữa hai năm tài chính
          </p>
        </div>

        {/* Thanh chọn tham số */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric */}
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
              Khách
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
              Đơn
            </button>
          </div>

          {/* Granularity */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs">
            {(
              [
                ['MONTH', 'Tháng'],
                ['QUARTER', 'Quý'],
                ['WEEK', 'Tuần'],
                ['YEAR', 'Cả năm'],
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

          {/* Chọn 2 năm */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-500">Năm gốc:</span>
            <input
              type="number"
              min={1970}
              max={2100}
              value={baseYear}
              onChange={(e) => setBaseYear(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-mono text-xs"
            />
            <span className="text-stone-500">vs</span>
            <input
              type="number"
              min={1970}
              max={2100}
              value={compareYear}
              onChange={(e) => setCompareYear(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Multi-select Tháng dạng Chip Toggle Grid 6 cột */}
      {granularity === 'MONTH' && (
        <div className="mb-5 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/70">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="font-medium text-stone-700">
              Lọc các tháng muốn so sánh:
              {selectedMonths.length > 0 && selectedMonths.length < 12 ? (
                <span className="ml-1.5 text-emerald-800 font-semibold">
                  (Đang chọn {selectedMonths.length} tháng)
                </span>
              ) : (
                <span className="ml-1.5 text-stone-400 font-normal">
                  (Mặc định cả 12 tháng)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllMonths}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-medium cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={handleClearMonths}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {ALL_MONTHS.map((m) => {
              const isSelected = selectedMonths.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-semibold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100/70'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  Tháng {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={fetchCompare}
        skeletonHeight="h-80"
      >
        {data && (
          <div className="space-y-6">
            {/* Box Summary toàn kỳ so sánh */}
            {data.summary && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Tổng kết toàn bộ kỳ so sánh
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-xl font-bold font-editorial text-stone-900">
                      Năm {baseYear}:{' '}
                      {formatNumberVi(
                        viewMetric === 'passengers'
                          ? data.summary.baseValue.passengerCount
                          : data.summary.baseValue.bookingCount
                      )}
                    </span>
                    <span className="text-xs text-stone-400">/</span>
                    <span className="text-sm font-medium text-stone-600">
                      Năm {compareYear}:{' '}
                      {formatNumberVi(
                        viewMetric === 'passengers'
                          ? data.summary.compareValue.passengerCount
                          : data.summary.compareValue.bookingCount
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] text-stone-400">Chênh lệch (Delta)</div>
                    <div className="font-mono text-xs font-bold text-stone-800">
                      {formatNumberVi(
                        viewMetric === 'passengers'
                          ? data.summary.delta.passengerCount
                          : data.summary.delta.bookingCount
                      )}{' '}
                      {viewMetric === 'passengers' ? 'khách' : 'đơn'}
                    </div>
                  </div>
                  <div>
                    {renderTrendBadge(
                      data.summary.changePercent,
                      data.summary.trend
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Biểu đồ dạng cột song song */}
            <BarLineChart
              categories={categories}
              series={chartSeries}
              data={chartData}
              height={280}
              formatValue={(val, key) =>
                val !== null && val !== undefined
                  ? `${formatNumberVi(val)} ${viewMetric === 'passengers' ? 'khách' : 'đơn'}`
                  : '—'
              }
            />

            {/* Bảng chi tiết từng kỳ */}
            <div className="overflow-x-auto border border-stone-200/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Kỳ ({granularity})</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Năm {baseYear}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Năm {compareYear}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Chênh lệch</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tăng trưởng</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {data.rows.map((row) => {
                    const baseVal =
                      viewMetric === 'passengers'
                        ? row.baseValue.passengerCount
                        : row.baseValue.bookingCount;
                    const compVal =
                      viewMetric === 'passengers'
                        ? row.compareValue.passengerCount
                        : row.compareValue.bookingCount;
                    const deltaVal =
                      viewMetric === 'passengers'
                        ? row.delta.passengerCount
                        : row.delta.bookingCount;

                    return (
                      <tr key={row.period} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-medium font-mono text-stone-900">
                          {row.period}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right font-medium">
                          {row.future ? '—' : formatNumberVi(baseVal)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-stone-600">
                          {formatNumberVi(compVal)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-stone-600">
                          {row.future ? '—' : formatNumberVi(deltaVal)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.future ? '—' : renderTrendBadge(row.changePercent, row.trend)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.partial && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/50 font-medium">
                              Đang diễn ra
                            </span>
                          )}
                          {row.future && (
                            <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-medium">
                              Tương lai
                            </span>
                          )}
                          {!row.partial && !row.future && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              Hoàn tất
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionStateWrapper>
    </div>
  );
};
