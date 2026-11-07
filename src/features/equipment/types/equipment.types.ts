export interface EquipmentCatalogItem {
  id: number;
  name: string;
  description: string | null;
  individualRentalPriceVnd: number | null;
  imageUrl: string | null;
}

export interface SaveEquipmentRequest {
  name: string;
  description?: string | null;
  individualRentalPriceVnd?: number | null;
}

export interface EquipmentInventoryItem {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  totalQuantity: number;
  maintenanceQuantity: number;
  availableQuantity: number;
  active: boolean;
}

export interface SaveInventoryRequest {
  categoryId: number;
  totalQuantity: number;
  maintenanceQuantity: number;
  active: boolean;
}

export interface EquipmentCategory {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface SaveCategoryRequest {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface RentalPackageTemplateItem {
  equipmentId: number;
  name: string;
  description: string | null;
  quantityInPackage: number;
  individualRentalPriceVnd: number | null;
}

export interface RentalPackageTemplate {
  id: number;
  title: string;
  rentalPriceVnd: number;
  imageUrl: string | null;
  items: RentalPackageTemplateItem[];
}

export interface SaveRentalPackageItemRequest {
  equipmentId: number;
  quantityInPackage: number;
  individualRentalPriceVnd?: number | null;
}

export interface SaveRentalPackageRequest {
  title: string;
  rentalPriceVnd: number;
  items: SaveRentalPackageItemRequest[];
}

export interface TourRentalItem {
  id: number;
  equipmentId: number;
  name: string;
  description: string | null;
  quantityInPackage?: number;
  individualRentalPriceVnd: number | null;
}

export interface TourRentalPackage {
  id: number;
  packageTemplateId: number | null;
  title: string;
  includedItems?: string | null;
  rentalPriceVnd: number | null;
  needsReview?: boolean;
  items?: TourRentalItem[];
}

export interface TourEquipmentResponse {
  version?: number;
  needsReview?: boolean;
  packages?: TourRentalPackage[];
  individualItems?: TourRentalItem[];
  equipmentPackage?: TourRentalPackage | null;
  items: TourRentalItem[];
}

export interface AssignTourEquipmentRequest {
  version?: number | null;
  packageTemplateIds: number[];
  packageTemplateId?: number | null;
  individualEquipmentIds: number[];
}

// Handover & Reservation Types for Guide & Admin
export type EquipmentCondition = 'GOOD' | 'NEEDS_INSPECTION';

export type EquipmentReservationStatus =
  | 'confirmed'
  | 'issued'
  | 'return_required'
  | 'returned'
  | string;

export interface EquipmentReservationItem {
  equipmentId: number;
  equipmentName: string;
  quantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
}

export interface EquipmentReservationResponse {
  reservationId: number;
  bookingId: number;
  scheduleId: number;
  packageId: number | null;
  status: EquipmentReservationStatus;
  holdExpiresAt: string | null;
  items: EquipmentReservationItem[];
}

export interface EquipmentHandoverItemRequest {
  equipmentId: number;
  quantity: number;
  condition?: EquipmentCondition;
}

export interface EquipmentHandoverRequest {
  note?: string;
  items: EquipmentHandoverItemRequest[];
}
