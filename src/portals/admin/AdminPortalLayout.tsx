import React, { useState, useEffect, useRef } from 'react';
import { Mountain, LogOut, Calendar, FileText, Boxes, LayoutDashboard, Users, Star, Menu, Ticket, Search, Bell, ChevronDown, UserRound } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';

export interface AdminPortalLayoutProps { children: React.ReactNode; }

export const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({ children }) => {
  const { account, user, xRole } = useAuthStore();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [pathname]);
  const go = (path: string) => { setMobileOpen(false); navigateTo(path); };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await authApi.logout(); toast.info('Đã đăng xuất khỏi phiên quản trị.'); }
    catch { /* The auth client clears the session even when the server is unavailable. */ }
    finally { setMobileOpen(false); setLoggingOut(false); navigateTo(ROUTES.PUBLIC.HOME); }
  };
  const navItems = [
    { label: 'Tổng quan', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, active: /^\/admin\/?$/.test(pathname) || pathname.startsWith('/admin/dashboard') },
    { label: 'Tour trekking', path: ROUTES.ADMIN.TOURS, icon: Mountain, active: pathname.startsWith('/admin/tours') },
    { label: 'Lịch khởi hành', path: ROUTES.ADMIN.SCHEDULES, icon: Calendar, active: pathname.startsWith('/admin/schedules') },
    { label: 'Đặt chỗ', path: ROUTES.ADMIN.BOOKINGS, icon: Ticket, active: pathname.startsWith('/admin/bookings') },
    { label: 'Thiết bị & tồn kho', path: ROUTES.ADMIN.EQUIPMENT, icon: Boxes, active: pathname.startsWith('/admin/equipment') },
    { label: 'Điều khoản', path: ROUTES.ADMIN.POLICIES, icon: FileText, active: pathname.startsWith('/admin/policies') },
    { label: 'Đánh giá', path: ROUTES.ADMIN.REVIEWS, icon: Star, active: pathname.startsWith('/admin/reviews') },
    { label: 'Tài khoản', path: ROUTES.ADMIN.USER_MANAGEMENT, icon: Users, active: pathname.startsWith('/admin/users') },
  ];
  const adminName = account?.fullName || user?.name || account?.email || 'Quản trị viên';
  const initials = adminName.split(' ').filter(Boolean).slice(-2).map(s => s[0]?.toUpperCase()).join('') || 'AD';
  const dashboard = /^\/admin\/?$/.test(pathname) || pathname.startsWith('/admin/dashboard');
  const adminPage = dashboard ? 'dashboard'
    : pathname.startsWith('/admin/schedules/') ? 'schedule-detail'
    : navItems.find(item => item.active)?.path.replace('/admin/', '') || 'dashboard';
  const tourPortal = adminPage === 'tours';
  const renderBrand = () => <div data-admin-sidebar-brand className="relative z-10 flex min-h-[104px] items-center gap-3 border-b border-[#DCE3D9] px-6">
    <svg aria-hidden="true" viewBox="0 0 64 36" className="h-9 w-12 shrink-0 fill-[#176A50]">
      <path d="M2 31 20 8l10 13L41 4l21 27H49L41 19l-8 12H24l-4-5-4 5H2Z" />
    </svg>
    <div className="min-w-0"><p className="whitespace-nowrap text-[22px] font-bold tracking-tight text-[#173B35]">WeTrek <span className="font-medium text-[#52645B]">Ops</span></p><p className="mt-0.5 whitespace-nowrap text-[13px] tracking-tight text-[#65756A]">Vận hành tour trekking Việt Nam</p></div>
  </div>;
  const renderAccountFooter = () => <div className="relative z-20 border-t border-[#DCE3D9] bg-[#FBF8F1] p-3.5">
    <div className="flex min-w-0 items-center gap-3 px-1 pb-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D8EFE8] text-[#126A55]"><UserRound aria-hidden="true" className="h-6 w-6" /></span>
      <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#233733]">{adminName}</span><span className="block text-xs text-[#65756A]">Quản trị viên</span></span>
    </div>
    <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#C9D5CD] bg-white px-3 text-sm font-semibold text-[#263A37] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-wait disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
  </div>;
  const renderNavigation = () => <>
    <nav aria-label="Menu quản trị" className="flex-1 space-y-1.5 overflow-y-auto p-2.5 pt-2.5">
      {navItems.map(item => <React.Fragment key={item.path}>
        <button type="button" onClick={() => go(item.path)} aria-label={item.label} aria-current={item.active ? 'page' : undefined} className={`relative z-10 flex min-h-[48px] w-full cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-medium transition-colors ${item.active ? 'bg-[#DFEBDD] font-semibold text-[#124F3D]' : 'text-[#263A37] hover:bg-[#EEF3EA] hover:text-[#124F3D]'}`}>
          <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" /><span>{item.label}</span>
        </button>
      </React.Fragment>)}
    </nav>
  </>;
  return <div data-x-role={xRole} data-admin-portal data-admin-page={adminPage} className="flex h-dvh w-full overflow-hidden bg-[#F8F6F1] font-sans text-[#172033]">
    <aside data-admin-sidebar aria-label="Thanh điều hướng quản trị" className="relative hidden w-[286px] shrink-0 flex-col overflow-hidden border-r border-[#DCE3D9] bg-[#FBF8F1] text-[#263A37] lg:flex">
      {renderBrand()}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{renderNavigation()}</div>
      {renderAccountFooter()}
    </aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className={`flex min-h-[58px] shrink-0 items-center justify-between gap-3 border-b border-[#E1E7EF] bg-white px-4 sm:px-7 ${dashboard ? 'lg:min-h-[72px]' : 'lg:hidden'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu quản trị" aria-haspopup="dialog" aria-expanded={mobileOpen} className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#E6E1D8] hover:bg-[#F7F4EE] lg:hidden"><Menu aria-hidden="true" className="h-5 w-5" /></button>
          <span className="truncate text-sm font-semibold text-slate-500">{dashboard ? 'Vận hành  /  Tổng quan' : navItems.find(item => item.active)?.label || 'Quản trị hệ thống'}</span>
        </div>
        {dashboard && <label className="hidden max-w-[430px] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-400 lg:flex"><Search className="h-4 w-4"/><input aria-label="Tìm tour, lịch hoặc booking" className="min-h-0 w-full border-0 p-0 text-sm shadow-none focus:ring-0" placeholder="Tìm tour, lịch, booking…"/></label>}
        {dashboard && <button type="button" aria-label="Thông báo" className="hidden rounded-full p-2 text-slate-700 hover:bg-slate-100 lg:inline-flex"><Bell className="h-5 w-5"/></button>}
        <div className={`relative ${dashboard ? 'hidden lg:block' : ''}`}>
          <button type="button" onClick={() => setProfileOpen(open => !open)} aria-expanded={profileOpen} className="flex min-w-0 items-center gap-2.5 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-3 sm:pr-4">
            <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dashboard ? 'bg-[#126A55] text-white' : 'bg-[#D8EFE8] text-sm font-bold text-[#126A55]'}`}>{dashboard ? <UserRound className="h-6 w-6"/> : initials}</span>
            {!dashboard && <span className="hidden min-w-0 sm:block"><span className="block max-w-40 truncate text-left text-sm font-semibold text-slate-900">{adminName}</span><span className="block max-w-40 truncate text-left text-xs text-slate-500">{account?.email}</span></span>}
            {!dashboard && <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {profileOpen && !dashboard && <button type="button" onClick={handleLogout} disabled={loggingOut} className="absolute right-0 top-full z-30 mt-2 flex min-h-10 w-44 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-50 disabled:opacity-50"><LogOut className="h-4 w-4"/>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>}
        </div>
      </header>
      <main ref={mainRef} id="admin-content" data-admin-content data-admin-page={adminPage} className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
    <Modal isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu quản trị" maxWidth="sm">
        <div className="relative flex max-h-[calc(90dvh-8rem)] flex-col overflow-hidden rounded-xl border border-[#DCE3D9] bg-[#FBF8F1]">
        {renderBrand()}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{renderNavigation()}</div>
        {renderAccountFooter()}
      </div>
    </Modal>
  </div>;
};
