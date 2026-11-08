import React, { useState } from 'react';
import {
  Mountain,
  Compass,
  Ticket,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';

export interface CustomerPortalLayoutProps {
  children: React.ReactNode;
}

export const CustomerPortalLayout: React.FC<CustomerPortalLayoutProps> = ({ children }) => {
  const { account, user, xRole, hasRole } = useAuthStore();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = xRole === 'ADMIN' || hasRole('ADMIN');
  const isGuide = xRole === 'GUIDE' || hasRole('GUIDE');

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi tài khoản.');
      navigateTo(ROUTES.PUBLIC.HOME);
    } catch {
      navigateTo(ROUTES.PUBLIC.HOME);
    }
  };

  const navItems = [
    {
      label: 'Khám phá tour',
      path: ROUTES.PUBLIC.TOURS,
      icon: Compass,
      active: pathname.startsWith('/tours'),
    },
    {
      label: 'Đặt chỗ của tôi',
      path: ROUTES.ACCOUNT.BOOKINGS,
      icon: Ticket,
      active: pathname.startsWith('/account/bookings') || pathname.startsWith('/booking/'),
    },
    {
      label: 'Hồ sơ cá nhân',
      path: ROUTES.CUSTOMER.PROFILE,
      icon: User,
      active: pathname.startsWith('/customer/profile'),
    },
  ];

  const displayName = account?.fullName || user?.name || account?.email || 'Trekker';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'C';

  return (
    <div
      data-x-role={xRole}
      className="min-h-screen bg-[#FDFBF7] text-[#1C2526] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]"
    >
      {/* Top Customer Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E1D8] px-4 md:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  isAdmin
                    ? ROUTES.ADMIN.DASHBOARD
                    : isGuide
                    ? ROUTES.GUIDE.SCHEDULES
                    : ROUTES.PUBLIC.HOME
                )
              }
              className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C]/40 rounded-lg"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center shadow-2xs">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <span className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#1C2526] block leading-none">
                  WeTrek
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#78716C] block mt-0.5">
                  Customer Portal
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Điều hướng Customer Portal" className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`inline-flex items-center gap-2 font-medium transition-colors cursor-pointer py-1 ${
                    item.active
                      ? 'text-[#C2410C] font-semibold border-b-2 border-[#C2410C]'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Portal Switchers based on active x-role permissions */}
            {xRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.DASHBOARD)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer border border-stone-700"
                title="Truy cập Admin Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#B9EADB]" />
                <span>Admin Portal</span>
                <ChevronRight className="w-3 h-3 text-stone-400" />
              </button>
            )}

            {xRole === 'GUIDE' && (
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1F4E43]/10 text-[#1F4E43] hover:bg-[#1F4E43]/20 transition-colors cursor-pointer border border-[#1F4E43]/30"
                title="Truy cập Guide Portal"
              >
                <Calendar className="w-3.5 h-3.5 text-[#1F4E43]" />
                <span>Guide Portal</span>
                <ChevronRight className="w-3 h-3 text-[#1F4E43]" />
              </button>
            )}
          </nav>

          {/* User profile & actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.CUSTOMER.PROFILE)}
              className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-[#F7F4EE] hover:bg-[#EFECE4] border border-[#E6E1D8] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#1F4E43] text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
              <span className="text-xs font-bold text-[#1C2526] block max-w-[140px] truncate">
                {displayName}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-xl text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[#E6E1D8] text-[#1C2526] hover:bg-[#F7F4EE] cursor-pointer"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#E6E1D8] space-y-2">
            <div className="px-3 py-2 bg-stone-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">{displayName}</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(item.path);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                    item.active
                      ? 'text-[#C2410C] bg-[#C2410C]/10 font-bold'
                      : 'text-stone-800 hover:bg-[#F7F4EE]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {xRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.ADMIN.DASHBOARD);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
                  <span>Chuyển sang Admin Portal</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {xRole === 'GUIDE' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.GUIDE.SCHEDULES);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] bg-[#1F4E43]/10 hover:bg-[#1F4E43]/20 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1F4E43]" />
                  <span>Chuyển sang Guide Portal</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#1F4E43]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Customer Content */}
      <main className="flex-1">{children}</main>

      {/* Customer Footer */}
      <footer className="bg-white border-t border-[#E6E1D8] py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-sm font-bold text-[#1C2526]">WeTrek Customer Portal</span>
            <span className="text-stone-300">•</span>
            <span>Hotline hỗ trợ khẩn cấp: 1900 6868 (24/7)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
              className="hover:text-stone-900 cursor-pointer"
            >
              Trang chủ WeTrek
            </button>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
              className="hover:text-stone-900 cursor-pointer"
            >
              Khám phá cung đường
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortalLayout;
