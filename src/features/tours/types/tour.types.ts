export interface LocationDto { id: number; name: string; provinceName: string | null; latitude: number | null; longitude: number | null; }
export interface TourSummaryDto {
  id: number; title: string; destinations: LocationDto[]; coverImageUrl: string | null;
  durationDays: number | null; difficulty: 'easy' | 'moderate' | 'hard' | 'expert' | string | null;
  startingPriceVnd: number | null; ratingAverage?: number | null; reviewCount?: number | null;
}
export interface TourPageDto { items: TourSummaryDto[]; page: number; size: number; totalItems: number; totalPages: number; }
export interface TourScheduleDto {
  id: number; startsAt: string; endsAt: string; availableSpots: number; basePriceVnd: number;
  equipmentFeeVnd: number; depositPercent: number; guides: string[];
}
export interface PublicEquipmentDto { id: number; title: string; includedItems: string; sharedItems: string | null; personalItemsToBring: string | null; }
export interface EquipmentPackageDto { tourId: number; title: string; includedItems: string; sharedItems: string | null; personalItemsToBring: string | null; scheduleEquipmentFeeVnd: number | null; }
export interface EquipmentPackageWriteRequest { title: string; includedItems: string; sharedItems?: string | null; personalItemsToBring?: string | null; }
export interface TourDetailDto {
  summary: TourSummaryDto; description: string | null; requiredExperience: string | null;
  includedServices: string | null; excludedServices: string | null; company: { id: number; name: string };
  gallery: { id: number; mediaType: string; url: string; caption: string | null }[];
  itinerary: { dayNumber: number; title: string; description: string | null; startTime: string | null; locationId: number | null }[];
  schedules: TourScheduleDto[]; routeFileUrl: string | null;
  cancellationPolicy: { id: number; title: string; version: number; content: string } | null;
  packingList: { id: number; name: string; required: boolean; note: string | null }[];
  equipment: PublicEquipmentDto | null; averageTourRating: number | null; reviewCount: number;
}
export interface TourReviewDto {
  id: number; tourRating: number; companyRating: number; content: string | null;
  imageUrls: string[]; createdAt: string; companyReply: string | null;
}
export interface TourReviewsDto {
  items: TourReviewDto[]; page: number; size: number; totalItems: number;
  totalPages: number; averageTourRating: number | null;
}
export interface TourFilter {
  query?: string; destinationId?: number; difficulty?: string; dateFrom?: string; dateTo?: string;
  minPrice?: number; maxPrice?: number; minRating?: number; equipmentPackageId?: number;
  sort?: 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'departure_asc'; page?: number; size?: number;
}
export interface PartnerTourDto {
  id: number; companyId: number; title: string; description: string | null; status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived'; difficulty: string | null;
  durationDays: number | null; requiredExperience: string | null; includedServices: string | null;
  excludedServices: string | null; routeFileUrl: string | null; cancellationPolicyVersionId: number | null;
  reviewNote?: string | null; reviewedAt?: string | null;
  locationIds: number[]; media: { id: number; mediaType: string; url: string; caption: string | null; displayOrder: number; cover: boolean }[];
  itinerary: { dayNumber: number; displayOrder: number; title: string; description: string | null; startTime: string | null; locationId: number | null }[];
  packingList: { id: number; name: string; required: boolean; note: string | null; displayOrder: number }[];
  equipmentOptions: EquipmentPackageDto[]; schedules: PartnerScheduleDto[];
}
export interface PartnerTourItemDto { id: number; companyId: number; title: string; status: string; difficulty: string | null; durationDays: number | null; createdAt: string; updatedAt: string; }
export interface PartnerTourPageDto { items: PartnerTourItemDto[]; page: number; size: number; totalItems: number; totalPages: number; }
export interface CancellationPolicyVersionDto { id: number; policyTitle: string; versionNumber: number; content: string; effectiveFrom: string; }
export interface PartnerTourDraftRequest {
  title: string; description: string; difficulty: string; durationDays: number; requiredExperience?: string | null;
  includedServices?: string | null; excludedServices?: string | null; routeFileUrl?: string | null;
  cancellationPolicyVersionId: number; locationIds: number[]; media: { mediaType: string; url: string; caption?: string | null; displayOrder: number; cover: boolean }[];
  itinerary: { dayNumber: number; displayOrder: number; title: string; description?: string | null; startTime?: string | null; locationId?: number | null }[];
  packingList: { name: string; required: boolean; note?: string | null; displayOrder: number }[];
}
export interface PartnerScheduleDto {
  id: number; tourId: number; startsAt: string; endsAt: string; capacity: number; heldSeats: number; confirmedSeats: number;
  availableSpots: number; basePriceVnd: number; equipmentFeeVnd: number; depositPercent: number; balanceDueAt: string;
  status: string; meetingPoint: string | null; contactPhone: string | null; guides: { id: number; displayName: string; isLead: boolean }[];
}
export interface PartnerScheduleRequest {
  startsAt: string; endsAt: string; capacity: number; basePriceVnd: number; equipmentFeeVnd: number; depositPercent: number;
  balanceDueAt: string; meetingPoint?: string | null; contactPhone?: string | null; guideAssignments: { guideId: number; isLead: boolean }[];
}
export interface PartnerGuideDto { id: number; companyId: number; displayName: string; active: boolean; }
export interface TourRosterDto { scheduleId: number; participants: { bookingCode: string; participantId?: number; fullName: string; phone?: string | null; emergencyContact?: string | null; checkedInAt?: string | null; checkInNote?: string | null }[]; page?: number; size?: number; totalItems?: number; totalPages?: number; }
export interface TourReviewQueueItem { id: number; companyId: number; title: string; submittedAt: string; mediaCount: number; itineraryDays: number; }
export type Tour = TourSummaryDto;
export type Destination = LocationDto;
