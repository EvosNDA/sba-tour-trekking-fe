export type { Booking, Traveler } from '../../../types/expedition';
import type { RentalSelection, TravelerDraft } from '../../tours/types/tour-contract.types';

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export interface CreateBookingRequest {
  scheduleId: number;
  travelers: TravelerDraft[];
  rental: RentalSelection;
}
export interface BookingSummary {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  tourId: number;
  tourTitle: string;
  scheduleId: number;
  startsAt: string;
  endsAt: string;
  participantCount: number;
  totalPriceVnd: number;
  holdExpiresAt: string;
  createdAt: string;
}
export interface BookingRentalSnapshot {
  mode: 'NONE' | 'PACKAGE' | 'ITEMS';
  packageId?: number;
  title?: string;
  quantity?: number;
  unitPriceVnd?: number;
  totalVnd?: number;
  items?: { itemId: number; equipmentId: number; name: string; quantity: number; unitPriceVnd: number; totalVnd: number }[];
}
export interface BookingDetail extends BookingSummary {
  contact: { fullName: string; email: string; phone: string | null };
  basePriceVnd: number;
  rentalFeeVnd: number;
  depositPercent: number;
  depositDueVnd: number;
  balanceDueAt: string;
  rental: BookingRentalSnapshot;
  travelers: { id: number; fullName: string; email: string | null; phone: string | null }[];
  cancelledAt: string | null;
  cancellationReason: string | null;
}
export interface BookingPage {
  content: BookingSummary[];
  number: number;
  totalPages: number;
  totalElements: number;
}
