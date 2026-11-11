import { APP_CONFIG } from '../constants/config';
import { ROUTES } from '../constants/routes';
import { navigateTo } from './navigation';
import { ApiError } from '../types/api.types';
import { authStore, AccountProfile } from '../stores/auth.store';

export interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  data?: any;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
  csrfRequired?: boolean;
}

interface CsrfTokenResponse {
  headerName: string;
  token: string;
}

interface AuthSessionResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  account: AccountProfile;
}

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Dữ liệu nhập vào chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
  INVALID_REQUEST: 'Yêu cầu không hợp lệ.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  EMAIL_NOT_VERIFIED: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư và nhập mã OTP.',
  ACCOUNT_DISABLED: 'Tài khoản của bạn đã bị vô hiệu hóa.',
  ACCOUNT_BLOCKED: 'Tài khoản của bạn tạm thời bị khóa.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được đăng ký tài khoản.',
  DUPLICATE_EMAIL: 'Email này đã được sử dụng.',
  INVALID_OTP: 'Mã xác thực OTP không chính xác hoặc đã hết hạn.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn (hiệu lực 5 phút). Vui lòng yêu cầu gửi lại mã mới.',
  OTP_MAX_ATTEMPTS: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng gửi lại mã mới.',
  OTP_COOLDOWN: 'Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã OTP.',
  OTP_RATE_LIMITED: 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau.',
  LOGIN_RATE_LIMITED: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
  RATE_LIMITED: 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.',
  MAIL_UNAVAILABLE: 'Tài khoản đã được tạo nhưng dịch vụ gửi email tạm thời gián đoạn. Vui lòng bấm Gửi lại OTP sau 60 giây.',
  GOOGLE_AUTH_UNAVAILABLE: 'Đăng nhập bằng Google hiện chưa được cấu hình trên máy chủ.',
  INVALID_GOOGLE_TOKEN: 'Xác thực Google không hợp lệ hoặc đã hết hạn.',
  GOOGLE_ACCOUNT_CONFLICT: 'Email này đã được liên kết với một tài khoản Google khác.',
  GOOGLE_EMAIL_VERIFICATION_REQUIRED: 'Tài khoản Google này cần xác minh quyền sở hữu email trước khi liên kết.',
  BOOKING_NOT_FOUND: 'Không tìm thấy thông tin đặt chỗ hoặc bạn không có quyền truy cập.',
  SCHEDULE_NOT_FOUND: 'Không tìm thấy lịch khởi hành này.',
  IDEMPOTENCY_KEY_REUSED: 'Mã giao dịch tạo đặt chỗ đã được sử dụng cho yêu cầu khác.',
  ACTIVE_BOOKING_HOLD_EXISTS: 'Bạn đang có đơn đặt chỗ giữ chỗ chờ thanh toán chưa hoàn tất. Vui lòng hoàn tất đơn hiện tại trước khi tạo đơn mới.',
  BOOKING_NOT_AVAILABLE: 'Lịch khởi hành này hiện không mở đặt chỗ.',
  INSUFFICIENT_SEATS: 'Số chỗ còn lại của lịch khởi hành không đủ cho đoàn của bạn.',
  BOOKING_HOLD_EXPIRED: 'Thời gian giữ chỗ 15 phút đã hết hạn. Vui lòng tạo đặt chỗ mới.',
  BOOKING_NOT_EDITABLE: 'Đặt chỗ này không còn ở trạng thái cho phép chỉnh sửa.',
  INVALID_BOOKING_TRANSITION: 'Không thể chuyển trạng thái đặt chỗ theo yêu cầu.',
  EQUIPMENT_UNAVAILABLE: 'Thiết bị không còn đủ số lượng tồn kho khả dụng cho lịch khởi hành này. Vui lòng giảm bớt số lượng hoặc đổi sang tự chuẩn bị đồ dùng.',
  EQUIPMENT_NOT_RENTABLE: 'Một hoặc nhiều thiết bị đã chọn hiện không khả dụng để thuê lẻ cho tour này.',
  EQUIPMENT_PACKAGE_NOT_AVAILABLE: 'Gói combo thiết bị đã chọn không khả dụng cho lịch khởi hành này.',
  INVALID_EQUIPMENT_SELECTION: 'Lựa chọn thiết bị không hợp lệ. Vui lòng kiểm tra lại số lượng hoặc chọn Tự chuẩn bị.',
  EQUIPMENT_PACKAGE_EMPTY: 'Gói combo thiết bị hiện chưa có danh sách món.',
  EQUIPMENT_PACKAGE_PRICE_MISSING: 'Gói combo chưa được cấu hình giá thuê.',
  EQUIPMENT_INACTIVE: 'Một số thiết bị trong danh sách thuê đang tạm dừng phục vụ.',
  EQUIPMENT_QUANTITY_OUT_OF_RANGE: 'Số lượng thiết bị vượt quá giới hạn hỗ trợ.',
  EQUIPMENT_HOLD_ALREADY_EXISTS: 'Yêu cầu đặt chỗ đã có lựa chọn thiết bị khác.',
  EQUIPMENT_SERVICE_UNAVAILABLE: 'Dịch vụ thuê thiết bị theo gói hiện chưa khả dụng. Vui lòng chọn Tự chuẩn bị trang bị cá nhân.',
  PASSENGER_COUNT_MISMATCH: 'Số lượng hành khách không khớp với số chỗ đã đặt.',
  MULTIPLE_BOOKING_CUSTOMERS: 'Chỉ được chọn tối đa 1 hành khách làm người đại diện đặt chỗ.',
  PAYMENT_PROVIDER_UNAVAILABLE: 'Cổng thanh toán đã chọn hiện chưa khả dụng. Vui lòng thử lại sau.',
  BOOKING_ALREADY_PAID: 'Đặt chỗ này đã được thanh toán đầy đủ.',
  DEPOSIT_ALREADY_PAID: 'Khoản tiền cọc đã được thanh toán trước đó.',
  DEPOSIT_REQUIRED: 'Cần thanh toán tiền cọc trước khi thanh toán phần còn lại.',
  TOUR_CANNOT_BE_PUBLISHED: 'Tour chưa đủ điều kiện xuất bản (backend yêu cầu thông tin người duyệt, thời gian duyệt và chính sách hủy).',
  INVALID_SCHEDULE_DATES: 'Khoảng thời gian lịch trình không hợp lệ (ngày kết thúc phải sau ngày bắt đầu).',
  INVALID_BALANCE_DUE_AT: 'Hạn thanh toán phải trước hoặc cùng thời điểm với ngày bắt đầu khởi hành.',
  TOUR_COVER_CONFLICT: 'Tour đã có ảnh bìa hoặc xảy ra xung đột khi gán ảnh bìa.',
  TOUR_IMAGE_CONFLICT: 'Hình ảnh này đã tồn tại trong danh sách media của tour.',
  SCHEDULE_NOT_EDITABLE: 'Chỉ có thể chỉnh sửa lịch trình khi chưa có khách đặt chỗ hoặc giữ chỗ.',
  SCHEDULE_IN_USE: 'Lịch khởi hành này đã có dữ liệu tham chiếu (đặt chỗ, điều phối) nên không thể xóa.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  AUTH_UNAVAILABLE: 'Hệ thống xác thực tạm thời bảo trì. Vui lòng thử lại sau.',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc trạng thái backend.',
};

