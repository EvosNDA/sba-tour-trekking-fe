import { apiClient } from '../../../lib/axios';
import { SpringPage } from '../../../types/api.types';
import {
  CreateBookingRequest,
  ReplacePassengersRequest,
  UpdatePassengerRequest,
  CancelBookingRequest,
  BookingDetailResponse,
  BookingSummaryResponse,
  BookingCancellationResponse,
  BookingStatus,
  RefundResponse,
} from '../types/booking.types';
import { INITIAL_BOOKING } from '../../../data/mockData';
import { Booking } from '../../../types/expedition';

export const bookingsApi = {
  createBooking: async (
    payload: CreateBookingRequest,
    signal?: AbortSignal
  ): Promise<BookingDetailResponse> => {
    return apiClient.post<BookingDetailResponse>('/api/v1/bookings', payload, { signal });
  },

  getActiveHolds: async (signal?: AbortSignal): Promise<BookingSummaryResponse[]> => {
    return apiClient.get<BookingSummaryResponse[]>('/api/v1/bookings/my/active-holds', { signal });
  },

  getMyBookings: async (
    params: { status?: BookingStatus | ''; page?: number; size?: number } = {},
    signal?: AbortSignal
  ): Promise<SpringPage<BookingSummaryResponse>> => {
    const queryParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };
    if (params.status) {
      queryParams.status = params.status;
    }
    return apiClient.get<SpringPage<BookingSummaryResponse>>('/api/v1/bookings/my', {
      params: queryParams,
      signal,
    });
  },

  searchBookings: async (
    criteria: {
      scheduleId?: number;
      tourId?: number;
      customerId?: number;
      status?: BookingStatus | '';
      query?: string;
      createdFrom?: string;
      createdTo?: string;
      page?: number;
      size?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<SpringPage<BookingSummaryResponse>> => {
    return apiClient.get<SpringPage<BookingSummaryResponse>>('/api/v1/bookings', {
      params: criteria,
      signal,
    });
  },

  getBookingDetail: async (
    bookingId: number | string,
    signal?: AbortSignal
  ): Promise<BookingDetailResponse> => {
    return apiClient.get<BookingDetailResponse>(`/api/v1/bookings/${bookingId}`, { signal });
  },

  replacePassengers: async (
    bookingId: number | string,
    payload: ReplacePassengersRequest,
    signal?: AbortSignal
  ): Promise<BookingDetailResponse> => {
    return apiClient.put<BookingDetailResponse>(
      `/api/v1/bookings/${bookingId}/passengers`,
      payload,
      { signal }
    );
  },

  updatePassenger: async (
    bookingId: number | string,
    participantId: number | string,
    payload: UpdatePassengerRequest,
    signal?: AbortSignal
  ): Promise<BookingDetailResponse> => {
    return apiClient.patch<BookingDetailResponse>(
      `/api/v1/bookings/${bookingId}/passengers/${participantId}`,
      payload,
      { signal }
    );
  },

  cancelBooking: async (
    bookingId: number | string,
    payload: CancelBookingRequest,
    signal?: AbortSignal
  ): Promise<BookingCancellationResponse> => {
    return apiClient.post<BookingCancellationResponse>(
      `/api/v1/bookings/${bookingId}/cancel`,
      payload,
      { signal }
    );
  },

  getRefundStatus: async (bookingId: number | string, signal?: AbortSignal): Promise<RefundResponse | null> =>
    apiClient.get<RefundResponse | null>(`/api/v1/bookings/${bookingId}/refund`, { signal }),

  // Legacy helpers kept for reference compatibility
  getCurrentBooking: async (): Promise<Booking> => {
    try {
      const saved = localStorage.getItem('wetrek_booking_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_BOOKING;
  },

  saveBooking: async (booking: Booking): Promise<Booking> => {
    try {
      localStorage.setItem('wetrek_booking_v1', JSON.stringify(booking));
    } catch {
      // Ignore
    }
    return booking;
  },
};
