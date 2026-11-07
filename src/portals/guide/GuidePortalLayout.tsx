import React from 'react';
import {
  Compass,
  Calendar,
  LogOut,
  Mountain,
  ShieldCheck,
  User,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuthStore, XRole } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';

export interface GuidePortalLayoutProps {
  children: React.ReactNode;
}

export const GuidePortalLayout: React.FC<GuidePortalLayoutProps> = ({ children }) => {
  const { account, user, xRole, setXRole, hasRole } = useAuthStore();
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
  const hasCustomerRole = hasRole('CUSTOMER');

  return (
    <div
      data-x-role="GUIDE"
      className="min-h-screen w-full bg-[#FDFBF7] flex flex-col font-sans text-[#1C2526]"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E1D8] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
              className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center font-bold text-base shadow-xs border border-[#1F4E43]/60">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#1C2526] leading-none">
                    WeTrek
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold uppercase tracking-wider">
                    Tour Guide
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-500 block mt-0.5">
                  Cổng tác nghiệp Hướng dẫn viên
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation (Desktop) */}
          <nav aria-label="Menu Hướng dẫn viên" className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                pathname.startsWith('/guide/schedules') || pathname === '/guide'
                  ? 'bg-[#1F4E43] text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch được phân công</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Khám phá tour</span>
            </button>
          </nav>

          {/* Right User Actions & Multi-Role Switching */}
          <div className="flex items-center gap-2.5">
            {/* Multi-role shortcuts */}
            {hasAdminRole && (
              <button
                type="button"
                onClick={() => {
                  setXRole('ADMIN');
                  navigateTo(ROUTES.ADMIN.DASHBOARD);
                }}
                title="Chuyển sang quyền Quản trị (Admin Portal)"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Sang Admin</span>
              </button>
            )}

            {/* Guide Info Pill */}
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#F7F4EE] border border-[#E6E1D8]">
              <div className="w-7 h-7 rounded-full bg-[#1F4E43] text-white text-xs font-bold flex items-center justify-center">
                {guideInitials}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-[#1C2526] text-xs block max-w-[130px] truncate leading-tight">
                  {guideName}
                </span>
                <span className="text-[10px] text-stone-500 block font-mono">
                  {account?.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16 sm:pb-8">{children}</main>

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
          <Calendar className="w-5 h-5" />
          <span>Lịch tour</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
          className="flex flex-col items-center gap-1 py-1 text-stone-500 cursor-pointer"
        >
          <Compass className="w-5 h-5" />
          <span>Trang chủ</span>
        </button>

        {hasAdminRole && (
          <button
            type="button"
            onClick={() => {
              setXRole('ADMIN');
              navigateTo(ROUTES.ADMIN.DASHBOARD);
            }}
            className="flex flex-col items-center gap-1 py-1 text-amber-800 font-semibold cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};
