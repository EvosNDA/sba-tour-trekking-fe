import React from 'react';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { PublicPortalLayout } from './PublicPortalLayout';

// Public & Auth pages
import HomePage from '../../pages/public/home/HomePage';
import TourListPage from '../../pages/public/tour-list/TourListPage';
import TourDetailPage from '../../pages/public/tour-detail/TourDetailPage';
import LoginPage from '../../pages/auth/login/LoginPage';
import RegisterPage from '../../pages/auth/register/RegisterPage';

import { Compass } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

export const PublicPortal: React.FC = () => {
  const { pathname } = useLocation();
  const { account, user, xRole, isAuthenticated, isInitializing } = useAuthStore();

  const isAdmin =
    (isAuthenticated &&
      (xRole === 'ADMIN' ||
        user?.role === 'admin' ||
        account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'))) ||
    (!isInitializing && xRole === 'ADMIN');

  const isGuide =
    (isAuthenticated &&
      (xRole === 'GUIDE' ||
        user?.role === 'guide' ||
        account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'GUIDE'))) ||
    (!isInitializing && xRole === 'GUIDE');

  const renderContent = () => {
    // 1. Home page `/`
    if (pathname === ROUTES.PUBLIC.HOME || pathname === '' || pathname === '/home') {
      if (!isInitializing) {
        if (isAdmin) {
          navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
          return null;
        }
        if (isGuide) {
          navigateTo(ROUTES.GUIDE.SCHEDULES, { replace: true });
          return null;
        }
      }
      return <HomePage />;
    }

    // 2. Tour list `/tours`
    if (pathname === ROUTES.PUBLIC.TOURS || pathname === '/tours/') {
      return <TourListPage />;
    }

    // 3. Tour detail `/tours/:tourId`
    const tourDetailMatch = pathname.match(/^\/tours\/(\d+)\/?$/);
    if (tourDetailMatch) {
      const tourId = Number(tourDetailMatch[1]);
      return <TourDetailPage tourId={tourId} />;
    }

    // 4. Auth routes
    if (pathname === ROUTES.AUTH.LOGIN) {
      return <LoginPage initialMode="login" />;
    }
    if (pathname === ROUTES.AUTH.REGISTER) {
      return <RegisterPage />;
    }
    if (pathname === ROUTES.AUTH.VERIFY_EMAIL) {
      return <LoginPage initialMode="verify-email" />;
    }
    if (pathname === ROUTES.AUTH.FORGOT_PASSWORD) {
      return <LoginPage initialMode="forgot-password" />;
    }
    if (pathname === ROUTES.AUTH.RESET_PASSWORD) {
      return <LoginPage initialMode="reset-password" />;
    }

    // Fallback 404 page
    return (
      <div className="min-h-[65vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
            Lỗi 404
          </span>
          <h1 className="font-editorial text-2xl font-bold text-[#1C2526] mt-1 mb-2">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            Đường dẫn <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded">{pathname}</code> không tồn tại hoặc đã được chuyển đi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Về trang chủ
            </button>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Danh sách tour
            </button>
          </div>
        </div>
      </div>
    );
  };

  return <PublicPortalLayout>{renderContent()}</PublicPortalLayout>;
};

export default PublicPortal;