export function normalizeApiError(raw: any, status?: number): ApiError {
  if (!raw) {
    return {
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'UNKNOWN_ERROR',
      message: FRIENDLY_ERROR_MESSAGES[status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : ''] || 'Đã xảy ra lỗi không xác định.',
      status,
    };
  }

  const code: string = raw.code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 429 ? 'RATE_LIMITED' : status === 503 ? 'SERVICE_UNAVAILABLE' : 'API_ERROR');
  const fieldErrors: Record<string, string> | undefined =
    raw.fieldErrors && typeof raw.fieldErrors === 'object' ? raw.fieldErrors : undefined;
  const activeHolds = Array.isArray(raw.activeHolds) ? raw.activeHolds : undefined;

  let message: string = FRIENDLY_ERROR_MESSAGES[code] || raw.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.';
  if (code === 'ACTIVE_BOOKING_HOLD_EXISTS') {
    message = raw.message || FRIENDLY_ERROR_MESSAGES.ACTIVE_BOOKING_HOLD_EXISTS;
  } else if (raw.message && !FRIENDLY_ERROR_MESSAGES[code]) {
    message = raw.message;
  }

  return {
    code,
    message,
    status: status ?? raw.status,
    fieldErrors,
    activeHolds,
  };
}

let activeRefreshPromise: Promise<string | null> | null = null;

function handleExpiredSession() {
  authStore.clearSession();

  const { pathname, search } = window.location;
  const isProtectedRoute = ['/admin', '/guide', '/booking', '/account', '/customer', '/payment']
    .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isProtectedRoute && !isAuthRoute) {
    const returnUrl = `${pathname}${search}`;
    navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
  }
}

