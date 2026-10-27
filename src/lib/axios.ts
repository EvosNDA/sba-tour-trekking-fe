import { APP_CONFIG } from '../constants/config';
import { ApiResponse } from '../types/api.types';
import { authStore } from '../stores/auth.store';

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  data?: any;
  auth?: boolean;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = APP_CONFIG.API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
      window.location.origin
    );
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }
    return url.toString();
  }

  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const { params, data, headers, auth = true, ...customConfig } = config;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    const token = authStore.getState().token;
    if (auth && token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(this.buildURL(endpoint, params), {
      ...customConfig,
      credentials: customConfig.credentials || 'include',
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || res.statusText };
      }
      throw errorData;
    }

    const json = await res.json();
    return json;
  }

  get<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>(url, { ...config, method: 'POST', data });
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>(url, { ...config, method: 'PUT', data });
  }

  delete<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new HttpClient();
export const axios = apiClient;
export default apiClient;
