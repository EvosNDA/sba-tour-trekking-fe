import React from 'react';
import {
  Boxes,
  Layers,
  FolderTree,
  Package,
  Wrench,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useSearchParams } from '../../../lib/navigation';
import { EquipmentCatalogTab } from './EquipmentCatalogTab';
import { EquipmentPackagesTab } from './EquipmentPackagesTab';
import { EquipmentCategoriesTab } from './EquipmentCategoriesTab';

type EquipmentTabKey = 'catalog' | 'packages' | 'categories';

export const AdminEquipmentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get('tab') as EquipmentTabKey) || 'catalog';

  const handleTabChange = (tab: EquipmentTabKey) => {
    setSearchParams({ tab }, true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="space-y-2">
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
          <span>Quản trị WeTrek</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold">Thiết bị & Combo</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2526] tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#1F4E43] text-white flex items-center justify-center shadow-xs">
                <Boxes className="w-5 h-5" />
              </span>
              <span>Quản lý Thiết bị & Combo</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Quản lý danh mục thiết bị lẻ, số lượng tồn kho, các gói combo thiết bị mẫu và nhóm phân loại trong hệ thống WeTrek.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-stone-200">
        <div className="flex items-center gap-2 -mb-px overflow-x-auto no-scrollbar">
          {/* Tab 1: Thiết bị lẻ */}
          <button
            type="button"
            onClick={() => handleTabChange('catalog')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'catalog'
                ? 'border-[#1F4E43] text-[#1F4E43]'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Thiết bị lẻ</span>
          </button>

          {/* Tab 2: Combo thiết bị */}
          <button
            type="button"
            onClick={() => handleTabChange('packages')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'packages'
                ? 'border-[#1F4E43] text-[#1F4E43]'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Combo thiết bị</span>
          </button>

          {/* Tab 3: Nhóm thiết bị */}
          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'categories'
                ? 'border-[#1F4E43] text-[#1F4E43]'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Nhóm thiết bị</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {currentTab === 'catalog' && <EquipmentCatalogTab />}
        {currentTab === 'packages' && <EquipmentPackagesTab />}
        {currentTab === 'categories' && <EquipmentCategoriesTab />}
      </div>
    </div>
  );
};

export default AdminEquipmentPage;