async function withAuthLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
    return navigator.locks.request('wetrek_auth_refresh_lock', fn);
  }
  return fn();
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = APP_CONFIG.API_BASE_URL) {
    this.baseURL = baseURL.replace(/\/+$/, '');
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${cleanEndpoint}`;

    const url = new URL(fullUrl, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, String(val));
        }
      });
    }
    return url.toString();
  }

  async fetchCsrfToken(signal?: AbortSignal): Promise<CsrfTokenResponse> {
    const res = await fetch(this.buildURL('/api/v1/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!res.ok) {
      const errBody = await this.parseBody(res);
      throw normalizeApiError(errBody, res.status);
    }

    return (await res.json()) as CsrfTokenResponse;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = withAuthLock(async () => {
      try {
        const csrf = await this.fetchCsrfToken();
        const csrfHeaderName = csrf.headerName || 'X-XSRF-TOKEN';

        // Do NOT send expired Bearer token to /api/v1/auth/refresh
        const res = await fetch(this.buildURL('/api/v1/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            [csrfHeaderName]: csrf.token,
          },
        });

        if (!res.ok) {
          handleExpiredSession();
          return null;
        }

        const data = (await res.json()) as AuthSessionResponse;
        if (data?.accessToken && data?.account) {
          authStore.setSession(data.accessToken, data.expiresIn || 900, data.account);
          return data.accessToken;
        }

        handleExpiredSession();
        return null;
      } catch {
        handleExpiredSession();
        return null;
      }
    }).finally(() => {
      activeRefreshPromise = null;
    });

    return activeRefreshPromise;
  }

  private async parseBody(res: Response): Promise<any> {
    if (res.status === 204) return undefined;
    const text = await res.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      params,
      data,
      headers,
      skipAuth = false,
      skipAuthRefresh = false,
      csrfRequired,
      ...customConfig
    } = config;

    const method = (customConfig.method || 'GET').toUpperCase();
    const isAuthEndpoint = endpoint.startsWith('/api/v1/auth');
    const isMutatingAuth = isAuthEndpoint && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);
    const needsCsrf = csrfRequired ?? isMutatingAuth;

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(data !== undefined && !(data instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(headers as Record<string, string>),
    };

    // Attach CSRF token for POST /api/v1/auth/**
    if (needsCsrf) {
      const csrf = await this.fetchCsrfToken(customConfig.signal || undefined);
      const headerName = csrf.headerName || 'X-XSRF-TOKEN';
      requestHeaders[headerName] = csrf.token;
    }

    // Attach Bearer token only when appropriate (never on public auth POST endpoints like /refresh, /login, /register)
    const isPublicAuthPost =
      isAuthEndpoint &&
      method === 'POST' &&
      !endpoint.endsWith('/me');

    if (!skipAuth && !isPublicAuthPost) {
      const token = authStore.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(this.buildURL(endpoint, params), {
        ...customConfig,
        method,
        credentials: 'include',
        headers: requestHeaders,
        body:
          data === undefined
            ? undefined
            : data instanceof FormData
            ? data
            : JSON.stringify(data),
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw err;
      }
      throw normalizeApiError({ code: 'NETWORK_ERROR' }, 0);
    }

    // Handle 401 with coordinated single refresh retry
    if (
      res.status === 401 &&
      !skipAuth &&
      !skipAuthRefresh &&
      !isPublicAuthPost &&
      !endpoint.includes('/api/v1/auth/refresh') &&
      !endpoint.includes('/api/v1/auth/login')
    ) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        const retryHeaders: Record<string, string> = {
          ...requestHeaders,
          Authorization: `Bearer ${newToken}`,
        };
        const retryRes = await fetch(this.buildURL(endpoint, params), {
          ...customConfig,
          method,
          credentials: 'include',
          headers: retryHeaders,
          body:
            data === undefined
              ? undefined
              : data instanceof FormData
              ? data
              : JSON.stringify(data),
        });

        const retryBody = await this.parseBody(retryRes);
        if (!retryRes.ok) {
          throw normalizeApiError(retryBody, retryRes.status);
        }
        return retryBody as T;
      }
    }

    const responseBody = await this.parseBody(res);
    if (!res.ok) {
      throw normalizeApiError(responseBody, res.status);
    }

    return responseBody as T;
  }

  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', data });
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', data });
  }

  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', data });
  }

  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new HttpClient();
export const axios = apiClient;
export default apiClient;
