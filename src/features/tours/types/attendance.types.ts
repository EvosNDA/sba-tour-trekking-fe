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
