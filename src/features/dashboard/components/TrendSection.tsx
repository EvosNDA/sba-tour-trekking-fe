import React, { useEffect, useState } from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { DashboardBasis, DashboardGranularity, BookingTrendResponse } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { BarLineChart, type ChartSeries } from './charts/BarLineChart';
import { formatNumberVi } from './dashboardFormatters';

export interface TrendSectionProps { basis: DashboardBasis; tourId: number | undefined; refreshTrigger: number; }

export const TrendSection: React.FC<TrendSectionProps> = ({ basis, tourId, refreshTrigger }) => {
  const [granularity, setGranularity] = useState<DashboardGranularity>('MONTH');
  const [data, setData] = useState<BookingTrendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = async () => {
    setIsLoading(true); setError(null);
    try { setData(await dashboardApi.getBookingTrend({ granularity, basis, tourId })); }
    catch (err: any) { setError(err?.message || 'Không thể tải biểu đồ xu hướng đặt chỗ.'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { void fetchTrend(); }, [granularity, basis, tourId, refreshTrigger]);

  const categories = data?.points.map(point => point.periodLabel || point.periodKey) || [];
  const series: ChartSeries[] = [
    { key: 'bookingCount', name: 'Booking', type: 'line', color: '#08745B' },
    { key: 'passengerCount', name: 'Hành khách', type: 'line', color: '#E99A2F' },
  ];
  const chartData = data?.points.map(point => ({ bookingCount: point.bookingCount, passengerCount: point.passengerCount })) || [];

  return <section className="min-w-0 rounded-xl border border-[#E3E4E2] bg-white p-4 shadow-[0_2px_8px_rgba(25,38,34,.04)] sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold text-[#151A20]">Xu hướng đặt chỗ</h2><div className="mt-2 flex items-center gap-5 text-sm"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#08745B]"/>Booking</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#E99A2F]"/>Hành khách</span></div></div>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">{([['WEEK','Tuần'],['MONTH','Tháng'],['QUARTER','Quý'],['YEAR','Năm']] as const).map(([key,label]) => <button type="button" key={key} onClick={() => setGranularity(key)} className={`rounded-md px-3 py-1.5 ${granularity === key ? 'bg-[#0B7058] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{label}</button>)}</div>
    </div>
    <div className="mt-3"><SectionStateWrapper isLoading={isLoading} error={error} onRetry={fetchTrend} skeletonHeight="h-56"><BarLineChart categories={categories} series={series} data={chartData} height={230} emptyMessage="Chưa có dữ liệu đặt chỗ trong kỳ này." formatValue={(value,key) => value == null ? '—' : `${formatNumberVi(value)} ${key === 'passengerCount' ? 'khách' : 'booking'}`}/></SectionStateWrapper></div>
  </section>;
};

export default TrendSection;
