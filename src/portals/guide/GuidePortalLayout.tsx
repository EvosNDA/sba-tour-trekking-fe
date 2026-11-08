import React from 'react';
import {
  Calendar,
  LogOut,
  Mountain,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';

export interface GuidePortalLayoutProps {
  children: React.ReactNode;
}

export const GuidePortalLayout: React.FC<GuidePortalLayoutProps> = ({ children }) => {
  const { account, user, setXRole, hasRole } = useAuthStore();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi tài khoản Hướng dẫn viên.');
      navigateTo(ROUTES.PUBLIC.HOME);
    } catch {
      navigateTo(ROUTES.PUBLIC.HOME);
    }
  };

  const guideName = account?.fullName || user?.name || account?.email || 'Hướng dẫn viên';
  const guideInitials =
    guideName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'HDV';

  const hasAdminRole = hasRole('ADMIN');

  return (
    <div
      data-x-role="GUIDE"
      className="min-h-screen w-full bg-[#FDFBF7] flex flex-col font-sans text-[#1C2526]"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E1D8] px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Navigation */}
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
              className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30 rounded-xl shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center font-bold text-sm shadow-2xs border border-[#1F4E43]/60 shrink-0">
                <Mountain className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-editorial text-lg font-bold tracking-tight text-[#1C2526] leading-none">
                  WeTrek Ops
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-[#1F4E43] border border-emerald-200 font-bold uppercase tracking-wider">
                  Guide Portal
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav aria-label="Menu Hướng dẫn viên" className="hidden md:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  pathname.startsWith('/guide/schedules') || pathname === '/guide'
                    ? 'bg-[#1F4E43] text-white shadow-2xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Lịch được phân công</span>
              </button>
            </nav>
          </div>

          {/* Right User Actions & Multi-Role Switching */}
          <div className="flex items-center gap-2 shrink-0">
            {hasAdminRole && (
              <button
                type="button"
                onClick={() => {
                  setXRole('ADMIN');
                  navigateTo(ROUTES.ADMIN.DASHBOARD);
                }}
                title="Chuyển sang quyền Quản trị (Admin Portal)"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#1F4E43] shrink-0" />
                <span>Admin Portal</span>
              </button>
            )}

            {/* Guide Info Pill */}
            <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#F7F4EE] border border-[#E6E1D8]">
              <div className="w-6 h-6 rounded-full bg-[#1F4E43] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {guideInitials}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-[#1C2526] text-xs block max-w-[140px] truncate leading-tight">
                  {guideName}
                </span>
                <span className="text-[10px] text-stone-500 block font-mono max-w-[160px] truncate leading-tight">
                  {account?.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-10 min-w-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E6E1D8] z-30 px-4 py-2 flex items-center justify-around text-xs">
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${
            pathname.startsWith('/guide/schedules') || pathname === '/guide'
              ? 'text-[#1F4E43] font-bold'
              : 'text-stone-500'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch tour</span>
        </button>

        {hasAdminRole && (
          <button
            type="button"
            onClick={() => {
              setXRole('ADMIN');
              navigateTo(ROUTES.ADMIN.DASHBOARD);
            }}
            className="flex flex-col items-center gap-1 py-1 text-stone-700 font-semibold cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};
