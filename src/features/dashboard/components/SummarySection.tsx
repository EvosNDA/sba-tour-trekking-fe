import React, { useEffect, useState } from 'react';
import type { DashboardBasis, DashboardSummaryResponse, SummaryPeriod } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { formatNumberVi, formatPercentVi } from './dashboardFormatters';

const previousChange = (metric: DashboardSummaryResponse['totalBookings']) => typeof metric === 'object' ? metric?.previousPeriod?.changePercent : undefined;

export interface SummarySectionProps {
  basis: DashboardBasis;
  period: SummaryPeriod;
  refreshTrigger: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ basis, period, refreshTrigger }) => {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await dashboardApi.getSummary({ period, basis }));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải tổng quan chỉ số.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchSummary(); }, [period, basis, refreshTrigger]);

  const cards = data ? [
    { label: 'Tổng booking', value: formatNumberVi(data.totalBookings), accent: 'bg-[#69B7A6]', color: 'text-[#08745B]', trend: previousChange(data.totalBookings) },
    { label: 'Đã xác nhận', value: formatNumberVi(data.confirmed), accent: 'bg-[#4F9D63]', color: 'text-[#08745B]', trend: previousChange(data.confirmed) },
    { label: 'Chờ thanh toán', value: formatNumberVi(data.pendingPayment), accent: 'bg-[#E7A13A]', color: 'text-[#B86A00]', trend: previousChange(data.pendingPayment) },
    { label: 'Tỷ lệ hủy', value: formatPercentVi(data.cancellationRate?.value, { isRatio: true }), accent: 'bg-[#D97B54]', color: 'text-[#08745B]', trend: data.cancellationRate?.previousPeriod?.changePercent, inverse: true },
  ] : [];

  return <SectionStateWrapper isLoading={isLoading} error={error} onRetry={fetchSummary} skeletonHeight="h-28">
    {data && <section aria-label="Chỉ số tổng quan" className="grid grid-cols-1 overflow-hidden rounded-xl border border-[#E3E4E2] bg-white shadow-[0_2px_8px_rgba(25,38,34,.04)] sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({label,value,accent,trend,color,inverse},index) => <div key={label} className={`flex min-h-[108px] items-center gap-4 px-5 py-4 ${index > 0 ? 'border-t border-[#E4E7E5] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'xl:border-t-0' : ''}`}>
        <span className={`h-14 w-1.5 shrink-0 rounded-full ${accent}`}/>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-600">{label}</p><div className="mt-1 flex items-baseline gap-3"><strong className="text-[32px] leading-none font-bold tracking-tight text-[#151A20]">{value}</strong>{trend != null && <span className={`whitespace-nowrap text-sm font-semibold ${inverse ? trend <= 0 ? 'text-emerald-700' : 'text-rose-700' : color}`}>{trend < 0 ? '▼ ' : trend > 0 ? '▲ ' : ''}{formatPercentVi(Math.abs(trend))}</span>}</div>{trend != null && <span className="text-xs text-slate-500">so với kỳ trước</span>}</div>
      </div>)}
    </section>}
  </SectionStateWrapper>;
};

export default SummarySection;
