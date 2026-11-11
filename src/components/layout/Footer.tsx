import React from 'react';
import { Mountain } from 'lucide-react';
import { navigateTo, useLocation } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../stores/auth.store';

export const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/' || pathname === '';
  const { account, user, xRole, isAuthenticated } = useAuthStore();
  const isAdmin =
    isAuthenticated &&
    (xRole === 'ADMIN' ||
      user?.role === 'admin' ||
      account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'));
  const isGuide =
    isAuthenticated &&
    (xRole === 'GUIDE' ||
      user?.role === 'guide' ||
      account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'GUIDE'));
  return (
    <footer className="bg-[#F7F4EE] border-t border-[#E6E1D8] text-[#1C2526]">
      {/* Main Links Grid */}
      <div className={`footer-links-grid py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-sm${isHomePage ? ' footer-home-grid' : ''}`}>
        <div className={isHomePage ? '' : 'md:col-span-2'}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center">
              <Mountain className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
              {isHomePage ? 'WeTrek' : 'WeTrek Vietnam'}
            </h3>
          </div>
          <p className="text-[#6B7068] leading-relaxed max-w-sm">
            Những cung đường Việt Nam, những trải nghiệm đáng nhớ. Tìm hành trình phù hợp và chuẩn bị cho chuyến đi tiếp theo cùng WeTrek.
          </p>
        </div>

        {isHomePage ? (
          <>
            <div>
              <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">Khám phá</h4>
              <ul className="space-y-2.5 text-[#64748B]">
                <li><button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className="hover:text-[#1C2526] cursor-pointer">Cung đường trekking</button></li>
                <li><button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className="hover:text-[#1C2526] cursor-pointer">Tìm hành trình</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">Cách hoạt động</h4>
              <ul className="space-y-2.5 text-[#64748B]">
                <li><button type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#1C2526] cursor-pointer">Quy trình đặt chỗ</button></li>
                <li><button type="button" onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)} className="hover:text-[#1C2526] cursor-pointer">Theo dõi đặt chỗ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">Hỗ trợ</h4>
              <div className="space-y-2.5 text-[#64748B]">
                <div><span className="block text-[10px] uppercase font-mono text-[#78716C]">Điện thoại</span><a href={`tel:${APP_CONFIG.SUPPORT_PHONE}`} className="font-bold text-[#C2410C] hover:underline font-mono">{APP_CONFIG.SUPPORT_PHONE}</a></div>
                <div><span className="block text-[10px] uppercase font-mono text-[#78716C]">Email</span><a href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`} className="font-mono text-[#1C2526] hover:underline">{APP_CONFIG.SUPPORT_EMAIL}</a></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">Tài khoản</h4>
              <ul className="space-y-2.5 text-[#64748B]">
                {isAuthenticated ? <>
                  <li><button type="button" onClick={() => navigateTo(ROUTES.CUSTOMER.PROFILE)} className="hover:text-[#1C2526] cursor-pointer">Hồ sơ của tôi</button></li>
                  <li><button type="button" onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)} className="hover:text-[#1C2526] cursor-pointer">Đặt chỗ của tôi</button></li>
                </> : <>
                  <li><button type="button" onClick={() => navigateTo(ROUTES.AUTH.LOGIN)} className="hover:text-[#1C2526] cursor-pointer">Đăng nhập</button></li>
                  <li><button type="button" onClick={() => navigateTo(ROUTES.AUTH.REGISTER)} className="hover:text-[#1C2526] cursor-pointer">Tạo tài khoản</button></li>
                </>}
              </ul>
            </div>
          </>
        ) : <>
        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            Điều hướng
          </h4>
          <ul className="space-y-2.5 text-[#64748B]">
            <li>
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
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Trang chủ
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Khám phá hành trình
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Đặt chỗ của tôi
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.AUTH.LOGIN)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Đăng nhập / Đăng ký
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            Liên hệ hỗ trợ
          </h4>
          <div className="space-y-2.5 text-[#64748B]">
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Điện thoại
              </span>
              <a
                href={`tel:${APP_CONFIG.SUPPORT_PHONE}`}
                className="font-bold text-[#C2410C] hover:underline font-mono"
              >
                {APP_CONFIG.SUPPORT_PHONE}
              </a>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Email
              </span>
              <a
                href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}
                className="font-mono text-[#1C2526] hover:underline"
              >
                {APP_CONFIG.SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>
        </>}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#E6E1D8] py-4 px-4 md:px-8 text-[11px] text-[#78716C] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>© {new Date().getFullYear()} WeTrek Vietnam.</div>
          <div className="flex items-center gap-4">
            <span>
              MÚI GIỜ: <strong className="text-[#1F4E43]">Giờ Việt Nam (GMT+7)</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
