import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { APP_CONFIG } from '../../../constants/config';
import { toast } from '../../../components/ui/Toast';

export type AuthFormMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

export interface AuthFormProps {
  initialMode?: AuthFormMode;
  initialEmail?: string;
  onAuthSuccess?: () => void;
  onModeChange?: (mode: AuthFormMode, email?: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthForm: React.FC<AuthFormProps> = ({
  initialMode = 'login',
  initialEmail = '',
  onAuthSuccess,
  onModeChange,
}) => {
  const {
    login,
    loginGoogle,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    isLoading,
    apiError,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthFormMode>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Google Identity Services initialization if GOOGLE_CLIENT_ID is configured
  useEffect(() => {
    if (!APP_CONFIG.GOOGLE_CLIENT_ID) return;
    if (mode !== 'login' && mode !== 'register') return;

    let disposed = false;
    const initGoogleButton = () => {
      if (!disposed && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (response?.credential) {
              try {
                await loginGoogle({ idToken: response.credential });
                toast.success('Đăng nhập bằng Google thành công!');
                onAuthSuccess?.();
              } catch {
                // Error already stored in hook
              }
            }
          },
        });
        const btnContainer = document.getElementById('google-signin-button-container');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: Math.min(360, btnContainer.parentElement?.clientWidth || 280),
            text: 'continue_with',
          });
        }
      }
    };

    let script = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    const isNewScript = !script;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
    }

    // Remounted forms must also wait for an existing, still-loading SDK script.
    script.addEventListener('load', initGoogleButton);
    if (window.google?.accounts?.id) {
      initGoogleButton();
    } else if (isNewScript) {
      document.body.appendChild(script);
    }

    return () => {
      disposed = true;
      script.removeEventListener('load', initGoogleButton);
    };
  }, [mode, loginGoogle, onAuthSuccess]);

  const switchMode = (nextMode: AuthFormMode, targetEmail?: string) => {
    clearError();
    setInfoMessage(null);
    setMode(nextMode);
    if (targetEmail !== undefined) {
      setEmail(targetEmail);
    }
    onModeChange?.(nextMode, targetEmail ?? email);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      // Handle paste of full 6-digit OTP
      const chars = cleaned.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) next[index + idx] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(index + chars.length, 5);
      document.getElementById(`auth-otp-${focusIdx}`)?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    if (index < 5) {
      document.getElementById(`auth-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`auth-otp-${index - 1}`)?.focus();
    }
  };

  const otpString = otpDigits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
        toast.success('Đăng nhập thành công!');
        onAuthSuccess?.();
      } else if (mode === 'register') {
        const res = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        setCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        toast.info(res.message || 'Đã gửi mã xác thực 6 chữ số tới email của bạn.');
        switchMode('verify-email', email.trim());
      } else if (mode === 'verify-email') {
        if (otpString.length !== 6) {
          toast.warning('Vui lòng nhập đủ 6 chữ số OTP.');
          return;
        }
        await verifyEmail({ email: email.trim(), otp: otpString });
        toast.success('Xác thực email thành công! Đang đăng nhập...');
        if (password) {
          try {
            await login({ email: email.trim(), password });
            onAuthSuccess?.();
            return;
          } catch {
            switchMode('login', email.trim());
            setInfoMessage('Email đã được xác thực thành công. Vui lòng đăng nhập.');
            return;
          }
        }
        switchMode('login', email.trim());
        setInfoMessage('Email đã được xác thực thành công. Vui lòng nhập mật khẩu để đăng nhập.');
      } else if (mode === 'forgot-password') {
        const res = await forgotPassword(email.trim());
        setCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        switchMode('reset-password', email.trim());
        setInfoMessage(res.message || 'Nếu tài khoản hợp lệ, mã OTP khôi phục đã được gửi qua email.');
      } else if (mode === 'reset-password') {
        if (otpString.length !== 6) {
          toast.warning('Vui lòng nhập đủ 6 chữ số OTP.');
          return;
        }
        const res = await resetPassword({
          email: email.trim(),
          otp: otpString,
          newPassword,
        });
        toast.success(res.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
        setPassword('');
        setNewPassword('');
        switchMode('login', email.trim());
      }
    } catch (err: any) {
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        toast.warning('Tài khoản chưa xác thực email. Vui lòng nhập mã OTP.');
        switchMode('verify-email', email.trim());
      } else if (err?.code === 'MAIL_UNAVAILABLE') {
        setCooldown(60);
        switchMode('verify-email', email.trim());
        setInfoMessage(
          'Tài khoản đã được lưu nhưng email xác thực chưa gửi được. Bạn có thể yêu cầu gửi lại OTP sau 60 giây.'
        );
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !email.trim()) return;
    clearError();
    try {
      if (mode === 'reset-password') {
        await forgotPassword(email.trim());
      } else {
        await resendVerification(email.trim());
      }
      setCooldown(60);
      toast.info('Yêu cầu gửi lại mã OTP đã được tiếp nhận.');
    } catch {
      // Handled by hook
    }
  };

  const fieldErrors = apiError?.fieldErrors || {};

  return (
    <div className="w-full space-y-7">
      {/* Mode-specific heading */}
      <div>
        <div className="space-y-3 mb-2">
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold leading-tight text-[#1C2526] tracking-tight">
            {mode === 'login' && 'Chào mừng trở lại'}
            {mode === 'register' && 'Tạo tài khoản WeTrek'}
            {mode === 'verify-email' && 'Xác thực Email'}
            {mode === 'forgot-password' && 'Khôi phục mật khẩu'}
            {mode === 'reset-password' && 'Thiết lập mật khẩu mới'}
          </h1>
          <p className="break-words text-sm leading-relaxed text-[#57534E]">
            {mode === 'login' && 'Hành trình tiếp theo bắt đầu từ đây. Đăng nhập để quản lý thông tin và đặt chỗ của bạn.'}
            {mode === 'register' && 'Tạo tài khoản để đặt chỗ và lưu thông tin cho những chuyến đi sắp tới.'}
            {mode === 'verify-email' && `Nhập mã xác thực 6 chữ số gửi đến ${email || 'email của bạn'}.`}
            {mode === 'forgot-password' && 'Nhập email tài khoản để nhận mã OTP khôi phục mật khẩu.'}
            {mode === 'reset-password' && 'Nhập mã OTP xác thực và mật khẩu mới an toàn.'}
          </p>
        </div>
      </div>

      {infoMessage && (
        <div role="status" className="p-3.5 rounded-xl bg-[#B9EADB]/40 border border-[#88D4BC] text-[#1F4E43] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{infoMessage}</div>
        </div>
      )}

      {apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1.5"
        >
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span>{apiError.message}</span>
            </div>
          </div>

          {Object.keys(fieldErrors).length > 0 && (
            <ul className="list-disc list-inside pl-5 text-[11px] text-red-700 space-y-0.5">
              {Object.entries(fieldErrors).map(([field, msg]) => (
                <li key={field}>
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
        {mode === 'register' && (
          <>
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-sm font-medium text-[#1C2526] mb-2"
              >
                Họ và tên đầy đủ <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-fullname"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'auth-fullname-error' : undefined}
                  type="text"
                  required
                  maxLength={200}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Khoa"
                  className={`w-full pl-10 pr-4 min-h-12 py-3 text-base sm:text-sm bg-white border rounded-lg text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                    fieldErrors.fullName ? 'border-red-500' : 'border-[#E6E1D8] focus:border-[#C2410C]'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <span id="auth-fullname-error" className="text-xs text-red-700 mt-1.5 block">{fieldErrors.fullName}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-phone"
                className="block text-sm font-medium text-[#1C2526] mb-2"
              >
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-phone"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'auth-phone-error' : undefined}
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0901234567"
                  className={`w-full pl-10 pr-4 min-h-12 py-3 text-base sm:text-sm bg-white border rounded-lg text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                    fieldErrors.phone ? 'border-red-500' : 'border-[#E6E1D8] focus:border-[#C2410C]'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <span id="auth-phone-error" className="text-xs text-red-700 mt-1.5 block">{fieldErrors.phone}</span>
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-[#1C2526] mb-2">
            Địa chỉ Email <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="auth-email"
              aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              className={`w-full pl-10 pr-4 min-h-12 py-3 text-base sm:text-sm bg-white border rounded-lg text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                fieldErrors.email ? 'border-red-500' : 'border-[#E6E1D8] focus:border-[#C2410C]'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <span id="auth-email-error" className="text-xs text-red-700 mt-1.5 block">{fieldErrors.email}</span>
          )}
        </div>

        {(mode === 'verify-email' || mode === 'reset-password') && (
          <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="auth-otp-0"
                className="text-xs font-bold text-[#1C2526] flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Mã xác thực OTP (6 chữ số)</span>
              </label>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleResendOtp}
                className="text-xs font-semibold text-[#C2410C] hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại OTP'}</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 max-w-xs mx-auto">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`auth-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Chữ số OTP thứ ${idx + 1}`}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="min-w-0 w-full h-12 text-center font-mono text-lg font-bold bg-white border border-[#D6CEBE] rounded-xl text-[#1C2526] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/25"
                />
              ))}
            </div>
            <p className="text-[11px] text-[#64748B] text-center">
              Mã OTP có hiệu lực trong 5 phút (tối đa 5 lần thử).
            </p>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div>
            <div className="flex items-center justify-between mb-2 gap-3">
              <label htmlFor="auth-password" className="text-sm font-medium text-[#1C2526]">
                Mật khẩu <span className="text-red-600">*</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password', email)}
                  className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'register'
                    ? 'Tối thiểu 8 ký tự (chữ hoa, chữ thường, số...)'
                    : 'Nhập mật khẩu của bạn'
                }
                className={`w-full pl-10 pr-10 min-h-12 py-3 text-base sm:text-sm bg-white border rounded-lg text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                  fieldErrors.password ? 'border-red-500' : 'border-[#E6E1D8] focus:border-[#C2410C]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 rounded-md text-[#78716C] hover:text-[#1C2526] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="auth-password-error" className="text-xs text-red-700 mt-1.5 block">{fieldErrors.password}</span>
            )}
          </div>
        )}

        {mode === 'reset-password' && (
          <div>
            <label
              htmlFor="auth-new-password"
              className="block text-sm font-medium text-[#1C2526] mb-2"
            >
              Mật khẩu mới <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-new-password"
                aria-invalid={Boolean(fieldErrors.newPassword)}
                  aria-describedby={fieldErrors.newPassword ? 'auth-new-password-error' : undefined}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới an toàn"
                className={`w-full pl-10 pr-10 min-h-12 py-3 text-base sm:text-sm bg-white border rounded-lg text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                  fieldErrors.newPassword
                    ? 'border-red-500'
                    : 'border-[#E6E1D8] focus:border-[#C2410C]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 rounded-md text-[#78716C] hover:text-[#1C2526] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <span id="auth-new-password-error" className="text-xs text-red-700 mt-1.5 block">{fieldErrors.newPassword}</span>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-12 py-3 px-6 rounded-lg bg-[#C2410C] hover:bg-[#9B2F00] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <span>
            {isLoading
              ? 'Đang xử lý...'
              : mode === 'login'
              ? 'Đăng nhập'
              : mode === 'register'
              ? 'Đăng ký & Nhận mã OTP'
              : mode === 'verify-email'
              ? 'Xác nhận mã OTP'
              : mode === 'forgot-password'
              ? 'Gửi mã OTP khôi phục'
              : 'Đặt lại mật khẩu mới'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Google Sign-In Section */}
      {(mode === 'login' || mode === 'register') && (
        <div className="space-y-3 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6E1D8]" />
            </div>
            <span className="relative px-3 bg-white text-xs text-[#78716C]">
              Hoặc tiếp tục với
            </span>
          </div>

          {APP_CONFIG.GOOGLE_CLIENT_ID ? (
            <div className="flex w-full min-w-0 justify-center overflow-hidden">
              <div id="google-signin-button-container" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#F7F4EE] border border-[#E6E1D8] text-center text-xs text-[#64748B]">
              Đăng nhập Google hiện chưa khả dụng. Bạn có thể tiếp tục bằng email và mật khẩu.
            </div>
          )}
        </div>
      )}

      {/* Mode Switch Links */}
      <div className="pt-5 border-t border-[#E6E1D8] flex flex-col items-start gap-4 text-sm text-[#64748B]">
        {mode === 'login' && (
          <>
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => switchMode('register', email)}
                className="font-semibold text-[#C2410C] hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </span>
            <button
              type="button"
              onClick={() => switchMode('verify-email', email)}
              className="text-[#1F4E43] font-medium hover:underline cursor-pointer"
            >
              Nhập mã OTP xác thực email
            </button>
          </>
        )}

        {mode === 'register' && (
          <span>
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => switchMode('login', email)}
              className="font-semibold text-[#C2410C] hover:underline cursor-pointer"
            >
              Đăng nhập tại đây
            </button>
          </span>
        )}

        {(mode === 'verify-email' || mode === 'forgot-password' || mode === 'reset-password') && (
          <button
            type="button"
            onClick={() => switchMode('login', email)}
            className="font-semibold text-[#1F4E43] hover:underline cursor-pointer"
          >
            &larr; Quay lại trang Đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};
