import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import React, { useState } from 'react';
import { DashboardBasis, SummaryPeriod } from '../../../features/dashboard/types/dashboard.types';
import { DashboardFilters } from '../../../features/dashboard/components/DashboardFilters';
import { SummarySection } from '../../../features/dashboard/components/SummarySection';
import { TrendSection } from '../../../features/dashboard/components/TrendSection';
import { TopToursSection } from '../../../features/dashboard/components/TopToursSection';
import { ScheduleFillRateSection } from '../../../features/dashboard/components/ScheduleFillRateSection';
import { RecentBookingsSection } from '../../../features/dashboard/components/RecentBookingsSection';

export const AdminDashboardPage: React.FC = () => {
  const [basis, setBasis] = useState<DashboardBasis>('BOOKING_DATE');
  const [period, setPeriod] = useState<SummaryPeriod>('THIS_MONTH');

  return (
    <div className="min-h-full px-4 py-5 text-[#172033] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader className="admin-dashboard-page-header" title="Tổng quan vận hành" description="Theo dõi booking, hành khách và tình trạng khởi hành." actions={<div className="flex flex-wrap items-center gap-3"><DashboardFilters basis={basis} onBasisChange={setBasis} period={period} onPeriodChange={setPeriod}/><span className="whitespace-nowrap border-l border-slate-300 pl-4 text-sm italic text-slate-500">Dữ liệu minh họa</span></div>} />
        <SummarySection basis={basis} period={period} refreshTrigger={0} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.85fr]">
          <TrendSection basis={basis} tourId={undefined} refreshTrigger={0} />
          <TopToursSection basis={basis} refreshTrigger={0} />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ScheduleFillRateSection tourId={undefined} refreshTrigger={0}/>
          <RecentBookingsSection refreshTrigger={0}/>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
