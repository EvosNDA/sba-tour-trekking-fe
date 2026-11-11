import React, { useEffect, useState } from 'react';
import type { DashboardBasis, TopToursResponse } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';
import { SectionStateWrapper } from './SectionStateWrapper';
import { formatNumberVi } from './dashboardFormatters';

export interface TopToursSectionProps { basis: DashboardBasis; refreshTrigger: number; }

export const TopToursSection: React.FC<TopToursSectionProps> = ({ basis, refreshTrigger }) => {
  const [data, setData] = useState<TopToursResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTopTours = async () => {
    setIsLoading(true); setError(null);
    try { setData(await dashboardApi.getTopTours({ limit: 4, basis })); }
    catch (err: any) { setError(err?.message || 'Không thể tải danh sách tour nổi bật.'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { void fetchTopTours(); }, [basis, refreshTrigger]);

  return <section className="min-w-0 rounded-xl border border-[#E3E4E2] bg-white p-4 shadow-[0_2px_8px_rgba(25,38,34,.04)] sm:p-5">
    <h2 className="mb-4 text-xl font-bold text-[#151A20]">Tour nổi bật</h2>
    <SectionStateWrapper isLoading={isLoading} error={error} onRetry={fetchTopTours} skeletonHeight="h-56">
      <div className="overflow-x-auto"><table className="w-full min-w-[330px] border-collapse text-sm"><thead><tr className="bg-[#F0F1F0] text-left text-slate-700"><th className="rounded-l-lg px-2.5 py-2">#</th><th className="px-2.5 py-2">Tour</th><th className="px-2.5 py-2 text-right">Booking</th><th className="rounded-r-lg px-2.5 py-2 text-right">Hành khách</th></tr></thead><tbody>{(data?.tours || []).slice(0,4).map((tour,index) => <tr key={tour.tourId} className="border-b border-[#E4E7E5]"><td className="px-2.5 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#DCEFE5] font-semibold text-[#146142]">{index+1}</span></td><td className="max-w-40 truncate px-2.5 py-2.5 font-medium" title={tour.tourName}>{tour.tourName}</td><td className="px-2.5 py-2.5 text-right tabular-nums">{formatNumberVi(tour.bookingCount)}</td><td className="px-2.5 py-2.5 text-right tabular-nums">{formatNumberVi(tour.passengerCount)}</td></tr>)}</tbody></table>{data?.tours.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Chưa có dữ liệu thống kê tour.</p>}</div>
    </SectionStateWrapper>
  </section>;
};

export default TopToursSection;
