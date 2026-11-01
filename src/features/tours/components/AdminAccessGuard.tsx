import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth.store';
import { useLocation, navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface AdminAccessGuardProps {
  children: React.ReactNode;
  forbiddenError?: boolean;
}

export function isUserAdmin(
  roles?: string[] | null,
  primaryRole?: string | null
): boolean {
  if (primaryRole?.toLowerCase() === 'admin') return true;
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((r) => {
    const upper = String(r).toUpperCase();
    return upper === 'ADMIN' || upper === 'ROLE_ADMIN';
  });
}

export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({
  children,
  forbiddenError = false,
}) => {
  const { account, user, isAuthenticated, isInitializing } = useAuthStore();
  const { pathname, search } = useLocation();

  const hasAdminRole = isUserAdmin(account?.roles, user?.role);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      const returnUrl = `${pathname}${search || ''}`;
      navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(returnUrl)}`, {
        replace: true,
      });
    }
  }, [isInitializing, isAuthenticated, pathname, search]);

  if (isInitializing) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-200/70 rounded-2xl w-1/3" />
          <div className="h-96 bg-stone-200/70 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasAdminRole || forbiddenError) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              403 Forbidden • Không đủ quyền
            </span>
            <h1 className="font-editorial text-2xl font-bold text-[#1C2526] pt-1">
              Bạn không có quyền truy cập khu vực quản trị
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Chức năng quản trị tour trekking chỉ dành cho tài khoản có vai trò{' '}
              <strong className="font-mono text-stone-800">ADMIN</strong>. Tài khoản hiện tại (
              <span className="font-medium text-stone-800">{account?.email}</span>) không có quyền thực hiện thao tác này.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.TOURS)}`
                )
              }
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đổi tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
