import { apiClient } from '../../../lib/axios';
import type {
  EquipmentCatalogItem,
  SaveEquipmentRequest,
  EquipmentInventoryItem,
  SaveInventoryRequest,
  EquipmentCategory,
  SaveCategoryRequest,
  RentalPackageTemplate,
  SaveRentalPackageRequest,
  TourEquipmentResponse,
  AssignTourEquipmentRequest,
  EquipmentReservationResponse,
  EquipmentHandoverRequest,
} from '../types/equipment.types';

export const equipmentApi = {
  // 1. Equipment Catalog (Thiết bị lẻ)
  listCatalog: async (signal?: AbortSignal): Promise<EquipmentCatalogItem[]> => {
    return apiClient.get<EquipmentCatalogItem[]>('/api/v1/tours/equipment-catalog', { signal });
  },

  createEquipment: async (
    payload: SaveEquipmentRequest,
    signal?: AbortSignal
  ): Promise<EquipmentCatalogItem> => {
    return apiClient.post<EquipmentCatalogItem>('/api/v1/tours/equipment-catalog', payload, {
      signal,
    });
  },

  updateEquipment: async (
    equipmentId: number,
    payload: SaveEquipmentRequest,
    signal?: AbortSignal
  ): Promise<EquipmentCatalogItem> => {
    return apiClient.put<EquipmentCatalogItem>(
      `/api/v1/tours/equipment-catalog/${equipmentId}`,
      payload,
      { signal }
    );
  },

  deleteEquipment: async (equipmentId: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/tours/equipment-catalog/${equipmentId}`, { signal });
  },

  uploadEquipmentImage: async (
    equipmentId: number,
    file: File,
    signal?: AbortSignal
  ): Promise<EquipmentCatalogItem> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<EquipmentCatalogItem>(
      `/api/v1/tours/equipment-catalog/${equipmentId}/image`,
      formData,
      {
        signal,
      }
    );
  },

  deleteEquipmentImage: async (equipmentId: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/tours/equipment-catalog/${equipmentId}/image`, {
      signal,
    });
  },

  // 2. Inventory & Categories (Tồn kho & Nhóm thiết bị)
  listInventory: async (signal?: AbortSignal): Promise<EquipmentInventoryItem[]> => {
    return apiClient.get<EquipmentInventoryItem[]>('/api/v1/admin/equipment/inventory', { signal });
  },

  updateInventory: async (
    equipmentId: number,
    payload: SaveInventoryRequest,
    signal?: AbortSignal
  ): Promise<EquipmentInventoryItem> => {
    return apiClient.put<EquipmentInventoryItem>(
      `/api/v1/admin/equipment/${equipmentId}/inventory`,
      payload,
      { signal }
    );
  },

  listCategories: async (signal?: AbortSignal): Promise<EquipmentCategory[]> => {
    return apiClient.get<EquipmentCategory[]>('/api/v1/admin/equipment/categories', { signal });
  },

  createCategory: async (
    payload: SaveCategoryRequest,
    signal?: AbortSignal
  ): Promise<EquipmentCategory> => {
    return apiClient.post<EquipmentCategory>('/api/v1/admin/equipment/categories', payload, {
      signal,
    });
  },

  updateCategory: async (
    categoryId: number,
    payload: SaveCategoryRequest,
    signal?: AbortSignal
  ): Promise<EquipmentCategory> => {
    return apiClient.put<EquipmentCategory>(
      `/api/v1/admin/equipment/categories/${categoryId}`,
      payload,
      { signal }
    );
  },

  deleteCategory: async (categoryId: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/admin/equipment/categories/${categoryId}`, { signal });
  },

  // 3. Rental Packages (Combo thiết bị)
  listPackages: async (signal?: AbortSignal): Promise<RentalPackageTemplate[]> => {
    return apiClient.get<RentalPackageTemplate[]>('/api/v1/tours/rental-packages', { signal });
  },

  createPackage: async (
    payload: SaveRentalPackageRequest,
    signal?: AbortSignal
  ): Promise<RentalPackageTemplate> => {
    return apiClient.post<RentalPackageTemplate>('/api/v1/tours/rental-packages', payload, {
      signal,
    });
  },

  updatePackage: async (
    packageId: number,
    payload: SaveRentalPackageRequest,
    signal?: AbortSignal
  ): Promise<RentalPackageTemplate> => {
    return apiClient.put<RentalPackageTemplate>(
      `/api/v1/tours/rental-packages/${packageId}`,
      payload,
      { signal }
    );
  },

  deletePackage: async (packageId: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/tours/rental-packages/${packageId}`, { signal });
  },

  uploadPackageImage: async (
    packageId: number,
    file: File,
    signal?: AbortSignal
  ): Promise<RentalPackageTemplate> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<RentalPackageTemplate>(
      `/api/v1/tours/rental-packages/${packageId}/image`,
      formData,
      {
        signal,
      }
    );
  },

  deletePackageImage: async (packageId: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/tours/rental-packages/${packageId}/image`, { signal });
  },

  // 4. Tour Equipment Attachment (Gắn thiết bị/combo vào tour)
  getTourEquipment: async (tourId: number, signal?: AbortSignal): Promise<TourEquipmentResponse> => {
    return apiClient.get<TourEquipmentResponse>(`/api/v1/tours/${tourId}/equipment`, { signal });
  },

  assignTourEquipment: async (
    tourId: number,
    payload: AssignTourEquipmentRequest,
    signal?: AbortSignal
  ): Promise<TourEquipmentResponse> => {
    return apiClient.put<TourEquipmentResponse>(`/api/v1/tours/${tourId}/equipment`, payload, {
      signal,
    });
  },

  // 5. Equipment Handover (Bàn giao & Thu hồi theo Booking)
  getBookingEquipmentReservation: async (
    bookingId: number | string,
    signal?: AbortSignal
  ): Promise<EquipmentReservationResponse> => {
    return apiClient.get<EquipmentReservationResponse>(
      `/api/v1/bookings/${bookingId}/equipment/reservation`,
      { signal }
    );
  },

  issueBookingEquipment: async (
    bookingId: number | string,
    payload: EquipmentHandoverRequest,
    signal?: AbortSignal
  ): Promise<EquipmentReservationResponse> => {
    return apiClient.post<EquipmentReservationResponse>(
      `/api/v1/bookings/${bookingId}/equipment/issue`,
      payload,
      { signal }
    );
  },

  returnBookingEquipment: async (
    bookingId: number | string,
    payload: EquipmentHandoverRequest,
    signal?: AbortSignal
  ): Promise<EquipmentReservationResponse> => {
    return apiClient.post<EquipmentReservationResponse>(
      `/api/v1/bookings/${bookingId}/equipment/return`,
      payload,
      { signal }
    );
  },
};
