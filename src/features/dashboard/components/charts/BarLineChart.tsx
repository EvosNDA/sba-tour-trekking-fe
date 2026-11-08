import React, { useState } from 'react';

export interface ChartSeries {
  key: string;
  name: string;
  type: 'bar' | 'line';
  color: string; // Tailwind hex or css color
  yAxis?: 'left' | 'right';
}

export interface BarLineChartProps {
  categories: string[]; // Trục X (labels)
  series: ChartSeries[];
  data: Record<string, number | null>[]; // Mỗi item tương ứng 1 category
  height?: number;
  emptyMessage?: string;
  formatValue?: (val: number | null | undefined, seriesKey: string) => string;
}

/**
 * Tính các mốc "nice ticks" cho trục Y:
 * - 4-5 mốc, mốc đầu = 0.
 * - Bước nhảy chuẩn 1, 2, hoặc 5 × 10^n.
 * - Nếu max = 0 thì trục 0..5 (step = 1).
 */
function calculateNiceTicks(maxValue: number): { ticks: number[]; maxY: number; step: number } {
  if (maxValue <= 0) {
    return { ticks: [0, 1, 2, 3, 4, 5], maxY: 5, step: 1 };
  }

  const targetTickCount = 4;
  const rawStep = maxValue / targetTickCount;
  const exponent = Math.floor(Math.log10(rawStep || 1));
  const fraction = rawStep / Math.pow(10, exponent);

  let niceFraction = 1;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  const step = Math.max(1, Math.round(niceFraction * Math.pow(10, exponent)));
  let currentMax = 0;
  const ticks: number[] = [0];
  while (currentMax < maxValue || ticks.length < 5) {
    currentMax += step;
    ticks.push(currentMax);
  }

  return { ticks, maxY: currentMax, step };
}

const compactNumberFormatter = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatYTick(val: number): string {
  if (val === 0) return '0';
  return compactNumberFormatter.format(val);
}

/**
 * Chuẩn hóa nhãn trục X ngắn gọn:
 * Nếu dạng yyyy-MM hoặc yyyy-MM-dd -> MM/yyyy
 */
function formatShortXLabel(label: string): string {
  if (!label) return '';
  const mMatch = label.match(/^(\d{4})[-/](\d{1,2})/);
  if (mMatch) {
    return `${mMatch[2].padStart(2, '0')}/${mMatch[1]}`;
  }
  return label;
}

