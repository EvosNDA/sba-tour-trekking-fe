import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { DashboardBasis } from '../types/dashboard.types';
import { useDebounce } from '../../../hooks/useDebounce';
import { toursApi } from '../../tours/api/tours.api';
import { TourSummaryResponse } from '../../tours/types/tour.types';
import { FilterToolbar } from '../../../components/ui/FilterToolbar';

export interface DashboardFiltersProps {
  basis: DashboardBasis;
  onBasisChange: (basis: DashboardBasis) => void;
  selectedTourId: number | undefined;
  onTourSelect: (tourId: number | undefined) => void;
  onRefreshAll: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  basis,
  onBasisChange,
  selectedTourId,
  onTourSelect,
  onRefreshAll,
}) => {
  const [tourSearch, setTourSearch] = useState('');
  const debouncedTourSearch = useDebounce(tourSearch, 300);
  const [tourOptions, setTourOptions] = useState<TourSummaryResponse[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTours = async () => {
      setIsLoadingTours(true);
      try {
        const res = await toursApi.listTours({
          query: debouncedTourSearch || undefined,
          size: 20,
        });
        if (active) {
          setTourOptions(res.content || []);
        }
      } catch {
        if (active) setTourOptions([]);
      } finally {
        if (active) setIsLoadingTours(false);
      }
    };
    fetchTours();
    return () => {
      active = false;
    };
  }, [debouncedTourSearch]);

  return (
    <FilterToolbar className="space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Bộ lọc Basis */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            Tiêu chí ghi nhận:
          </span>
          <div className="inline-flex max-w-full flex-wrap rounded-xl bg-stone-100 p-1 border border-stone-200/60">
            <button
              type="button"
              onClick={() => onBasisChange('BOOKING_DATE')}
              className={`px-3 min-h-10 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                basis === 'BOOKING_DATE'
                  ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Theo ngày đặt
            </button>
            <button
              type="button"
              onClick={() => onBasisChange('DEPARTURE_DATE')}
              className={`px-3 min-h-10 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                basis === 'DEPARTURE_DATE'
                  ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Theo ngày khởi hành
            </button>
          </div>
        </div>

        {/* Lọc Tour áp dụng cho Trend/Compare/FillRate */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <select
              aria-label="Tour áp dụng cho biểu đồ xu hướng, so sánh và tỷ lệ lấp đầy"
              value={selectedTourId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onTourSelect(val ? Number(val) : undefined);
              }}
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl py-2 pl-3 pr-8 font-medium text-stone-800 focus:outline-hidden focus:border-[#1F4E43] transition-colors"
            >
              <option value="">Tất cả các tour (Toàn hệ thống)</option>
              {tourOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefreshAll}
            title="Làm mới tất cả số liệu"
            aria-label="Làm mới tất cả số liệu"
            className="p-2 text-stone-600 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-stone-600">Bộ lọc tour áp dụng cho biểu đồ xu hướng, so sánh và tỷ lệ lấp đầy. Chỉ số tổng quan và bảng xếp hạng luôn hiển thị toàn hệ thống.</p>
    </FilterToolbar>
  );
};
