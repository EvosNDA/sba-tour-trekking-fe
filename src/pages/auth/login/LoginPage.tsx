import React, { useEffect, useRef } from 'react';
import { Mountain, ShieldCheck, CheckCircle, Radio, Quote, Compass } from 'lucide-react';
import { AuthForm, type AuthFormMode } from '../../../features/auth/components/AuthForm';
import { useLocation, useSearchParams, navigateTo } from '../../../lib/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { authStore } from '../../../stores/auth.store';
import { ROUTES } from '../../../constants/routes';

export interface LoginPageProps {
  initialMode?: AuthFormMode;
  onLoginSuccess?: (email: string) => void;
  onNavigate?: (screen: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isInitializing, bookingIntent, setBookingIntent } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redirectParam = searchParams.get('redirect');
  const emailParam = searchParams.get('email') || '';

  // Determine mode from path if not explicitly passed
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

  // Only consider booking redirect valid if explicitly specified in the query parameter
  const hasBookingRedirect = Boolean(redirectParam && redirectParam.startsWith('/booking/'));

  // If user navigates directly to login/register without a booking redirect, clear any leftover stale bookingIntent
  useEffect(() => {
    if (!redirectParam && bookingIntent) {
      setBookingIntent(null);
    }
  }, [redirectParam, bookingIntent, setBookingIntent]);

  // If already logged in and not in verify/reset mode, redirect to admin dashboard, explicit redirect, or home
  useEffect(() => {
    if (!isInitializing && isAuthenticated && (resolvedMode === 'login' || resolvedMode === 'register')) {
      if (isCurrentUserAdmin()) {
        navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
        return;
      }
      if (isCurrentUserGuide()) {
        const target = (redirectParam && redirectParam.startsWith('/guide')) ? redirectParam : ROUTES.GUIDE.SCHEDULES;
        navigateTo(target, { replace: true });
        return;
      }
      const target = redirectParam || ROUTES.PUBLIC.HOME;
      navigateTo(target, { replace: true });
    }
  }, [isInitializing, isAuthenticated, resolvedMode, redirectParam]);

