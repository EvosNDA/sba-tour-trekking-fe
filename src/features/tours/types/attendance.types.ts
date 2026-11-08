import type { EquipmentReservationResponse } from '../../equipment/types/equipment.types';

export interface ParticipantCheckInRequest {
  note?: string; // Optional, maximum 1000 characters
}

export interface ParticipantCheckInResponse {
  participantId: number;
  bookingId: number;
  checkedInAt: string; // ISO 8601 OffsetDateTime
  checkedInBy: number;
  note: string | null;
}

export interface ParticipantCheckOutRequest {
  note?: string; // Optional, maximum 1000 characters
}

export interface ParticipantCheckOutResponse {
  participantId: number;
  bookingId: number;
  checkedOutAt: string; // ISO 8601 OffsetDateTime
  checkedOutBy: number;
  note: string | null;
}

export interface ScheduleGuideSummary {
  id?: number;
  guideId: number;
  accountId?: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  isLead: boolean;
  assignedAt?: string | null;
}

export interface AssignGuidesRequest {
  guides: {
    guideId: number;
    isLead: boolean;
  }[];
}

export interface ScheduleParticipantItem {
  participantId: number;
  bookingId: number;
  bookingCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  bookingCustomer: boolean;
  checkedIn: boolean;
  checkedInAt?: string | null;
  checkedInBy?: number | null;
  checkedOut: boolean;
  checkedOutAt?: string | null;
  checkedOutBy?: number | null;
  note?: string | null;
}

export interface ScheduleManifestBooking {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  status: string;
  passengers: ScheduleParticipantItem[];
  equipmentReservation?: EquipmentReservationResponse | null;
}

export interface ScheduleManifestResponse {
  scheduleId: number;
  tourId: number;
  tourTitle: string;
  startsAt: string;
  endsAt: string;
  meetingPoint: string | null;
  contactPhone: string | null;
  capacity: number;
  confirmedSeats: number;
  heldSeats?: number;
  assignedGuides: ScheduleGuideSummary[];
  bookings: ScheduleManifestBooking[];
}

// ============================================================================
// BATCH CHECK-IN / CHECK-OUT & PARTICIPANT EQUIPMENT HANDOVER TYPES
// ============================================================================

export type BatchRoundStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'CONFIRMED' | 'FAILED';

export type GuestCheckInStatus = 'PENDING' | 'PRESENT' | 'ABSENT';

export type GuestCheckOutStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'EARLY_DEPARTURE'
  | 'ABSENT_AT_CHECKIN';

export type HandoverEquipmentCondition =
  | 'GOOD'
  | 'NEEDS_INSPECTION'
  | 'DAMAGED'
  | 'MISSING';

export interface HandoverPhotoRecord {
  id: string;
  url: string;
  storageKey: string;
  fileName: string;
  capturedAt: string; // ISO 8601 OffsetDateTime
}

export interface ParticipantEquipmentCheckInItem {
  scheduleId: number;
  bookingId: number;
  participantId: number;
  equipmentId: number;
  equipmentName: string;
  bookingOrderedQuantity?: number;
  allocatedQuantity: number; // Số lượng thực tế bàn giao cho hành khách này
  condition: HandoverEquipmentCondition;
  note: string | null;
  photos: HandoverPhotoRecord[];
  handedOverAt: string | null; // Thời điểm bàn giao thiết bị này
}

export interface ParticipantCheckInRecord {
  scheduleId: number;
  bookingId: number;
  bookingCode: string;
  participantId: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  bookingCustomer: boolean;
  status: GuestCheckInStatus;
  markedAt: string | null; // Thời điểm Guide đánh dấu khách này
  note: string | null;
  equipmentItems: ParticipantEquipmentCheckInItem[];
}

export interface ParticipantEquipmentCheckOutItem {
  scheduleId: number;
  bookingId: number;
  participantId: number;
  equipmentId: number;
  equipmentName: string;
  issuedQuantity: number; // Số lượng đã bàn giao lúc check-in
  returnedQuantity: number; // Số lượng thực tế nhận lại (0 <= returnedQuantity <= issuedQuantity)
  condition: HandoverEquipmentCondition;
  note: string | null;
  photos: HandoverPhotoRecord[];
  returnedAt: string | null; // Thời điểm nhận lại thiết bị này
}

export interface ParticipantCheckOutRecord {
  scheduleId: number;
  bookingId: number;
  bookingCode: string;
  participantId: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  bookingCustomer: boolean;
  checkInStatus: GuestCheckInStatus;
  status: GuestCheckOutStatus;
  markedAt: string | null; // Thời điểm Guide đánh dấu kết thúc chuyến cho khách này
  note: string | null;
  equipmentItems: ParticipantEquipmentCheckOutItem[];
}

export interface ScheduleCheckInBatchReport {
  scheduleId: number;
  roundStatus: BatchRoundStatus;
  idempotencyKey: string;
  startedAt: string | null;
  submittedAt: string | null; // Thời điểm Guide xác nhận gửi toàn bộ lượt check-in
  submittedByGuideId: number | null;
  submittedByGuideName: string | null;
  submittedByGuideEmail: string | null;
  generalNote: string | null;
  lastErrorMessage?: string | null;
  participants: ParticipantCheckInRecord[];
}

export interface ScheduleCheckOutBatchReport {
  scheduleId: number;
  roundStatus: BatchRoundStatus;
  idempotencyKey: string;
  startedAt: string | null;
  submittedAt: string | null; // Thời điểm Guide xác nhận gửi toàn bộ lượt check-out
  submittedByGuideId: number | null;
  submittedByGuideName: string | null;
  submittedByGuideEmail: string | null;
  generalNote: string | null;
  lastErrorMessage?: string | null;
  participants: ParticipantCheckOutRecord[];
}

export interface ScheduleOperationsReport {
  scheduleId: number;
  tourId?: number;
  tourTitle?: string;
  startsAt?: string;
  endsAt?: string;
  checkInReport: ScheduleCheckInBatchReport | null;
  checkOutReport: ScheduleCheckOutBatchReport | null;
  updatedAt: string;
}

export interface TimeWindowCheckResult {
  allowed: boolean;
  unlockAtIso: string;
  referenceAtIso: string;
  remainingMs: number;
  message: string;
}
