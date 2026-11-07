import { apiClient } from '../../../lib/axios';
import {
  DashboardSummaryParams,
  DashboardSummaryResponse,
  BookingTrendParams,
  BookingTrendResponse,
  BookingCompareParams,
  BookingCompareResponse,
  TopToursParams,
  TopToursResponse,
  ScheduleFillRateParams,
  ScheduleFillRateResponse,
} from '../types/dashboard.types';

export const dashboardApi = {
  getSummary: async (
    params: DashboardSummaryParams,
    signal?: AbortSignal
  ): Promise<DashboardSummaryResponse> => {
    return apiClient.get<DashboardSummaryResponse>('/api/v1/admin/dashboard/summary', {
      params: {
        period: params.period,
        from: params.from,
        to: params.to,
        basis: params.basis,
      },
      signal,
    });
  },

  getBookingTrend: async (
    params: BookingTrendParams,
    signal?: AbortSignal
  ): Promise<BookingTrendResponse> => {
    return apiClient.get<BookingTrendResponse>('/api/v1/admin/dashboard/bookings/trend', {
      params: {
        granularity: params.granularity,
        from: params.from,
        to: params.to,
        basis: params.basis,
        tourId: params.tourId && params.tourId > 0 ? params.tourId : undefined,
      },
      signal,
    });
  },

  getBookingCompare: async (
    params: BookingCompareParams,
    signal?: AbortSignal
  ): Promise<BookingCompareResponse> => {
    return apiClient.get<BookingCompareResponse>('/api/v1/admin/dashboard/bookings/compare', {
      params: {
        granularity: params.granularity,
        baseYear: params.baseYear,
        compareYear: params.compareYear,
        months: params.months || undefined,
        basis: params.basis,
        tourId: params.tourId && params.tourId > 0 ? params.tourId : undefined,
      },
      signal,
    });
  },

  getTopTours: async (
    params: TopToursParams = {},
    signal?: AbortSignal
  ): Promise<TopToursResponse> => {
    return apiClient.get<TopToursResponse>('/api/v1/admin/dashboard/tours/top', {
      params: {
        from: params.from,
        to: params.to,
        limit: params.limit,
        basis: params.basis,
      },
      signal,
    });
  },

  getScheduleFillRate: async (
    params: ScheduleFillRateParams = {},
    signal?: AbortSignal
  ): Promise<ScheduleFillRateResponse> => {
    return apiClient.get<ScheduleFillRateResponse>('/api/v1/admin/dashboard/schedules/fill-rate', {
      params: {
        from: params.from,
        to: params.to,
        tourId: params.tourId && params.tourId > 0 ? params.tourId : undefined,
        status: params.status,
      },
      signal,
    });
  },
};
