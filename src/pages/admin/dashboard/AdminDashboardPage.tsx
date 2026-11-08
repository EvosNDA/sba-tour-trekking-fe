import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Dashboard Header Card theo spec chuẩn */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1F4E43] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
              <span>THỐNG KÊ VẬN HÀNH</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
              Bảng điều khiển & Thống kê vận hành
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Tổng hợp dữ liệu doanh số, khối lượng khách, tỷ lệ lấp đầy lịch trình và phân tích tăng trưởng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAll}
              className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1F4E43]" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 1. Bộ lọc dùng chung */}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 5. Section Top tour thị phần */}
          <TopToursSection basis={basis} refreshTrigger={refreshTrigger} />

          {/* 6. Section Tỷ lệ lấp đầy (Fill-rate) */}
          <ScheduleFillRateSection
            tourId={selectedTourId}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
