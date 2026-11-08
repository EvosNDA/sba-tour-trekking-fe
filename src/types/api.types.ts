import type { BookingSummaryResponse } from '../features/bookings/types/booking.types';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: 'success' | 'error';
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
  activeHolds?: BookingSummaryResponse[];
  [key: string]: any;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
  csrfRequired?: boolean;
}
