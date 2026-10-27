import { apiClient } from '../../../lib/axios';
import { APP_CONFIG } from '../../../constants/config';

const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const path = (value: string) => `${API_V1}${value}`;
const unwrap = <T,>(response: { data: T } | T): T =>
  response && typeof response === 'object' && 'data' in response && 'status' in response
    ? (response as { data: T }).data
    : response as T;

export type PartnerBookingStatus = 'pending_payment' | 'confirmed' | 'expired' | 'cancelled' | 'completed' | 'no_show';
export interface PartnerBookingListItem {
  id: number;
  bookingCode: string;
  status: PartnerBookingStatus;
  createdAt: string;
  departure: { scheduleId: number; tourId: number; tourTitle: string; startsAt: string; endsAt: string };
  participantCount: number;
  totalPriceVnd: number;
  receivedVnd: number;
  pendingReviewVnd: number;
  refundedVnd: number;
}
export interface PartnerBookingPage {
  items: PartnerBookingListItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}
export interface PartnerBookingDetail extends PartnerBookingListItem {
  departure: PartnerBookingListItem['departure'] & { meetingPoint: string | null; contactPhone: string | null };
  customer: { displayName: string; email: string | null; phone: string | null };
  participants: { id: number; fullName: string; email?: string | null; phone?: string | null; checkedInAt?: string | null; checkInNote?: string | null }[];
  money: { totalPriceVnd: number; receivedVnd: number; pendingReviewVnd: number; refundedVnd: number; depositPercent: number; balanceDueAt: string | null };
  refundRequests: { id: number; requestedAmountVnd: number; approvedAmountVnd?: number | null; status: string; reason: string; decisionNote?: string | null; createdAt: string }[];
}
export interface PartnerDeparture {
  scheduleId: number;
  tourId: number;
  tourTitle: string;
  startsAt: string;
  endsAt: string;
  status: string;
  meetingPoint: string | null;
  contactPhone: string | null;
  capacity: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  participantCount: number;
  guideNames: string[];
}
export interface PartnerStatement {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  payableVnd: number;
  transferredVnd: number;
  remainingVnd: number;
  transfers: { amountVnd: number; transferredAt: string }[];
  note: string | null;
}
export interface Paged<T> { items: T[]; page: number; size: number; totalItems: number; totalPages: number; }

export const partnerBookingsApi = {
  list: (params: { status?: PartnerBookingStatus; dateFrom?: string; dateTo?: string; query?: string; page?: number; size?: number }) =>
    apiClient.get<PartnerBookingPage>(path('/partner/bookings'), { params }).then(unwrap<PartnerBookingPage>),
  detail: (id: number) => apiClient.get<PartnerBookingDetail>(path(`/partner/bookings/${id}`)).then(unwrap<PartnerBookingDetail>),
  departures: (params: { from?: string; to?: string; status?: string; page?: number; size?: number }) => apiClient.get<Paged<PartnerDeparture>>(path('/partner/departures'), { params }).then(unwrap<Paged<PartnerDeparture>>),
  statements: (params: { page?: number; size?: number }) => apiClient.get<Paged<PartnerStatement>>(path('/partner/statements'), { params }).then(unwrap<Paged<PartnerStatement>>),
  checkIn: (bookingId: number, participantId: number, note?: string) =>
    apiClient.post(path(`/partner/bookings/${bookingId}/participants/${participantId}/check-in`), note ? { note } : {}).then(unwrap),
  undoCheckIn: (bookingId: number, participantId: number, reason: string) =>
    apiClient.delete(path(`/partner/bookings/${bookingId}/participants/${participantId}/check-in`), { data: { reason } }).then(unwrap),
  cancel: (bookingId: number, reason: string) =>
    apiClient.post(path(`/partner/bookings/${bookingId}/cancel`), { reason }).then(unwrap),
};
