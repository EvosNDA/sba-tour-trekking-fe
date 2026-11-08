import { apiClient } from '../../../lib/axios';
import type { BookingDetailResponse } from '../../bookings/types/booking.types';
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
  ScheduleEquipmentSummaryItem,
  ScheduleEquipmentSummaryResponse,
} from '../types/equipment.types';

const CONFIRMED_BOOKING_STATUSES = new Set(['CONFIRMED', 'COMPLETED']);

const COUNTED_RESERVATION_STATUSES = new Set([
  'confirmed',
  'issued',
  'partially_issued',
  'return_required',
  'returned',
  'partially_returned',
]);

const EXCLUDED_RESERVATION_STATUSES = new Set([
  'released',
  'cancelled',
  'canceled',
  'expired',
  'voided',
  'rejected',
  'held',
  'hold',
  'pending',
  'pending_payment',
]);

/**
 * Xác định đơn đặt chỗ và phiếu giữ/đặt thiết bị có đủ điều kiện cộng vào
 * bảng "Tổng hợp thiết bị khách đặt" của một lịch khởi hành cụ thể hay không.
 *
 * Quy tắc:
 * - Thuộc đúng `scheduleId` đang mở.
 * - Đơn đặt chỗ ở trạng thái xác nhận (`CONFIRMED` hoặc `COMPLETED`); loại bỏ
 *   đơn đã hủy (`CANCELLED`), hết hạn (`EXPIRED`), vắng mặt (`NO_SHOW`) hoặc
 *   đang chờ thanh toán (`PENDING_PAYMENT`).
 * - Reservation ở trạng thái đã xác nhận/bàn giao/thu hồi (`confirmed`, `issued`,
 *   `return_required`, `returned`); loại bỏ reservation đã giải phóng (`released`,
 *   `cancelled`, `expired`) và không tính `held` (đặc biệt các `held` đã hết hạn)
 *   như đơn xác nhận.
 */
export function isReservationCountedForSchedule(
  booking: BookingDetailResponse,
  reservation: EquipmentReservationResponse | undefined | null,
  scheduleId: number,
  nowMs: number = Date.now()
): boolean {
  if (!reservation || !Array.isArray(reservation.items) || reservation.items.length === 0) {
    return false;
  }

  if (booking.scheduleId && booking.scheduleId !== scheduleId) {
    return false;
  }

  if (reservation.scheduleId && reservation.scheduleId !== scheduleId) {
    return false;
  }

  const bookingStatus = String(booking.status || '').trim().toUpperCase();
  if (!CONFIRMED_BOOKING_STATUSES.has(bookingStatus)) {
    return false;
  }

  const resStatus = String(reservation.status || '').trim().toLowerCase();
  if (!resStatus || EXCLUDED_RESERVATION_STATUSES.has(resStatus)) {
    return false;
  }

  if (reservation.holdExpiresAt && resStatus.includes('hold')) {
    const expMs = new Date(reservation.holdExpiresAt).getTime();
    if (!Number.isNaN(expMs) && expMs <= nowMs) {
      return false;
    }
  }

  return COUNTED_RESERVATION_STATUSES.has(resStatus);
}

/**
 * Tổng hợp thiết bị khách đặt theo đúng `scheduleId` từ danh sách booking và reservation.
 */
export function aggregateScheduleEquipment(
  scheduleId: number,
  bookings: BookingDetailResponse[],
  reservationsMap: Record<number, EquipmentReservationResponse>
): ScheduleEquipmentSummaryResponse {
  const nowMs = Date.now();
  const itemMap = new Map<
    number,
    {
      equipmentId: number;
      equipmentName: string;
      bookingIds: Set<number>;
      totalQuantity: number;
      issuedQuantity: number;
      returnedQuantity: number;
    }
  >();
  const bookingsWithEquipment = new Set<number>();

  bookings.forEach((booking) => {
    const reservation = reservationsMap[booking.id];
    if (!isReservationCountedForSchedule(booking, reservation, scheduleId, nowMs)) {
      return;
    }

    let hasPositiveItem = false;
    (reservation.items || []).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const issued = Number(item.issuedQuantity) || 0;
      const returned = Number(item.returnedQuantity) || 0;
      if (qty <= 0 && issued <= 0 && returned <= 0) {
        return;
      }

      hasPositiveItem = true;
      const existing = itemMap.get(item.equipmentId);
      if (existing) {
        existing.bookingIds.add(booking.id);
        existing.totalQuantity += qty;
        existing.issuedQuantity += issued;
        existing.returnedQuantity += returned;
      } else {
        itemMap.set(item.equipmentId, {
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName || `Thiết bị #${item.equipmentId}`,
          bookingIds: new Set([booking.id]),
          totalQuantity: qty,
          issuedQuantity: issued,
          returnedQuantity: returned,
        });
      }
    });

    if (hasPositiveItem) {
      bookingsWithEquipment.add(booking.id);
    }
  });

  const items: ScheduleEquipmentSummaryItem[] = Array.from(itemMap.values())
    .map((entry) => ({
      equipmentId: entry.equipmentId,
      equipmentName: entry.equipmentName,
      bookingCount: entry.bookingIds.size,
      totalQuantity: entry.totalQuantity,
      issuedQuantity: entry.issuedQuantity,
      returnedQuantity: entry.returnedQuantity,
    }))
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return a.equipmentName.localeCompare(b.equipmentName, 'vi');
    });

  return {
    scheduleId,
    totalBookingsWithEquipment: bookingsWithEquipment.size,
    items,
  };
}

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

  // 6. Schedule Equipment Summary (Tổng hợp thiết bị khách đặt theo scheduleId)
  getScheduleEquipmentSummary: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleEquipmentSummaryResponse> => {
    const raw = await apiClient.get<any>(
      `/api/v1/schedules/${scheduleId}/equipment-summary`,
      { signal }
    );
    const items: ScheduleEquipmentSummaryItem[] = (raw?.items || []).map((item: any) => ({
      equipmentId: Number(item.equipmentId),
      equipmentName: item.equipmentName || `Thiết bị #${item.equipmentId}`,
      bookingCount: Number(item.bookingCount ?? 0),
      totalQuantity: Number(item.totalQuantity ?? item.orderedQuantity ?? 0),
      issuedQuantity: Number(item.issuedQuantity ?? 0),
      returnedQuantity: Number(item.returnedQuantity ?? 0),
    }));
    return {
      scheduleId: Number(raw?.scheduleId ?? scheduleId),
      totalBookingsWithEquipment: Number(
        raw?.totalBookingsWithEquipment ?? raw?.bookingsWithEquipment ?? 0
      ),
      items,
    };
  },
};