export const BarLineChart: React.FC<BarLineChartProps> = ({
  categories,
  series,
  data,
  height = 320,
  emptyMessage = 'Không có dữ liệu trong khoảng thời gian này.',
  formatValue,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!categories || categories.length === 0 || !data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-stone-500 bg-stone-50/50 rounded-xl border border-dashed border-stone-200"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Tìm giá trị max thực tế
  let maxVal = 0;
  data.forEach((row) => {
    series.forEach((s) => {
      const val = row[s.key];
      if (typeof val === 'number' && val > maxVal) {
        maxVal = val;
      }
    });
  });

  const { ticks, maxY } = calculateNiceTicks(maxVal);

  const totalPoints = categories.length;
  // Chiều rộng tối thiểu mỗi mốc điểm để không bị chen chúc
  const minPointWidth = 48;
  const minBaseWidth = 720;
  const computedWidth = Math.max(minBaseWidth, totalPoints * minPointWidth + 100);

  // Tùy theo số lượng điểm, quyết định xoay nhãn hoặc giãn cách
  const shouldRotate = totalPoints > 8;
  const marginBottom = shouldRotate ? 65 : 45;
  const marginTop = 30;
  const marginRight = 30;
  const marginLeft = 55;

  const chartWidth = computedWidth - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  const barSeriesList = series.filter((s) => s.type === 'bar');
  const lineSeriesList = series.filter((s) => s.type === 'line');

  const getY = (val: number | null | undefined) => {
    if (val === null || val === undefined) return chartHeight;
    const clamped = Math.max(0, Math.min(val, maxY));
    return chartHeight - (clamped / maxY) * chartHeight;
  };

  const groupWidth = chartWidth / totalPoints;

  // Bước nhảy hiển thị nhãn để luôn đảm bảo >= 48px/nhãn
  const stepLabel = Math.max(1, Math.ceil(minPointWidth / Math.max(1, groupWidth)));

  return (
    <div className="relative w-full select-none">
      {/* Vùng chart bọc overflow-x-auto */}
      <div className="w-full overflow-x-auto pb-2">
        <div style={{ minWidth: totalPoints > 14 ? `${computedWidth}px` : '100%' }}>
          <svg
            viewBox={`0 0 ${computedWidth} ${height}`}
            className="w-full h-auto overflow-visible font-sans"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
              {/* Lưới ngang & Ticks trục Y */}
              {ticks.map((yVal, i) => {
                const yPos = getY(yVal);
                return (
                  <g key={`ytick-${i}-${yVal}`}>
                    <line
                      x1={0}
                      y1={yPos}
                      x2={chartWidth}
                      y2={yPos}
                      stroke="#E7E5E4"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={-10}
                      y={yPos + 4}
                      textAnchor="end"
                      className="fill-stone-400 text-[11px] font-mono"
                    >
                      {formatYTick(yVal)}
                    </text>
                  </g>
                );
              })}

              {/* Cột (Bars) */}
              {data.map((row, catIdx) => {
                const xCenter = (catIdx + 0.5) * groupWidth;
                const totalBars = barSeriesList.length;
                const barWidth = Math.min(28, Math.max(8, (groupWidth * 0.6) / (totalBars || 1)));

                return (
                  <g key={`bars-${catIdx}`}>
                    {/* Vùng cảm ứng hover */}
                    <rect
                      x={catIdx * groupWidth}
                      y={0}
                      width={groupWidth}
                      height={chartHeight}
                      fill={hoverIndex === catIdx ? 'rgba(0,0,0,0.03)' : 'transparent'}
                      className="cursor-pointer transition-colors"
                      onMouseEnter={() => setHoverIndex(catIdx)}
                    />

                    {barSeriesList.map((s, bIdx) => {
                      const val = row[s.key] ?? 0;
                      const barH = chartHeight - getY(val);
                      const barX =
                        xCenter - (totalBars * barWidth) / 2 + bIdx * barWidth + bIdx * 2;
                      const barY = getY(val);

                      return (
                        <rect
                          key={s.key}
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={Math.max(0, barH)}
                          fill={s.color}
                          rx="3"
                          className="transition-all duration-200"
                          opacity={hoverIndex === null || hoverIndex === catIdx ? 1 : 0.6}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Đường (Lines) */}
              {lineSeriesList.map((s) => {
                const points = data
                  .map((row, idx) => {
                    const val = row[s.key];
                    if (val === null || val === undefined) return null;
                    const x = (idx + 0.5) * groupWidth;
                    const y = getY(val);
                    return `${x},${y}`;
                  })
                  .filter(Boolean)
                  .join(' ');

                return (
                  <g key={s.key}>
                    <polyline
                      points={points}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {data.map((row, idx) => {
                      const val = row[s.key];
                      if (val === null || val === undefined) return null;
                      const x = (idx + 0.5) * groupWidth;
                      const y = getY(val);
                      const isHovered = hoverIndex === idx;

                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={isHovered ? 5 : 3.5}
                          fill="#FFFFFF"
                          stroke={s.color}
                          strokeWidth={isHovered ? 3 : 2}
                          className="cursor-pointer transition-transform"
                          onMouseEnter={() => setHoverIndex(idx)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Nhãn trục X (Categories) */}
              {categories.map((cat, idx) => {
                const xCenter = (idx + 0.5) * groupWidth;
                const shouldShow =
                  idx === 0 ||
                  idx === totalPoints - 1 ||
                  idx % stepLabel === 0;

                if (!shouldShow) return null;

                const displayLabel = formatShortXLabel(cat);

                return (
                  <text
                    key={idx}
                    x={xCenter}
                    y={chartHeight + (shouldRotate ? 14 : 18)}
                    textAnchor={shouldRotate ? 'end' : 'middle'}
                    transform={
                      shouldRotate
                        ? `rotate(-35, ${xCenter}, ${chartHeight + 14})`
                        : undefined
                    }
                    className="fill-stone-500 text-[11px] font-sans"
                  >
                    {displayLabel}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Tooltip Hover Box */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-stone-900/90 text-white rounded-lg px-3 py-2 text-xs shadow-lg backdrop-blur-xs border border-stone-700 space-y-1"
          style={{
            left: `${Math.min(
              85,
              Math.max(
                15,
                ((hoverIndex + 0.5) / categories.length) * 100
              )
            )}%`,
            top: '8%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-stone-200 border-b border-stone-700/60 pb-1 mb-1">
            {categories[hoverIndex]}
          </div>
          {series.map((s) => {
            const val = data[hoverIndex][s.key];
            const formatted = formatValue
              ? formatValue(val, s.key)
              : val !== null && val !== undefined
              ? val.toLocaleString('vi-VN')
              : '—';
            return (
              <div key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}:
                </span>
                <span className="font-mono font-medium text-white">{formatted}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chú thích Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-3 pt-2 border-t border-stone-100">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-stone-600">
            {s.type === 'bar' ? (
              <span
                className="w-3 h-3 rounded-xs"
                style={{ backgroundColor: s.color }}
              />
            ) : (
              <span className="flex items-center w-4">
                <span
                  className="w-full h-0.5"
                  style={{ backgroundColor: s.color }}
                />
              </span>
            )}
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
