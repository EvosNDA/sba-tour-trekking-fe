import React, { useState, useEffect, useRef } from 'react';
import { ScreenId } from '../../../types/expedition';
import { authApi } from '../../../features/auth/api/auth.api';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Radio,
  Compass,
  Eye,
  EyeOff,
  ArrowRight,
  Send,
  Timer,
} from 'lucide-react';

export interface RegisterPageProps {
  onSuccess?: (userData: { name: string; email: string; phone: string }) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess = () => {},
  onNavigate = () => {},
}) => {
  const { t } = useI18n();
  const [fullName, setFullName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeRules, setAgreeRules] = useState(true);
  const [agreeWeatherAlerts, setAgreeWeatherAlerts] = useState(true);
  const { login } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const registrationPayload = () => ({
    fullName,
    email,
    password,
    phone: `${phoneCountry} ${phoneNumber}`,
  });

  const errorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'MAIL_UNAVAILABLE') return t('auth.mailUnavailable');
      if (error.code === 'EMAIL_ALREADY_REGISTERED') return t('auth.emailAlreadyExists');
      if (error.code === 'INVALID_OTP') return t('auth.invalidOtp');
      if (error.code === 'TOO_MANY_ATTEMPTS') return t('auth.tooManyAttempts');
    }
    return t('auth.genericError');
  };

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const verifyOtp = async (code: string) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await authApi.verifyEmail(email, code);
    } catch (error) {
      setFormError(errorMessage(error));
      setOtpDigits(['', '', '', '', '', '']);
      document.getElementById('otp-input-0')?.focus();
      setIsSubmitting(false);
      return;
    }
    try {
      await login({ email, password });
      onSuccess({ name: fullName, email, phone: `${phoneCountry} ${phoneNumber}` });
    } catch {
      setFormError(t('auth.verifiedLoginHint'));
      onNavigate('login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    value = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
    if (updated.every(Boolean)) void verifyOtp(updated.join(''));
  };

  const handleSendOtp = async () => {
    if ((isOtpSent && otpTimer > 0) || isSubmitting) return;
    if (!formRef.current?.reportValidity()) return;
    if (!isOtpSent && password !== confirmPassword) {
      setFormError(t('auth.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isOtpSent) await authApi.resendVerification(email);
      else await authApi.requestOtp(registrationPayload());
      setIsOtpSent(true);
      setOtpTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (error) {
      setFormError(errorMessage(error));
      if (error && typeof error === 'object' && 'code' in error && error.code === 'MAIL_UNAVAILABLE') {
        // The backend saved the unverified account; enable its resend-verification flow after cooldown.
        setIsOtpSent(true);
        setOtpTimer(60);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) setFormError(t('auth.sendOtpFirst'));
    else if (!otpDigits.every(Boolean)) setFormError(t('auth.enterAllOtp'));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      {/* Step Subheader */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
        <span className="w-2.5 h-2.5 rounded-full border-2 border-[#C2410C] flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-[#C2410C]"></span>
        </span>
        <span>{t('auth.registerStep')}</span>
      </div>

      {/* Main Registration Split Container */}
      <div className="max-w-5xl mx-auto bg-white border border-[#E6E1D8] rounded-xl shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 mb-10">
        {/* Left Column: Trust Guarantees */}
        <div className="lg:col-span-5 bg-radial from-[#F2FBFC] to-[#F7F4EE] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#E6E1D8] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#C2410C] font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]"></span>
              <span>{t('auth.registerEyebrow')}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526] mb-3 leading-tight">
              {t('auth.registerHeadline')}
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-8">
              {t('auth.registerDescription')}
            </p>

            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold block">
                {t('auth.trustGuarantees')}
              </span>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    {t('auth.weatherEscrow')}
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    {t('auth.weatherEscrowDescription')}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    {t('auth.certifiedGuides')}
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    {t('auth.certifiedGuidesDescription')}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-emerald-100 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    {t('auth.satelliteSos')}
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    {t('auth.satelliteDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#E6E1D8]/80 text-[11px] text-[#78716C]">
            <p>{t('auth.certifiedOperations')}</p>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-white flex flex-col justify-between">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
                {t('auth.registrationLabel')}
              </span>
              <span className="text-[10px] font-mono text-[#78716C]">
                {t('auth.secureSsl')}
              </span>
            </div>

            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                {t('auth.createClimberAccount')}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t('auth.registrationIntro')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-[#1C2526]">{t('auth.fullLegalName')}</label>
                <span className="text-[10px] text-[#78716C] font-mono">{t('auth.nameForPasses')}</span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                    disabled={isOtpSent}
                  placeholder={t('auth.namePlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                {t('auth.phone')} <span className="text-[#64748B] font-normal">{t('auth.phoneHint')}</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                  className="bg-[#F7F4EE] border border-[#E6E1D8] text-xs font-semibold px-2.5 py-2 rounded focus:outline-none cursor-pointer"
                >
                  <option value="+84">VN +84 (VN)</option>
                  <option value="+1">US +1 (USA)</option>
                  <option value="+44">UK +44 (GBR)</option>
                  <option value="+61">AU +61 (AUS)</option>
                  <option value="+49">DE +49 (DEU)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isOtpSent}
                    placeholder={t('auth.phonePlaceholder')}
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-[#1C2526] flex items-center gap-1.5">
                  <span>{t('auth.email')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </label>
                {isOtpSent && <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">{t('auth.verifyingEmail')}</span>}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isOtpSent}
                    placeholder="name@example.com"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E6E1D8] rounded text-[#1C2526] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={(isOtpSent && otpTimer > 0) || isSubmitting}
                  className="bg-[#1F4E43] hover:bg-[#15372F] disabled:bg-stone-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? t('auth.pleaseWait') : isOtpSent ? otpTimer > 0 ? t('auth.codeSent') : t('auth.resendOtp') : t('auth.sendOtp')}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                  {t('auth.createPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isOtpSent}
                    placeholder={t('auth.passwordHint')}
                    className="w-full pr-8 pl-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C2526] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isOtpSent}
                    placeholder={t('auth.retypePassword')}
                    className="w-full pr-8 pl-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C2526] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {isOtpSent && (
              <div className="bg-[#FDFBF7] border border-[#E6E1D8] rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="font-semibold text-[#1C2526] font-mono text-[11px]">
                    {t('auth.enterOtp')} <span className="text-[#C2410C]">{t('auth.otpRequired')}</span>
                  </span>
                  <div role="timer" aria-live="polite" className={`flex items-center gap-2 rounded-md border px-3 py-2 ${otpTimer > 0 ? 'border-[#C2410C]/30 bg-orange-50 text-[#9B2F00]' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                    <Timer className="w-4 h-4 shrink-0" />
                    {otpTimer > 0 ? <span className="text-xs font-medium">{t('auth.resendIn')} <strong className="font-mono text-base tabular-nums">00:{String(otpTimer).padStart(2, '0')}</strong></span> : <span className="text-xs font-medium">{t('auth.resendNow')}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-xs mx-auto mb-2">
                  {otpDigits.map((digit, idx) => (
                    <React.Fragment key={idx}>
                      {idx === 3 && <span className="text-stone-400 font-bold">-</span>}
                      <input
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        aria-label={t('auth.otpDigit', { digit: idx + 1 })}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6 - idx);
                          if (!pasted) return;
                          e.preventDefault();
                          const updated = [...otpDigits];
                          [...pasted].forEach((char, offset) => { updated[idx + offset] = char; });
                          setOtpDigits(updated);
                          if (updated.every(Boolean)) void verifyOtp(updated.join(''));
                          else document.getElementById(`otp-input-${Math.min(idx + pasted.length, 5)}`)?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) document.getElementById(`otp-input-${idx - 1}`)?.focus();
                        }}
                        disabled={isSubmitting}
                        className="w-9 h-10 sm:w-10 sm:h-11 text-center font-mono text-base font-bold bg-white border border-[#E6E1D8] rounded focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] focus:outline-none"
                      />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {formError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800">{formError}</p>}

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
                />
                <span className="text-[#2D3748] leading-tight">
                  {t('auth.safetyRulesAgree')} <strong className="text-[#1C2526]">{t('auth.mountainSafetyRules')}</strong> {t('auth.escrowPolicy')}
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeWeatherAlerts}
                  onChange={(e) => setAgreeWeatherAlerts(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
                />
                <span className="text-[#2D3748] leading-tight">
                  {t('auth.weatherAlertsAgree')}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!isOtpSent || !otpDigits.every(Boolean) || isSubmitting}
              className="w-full bg-[#C2410C] hover:bg-[#9B2F00] disabled:bg-stone-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
            >
              <span>{t('auth.completeRegistration')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs text-[#64748B] pt-2">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                {t('auth.alreadyClimber')} <strong className="text-[#1C2526] underline">{t('auth.signInHere')}</strong>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
