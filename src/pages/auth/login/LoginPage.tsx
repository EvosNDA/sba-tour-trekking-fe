import React, { useState, useEffect, useRef } from 'react';
import { ScreenId } from '../../../types/expedition';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { homeScreenForRole } from '../../../app/screenAccess';
import { useI18n } from '../../../i18n/I18nProvider';
import { authApi } from '../../../features/auth/api/auth.api';
import { LanguageToggle } from '../../../components/LanguageToggle';
import {
  Mountain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Quote,
} from 'lucide-react';

export interface LoginPageProps {
  onLoginSuccess?: (email: string) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess = () => {},
  onNavigate = () => {},
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [googleSignInUnavailable, setGoogleSignInUnavailable] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { login, error: authError } = useAuth();
  const { t } = useI18n();
  const localizedAuthError = authError
    ? authError.includes('Email or password') ? t('auth.invalidCredentials')
      : authError.includes('Verify your email') ? t('auth.emailNotVerified')
        : authError.includes('Account is not active') ? t('auth.accountUnavailable')
          : authError.includes('temporarily unavailable') ? t('auth.authUnavailable')
            : authError.includes('Reset your password') ? t('auth.passwordResetRequired')
              : t('auth.genericError')
    : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const requestPasswordReset = async () => {
    if (!email.trim()) {
      setResetError(t('auth.enterEmailFirst'));
      return;
    }
    setIsResetting(true);
    setResetError(null);
    setResetSent(false);
    try {
      await authApi.forgotPassword(email.trim());
      setResetSent(true);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : t('auth.genericError'));
    } finally {
      setIsResetting(false);
    }
  };

  const completePasswordReset = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      await authApi.resetPassword(email.trim(), resetOtp.trim(), newPassword);
      setResetSent(false);
      setResetOtp('');
      setNewPassword('');
      setStatusMessage('auth.passwordResetDone');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : t('auth.genericError'));
    } finally {
      setIsResetting(false);
    }
  };

  // Initialize WebGL mountain sunset shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
        val += amp * noise(p * freq);
        freq *= 2.05;
        amp *= 0.5;
    }
    return val;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 st = uv;
    st.x *= aspect;

    float t = u_time * 0.12;

    vec3 skyTop = vec3(0.06, 0.09, 0.16);
    vec3 skyHorizon = vec3(0.76, 0.25, 0.05);
    vec3 sunGlow = vec3(1.0, 0.82, 0.62);

    vec3 col = mix(skyHorizon, skyTop, pow(uv.y, 0.85));

    vec2 sunPos = vec2(0.65 * aspect, 0.65);
    float sunDist = length(st - sunPos);
    col += sunGlow * smoothstep(0.2, 0.02, sunDist) * 0.8;
    col += vec3(0.9, 0.45, 0.18) * smoothstep(0.6, 0.0, sunDist) * 0.4;

    float clouds = fbm(vec2(st.x * 0.8 + t * 0.15, st.y * 1.5));
    float cloudMask = smoothstep(0.45, 0.8, clouds) * smoothstep(0.35, 0.85, uv.y);
    col = mix(col, vec3(0.95, 0.75, 0.65), cloudMask * 0.35);

    // Far ridge
    float m3_y = 0.48 + 0.22 * sin(st.x * 0.9 + 1.2) + 0.08 * sin(st.x * 2.3);
    m3_y += fbm(vec2(st.x * 1.8, 1.0)) * 0.08;
    if (uv.y < m3_y) {
        float depth = (m3_y - uv.y) * 3.5;
        vec3 m3Col = mix(vec3(0.65, 0.30, 0.18), vec3(0.18, 0.15, 0.25), clamp(depth, 0.0, 1.0));
        col = mix(col, m3Col, smoothstep(m3_y, m3_y - 0.005, uv.y));
    }

    // Mid ridge
    float m2_y = 0.38 + 0.25 * abs(sin(st.x * 1.4 - 0.8)) + 0.12 * cos(st.x * 3.1 + t * 0.02);
    m2_y += fbm(vec2(st.x * 2.5 + 2.0, 3.0)) * 0.06;
    if (uv.y < m2_y) {
        float facet = sin(st.x * 25.0 + uv.y * 15.0) * 0.5 + 0.5;
        vec3 litSide = vec3(0.85, 0.38, 0.15);
        vec3 shadowSide = vec3(0.12, 0.12, 0.22);
        vec3 m2Col = mix(shadowSide, litSide, facet * 0.7 + 0.2);
        col = mix(col, m2Col, smoothstep(m2_y, m2_y - 0.005, uv.y));
    }

    // Foreground silhouette
    float m1_y = 0.25 + 0.22 * abs(cos(st.x * 1.8 + 0.4)) + 0.08 * sin(st.x * 4.2);
    m1_y += fbm(vec2(st.x * 4.0, 5.0)) * 0.04;
    if (uv.y < m1_y) {
        vec3 m1Col = vec3(0.05, 0.07, 0.11);
        float rim = smoothstep(m1_y - 0.015, m1_y, uv.y);
        m1Col += vec3(0.7, 0.3, 0.1) * rim * 0.6;
        col = mix(col, m1Col, smoothstep(m1_y, m1_y - 0.004, uv.y));
    }

    col *= 0.75 + 0.25 * 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    gl_FragColor = vec4(col, 1.0);
}`;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, vs);
    const frag = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    let isDisposed = false;

    const render = (timeMs: number) => {
      if (isDisposed) return;
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timeMs * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('auth.verifying');
    try {
      const session = await login({ email, password });
      setStatusMessage('auth.loginSuccess');
      try { sessionStorage.removeItem('wetrek_partner_application_email'); } catch { /* Session storage is optional. */ }
      onLoginSuccess(email);
      onNavigate(homeScreenForRole(session.user.role));
    } catch (cause) {
      setStatusMessage(null);
      try {
        const errorCode = cause && typeof cause === 'object' && 'code' in cause ? cause.code : null;
        const pendingPartnerEmail = sessionStorage.getItem('wetrek_partner_application_email');
        if (errorCode === 'PARTNER_ACTIVATION_REQUIRED'
          || (pendingPartnerEmail && pendingPartnerEmail === email.trim().toLowerCase())) {
          sessionStorage.setItem('wetrek_partner_activation_email', email.trim());
          sessionStorage.removeItem('wetrek_partner_application_email');
          onNavigate('partner_application_submitted');
        }
      } catch {
        // Keep the regular sign-in error if browser storage is unavailable.
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => setGoogleSignInUnavailable(true);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] flex flex-col justify-between">
      {/* Top Banner Navigation Bar */}
      <div className="border-b border-[#E6E1D8] bg-white/80 backdrop-blur-md px-4 md:px-8 py-3 sticky top-10 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded bg-[#C2410C] text-white flex items-center justify-center font-bold text-sm">
                W
              </div>
              <span className="font-editorial text-xl font-bold tracking-tight text-[#1C2526]">
                WeTrek
              </span>
            </button>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('marketplace')}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              &larr; {t('auth.backMarketplace')}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <LanguageToggle />
            <span className="bg-[#B9EADB]/50 text-[#1F4E43] font-semibold px-3 py-1 rounded">
              {t('auth.signIn')}
            </span>
            <button
              onClick={() => onNavigate('registration')}
              className="text-[#64748B] hover:text-[#1C2526] px-2 py-1 cursor-pointer"
            >
              {t('auth.createAccount')}
            </button>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F4EE] rounded-full text-[#1F4E43] border border-[#E6E1D8] ml-2">
              <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider">{t('auth.safetyGuarantee')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Login Workspace */}
      <div className="relative w-full py-8 sm:py-12 px-4 md:px-8 flex-1 flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#c2410c_0.75px,transparent_0.75px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-xl shadow-xl overflow-hidden bg-white border border-[#E6E1D8]">
          {/* Left Column: Shader Panel */}
          <div className="lg:col-span-5 relative min-h-[460px] lg:min-h-[720px] bg-[#141D1E] overflow-hidden flex flex-col justify-between p-6 sm:p-10 text-white">
            <div className="absolute inset-0 w-full h-full object-cover">
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#141D1E] via-[#141D1E]/60 to-[#141D1E]/30 mix-blend-multiply pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#C2410C]/20 via-transparent to-[#141D1E]/90 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md shadow-sm border border-white/20">
                <Mountain className="w-4 h-4 text-[#FFB59D]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                  {t('auth.officialPortal')}
                </span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-6 flex flex-col gap-4">
              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white leading-tight drop-shadow-sm">
                {t('auth.loginHeadline')}<br />
                <span className="italic font-normal text-[#FFDCC3]">
                  {t('auth.loginSubheadline')}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-200/90 max-w-sm leading-relaxed">
                {t('auth.loginDescription')}
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded bg-black/40 backdrop-blur-md border border-white/10 shadow-sm w-fit">
                  <CheckCircle className="w-4 h-4 text-[#A0D0C2]" />
                  <span className="text-xs text-white font-medium">{t('auth.verifiedGuides')}</span>
                </div>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded bg-black/40 backdrop-blur-md border border-white/10 shadow-sm w-fit">
                  <ShieldCheck className="w-4 h-4 text-[#A0D0C2]" />
                  <span className="text-xs text-white font-medium">{t('auth.weatherRefund')}</span>
                </div>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded bg-black/40 backdrop-blur-md border border-white/10 shadow-sm w-fit">
                  <CheckCircle className="w-4 h-4 text-[#A0D0C2]" />
                  <span className="text-xs text-white font-medium">{t('auth.localSupport')}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 bg-black/35 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-sm">
              <div className="flex items-start gap-2.5">
                <Quote className="w-5 h-5 text-[#FFB59D] shrink-0 rotate-180" />
                <div className="flex flex-col">
                  <p className="text-xs text-stone-100 italic leading-relaxed">
                    {t('auth.testimonial')}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="font-semibold text-[#FFB59D]">Elena V.</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-300">{t('auth.trekker')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
            <div className="w-full max-w-md mx-auto flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526] tracking-tight">
                  {t('auth.welcomeBack')}
                </h2>
                <p className="text-xs text-[#64748B]">
                  {t('auth.loginDescriptionShort')}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className="text-xs font-semibold text-[#1C2526] flex items-center justify-between">
                    <span>{t('auth.email')}</span>
                    <span className="text-[10px] font-mono text-[#78716C]">{t('auth.required')}</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#78716C] absolute left-3 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F7F4EE] text-[#1C2526] text-xs sm:text-sm rounded border border-[#E6E1D8] placeholder-[#78716C] focus:outline-none focus:bg-white focus:border-[#C2410C] transition-all"
                    />
                  </div>
                </div>

                {localizedAuthError && <div>
                  <p role="alert" aria-live="assertive" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">{localizedAuthError}</p>
                </div>}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-password" className="text-xs font-semibold text-[#1C2526]">{t('auth.password')}</label>
                  {resetSent && (
                    <div role="status" aria-live="polite" className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded flex items-center justify-between">
                      <span>{t('auth.resetSent', { email })}</span>
                      <button
                        type="button"
                        onClick={() => setResetSent(false)}
                        aria-label={t('auth.dismissReset')}
                        className="text-emerald-700 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {resetSent && (
                    <div className="space-y-2 rounded border border-[#E6E1D8] bg-white p-3">
                      <label className="block text-xs font-semibold" htmlFor="reset-otp">{t('auth.resetOtp')}</label>
                      <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded border p-2 text-sm" />
                      <label className="block text-xs font-semibold" htmlFor="reset-new-password">{t('auth.newPassword')}</label>
                      <input id="reset-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded border p-2 text-sm" />
                      <button type="button" disabled={isResetting || resetOtp.length !== 6 || newPassword.length < 8} onClick={() => void completePasswordReset()} className="rounded bg-[#1F4E43] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isResetting ? t('auth.sendingReset') : t('auth.resetPassword')}</button>
                    </div>
                  )}
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#78716C] absolute left-3 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.enterPassword')}
                      className="w-full pl-9 pr-10 py-2.5 bg-[#F7F4EE] text-[#1C2526] text-xs sm:text-sm rounded border border-[#E6E1D8] placeholder-[#78716C] focus:outline-none focus:bg-white focus:border-[#C2410C] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      aria-pressed={showPassword}
                      className="absolute right-3 rounded text-[#78716C] hover:text-[#1C2526] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void requestPasswordReset()}
                    disabled={isResetting}
                    className="self-end text-xs text-[#C2410C] hover:underline font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] rounded-sm cursor-pointer"
                  >
                    {isResetting ? t('auth.sendingReset') : t('auth.forgotPassword')}
                  </button>
                  {resetError && <p role="alert" className="text-xs text-red-700">{resetError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-2 py-3 px-6 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    statusMessage === 'auth.loginSuccess'
                      ? 'bg-[#1F4E43]'
                      : 'bg-[#C2410C] hover:bg-[#9B2F00]'
                  }`}
                >
                  <span>{statusMessage ? t(statusMessage) : t('auth.signIn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-[#F7F4EE] hover:bg-[#EFECE4] text-[#1C2526] text-xs font-semibold rounded border border-[#E6E1D8] shadow-2xs hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>{t('auth.continueGoogle')}</span>
              </button>
              {googleSignInUnavailable && (
                <p role="status" aria-live="polite" className="text-center text-xs text-[#64748B]">
                  {t('auth.googleUnavailable')}
                </p>
              )}

            </div>

            <div className="w-full max-w-md mx-auto pt-4 mt-6 bg-[#FAF8F5] rounded-lg p-4 text-center flex flex-col gap-1.5 border border-[#E6E1D8]">
              <p className="text-xs text-[#64748B]">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('registration')}
                  className="font-semibold text-[#C2410C] hover:underline cursor-pointer"
                >
                  {t('auth.createFree')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#F7F4EE] border-t border-[#E6E1D8] py-4 px-4 md:px-8 text-xs text-[#64748B]"><div className="max-w-7xl mx-auto">WeTrek</div></footer>
    </div>
  );
};

export default LoginPage;
