import React from 'react';
import {
  Mountain,
  Compass,
  LogOut,
  Calendar,
  FileText,
  Boxes,
  LayoutDashboard,
  Users,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';

export interface AdminPortalLayoutProps {
  children: React.ReactNode;
}

export const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({ children }) => {
  const { account, user, xRole } = useAuthStore();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi phiên quản trị.');
      navigateTo(ROUTES.PUBLIC.HOME);
    } catch {
      navigateTo(ROUTES.PUBLIC.HOME);
    }
  };

  const navItems = [
    {
      label: 'Thống kê',
      path: ROUTES.ADMIN.DASHBOARD,
      icon: LayoutDashboard,
      active: pathname === ROUTES.ADMIN.DASHBOARD || pathname === '/admin/dashboard' || pathname === '/admin/dashboard/' || pathname === '/admin' || pathname === '/admin/',
    },
    {
      label: 'Danh sách tour',
      path: ROUTES.ADMIN.TOURS,
      icon: Compass,
      active: pathname.startsWith('/admin/tours'),
    },
    {
      label: 'Lịch khởi hành',
      path: ROUTES.ADMIN.SCHEDULES,
      icon: Calendar,
      active: pathname.startsWith('/admin/schedules'),
    },
    {
      label: 'Thiết bị & Combo',
      path: ROUTES.ADMIN.EQUIPMENT,
      icon: Boxes,
      active: pathname.startsWith('/admin/equipment'),
    },
    { label: 'Điều khoản & lưu ý', path: ROUTES.ADMIN.POLICIES, icon: FileText, active: pathname.startsWith('/admin/policies') },
    {
      label: 'Đánh giá',
      path: ROUTES.ADMIN.REVIEWS,
      icon: Star,
      active: pathname.startsWith('/admin/reviews') || pathname === ROUTES.ADMIN.REVIEWS,
    },
    {
      label: 'Người dùng',
      path: ROUTES.ADMIN.USER_MANAGEMENT,
      icon: Users,
      active: pathname.startsWith('/admin/users') || pathname === ROUTES.ADMIN.USER_MANAGEMENT,
    },
  ];

  const isScheduleOverviewActive =
    pathname === ROUTES.ADMIN.SCHEDULE_OVERVIEW ||
    pathname.startsWith(`${ROUTES.ADMIN.SCHEDULE_OVERVIEW}/`);

  const adminName = account?.fullName || user?.name || account?.email || 'Quản trị viên';
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'AD';

  return (
    <div data-x-role={xRole} className="h-screen w-full overflow-hidden bg-[#FDFBF7] flex font-sans text-[#1C2526]">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#141D1E] text-stone-200 flex flex-col h-full border-r border-stone-800 shrink-0 select-none z-30">
        {/* Brand */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center font-bold text-base shadow-sm border border-[#1F4E43]/60">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-white tracking-wide leading-none">
                WeTrek Ops
              </h2>
              <span className="text-xs font-mono text-[#FFB59D] uppercase tracking-widest block mt-1">
                Admin Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav aria-label="Menu quản trị" className="p-3 flex-1 overflow-y-auto space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.path}>
                <button
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                    item.active
                      ? 'bg-[#1F4E43] text-white shadow-sm border border-[#1F4E43]/70'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#FFDCC3]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
                {item.path === ROUTES.ADMIN.SCHEDULES && item.active && (
                  <button
                    type="button"
                    onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_OVERVIEW)}
                    aria-current={isScheduleOverviewActive ? 'page' : undefined}
                    className={`ml-7 w-[calc(100%-1.75rem)] flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      isScheduleOverviewActive
                        ? 'bg-[#285e51] text-white font-semibold'
                        : 'text-stone-400 hover:bg-stone-800/80 hover:text-white'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                    Tổng quan lịch
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-stone-800 space-y-1 text-sm shrink-0 mt-auto bg-[#141D1E]">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-stone-400" />
            <span>Trang công khai / Khám phá</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Admin Header */}
        <header className="bg-white border-b border-[#E6E1D8] px-6 py-3.5 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
              Khu vực Quản trị
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-[#F7F4EE] border border-[#E6E1D8]">
              <div className="w-7 h-7 rounded-full bg-[#1F4E43] text-white text-sm font-bold flex items-center justify-center">
                {adminInitials}
              </div>
              <div className="text-left text-sm">
                <span className="font-bold text-[#1C2526] block max-w-[160px] truncate leading-tight">
                  {adminName}
                </span>
                <span className="text-xs text-stone-500 block font-mono">
                  {account?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Admin Body Content */}
        <main className="flex-1 overflow-y-auto bg-[#FDFBF7]">{children}</main>
      </div>
    </div>
  );
};
