import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { DashboardBasis } from '../../../features/dashboard/types/dashboard.types';
import { DashboardFilters } from '../../../features/dashboard/components/DashboardFilters';
import { SummarySection } from '../../../features/dashboard/components/SummarySection';
import { TrendSection } from '../../../features/dashboard/components/TrendSection';
import { CompareSection } from '../../../features/dashboard/components/CompareSection';
import { TopToursSection } from '../../../features/dashboard/components/TopToursSection';
import { ScheduleFillRateSection } from '../../../features/dashboard/components/ScheduleFillRateSection';

export const AdminDashboardPage: React.FC = () => {
  const [basis, setBasis] = useState<DashboardBasis>('BOOKING_DATE');
  const [selectedTourId, setSelectedTourId] = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-[#1F4E43]" />
            Bảng điều khiển & Thống kê vận hành
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tổng hợp dữ liệu doanh số, khối lượng khách, tỷ lệ lấp đầy lịch trình và phân tích tăng trưởng
          </p>
        </div>
      </div>

      {/* 1. Bộ lọc dùng chung (Basis, Tour cho Trend/Compare/FillRate) */}
      <DashboardFilters
        basis={basis}
        onBasisChange={setBasis}
        selectedTourId={selectedTourId}
        onTourSelect={setSelectedTourId}
        onRefreshAll={handleRefreshAll}
      />

      {/* 2. Section KPI Cards (Summary) */}
      <SummarySection basis={basis} refreshTrigger={refreshTrigger} />

      {/* 3. Section Biểu đồ xu hướng (Trend) */}
      <TrendSection
        basis={basis}
        tourId={selectedTourId}
        refreshTrigger={refreshTrigger}
      />

      {/* 4. Section So sánh cùng kỳ (Compare) */}
      <CompareSection
        basis={basis}
        tourId={selectedTourId}
        refreshTrigger={refreshTrigger}
      />

      {/* Grid 2 cột: Top tour và Tỷ lệ lấp đầy lịch */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 5. Section Top tour thị phần */}
        <TopToursSection basis={basis} refreshTrigger={refreshTrigger} />

        {/* 6. Section Tỷ lệ lấp đầy (Fill-rate) */}
        <ScheduleFillRateSection
          tourId={selectedTourId}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