  // Initialize WebGL mountain sunset shader with prefers-reduced-motion support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    vec3 skyTop = vec3(0.09, 0.18, 0.15);
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
        vec3 m3Col = mix(vec3(0.65, 0.30, 0.18), vec3(0.12, 0.24, 0.20), clamp(depth, 0.0, 1.0));
        col = mix(col, m3Col, smoothstep(m3_y, m3_y - 0.005, uv.y));
    }

    // Mid ridge
    float m2_y = 0.38 + 0.25 * abs(sin(st.x * 1.4 - 0.8)) + 0.12 * cos(st.x * 3.1 + t * 0.02);
    m2_y += fbm(vec2(st.x * 2.5 + 2.0, 3.0)) * 0.06;
    if (uv.y < m2_y) {
        float facet = sin(st.x * 25.0 + uv.y * 15.0) * 0.5 + 0.5;
        vec3 litSide = vec3(0.85, 0.38, 0.15);
        vec3 shadowSide = vec3(0.09, 0.18, 0.16);
        vec3 m2Col = mix(shadowSide, litSide, facet * 0.7 + 0.2);
        col = mix(col, m2Col, smoothstep(m2_y, m2_y - 0.005, uv.y));
    }

    // Foreground silhouette
    float m1_y = 0.25 + 0.22 * abs(cos(st.x * 1.8 + 0.4)) + 0.08 * sin(st.x * 4.2);
    m1_y += fbm(vec2(st.x * 4.0, 5.0)) * 0.04;
    if (uv.y < m1_y) {
        vec3 m1Col = vec3(0.05, 0.09, 0.08);
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

    const drawFrame = (timeMs: number) => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, timeMs * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (prefersReducedMotion) {
      drawFrame(1500);
      return;
    }

    const render = (timeMs: number) => {
      drawFrame(timeMs);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSuccess = () => {
    if (isCurrentUserAdmin()) {
      navigateTo(ROUTES.ADMIN.DASHBOARD, { replace: true });
      return;
    }
    if (isCurrentUserGuide()) {
      const target = (redirectParam && redirectParam.startsWith('/guide')) ? redirectParam : ROUTES.GUIDE.SCHEDULES;
      navigateTo(target, { replace: true });
      return;
    }
    const target = redirectParam || ROUTES.PUBLIC.HOME;
    navigateTo(target, { replace: true });
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
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFBF7] text-[#1C2526] flex flex-col justify-between py-8 sm:py-12 px-4 md:px-8">
      <div className="relative w-full flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl shadow-lg overflow-hidden bg-white border border-[#E6E1D8]">
          {/* Left Column: Nature & Mountain Shader */}
          <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-[620px] bg-[#141D1E] overflow-hidden flex flex-col justify-between p-6 sm:p-9 text-white">
            <div className="absolute inset-0 w-full h-full">
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%' }}
                aria-hidden="true"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#141D1E] via-[#141D1E]/55 to-[#141D1E]/25 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                <Mountain className="w-4 h-4 text-[#FFB59D]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                  Hành trình Trekking Việt Nam
                </span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-6 flex flex-col gap-4">
              <h1 className="font-editorial text-3xl sm:text-4xl text-white leading-tight drop-shadow-sm">
                Chinh phục những đỉnh cao.<br />
                <span className="italic font-normal text-[#FFDCC3]">
                  An toàn và có tổ chức.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-200/90 max-w-sm leading-relaxed">
                Đặt chỗ trực tuyến với tình trạng chỗ thời gian thực, giữ chỗ 15 phút và xác nhận đặt cọc nhanh chóng trực tuyến.
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/10 w-fit">
                  <CheckCircle className="w-4 h-4 text-[#A0D0C2] shrink-0" />
                  <span className="text-xs text-white font-medium">Lịch khởi hành & số chỗ cập nhật chuẩn xác</span>
                </div>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/10 w-fit">
                  <ShieldCheck className="w-4 h-4 text-[#A0D0C2] shrink-0" />
                  <span className="text-xs text-white font-medium">Giữ chỗ 15 phút trong lúc thanh toán cọc</span>
                </div>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/10 w-fit">
                  <Radio className="w-4 h-4 text-[#A0D0C2] shrink-0" />
                  <span className="text-xs text-white font-medium">Quản lý danh sách đoàn linh hoạt trước giờ đi</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-black/35 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-2.5">
                <Quote className="w-5 h-5 text-[#FFB59D] shrink-0 rotate-180" />
                <div className="flex flex-col">
                  <p className="text-xs text-stone-100 italic leading-relaxed">
                    "Biển mây lúc bình minh trên đỉnh Lảo Thẩn và Ky Quan San thực sự xứng đáng từng bước chân."
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="font-semibold text-[#FFB59D]">Cộng đồng WeTrek</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-300">Tây Bắc & Tây Nguyên</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AuthForm */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              {/* Booking Intent Banner (Only show when intentionally redirected from booking flow) */}
              {bookingIntent && hasBookingRedirect && (
                <div className="mb-6 rounded-xl bg-[#1F4E43]/8 border border-[#1F4E43]/25 p-4 flex items-start gap-3">
                  <Compass className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#1C2526]">
                    <p className="font-semibold text-[#1F4E43]">
                      Đã lưu lựa chọn lịch trình của bạn
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      {bookingIntent.tourTitle
                        ? `Tour "${bookingIntent.tourTitle}"`
                        : 'Tour đã chọn'}
                      . Sau khi xác thực tài khoản, hệ thống sẽ đưa bạn quay lại bước đặt chỗ ngay lập tức.
                    </p>
                  </div>
                </div>
              )}

              <AuthForm
                initialMode={resolvedMode}
                initialEmail={emailParam}
                onModeChange={handleModeChange}
                onAuthSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
