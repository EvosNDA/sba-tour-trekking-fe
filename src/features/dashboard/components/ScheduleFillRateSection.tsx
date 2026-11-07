import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ScheduleFillRateResponse,
  ScheduleFillStatus,
  ScheduleFillLevel,
} from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import {
  formatNumberVi,
  formatPercentVi,
  formatDateVi,
  addOneDay,
} from './dashboardFormatters';

export interface ScheduleFillRateSectionProps {
  tourId: number | undefined;
  refreshTrigger: number;
}

export const ScheduleFillRateSection: React.FC<ScheduleFillRateSectionProps> = ({
  tourId,
  refreshTrigger,
}) => {
  const [status, setStatus] = useState<ScheduleFillStatus>('OPEN');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [data, setData] = useState<ScheduleFillRateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFillRate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getScheduleFillRate({
        status,
        tourId,
        from: fromDate || undefined,
        to: toDate ? addOneDay(toDate) : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải tỷ lệ lấp đầy lịch khởi hành.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFillRate();
  }, [status, tourId, refreshTrigger]);

  const renderLevelBadge = (level: ScheduleFillLevel) => {
    switch (level) {
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
            Kín chỗ (FULL)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
            Gần đầy (HIGH)
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            Bình thường (NORMAL)
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
            Thấp (LOW)
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 mb-8 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-800" />
            Tỷ lệ lấp đầy các lịch khởi hành
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Kiểm soát sức chứa, lượng khách đã chốt và khách đang giữ chỗ
          </p>
        </div>

        {/* Nút lọc Status OPEN / ALL */}
        <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatus('OPEN')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              status === 'OPEN'
                ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Đang mở đặt (OPEN)
          </button>
          <button
            type="button"
            onClick={() => setStatus('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              status === 'ALL'
                ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tất cả trạng thái (ALL)
          </button>
        </div>
      </div>

      {/* Lọc ngày từ / đến */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 mb-5">
        <div className="flex items-center gap-2 text-stone-600">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>Khoảng ngày khởi hành (mặc định: hôm nay → +30 ngày):</span>
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
            onClick={fetchFillRate}
            className="px-3 py-1 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Lọc
          </button>
        </div>
      </div>

      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={fetchFillRate}
        skeletonHeight="h-72"
      >
        {data && (
          <div className="space-y-5">
            {/* Thẻ tóm tắt Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50 border border-stone-200/80 rounded-xl p-4">
              <div>
                <div className="text-[11px] font-medium text-stone-500 mb-1">
                  Số lịch khởi hành
                </div>
                <div className="font-editorial text-xl font-bold text-stone-900">
                  {formatNumberVi(data.summary.scheduleCount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500 mb-1">
                  Tổng tải sức chứa
                </div>
                <div className="font-editorial text-xl font-bold text-stone-900">
                  {formatNumberVi(data.summary.capacity)} chỗ
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-emerald-700 mb-1">
                  Đã chốt / Giữ chỗ
                </div>
                <div className="font-mono text-sm font-bold text-stone-800">
                  {formatNumberVi(data.summary.bookedPassengers)}{' '}
                  <span className="text-stone-400 font-normal">/</span>{' '}
                  <span className="text-amber-700">
                    {formatNumberVi(data.summary.heldPassengers)} giữ
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-emerald-800 mb-1">
                  Tỷ lệ lấp đầy bình quân
                </div>
                <div className="font-editorial text-xl font-bold text-emerald-900">
                  {formatPercentVi(data.summary.averageFillRate, { isRatio: true })}
                </div>
              </div>
            </div>

            {/* Bảng danh sách lịch */}
            <div className="overflow-x-auto border border-stone-200/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200/80">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Mã lịch</th>
                    <th className="py-2.5 px-3 font-semibold">Tên tour</th>
                    <th className="py-2.5 px-3 font-semibold">Ngày khởi hành</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Sức chứa</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Đã chốt</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Giữ chỗ</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Lấp đầy (%)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Mức độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {data.schedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-stone-400">
                        Không có lịch khởi hành nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    data.schedules.map((item) => (
                      <tr key={item.scheduleId} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-stone-600">
                          #{item.scheduleId}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-900 max-w-xs truncate" title={item.tourName}>
                          {item.tourName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">
                          {formatDateVi(item.departureDate)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right font-medium">
                          {formatNumberVi(item.capacity)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-emerald-800 font-semibold">
                          {formatNumberVi(item.bookedPassengers)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-amber-700">
                          {formatNumberVi(item.heldPassengers)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right font-bold">
                          {formatPercentVi(item.fillRate, { isRatio: true })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {renderLevelBadge(item.level)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionStateWrapper>
    </div>
  );
};
