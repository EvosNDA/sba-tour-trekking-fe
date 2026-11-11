import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ScheduleFillRateResponse } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { formatDateVi, formatNumberVi, formatPercentVi } from './dashboardFormatters';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface ScheduleFillRateSectionProps { tourId: number | undefined; refreshTrigger: number; }

export const ScheduleFillRateSection: React.FC<ScheduleFillRateSectionProps> = ({ tourId, refreshTrigger }) => {
  const [data, setData] = useState<ScheduleFillRateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSchedules = async () => {
    setIsLoading(true); setError(null);
    try { setData(await dashboardApi.getScheduleFillRate({ status: 'ALL', tourId })); }
    catch (err: any) { setError(err?.message || 'Không thể tải lịch khởi hành.'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { void fetchSchedules(); }, [tourId, refreshTrigger]);

  return <section className="min-w-0 rounded-xl border border-[#E3E4E2] bg-white p-4 shadow-[0_2px_8px_rgba(25,38,34,.04)] sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#151A20]">Tình trạng lịch khởi hành</h2><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULES)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#08745B]">Xem lịch <ArrowRight size={16}/></button></div>
    <SectionStateWrapper isLoading={isLoading} error={error} onRetry={fetchSchedules} skeletonHeight="h-44">
      <div className="overflow-x-auto"><table className="w-full min-w-[440px] border-collapse text-sm"><thead><tr className="bg-[#F0F1F0] text-left text-slate-700"><th className="rounded-l-lg px-2.5 py-2">Tour</th><th className="px-2.5 py-2">Ngày đi</th><th className="px-2.5 py-2 text-right">Đã đặt</th><th className="px-2.5 py-2 text-right">Sức chứa</th><th className="rounded-r-lg px-2.5 py-2 text-right">Lấp đầy</th></tr></thead><tbody>{(data?.schedules || []).slice(0,3).map(item => <tr key={item.scheduleId} className="border-b border-[#E4E7E5]"><td className="max-w-44 truncate px-2.5 py-2.5 font-medium" title={item.tourName}>{item.tourName}</td><td className="whitespace-nowrap px-2.5 py-2.5">{formatDateVi(item.departureDate)}</td><td className="px-2.5 py-2.5 text-right tabular-nums">{formatNumberVi(item.bookedPassengers)}</td><td className="px-2.5 py-2.5 text-right tabular-nums">{formatNumberVi(item.capacity)}</td><td className="px-2.5 py-2.5 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${Number(item.fillRate || 0) >= .85 ? 'bg-[#FFE8C4] text-[#9B5800]' : 'bg-[#DCEFE5] text-[#0A6044]'}`}>{formatPercentVi(item.fillRate, { isRatio: true })}</span></td></tr>)}</tbody></table>{data?.schedules.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Chưa có lịch khởi hành sắp tới.</p>}</div>
    </SectionStateWrapper>
  </section>;
};

export default ScheduleFillRateSection;
