export type { Booking, Traveler } from '../../../types/expedition';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type BookingPaymentState =
  | 'UNPAID'
  | 'DEPOSIT_PAID'
  | 'FULLY_PAID'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_REFUNDED';

export type BookingEquipmentChoice = 'SELF_PROVIDED' | 'TOUR_PACKAGE';

export interface BookingPassengerRequest {
  fullName: string;
  phone?: string;
  email?: string;
  bookingCustomer?: boolean;
}

export interface CreateBookingRequest {
  idempotencyKey: string;
  scheduleId: number;
  equipmentChoice: BookingEquipmentChoice;
  packageQuantities?: Record<number, number>;
  itemQuantities?: Record<number, number>;
  passengers: BookingPassengerRequest[];
}

export interface ReplacePassengersRequest {
  passengers: BookingPassengerRequest[];
}

export interface UpdatePassengerRequest {
  fullName: string;
  phone?: string;
  email?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

/** Filters for GET /api/v1/bookings. All optional; createdFrom/createdTo are ISO date-time, interval [from, to). */
export interface BookingSearchCriteria {
  status?: BookingStatus;
  scheduleId?: number;
  tourId?: number;
  customerId?: number;
  createdFrom?: string;
  createdTo?: string;
}

export interface BookingPassengerResponse {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  bookingCustomer: boolean;
}

export interface EquipmentSnapshotComponent {
  itemId?: number;
  equipmentId?: number;
  name: string;
  quantityInPackage?: number;
}

export interface EquipmentSnapshotPackage {
  packageId?: number;
  title: string;
  quantity: number;
  unitPriceVnd?: number;
  components?: EquipmentSnapshotComponent[];
}

export interface EquipmentSnapshotItem {
  itemId?: number;
  equipmentId?: number;
  name: string;
  selectedQuantity: number;
  quantityInPackage?: number;
  unitPriceVnd?: number;
}

export interface BookingEquipmentSnapshot {
  choice?: BookingEquipmentChoice;
  mode?: string;
  rentalFeeVnd?: number;
  participantCount?: number;
  packages?: EquipmentSnapshotPackage[];
  items?: EquipmentSnapshotItem[];
  title?: string;
  packageQuantity?: number;
  unitPriceVnd?: number;
  [key: string]: any;
}

export interface BookingPriceResponse {
  participantCount: number;
  basePriceVnd: number;
  equipmentFeeVnd: number;
  totalPriceVnd: number;
  depositPercent: number;
  depositAmountVnd: number;
  paidAmountVnd: number;
  refundedAmountVnd: number;
  netCollectedAmountVnd: number;
  remainingAmountVnd: number;
  paymentState: BookingPaymentState;
}

export interface BookingDetailResponse {
  id: number;
  bookingCode: string;
  qrPayload: string;
  status: BookingStatus;
  customerId: number;
  scheduleId: number;
  tourId: number;
  tourTitle: string;
  startsAt: string;
  endsAt: string;
  meetingPoint: string | null;
  equipmentChoice: BookingEquipmentChoice;
  equipmentSnapshot: BookingEquipmentSnapshot | null;
  cancellationPolicy: Record<string, any> | null;
  price: BookingPriceResponse;
  passengers: BookingPassengerResponse[];
  holdExpiresAt: string;
  balanceDueAt: string | null;
  priceLockedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelledBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSummaryResponse {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  customerId: number;
  scheduleId: number;
  tourId: number;
  tourTitle: string;
  startsAt: string;
  participantCount: number;
  totalPriceVnd: number;
  paidAmountVnd: number;
  paymentState: BookingPaymentState;
  holdExpiresAt: string;
  createdAt: string;
}

export interface BookingCancellationResponse {
  bookingId: number;
  bookingCode: string;
  status: BookingStatus;
  cancelledAt: string;
  cancellationReason: string;
  cancelledBy: number;
  paidAmountVnd: number;
  refundedAmountVnd: number;
  refundRequired: boolean;
}
