import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuthStore, XRole } from '../../stores/auth.store';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';

export interface RequireXRoleProps {
  allowedRoles: XRole | XRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export const RequireXRole: React.FC<RequireXRoleProps> = ({
  allowedRoles,
  children,
  fallbackTitle = 'Không đủ quyền truy cập (403 Forbidden)',
  fallbackMessage,
}) => {
  const { account, user, xRole, isAuthenticated, isInitializing, checkXRole } = useAuthStore();
  const { pathname, search } = useLocation();

  const allowedList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const isAuthorized = checkXRole(allowedList);

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
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-stone-200/70 rounded-xl w-1/4" />
          <div className="h-80 bg-stone-200/70 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAuthorized) {
    const defaultMsg = `Portal này yêu cầu quyền [${allowedList.join(
      ', '
    )}]. Vai trò hiện tại của tài khoản là [${xRole}], không đủ thẩm quyền để truy cập tài nguyên này.`;

    return (
      <div
        data-x-role={xRole}
        className="min-h-[70vh] bg-[#FDFBF7] py-16 px-4 flex items-center justify-center font-sans"
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Vai trò: {xRole} • 403 Forbidden
            </span>
            <h1 className="font-editorial text-2xl font-bold text-[#1C2526] pt-1">
              {fallbackTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {fallbackMessage || defaultMsg}
            </p>
            <div className="pt-1 text-[11px] font-mono text-stone-400">
              Tài khoản: {account?.email || user?.email}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(pathname + (search || ''))}`
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

  return (
    <div data-x-role={xRole} className="w-full">
      {children}
    </div>
  );
};
