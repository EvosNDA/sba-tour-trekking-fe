import React, { useEffect } from 'react';
import { useLocation, navigateTo } from '../lib/navigation';
import { AdminPortal } from '../portals/admin/AdminPortal';
import { GuidePortal } from '../portals/guide/GuidePortal';
import { PartnerPortal } from '../portals/partner/PartnerPortal';
import { CustomerPortal } from '../portals/customer/CustomerPortal';
import { PublicPortal } from '../portals/public/PublicPortal';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../constants/routes';

/**
 * AppRouter dispatches cleanly across dedicated Role Portals.
 * Authorization & role checking is governed by `x-role` rather than ad-hoc inline `if` conditions.
 *
 * 1. Admin Portal (`/admin/*`)      -> Guarded by x-role: ADMIN
 * 2. Partner Portal (`/partner/*`)  -> Guarded by x-role: PARTNER / GUIDE / ADMIN
 * 3. Customer Portal (`/booking/*`, `/account/*`, `/customer/*`, `/payment/*`) -> Guarded by x-role: CUSTOMER / PARTNER / GUIDE / ADMIN
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

  const isHomeRoute = pathname === ROUTES.PUBLIC.HOME || pathname === '' || pathname === '/home';

  // If logged in as admin and entering or visiting the home page, redirect to Admin Dashboard
  useEffect(() => {
    if (!isInitializing && isAdmin && isHomeRoute) {
      navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
    }
  }, [isInitializing, isAdmin, isHomeRoute]);

  // Prevent home page from rendering for admin: render AdminPortal immediately without flicker
  if (!isInitializing && isAdmin && isHomeRoute) {
    return <AdminPortal />;
  }

  // 1. Admin Portal Domain
  if (pathname.startsWith('/admin')) {
    return <AdminPortal />;
  }

  // 2. Guide Portal Domain
  if (pathname.startsWith('/guide')) {
    return <GuidePortal />;
  }

  // 3. Partner Portal Domain
  if (pathname.startsWith('/partner')) {
    return <PartnerPortal />;
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
