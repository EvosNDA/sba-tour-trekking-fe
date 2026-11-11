import React from 'react';
import { CalendarDays, Filter } from 'lucide-react';
import type { DashboardBasis, SummaryPeriod } from '../types/dashboard.types';

export interface DashboardFiltersProps {
  basis: DashboardBasis;
  onBasisChange: (basis: DashboardBasis) => void;
  period: SummaryPeriod;
  onPeriodChange: (period: SummaryPeriod) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({ basis, onBasisChange, period, onPeriodChange }) => (
  <div className="flex flex-wrap items-center gap-3">
    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#202A35] shadow-sm">
      <CalendarDays className="h-4 w-4 text-slate-600"/>
      <select aria-label="Kỳ báo cáo" value={period} onChange={e => onPeriodChange(e.target.value as SummaryPeriod)} className="min-h-0 border-0 bg-transparent p-0 pr-7 text-sm shadow-none focus:ring-0">
        <option value="TODAY">Hôm nay</option><option value="THIS_WEEK">Tuần này</option><option value="THIS_MONTH">Tháng này</option><option value="THIS_QUARTER">Quý này</option><option value="THIS_YEAR">Năm nay</option>
      </select>
    </label>
    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#202A35] shadow-sm">
      <Filter className="h-4 w-4 text-slate-600"/>
      <select aria-label="Tiêu chí ngày" value={basis} onChange={e => onBasisChange(e.target.value as DashboardBasis)} className="min-h-0 border-0 bg-transparent p-0 pr-7 text-sm shadow-none focus:ring-0">
        <option value="BOOKING_DATE">Ngày đặt chỗ</option><option value="DEPARTURE_DATE">Ngày khởi hành</option>
      </select>
    </label>
  </div>
);

export default DashboardFilters;
