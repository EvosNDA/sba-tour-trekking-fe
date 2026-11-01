import React from 'react';
import {
  Mountain,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  FileCheck,
  LogOut,
  Compass,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../features/auth/api/auth.api';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { toast } from '../../components/ui/Toast';

export interface PartnerPortalLayoutProps {
  children: React.ReactNode;
}

export const PartnerPortalLayout: React.FC<PartnerPortalLayoutProps> = ({ children }) => {
  const { account, user, xRole } = useAuthStore();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi phiên đối tác.');
      navigateTo(ROUTES.PUBLIC.HOME);
    } catch {
      navigateTo(ROUTES.PUBLIC.HOME);
    }
  };

  const navItems = [
    {
      label: 'Thông tin công ty',
      path: ROUTES.PARTNER.COMPANY_INFO,
      icon: Mountain,
      active:
        pathname === ROUTES.PARTNER.COMPANY_INFO ||
        pathname === ROUTES.PARTNER.DASHBOARD ||
        pathname === '/partner' ||
        pathname === '/partner/',
    },
    {
      label: 'Chứng chỉ an toàn & Guide',
      path: ROUTES.PARTNER.CERTIFICATES,
      icon: ShieldCheck,
      active: pathname === ROUTES.PARTNER.CERTIFICATES || pathname === ROUTES.PARTNER.TOUR_MANAGEMENT,
    },
    {
      label: 'Ngân hàng & Payouts',
      path: ROUTES.PARTNER.PAYOUTS,
      icon: CreditCard,
      active: pathname === ROUTES.PARTNER.PAYOUTS || pathname === ROUTES.PARTNER.BOOKING_MANAGEMENT,
    },
    {
      label: 'Đánh giá & Xác thực',
      path: '/partner/final-review',
      icon: FileCheck,
      active: pathname === '/partner/final-review',
    },
  ];

  const partnerName = account?.fullName || user?.name || account?.email || 'Đối tác Trekking';

  return (
    <div data-x-role={xRole} className="min-h-screen bg-[#FDFBF7] flex font-sans text-[#1C2526]">
      {/* Partner Sidebar */}
      <aside className="w-64 bg-[#1C2526] text-stone-200 flex flex-col min-h-screen border-r border-stone-800 shrink-0">
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C2410C] flex items-center justify-center text-white font-bold text-base shadow-sm">
              W
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-white tracking-wide leading-none">
                Partner HQ
              </h2>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block mt-1">
                WeTrek Certified
              </span>
            </div>
          </div>
        </div>

        {/* Role Badge Box */}
        <div className="p-3 mx-3 mt-3 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono text-stone-300 font-semibold uppercase">
              Vai trò:
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1F4E43] text-white">
            {xRole}
          </span>
        </div>

        <nav aria-label="Menu đối tác" className="p-3 flex-1 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  item.active
                    ? 'bg-[#C2410C] text-white shadow-sm'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-800 space-y-1 text-xs">
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

      {/* Main Partner Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E6E1D8] px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
              Khu vực Đối tác
            </span>
            <span className="text-stone-300">/</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#C2410C] bg-[#C2410C]/10 px-2.5 py-1 rounded-full border border-[#C2410C]/20">
              <UserCheck className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Vai trò: {xRole}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1C2526]">{partnerName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
