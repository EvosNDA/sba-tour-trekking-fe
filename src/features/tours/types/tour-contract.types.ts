/** Wire types for features/tour. Enum names match Java JSON, not database values. */
export type TourDifficulty = 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
export type TourStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type ScheduleStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export interface TourPageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface TourSummaryResponse {
  id: number;
  title: string;
  difficulty: TourDifficulty | null;
  durationDays: number | null;
  status: TourStatus;
  coverImageUrl: string | null;
}
export interface TourMediaResponse {
  id: number;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  caption: string | null;
  displayOrder: number;
  isCover: boolean;
}
export interface TourDetailResponse {
  id: number;
  title: string;
  description: string | null;
  difficulty: TourDifficulty | null;
  durationDays: number | null;
  requiredExperience: string | null;
  includedServices: string | null;
  excludedServices: string | null;
  routeFileUrl: string | null;
  status: TourStatus;
  media: TourMediaResponse[];
}
export interface CreateTourRequest {
  title: string;
  description?: string | null;
  difficulty?: TourDifficulty | null;
  durationDays?: number | null;
  requiredExperience?: string | null;
  includedServices?: string | null;
  excludedServices?: string | null;
  routeFileUrl?: string | null;
}
export interface UpdateTourRequest extends CreateTourRequest { status?: TourStatus | null; }
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
export interface ScheduleDetailResponse extends ScheduleSummaryResponse {
  tourId: number;
  depositPercent: number;
  balanceDueAt: string;
  meetingPoint: string | null;
  contactPhone: string | null;
  lockVersion: number;
}
export interface CreateScheduleRequest {
  startsAt: string;
  endsAt: string;
  capacity: number;
  basePriceVnd: number;
  equipmentFeeVnd: number;
  depositPercent: number;
  balanceDueAt: string;
  meetingPoint?: string | null;
  contactPhone?: string | null;
}
export type UpdateScheduleRequest = CreateScheduleRequest;
export interface CreateActivityRequest {
  dayNumber: number;
  displayOrder: number;
  startTime?: string | null;
  title: string;
  description?: string | null;
  locationId?: number | null;
}
export type UpdateActivityRequest = CreateActivityRequest;
export interface ActivityResponse {
  id: number;
  dayNumber: number;
  displayOrder: number;
  startTime: string | null;
  title: string;
  description: string | null;
  locationId: number | null;
}
export interface RequiredItemResponse {
  id: number;
  equipmentId: number | null;
  name: string;
  isRequired: boolean;
  note: string | null;
  displayOrder: number;
}
export interface RentalPackageResponse {
  id: number;
  packageTemplateId: number | null;
  title: string;
  includedItems: string;
  sharedItems: string | null;
  personalItemsToBring: string | null;
  rentalPriceVnd: number | null;
}
export interface RentalItemResponse {
  id: number;
  equipmentId: number;
  name: string;
  description: string | null;
  quantityInPackage: number;
  individualRentalPriceVnd: number | null;
}
export interface TourEquipmentResponse {
  equipmentPackage: RentalPackageResponse | null;
  items: RentalItemResponse[];
}
export interface EquipmentCatalogResponse {
  id: number;
  name: string;
  description: string | null;
  individualRentalPriceVnd: number | null;
  imageUrl: string | null;
}
export interface RentalPackageTemplateItemResponse {
  equipmentId: number;
  name: string;
  description: string | null;
  quantityInPackage: number;
  individualRentalPriceVnd: number | null;
}
export interface RentalPackageTemplateResponse {
  id: number;
  title: string;
  sharedItems: string | null;
  personalItemsToBring: string | null;
  rentalPriceVnd: number;
  imageUrl: string | null;
  items: RentalPackageTemplateItemResponse[];
}
export interface SaveEquipmentRequest {
  name: string;
  description?: string | null;
  individualRentalPriceVnd?: number | null;
}
export interface SaveRentalPackageRequest {
  title: string;
  sharedItems?: string | null;
  personalItemsToBring?: string | null;
  rentalPriceVnd: number;
  items: { equipmentId: number; quantityInPackage: number; individualRentalPriceVnd?: number | null }[];
}
export interface AssignTourEquipmentRequest {
  packageTemplateId: number | null;
  individualEquipmentIds: number[];
}
export interface TourApiError {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}
export interface TourSearchParams {
  query?: string;
  difficulty?: TourDifficulty;
  durationDays?: number;
  page?: number;
  size?: number;
}
export interface TravelerDraft { fullName: string; email: string; phone: string; }
export type RentalSelection =
  | { mode: 'NONE' }
  | { mode: 'PACKAGE'; packageId: number; quantity: number }
  | { mode: 'ITEMS'; items: { itemId: number; quantity: number }[] };
/** Local handoff only. No booking endpoint currently accepts this contract. */
export interface TourSelectionDraft {
  version: 2;
  tourId: number;
  scheduleId: number;
  contact: TravelerDraft;
  travelers: TravelerDraft[];
  rental: RentalSelection;
}
