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
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';

type EquipmentTabKey = 'catalog' | 'packages' | 'categories';

export const AdminEquipmentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get('tab') as EquipmentTabKey) || 'catalog';

  const handleTabChange = (tab: EquipmentTabKey) => {
    setSearchParams({ tab }, true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader eyebrow="Kho thiết bị" title="Thiết bị & Combo" description="Quản lý thiết bị lẻ, số lượng tồn kho, gói thuê mẫu và nhóm phân loại." />

      {/* Tabs Navigation */}
      <div className="border-b border-stone-200">
        <div className="flex items-center gap-2 -mb-px overflow-x-auto no-scrollbar">
          {/* Tab 1: Thiết bị lẻ */}
          <button
            type="button"
            onClick={() => handleTabChange('catalog')}
            aria-pressed={currentTab === 'catalog'}
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
            aria-pressed={currentTab === 'packages'}
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
            aria-pressed={currentTab === 'categories'}
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
