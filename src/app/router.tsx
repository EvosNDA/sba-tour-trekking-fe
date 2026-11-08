import React, { useEffect } from 'react';
import { useLocation, navigateTo } from '../lib/navigation';
import { AdminPortal } from '../portals/admin/AdminPortal';
import { GuidePortal } from '../portals/guide/GuidePortal';
import { CustomerPortal } from '../portals/customer/CustomerPortal';
import { PublicPortal } from '../portals/public/PublicPortal';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../constants/routes';

/**
 * AppRouter dispatches cleanly across dedicated Role Portals.
 * Authorization & role checking is governed by `x-role` rather than ad-hoc inline `if` conditions.
 *
 * 1. Admin Portal (`/admin/*`)      -> Guarded by x-role: ADMIN
 * 2. Guide Portal (`/guide/*`)      -> Guarded by x-role: GUIDE / ADMIN
 * 3. Customer Portal (`/booking/*`, `/account/*`, `/customer/*`, `/payment/*`) -> Guarded by x-role: CUSTOMER / GUIDE / ADMIN
 * 4. Public Portal (fallback)       -> Public accessibility (`/`, `/tours/*`, `/login`, `/register`, etc.)
 */
export const AppRouter: React.FC = () => {
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

  const isHomeRoute = pathname === ROUTES.PUBLIC.HOME || pathname === '' || pathname === '/home';

  // If logged in as admin or guide and entering or visiting the home page, redirect to respective Dashboard
  useEffect(() => {
    if (!isInitializing && isHomeRoute) {
      if (isAdmin) {
        navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else if (isGuide) {
        navigateTo(ROUTES.GUIDE.SCHEDULES, { replace: true });
      }
    }
  }, [isInitializing, isAdmin, isGuide, isHomeRoute]);

  // Prevent home page from rendering for admin / guide: render respective Portal immediately without flicker
  if (!isInitializing && isHomeRoute) {
    if (isAdmin) return <AdminPortal />;
    if (isGuide) return <GuidePortal />;
  }

  // 1. Admin Portal Domain
  if (pathname.startsWith('/admin')) {
    return <AdminPortal />;
  }

  // 2. Guide Portal Domain
  if (pathname.startsWith('/guide')) {
    return <GuidePortal />;
  }

  // Redirect legacy /partner routes to appropriate dashboard or home
  if (pathname.startsWith('/partner')) {
    if (isAdmin) {
      navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
    } else if (isGuide) {
      navigateTo(ROUTES.GUIDE.SCHEDULES, { replace: true });
    } else {
      navigateTo(ROUTES.PUBLIC.HOME, { replace: true });
    }
    return null;
  }

  // 3. Customer Portal Domain
  if (
    pathname.startsWith('/booking') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/payment')
  ) {
    return <CustomerPortal />;
  }

  // 4. Public Portal Domain
  return <PublicPortal />;
};

export default AppRouter;
