import React, { useState } from 'react';
import { Mountain, LayoutDashboard, Compass, Users, ListChecks, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScreenId } from '../../types/expedition';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';

export interface SidebarProps {
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  role?: 'admin' | 'staff' | 'guide';
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate = () => {},
  role = 'admin',
  className,
}) => {
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await authApi.logout(); }
    finally { logout(); onNavigate('marketplace'); setLoggingOut(false); }
  };
  const adminItems = [
    { label: t('roleArea.adminHome'), screen: 'admin_home' as ScreenId, icon: LayoutDashboard },
    { label: t('adminTour.title'), screen: 'admin_tours' as ScreenId, icon: ListChecks },
    { label: t('adminAccounts.title'), screen: 'admin_accounts' as ScreenId, icon: Users },
  ];
  const staffItems = [{ label: t('roleArea.staffHome'), screen: 'staff_home' as ScreenId, icon: LayoutDashboard }];
  const guideItems = [{ label: t('roleArea.guideHome'), screen: 'guide_home' as ScreenId, icon: Mountain }];

  const items = role === 'admin' ? adminItems : role === 'guide' ? guideItems : staffItems;
  const roleTitle = role === 'admin' ? t('roleArea.adminBrand') : role === 'guide' ? t('roleArea.guideBrand') : t('roleArea.staffBrand');

  return (
    <aside className={cn('w-64 bg-[#1C2526] text-stone-200 flex flex-col min-h-screen border-r border-stone-800', className)}>
      <div className="p-5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <div>
            <h2 className="font-editorial text-base font-bold text-white tracking-wide">
              {roleTitle}
            </h2>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
              {t('roleArea.workspaceLabel')}
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

      <div className="border-t border-stone-800 p-3 text-xs">
        {user && <div className="truncate px-3.5 pb-3 text-stone-400"><span className="block truncate font-semibold text-stone-200">{user.name}</span><span className="block truncate">{user.email}</span></div>}
        <button
          onClick={() => onNavigate('marketplace')}
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
        >
          <Compass className="w-4 h-4" />
          <span>{t('header.marketplace')}</span>
        </button>
        <button
          type="button"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{loggingOut ? t('header.loggingOut') : t('auth.signOut')}</span>
        </button>
      </div>
    </aside>
  );
};
