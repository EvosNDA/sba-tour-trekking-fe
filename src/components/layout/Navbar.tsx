import React, { useState } from 'react';
import { Mountain, Compass, HelpCircle, Ticket, LogOut, Menu, X, User, ShieldCheck, Calendar } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { navigateTo, useLocation } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../ui/Toast';

export const Navbar: React.FC = () => {
  const { account, user, isAuthenticated, xRole, hasRole } = useAuthStore();
  const location = useLocation();
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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = account?.fullName
    ? account.fullName
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0]?.toUpperCase())
        .join('')
    : account?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E1D8] px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
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
              Vietnam Alpine Trails
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-7 text-sm">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
            className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 ${
              isActive('/tours')
                ? 'text-[#C2410C] font-semibold border-b-2 border-[#C2410C]'
                : 'text-[#2D3748] hover:text-[#1C2526]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Khám phá</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (location.pathname !== '/') {
                navigateTo('/#how-it-works');
              } else {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-1.5 font-medium text-[#2D3748] hover:text-[#1C2526] transition-colors cursor-pointer py-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Cách hoạt động</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 ${
                isActive('/account/bookings') || isActive('/booking/')
                  ? 'text-[#C2410C] font-semibold border-b-2 border-[#C2410C]'
                  : 'text-[#2D3748] hover:text-[#1C2526]'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Đặt chỗ của tôi</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 ${
                isActive('/admin')
                  ? 'text-[#1F4E43] font-semibold border-b-2 border-[#1F4E43]'
                  : 'text-[#1F4E43] hover:text-[#15372F]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          )}

          {isGuide && (
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 ${
                isActive('/guide')
                  ? 'text-[#1F4E43] font-semibold border-b-2 border-[#1F4E43]'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#1F4E43]" />
              <span>Dẫn tour</span>
            </button>
          )}


        </nav>

        {/* Auth / User Profile Zone */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && account ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigateTo(
                    isAdmin
                      ? ROUTES.ADMIN.DASHBOARD
                      : isGuide
                      ? ROUTES.GUIDE.SCHEDULES
                      : ROUTES.ACCOUNT.BOOKINGS
                  )
                }
                className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-[#F7F4EE] hover:bg-[#EFECE4] border border-[#E6E1D8] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#1F4E43] text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <span className="text-xs font-bold text-[#1C2526] block max-w-[140px] truncate">
                  {account.fullName || account.email}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-[#64748B] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.AUTH.LOGIN)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.AUTH.REGISTER)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#C2410C] hover:bg-[#9B2F00] text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Mở menu điều hướng"
          className="md:hidden p-2 rounded-xl border border-[#E6E1D8] text-[#1C2526] hover:bg-[#F7F4EE] cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#E6E1D8] space-y-2">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              navigateTo(ROUTES.PUBLIC.TOURS);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1C2526] hover:bg-[#F7F4EE] flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-[#1F4E43]" />
            <span>Khám phá các tuyến Tour</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (location.pathname !== '/') {
                navigateTo('/#how-it-works');
              } else {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1C2526] hover:bg-[#F7F4EE] flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-[#C2410C]" />
            <span>Cách hoạt động</span>
          </button>

          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(
                    isAdmin
                      ? ROUTES.ADMIN.DASHBOARD
                      : isGuide
                      ? ROUTES.GUIDE.SCHEDULES
                      : ROUTES.ACCOUNT.BOOKINGS
                  );
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] bg-[#B9EADB]/30 flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>
                  {isAdmin
                    ? `Admin Dashboard (${account?.fullName || account?.email})`
                    : isGuide
                    ? `Lịch dẫn tour (${account?.fullName || account?.email})`
                    : `Đặt chỗ của tôi (${account?.fullName || account?.email})`}
                </span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(ROUTES.ADMIN.TOURS);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Portal</span>
                </button>
              )}

              {isGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(ROUTES.GUIDE.SCHEDULES);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-[#1F4E43]" />
                  <span>Cổng Dẫn tour (Guide)</span>
                </button>
              )}



              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.AUTH.LOGIN);
                }}
                className="py-2.5 rounded-xl text-xs font-semibold border border-[#E6E1D8] text-[#1C2526] bg-[#F7F4EE]"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.AUTH.REGISTER);
                }}
                className="py-2.5 rounded-xl text-xs font-semibold bg-[#C2410C] text-white"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
