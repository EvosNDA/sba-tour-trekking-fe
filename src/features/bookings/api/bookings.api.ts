import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';
import type { BookingDetail, BookingPage, CreateBookingRequest } from '../types/booking.types';

const base = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const version = base.endsWith('/api/v1') ? '' : base.endsWith('/api') ? '/v1' : '/api/v1';
const path = `${version}/bookings`;

export const bookingsApi = {
  create: async (request: CreateBookingRequest): Promise<BookingDetail> =>
    await apiClient.post<BookingDetail>(path, request) as unknown as BookingDetail,
  list: async (page = 0, signal?: AbortSignal): Promise<BookingPage> =>
    await apiClient.get<BookingPage>(`${path}/my`, { params: { page, size: 10 }, signal }) as unknown as BookingPage,
  get: async (id: number, signal?: AbortSignal): Promise<BookingDetail> =>
    await apiClient.get<BookingDetail>(`${path}/${id}`, { signal }) as unknown as BookingDetail,
  cancel: async (id: number, reason: string): Promise<BookingDetail> =>
    await apiClient.post<BookingDetail>(`${path}/${id}/cancel`, { reason }) as unknown as BookingDetail,
};

export function bookingErrorKey(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const known = ['SCHEDULE_FULL', 'SCHEDULE_NOT_BOOKABLE', 'INVALID_RENTAL_SELECTION', 'INVALID_BOOKING_TOTAL',
    'RESOURCE_NOT_FOUND', 'BOOKING_NOT_CANCELLABLE', 'BOOKING_DATA_CONFLICT', 'INVALID_REQUEST',
    'INVALID_TRAVELER', 'UNAUTHORIZED', 'FORBIDDEN', 'PRICE_OUT_OF_RANGE', 'CANCELLATION_POLICY_UNAVAILABLE'];
  return known.includes(code) ? `bookingFlow.error.${code}` : 'bookingFlow.error.generic';
}
