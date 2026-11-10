import React, { useState, useEffect, useRef } from 'react';
import { Mountain, Compass, LogOut, Calendar, FileText, Boxes, LayoutDashboard, Users, Star, Menu, PanelLeft } from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState(false);
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
    { label: 'Thống kê', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, active: /^\/admin\/?$/.test(pathname) || pathname.startsWith('/admin/dashboard') },
    { label: 'Danh sách tour', path: ROUTES.ADMIN.TOURS, icon: Compass, active: pathname.startsWith('/admin/tours') },
    { label: 'Lịch khởi hành', path: ROUTES.ADMIN.SCHEDULES, icon: Calendar, active: pathname.startsWith('/admin/schedules') },
    { label: 'Thiết bị & Combo', path: ROUTES.ADMIN.EQUIPMENT, icon: Boxes, active: pathname.startsWith('/admin/equipment') },
    { label: 'Điều khoản & lưu ý', path: ROUTES.ADMIN.POLICIES, icon: FileText, active: pathname.startsWith('/admin/policies') },
    { label: 'Đánh giá', path: ROUTES.ADMIN.REVIEWS, icon: Star, active: pathname.startsWith('/admin/reviews') },
    { label: 'Người dùng', path: ROUTES.ADMIN.USER_MANAGEMENT, icon: Users, active: pathname.startsWith('/admin/users') },
  ];
  const overviewActive = pathname.startsWith(ROUTES.ADMIN.SCHEDULE_OVERVIEW);
  const adminName = account?.fullName || user?.name || account?.email || 'Quản trị viên';
  const initials = adminName.split(' ').filter(Boolean).slice(-2).map(s => s[0]?.toUpperCase()).join('') || 'AD';
  const renderNavigation = (compact = false) => <>
    <nav aria-label="Menu quản trị" className="flex-1 space-y-1.5 overflow-y-auto p-3">
      {navItems.map(item => <React.Fragment key={item.path}>
        <button type="button" onClick={() => go(item.path)} title={compact ? item.label : undefined} aria-label={item.label} aria-current={item.active && !overviewActive ? 'page' : undefined} className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${item.active ? 'bg-[#1F4E43] text-white' : 'text-stone-300 hover:bg-white/10 hover:text-white'}`}>
          <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" /><span className={compact ? 'sr-only' : ''}>{item.label}</span>
        </button>
        {item.path === ROUTES.ADMIN.SCHEDULES && item.active && <button type="button" onClick={() => go(ROUTES.ADMIN.SCHEDULE_OVERVIEW)} aria-label="Tổng quan lịch" aria-current={overviewActive ? 'page' : undefined} title={compact ? 'Tổng quan lịch' : undefined} className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${overviewActive ? 'bg-[#285E51] text-white' : 'text-stone-300 hover:bg-white/10'}`}>
          <span aria-hidden="true" className="mx-1.5 h-2 w-2 shrink-0 rounded-full bg-current" /><span className={compact ? 'sr-only' : ''}>Tổng quan lịch</span>
        </button>}
      </React.Fragment>)}
    </nav>
    <div className="space-y-1 border-t border-white/10 p-3">
      <button type="button" onClick={() => go(ROUTES.PUBLIC.TOURS)} title={compact ? 'Khám phá tour' : undefined} aria-label="Khám phá tour" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-stone-300 hover:bg-white/10 hover:text-white"><Compass aria-hidden="true" className="h-5 w-5 shrink-0" /><span className={compact ? 'sr-only' : ''}>Khám phá tour</span></button>
      <button type="button" onClick={handleLogout} disabled={loggingOut} title={compact ? 'Đăng xuất' : undefined} aria-label="Đăng xuất" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-rose-300 hover:bg-white/10 disabled:opacity-50"><LogOut aria-hidden="true" className="h-5 w-5 shrink-0" /><span className={compact ? 'sr-only' : ''}>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span></button>
    </div>
  </>;
  return <div data-x-role={xRole} className="flex h-dvh w-full overflow-hidden bg-[#FDFBF7] font-sans text-[#1C2526]">
    <aside aria-label="Thanh điều hướng quản trị" className={`hidden shrink-0 flex-col border-r border-white/10 bg-[#141D1E] text-stone-200 lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex min-h-20 items-center gap-3 border-b border-white/10 ${collapsed ? 'justify-center px-3' : 'px-6'}`}>
        <Mountain aria-hidden="true" className="h-7 w-7 shrink-0 text-[#B9EADB]" />
        {!collapsed && <div><p className="text-lg font-semibold tracking-tight text-white">WeTrek Ops</p><p className="mt-0.5 text-xs text-stone-400">Quản trị hệ thống</p></div>}
      </div>
      {renderNavigation(collapsed)}
    </aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-[#E6E1D8] bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu quản trị" aria-haspopup="dialog" aria-expanded={mobileOpen} className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#E6E1D8] hover:bg-[#F7F4EE] lg:hidden"><Menu aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-expanded={!collapsed} className="hidden h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-[#F7F4EE] lg:inline-flex"><PanelLeft aria-hidden="true" className="h-5 w-5" /></button>
          <span className="truncate text-sm font-medium text-[#6B7068]">{navItems.find(item => item.active)?.label || 'Quản trị hệ thống'}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-[#F7F4EE] p-1.5 sm:pr-4">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F4E43] text-xs font-semibold text-white">{initials}</span>
          <div className="hidden min-w-0 sm:block"><p className="max-w-40 truncate text-sm font-semibold">{adminName}</p><p className="max-w-40 truncate text-xs text-[#6B7068]">{account?.email}</p></div>
        </div>
      </header>
      <main ref={mainRef} id="admin-content" className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
    <Modal isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu quản trị" maxWidth="sm">
      <div className="flex max-h-[65dvh] flex-col rounded-xl bg-[#141D1E]">{renderNavigation()}</div>
    </Modal>
  </div>;
};
