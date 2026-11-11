import React, { useCallback, useState } from 'react';
import {
  Package,
  Plus,
  Wrench,
  FolderTree,
} from 'lucide-react';
import { useSearchParams } from '../../../lib/navigation';
import { EquipmentCatalogTab } from './EquipmentCatalogTab';
import { EquipmentPackagesTab } from './EquipmentPackagesTab';
import { EquipmentCategoriesTab } from './EquipmentCategoriesTab';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';

type EquipmentTabKey = 'catalog' | 'packages' | 'categories';

export const AdminEquipmentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createAction, setCreateAction] = useState<(() => void) | null>(null);
  const registerCreateAction = useCallback((action: () => void) => setCreateAction(() => action), []);

  const currentTab = (searchParams.get('tab') as EquipmentTabKey) || 'catalog';

  const handleTabChange = (tab: EquipmentTabKey) => {
    setSearchParams({ tab }, true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader title="Thiết bị & tồn kho" description="Theo dõi danh mục thiết bị, số lượng khả dụng và các combo cho thuê." actions={currentTab === 'catalog' ? <button type="button" onClick={() => createAction?.()} className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#0B7058] px-6 text-base font-semibold text-white hover:bg-[#075743]"><Plus className="h-5 w-5" />Thêm thiết bị</button> : undefined} />

      {/* Tabs Navigation */}
      <div>
        <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm no-scrollbar sm:inline-flex sm:w-auto">
          {/* Tab 1: Thiết bị lẻ */}
          <button
            type="button"
            onClick={() => handleTabChange('catalog')}
            aria-pressed={currentTab === 'catalog'}
            className={`rounded-xl px-3 py-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer sm:px-6 sm:text-base ${
              currentTab === 'catalog'
                ? 'bg-[#0B7058] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Tồn kho</span>
          </button>

          {/* Tab 2: Danh mục */}
          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            aria-pressed={currentTab === 'categories'}
            className={`rounded-xl px-3 py-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer sm:px-6 sm:text-base ${
              currentTab === 'categories'
                ? 'bg-[#0B7058] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Danh mục</span>
          </button>

          {/* Tab 3: Combo cho thuê */}
          <button
            type="button"
            onClick={() => handleTabChange('packages')}
            aria-pressed={currentTab === 'packages'}
            className={`rounded-xl px-3 py-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer sm:px-6 sm:text-base ${
              currentTab === 'packages'
                ? 'bg-[#0B7058] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Combo cho thuê</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {currentTab === 'catalog' && <EquipmentCatalogTab onRegisterCreateAction={registerCreateAction} />}
        {currentTab === 'packages' && <EquipmentPackagesTab />}
        {currentTab === 'categories' && <EquipmentCategoriesTab />}
      </div>
    </div>
  );
};

export default AdminEquipmentPage;
