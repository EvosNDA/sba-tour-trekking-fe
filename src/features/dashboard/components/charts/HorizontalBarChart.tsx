import React from 'react';
import { formatNumberVi, formatPercentVi } from '../dashboardFormatters';

export interface HorizontalBarItem {
  id: string | number;
  label: string;
  subLabel?: string;
  value: number; // Ví dụ: passengerCount hoặc bookingCount
  share: number | null; // Tỷ lệ (0..1)
}

export interface HorizontalBarChartProps {
  items: HorizontalBarItem[];
  emptyMessage?: string;
  metricLabel?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  items,
  emptyMessage = 'Chưa có dữ liệu thống kê tour.',
  metricLabel = 'khách',
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-stone-500 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
        {emptyMessage}
      </div>
    );
  }

  const maxVal = Math.max(...items.map((it) => it.value), 1);

  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const pctWidth = Math.max(3, Math.min(100, (item.value / maxVal) * 100));
        const shareText = formatPercentVi(item.share, { isRatio: true });

        return (
          <div key={item.id} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-stone-900 truncate" title={item.label}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="font-mono font-medium text-stone-900">
                  {formatNumberVi(item.value)}{' '}
                  <span className="text-stone-400 font-normal text-[11px]">{metricLabel}</span>
                </span>
                <span className="w-12 text-stone-500 font-mono text-[11px]">
                  {shareText}
                </span>
              </div>
            </div>

            {/* Thanh bar */}
            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500 group-hover:bg-emerald-600"
                style={{ width: `${pctWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
