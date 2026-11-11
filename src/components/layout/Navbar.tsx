import React, { useState, useEffect, useRef } from 'react';
import {
  Mountain,
  Compass,
  HelpCircle,
  Ticket,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { navigateTo, useLocation } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../ui/Toast';

export const Navbar: React.FC = () => {
  const { account, user, isAuthenticated, xRole, hasRole } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  const isAdmin = xRole === 'ADMIN' || hasRole('ADMIN');
  const isGuide = xRole === 'GUIDE' || hasRole('GUIDE');

  // Handle click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dropdownRef.current?.contains(document.activeElement)) userTriggerRef.current?.focus();
        if (mobileMenuOpen) mobileTriggerRef.current?.focus();
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi tài khoản.');
      navigateTo(ROUTES.PUBLIC.HOME);
    } catch {
      navigateTo(ROUTES.PUBLIC.HOME);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '';
    return location.pathname.startsWith(path);
  };

  const displayName = account?.fullName || user?.name || account?.email || 'Trekker';
  const displayEmail = account?.email || user?.email || '';

  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0]?.toUpperCase())
        .join('')
    : 'U';

  const roleLabel = isAdmin
    ? 'Quản trị viên'
    : isGuide
    ? 'Hướng dẫn viên'
    : 'Thành viên WeTrek';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E1D8] px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
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
          className="flex items-center gap-2.5 justify-self-start text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C]/40 rounded-lg group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center shadow-2xs group-hover:bg-[#15372F] transition-colors">
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
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center justify-center gap-7 text-sm">
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
              if (location.pathname !== '/' && location.pathname !== '') {
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
              onClick={() => navigateTo(ROUTES.ADMIN.DASHBOARD)}
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
                  : 'text-[#1F4E43] hover:text-[#15372F]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Dẫn tour</span>
            </button>
          )}
        </nav>

        {/* Auth / User Profile Zone (Desktop) */}
        <div className="hidden lg:flex items-center justify-self-end gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#F7F4EE] hover:bg-[#EFECE4] border border-[#E6E1D8] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30"
                aria-expanded={userDropdownOpen}
                ref={userTriggerRef}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-[#1F4E43] text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-[#1C2526] block max-w-[130px] truncate leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-stone-500 block leading-none">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E6E1D8] py-2 z-50 text-xs">
                  {/* Identity Box */}
                  <div className="px-4 py-3 border-b border-[#E6E1D8] bg-[#FAF8F5]/80 rounded-t-2xl">
                    <p className="font-bold text-sm text-[#1C2526] truncate">{displayName}</p>
                    {displayEmail && (
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{displayEmail}</p>
                    )}
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-[#1F4E43]/10 text-[#1F4E43] font-mono text-[10px] font-semibold">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo(ROUTES.CUSTOMER.PROFILE);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F7F4EE] text-[#1C2526] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#1F4E43]" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo(ROUTES.ACCOUNT.BOOKINGS);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F7F4EE] text-[#1C2526] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-[#C2410C]" />
                      <span>Đặt chỗ của tôi</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigateTo(ROUTES.ADMIN.DASHBOARD);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F7F4EE] text-[#1C2526] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#1F4E43]" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    {isGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigateTo(ROUTES.GUIDE.SCHEDULES);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F7F4EE] text-[#1C2526] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#1F4E43]" />
                        <span>Lịch dẫn tour</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#E6E1D8]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
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
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
          aria-expanded={mobileMenuOpen}
          ref={mobileTriggerRef}
          className="lg:hidden p-2 rounded-xl border border-[#E6E1D8] text-[#1C2526] hover:bg-[#F7F4EE] cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-[#E6E1D8] space-y-2 pb-2">
          {isAuthenticated && (
            <div className="px-3.5 py-3 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#1F4E43] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1C2526] truncate">{displayName}</p>
                <p className="text-xs text-stone-500 truncate">{displayEmail}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F4E43]/10 text-[#1F4E43] font-semibold shrink-0">
                {roleLabel}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              navigateTo(ROUTES.PUBLIC.TOURS);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors ${
              isActive('/tours')
                ? 'bg-[#C2410C]/10 text-[#C2410C] font-semibold'
                : 'text-[#1C2526] hover:bg-[#F7F4EE]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#1F4E43]" />
            <span>Khám phá các tuyến Tour</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (location.pathname !== '/' && location.pathname !== '') {
                navigateTo('/#how-it-works');
              } else {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#1C2526] hover:bg-[#F7F4EE] flex items-center gap-2.5"
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
                  navigateTo(ROUTES.CUSTOMER.PROFILE);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors ${
                  isActive('/customer/profile')
                    ? 'bg-[#1F4E43]/10 text-[#1F4E43] font-semibold'
                    : 'text-[#1C2526] hover:bg-[#F7F4EE]'
                }`}
              >
                <User className="w-4 h-4 text-[#1F4E43]" />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.ACCOUNT.BOOKINGS);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors ${
                  isActive('/account/bookings') || isActive('/booking/')
                    ? 'bg-[#C2410C]/10 text-[#C2410C] font-semibold'
                    : 'text-[#1C2526] hover:bg-[#F7F4EE]'
                }`}
              >
                <Ticket className="w-4 h-4 text-[#C2410C]" />
                <span>Đặt chỗ của tôi</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(ROUTES.ADMIN.DASHBOARD);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] bg-[#B9EADB]/25 hover:bg-[#B9EADB]/40 flex items-center gap-2.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
                  <span>Admin Dashboard</span>
                </button>
              )}

              {isGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo(ROUTES.GUIDE.SCHEDULES);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1F4E43] bg-[#1F4E43]/10 hover:bg-[#1F4E43]/20 flex items-center gap-2.5"
                >
                  <Calendar className="w-4 h-4 text-[#1F4E43]" />
                  <span>Cổng Dẫn tour (Guide)</span>
                </button>
              )}

              <div className="pt-2 border-t border-[#E6E1D8]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.AUTH.LOGIN);
                }}
                className="py-2.5 rounded-xl text-xs font-semibold border border-[#E6E1D8] text-[#1C2526] bg-[#F7F4EE] hover:bg-[#EFECE4] transition-colors"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo(ROUTES.AUTH.REGISTER);
                }}
                className="py-2.5 rounded-xl text-xs font-semibold bg-[#C2410C] hover:bg-[#9B2F00] text-white transition-colors"
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
