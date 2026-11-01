export type { Tour, Destination, TourCompany, DiscountVoucher } from '../../../types/expedition';

export type DifficultyLevel = 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';

export type TourStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type MediaType = 'IMAGE' | 'VIDEO';

export type ScheduleStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export const DIFFICULTY_OPTIONS: ReadonlyArray<{ value: DifficultyLevel; label: string }> = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
  { value: 'EXPERT', label: 'Chuyên gia' },
];

export const TOUR_STATUS_OPTIONS: ReadonlyArray<{ value: TourStatus; label: string }> = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export const SCHEDULE_STATUS_OPTIONS: ReadonlyArray<{ value: ScheduleStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export interface TourSummaryResponse {
  id: number;
  title: string;
  difficulty: DifficultyLevel;
  durationDays: number;
  status: TourStatus;
  coverImageUrl: string | null;
}

export interface TourMediaResponse {
  id: number;
  mediaType: MediaType;
  url: string;
  caption: string | null;
  displayOrder: number;
  isCover: boolean;
}

export interface TourDetailResponse {
  id: number;
  title: string;
  description: string | null;
  difficulty: DifficultyLevel;
  durationDays: number;
  requiredExperience: string | null;
  includedServices: string | null;
  excludedServices: string | null;
  routeFileUrl: string | null;
  status: TourStatus;
  cancellationPolicyVersionId: number | null;
  media: TourMediaResponse[];
}

export interface CreateTourRequest {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  durationDays: number;
  requiredExperience: string;
  includedServices: string;
  excludedServices: string;
  routeFileUrl: string;
}

export interface UpdateTourRequest extends CreateTourRequest {
  status: TourStatus;
  cancellationPolicyVersionId?: number;
}

export interface CreateScheduleRequest {
  startsAt: string; // ISO OffsetDateTime string
  endsAt: string; // ISO OffsetDateTime string
  capacity: number; // positive integer
  basePriceVnd: number; // positive or zero Long
  equipmentFeeVnd: number; // positive or zero Long
  depositPercent: number; // BigDecimal: > 0 and <= 100
  balanceDueAt: string; // ISO OffsetDateTime string
  meetingPoint?: string;
  contactPhone?: string;
}

export interface TourScheduleRangeResponse {
  id: number;
  tourId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status: ScheduleStatus;
  tourStatus?: TourStatus;
}

export interface ActivityResponse {
  id: number;
  dayNumber: number;
  displayOrder: number;
  startTime: string | null;
  title: string;
  description: string | null;
  locationId: number | null;
}

export interface ScheduleSummaryResponse {
  id: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  heldSeats: number;
  confirmedSeats: number;
  basePriceVnd: number;
  equipmentFeeVnd: number;
  status: ScheduleStatus;
}

export interface ScheduleDetailResponse {
  id: number;
  tourId: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  heldSeats: number;
  confirmedSeats: number;
  basePriceVnd: number;
  equipmentFeeVnd: number;
  depositPercent: number;
  balanceDueAt: string | null;
  meetingPoint: string | null;
  contactPhone: string | null;
  status: ScheduleStatus;
  lockVersion: number;
}

export interface ScheduleAvailabilityResponse {
  scheduleId: number;
  tourId: number;
  startsAt: string;
  capacity: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  bookable: boolean;
}

export interface TourQueryParams {
  page?: number;
  size?: number;
  query?: string;
  difficulty?: DifficultyLevel | '';
  durationDays?: number | '';
  status?: TourStatus | '';
}

export type {
  TourEquipmentResponse,
  TourRentalPackage,
  TourRentalItem,
} from '../../equipment/types/equipment.types';

export interface TourFilter {
  search?: string;
  difficulty?: string;
  destinationId?: string;
  maxPriceUSD?: number;
}
