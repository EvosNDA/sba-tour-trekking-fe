import { apiClient } from '../../../lib/axios';
import { APP_CONFIG } from '../../../constants/config';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
export interface CreateBookingRequest {
  scheduleId: number;
  participantCount: number;
  includesEquipment: boolean;
  participants: { fullName: string; email?: string; phone?: string; accountId?: number }[];
}
export interface CreatedBooking {
  id: number;
  bookingCode: string;
  status: 'pending_payment' | string;
  holdExpiresAt: string;
  participantCount: number;
  totalPriceVnd: number;
  depositDueVnd: number;
  balanceDueAt: string;
  participants: { id: number; fullName: string; email?: string; phone?: string }[];
}
export type BookingPaymentPurpose = 'deposit' | 'full' | 'balance';
export interface BookingPaymentLink {
  enabled: boolean;
  attemptId: number;
  purpose: BookingPaymentPurpose;
  amountVnd: number;
  status: string;
  checkoutUrl: string | null;
  qrCode: string | null;
  expiresAt: string | null;
}
export interface BookingPaymentStatus {
  paymentEnabled: boolean;
  bookingStatus: string;
  totalPriceVnd: number;
  receivedVnd: number;
  refundedVnd: number;
  amountDueVnd: number;
  pendingReviewVnd?: number;
  attempts: { id: number; purpose: BookingPaymentPurpose; amountVnd: number; status: string; expiresAt: string | null }[];
}
const unwrap = <T,>(response: { data: T } | T): T =>
  response && typeof response === 'object' && 'data' in response && 'status' in response
    ? (response as { data: T }).data
    : response as T;

export const customerBookingsApi = {
  create: async (request: CreateBookingRequest, idempotencyKey: string) => unwrap(await apiClient.post<CreatedBooking>(`${API_V1}/bookings`, request, { headers: { 'Idempotency-Key': idempotencyKey } })),
  createPaymentLink: async (bookingId: number, purpose: BookingPaymentPurpose) => unwrap(await apiClient.post<BookingPaymentLink>(`${API_V1}/bookings/${bookingId}/payment-links`, { purpose })),
  paymentStatus: async (bookingId: number) => unwrap(await apiClient.get<BookingPaymentStatus>(`${API_V1}/bookings/${bookingId}/payment-status`)),
};
