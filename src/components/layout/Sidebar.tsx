import React from 'react';
import { Mountain, LayoutDashboard, Compass, Users, CreditCard, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScreenId } from '../../types/expedition';
import { useI18n } from '../../i18n/I18nProvider';

export interface SidebarProps {
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  role?: 'partner' | 'admin';
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate = () => {},
  role = 'partner',
  className,
}) => {
  const { t } = useI18n();
  const partnerItems = [
    { label: t('partnerNav.company'), screen: 'partner_company_info' as ScreenId, icon: Mountain },
    { label: t('partnerNav.tours'), screen: 'partner_certificates' as ScreenId, icon: ShieldCheck },
    { label: t('partnerNav.operations'), screen: 'partner_bank_payouts' as ScreenId, icon: CreditCard },
    { label: t('partnerNav.account'), screen: 'partner_final_review' as ScreenId, icon: LayoutDashboard },
  ];

  const adminItems = [
    { label: 'Moderation Console', screen: 'ops_moderation' as ScreenId, icon: ShieldCheck },
    { label: 'Staff Escalations', screen: 'staff_escalations' as ScreenId, icon: Users },
    { label: 'Platform Analytics', screen: 'platform_analytics' as ScreenId, icon: LayoutDashboard },
  ];

  const items = role === 'admin' ? adminItems : partnerItems;

  return (
    <aside className={cn('w-64 bg-[#1C2526] text-stone-200 flex flex-col min-h-screen border-r border-stone-800', className)}>
      <div className="p-5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <div>
            <h2 className="font-editorial text-base font-bold text-white tracking-wide">
              {role === 'admin' ? 'Operations HQ' : 'Partner Portal'}
            </h2>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
              {role === 'admin' ? 'Dispatch Terminal' : 'WeTrek Certified'}
            </span>
          </div>
        </div>
      </div>

      <nav className="p-3 flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                isActive
                  ? 'bg-[#C2410C] text-white shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-800 space-y-1 text-xs">
        <button
          onClick={() => onNavigate('marketplace')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>{t('partnerNav.marketplace')}</span>
        </button>
      </div>
    </aside>
  );
};
