import React, { useEffect } from 'react';
import { ArrowLeft, Compass, Mountain } from 'lucide-react';
import { AuthForm, type AuthFormMode } from '../../../features/auth/components/AuthForm';
import { useLocation, useSearchParams, navigateTo } from '../../../lib/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { authStore } from '../../../stores/auth.store';
import { ROUTES } from '../../../constants/routes';
import mountainImage from '../../../assets/images/bach_moc_cloud_sea_1792001302458.jpg';

export interface LoginPageProps {
  initialMode?: AuthFormMode;
  onLoginSuccess?: (email: string) => void;
  onNavigate?: (screen: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isInitializing, bookingIntent, setBookingIntent } = useAuth();
  const redirectParam = searchParams.get('redirect');
  const emailParam = searchParams.get('email') || '';

  const resolvedMode: AuthFormMode = initialMode
    ? initialMode
    : pathname === ROUTES.AUTH.VERIFY_EMAIL
    ? 'verify-email'
    : pathname === ROUTES.AUTH.FORGOT_PASSWORD
    ? 'forgot-password'
    : pathname === ROUTES.AUTH.RESET_PASSWORD
    ? 'reset-password'
    : pathname === ROUTES.AUTH.REGISTER
    ? 'register'
    : 'login';

  const isCurrentUserAdmin = () => {
    const state = authStore.getState();
    return (
      state.xRole === 'ADMIN' ||
      state.user?.role === 'admin' ||
      state.account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN')
    );
  };

  const isCurrentUserGuide = () => {
    const state = authStore.getState();
    return (
      state.xRole === 'GUIDE' ||
      state.user?.role === 'guide' ||
      state.account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'GUIDE')
    );
  };

  const hasBookingRedirect = Boolean(redirectParam && redirectParam.startsWith('/booking/'));

  useEffect(() => {
    if (!redirectParam && bookingIntent) setBookingIntent(null);
  }, [redirectParam, bookingIntent, setBookingIntent]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated && (resolvedMode === 'login' || resolvedMode === 'register')) {
      if (isCurrentUserAdmin()) {
        navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
        return;
      }
      if (isCurrentUserGuide()) {
        const target = redirectParam && redirectParam.startsWith('/guide') ? redirectParam : ROUTES.GUIDE.SCHEDULES;
        navigateTo(target, { replace: true });
        return;
      }
      navigateTo(redirectParam || ROUTES.PUBLIC.HOME, { replace: true });
    }
  }, [isInitializing, isAuthenticated, resolvedMode, redirectParam]);

  const handleSuccess = () => {
    if (isCurrentUserAdmin()) {
      navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
      return;
    }
    if (isCurrentUserGuide()) {
      const target = redirectParam && redirectParam.startsWith('/guide') ? redirectParam : ROUTES.GUIDE.SCHEDULES;
      navigateTo(target, { replace: true });
      return;
    }
    navigateTo(redirectParam || ROUTES.PUBLIC.HOME, { replace: true });
  };

  const handleModeChange = (nextMode: AuthFormMode, email?: string) => {
    const params = new URLSearchParams();
    if (redirectParam) params.set('redirect', redirectParam);
    if (email) params.set('email', email);
    const qs = params.toString() ? `?${params.toString()}` : '';
    if (nextMode === 'register') navigateTo(`${ROUTES.AUTH.REGISTER}${qs}`);
    else if (nextMode === 'verify-email') navigateTo(`${ROUTES.AUTH.VERIFY_EMAIL}${qs}`);
    else if (nextMode === 'forgot-password') navigateTo(`${ROUTES.AUTH.FORGOT_PASSWORD}${qs}`);
    else if (nextMode === 'reset-password') navigateTo(`${ROUTES.AUTH.RESET_PASSWORD}${qs}`);
    else navigateTo(`${ROUTES.AUTH.LOGIN}${qs}`);
  };

  return (
    <div className="bg-[#FDFBF7] px-4 py-8 text-[#1C2526] sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.HOME)}
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[#57534E] transition-colors hover:text-[#1F4E43] cursor-pointer">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Về trang chủ
        </button>
        <div className="grid overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-[#163C33] p-10 text-white lg:flex xl:p-12" aria-label="Khám phá cùng WeTrek">
            <img src={mountainImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#102D25]/45 via-[#102D25]/20 to-[#102D25]/95" />
            <div className="relative flex items-center gap-2.5 text-sm font-semibold tracking-wide">
              <Mountain className="h-6 w-6" aria-hidden="true" />
              WeTrek / Ra ngoài, đi xa hơn.
            </div>
            <div className="relative mt-32">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#E5DFD2]">Mỗi bước chân, một trải nghiệm</p>
              <h2 className="max-w-sm text-4xl font-semibold leading-[1.18] tracking-tight xl:text-5xl">
                Những cung đường mới đang chờ bạn.
              </h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-white/85">
                Lưu thông tin cá nhân, theo dõi đặt chỗ và chuẩn bị cho hành trình tiếp theo cùng WeTrek.
              </p>
              <div className="mt-10 border-t border-white/25 pt-5">
                <p className="text-sm font-medium">Bạch Mộc Lương Tử</p>
                <p className="mt-1 text-xs text-white/75">Những tầng mây giữa núi rừng Tây Bắc</p>
              </div>
            </div>
          </aside>
          <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
            <div className="mx-auto w-full max-w-md">
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1F4E43]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" aria-hidden="true" />
                Tài khoản WeTrek
              </p>
              {bookingIntent && hasBookingRedirect && (
                <div className="mb-7 flex items-start gap-3 rounded-xl border border-[#C8D8D0] bg-[#F0F5F1] p-4" role="status">
                  <Compass className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E43]" aria-hidden="true" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-[#1F4E43]">Tiếp tục hành trình của bạn</p>
                    <p className="mt-1 break-words leading-relaxed text-[#57534E]">
                      {bookingIntent.tourTitle ? `Đã lưu lựa chọn “${bookingIntent.tourTitle}”.` : 'Đã lưu lựa chọn tour của bạn.'}
                      {' '}Đăng nhập để tiếp tục đặt chỗ.
                    </p>
                  </div>
                </div>
              )}
              <AuthForm initialMode={resolvedMode} initialEmail={emailParam} onModeChange={handleModeChange} onAuthSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
