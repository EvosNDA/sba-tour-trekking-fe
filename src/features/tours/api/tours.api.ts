import { apiClient } from '../../../lib/axios';
import { ApiResponse } from '../../../types/api.types';
import { APP_CONFIG } from '../../../constants/config';
import { authStore } from '../../../stores/auth.store';
import { CancellationPolicyVersionDto, EquipmentPackageWriteRequest, ImageUploadSignature, LocationDto, PartnerGuideDto, PartnerScheduleRequest, PartnerTourDto, PartnerTourDraftRequest, PartnerTourPageDto, TourDetailDto, TourFilter, TourPageDto, TourReviewQueueItem, TourReviewsDto, TourRosterDto } from '../types/tour.types';

// The backend mounts features below /api/v1. The default Vite proxy already
// includes /api, while an explicitly configured backend URL may not.
const API_BASE = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const API_V1 = API_BASE.endsWith('/api/v1') ? '' : API_BASE.endsWith('/api') ? '/v1' : '/api/v1';
const tourPath = (path: string) => `${API_V1}${path}`;

const unwrap = <T,>(response: ApiResponse<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response && 'status' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};
const get = <T,>(url: string, config?: Parameters<typeof apiClient.get<T>>[1]) => apiClient.get<T>(url, config).then(unwrap<T>);
const post = <T,>(url: string, body?: unknown) => apiClient.post<T>(url, body).then(unwrap<T>);
const patch = <T,>(url: string, body: unknown) => apiClient.request<T>(url, { method: 'PATCH', data: body }).then(unwrap<T>);
const put = <T,>(url: string, body: unknown) => apiClient.put<T>(url, body).then(unwrap<T>);
const remove = <T,>(url: string) => apiClient.delete<T>(url).then(unwrap<T>);

export const toursApi = {
  // Public catalog calls stay anonymous so an expired saved token cannot block guest browsing.
  getTours: (filter: TourFilter = {}) => get<TourPageDto>(tourPath('/tours'), {
    params: {
      query: filter.query,
      destinationId: filter.destinationId,
      difficulty: filter.difficulty,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minRating: filter.minRating,
      equipmentPackageId: filter.equipmentPackageId,
      sort: filter.sort,
      page: filter.page ?? 0,
      size: filter.size ?? 20,
    },
    auth: false,
  }),
  getTourById: (id: number | string) => get<TourDetailDto>(tourPath(`/tours/${encodeURIComponent(id)}`), { auth: false }),
  getReviews: (id: number | string, page = 0, size = 10) => get<TourReviewsDto>(tourPath(`/tours/${encodeURIComponent(id)}/reviews`), { params: { page, size }, auth: false }),
  getDestinations: () => get<LocationDto[]>(tourPath('/locations'), { auth: false }),
  getPartnerTours: (params: { page?: number; size?: number; status?: string } = {}) => get<PartnerTourPageDto>(tourPath('/partner/tours'), { params }),
  getPartnerGuides: () => get<{ items: PartnerGuideDto[] }>(tourPath('/partner/guides')),
  getCancellationPolicyVersions: () => get<{ items: CancellationPolicyVersionDto[] }>(tourPath('/partner/tours/policy-versions')),
  getImageUploadSignature: () => post<ImageUploadSignature>(tourPath('/partner/tours/upload-signature'), {}),
  createPartnerTour: (body: PartnerTourDraftRequest) => post<PartnerTourDto>(tourPath('/partner/tours'), body),
  getPartnerTour: (id: number) => get<PartnerTourDto>(tourPath(`/partner/tours/${id}`)),
  updatePartnerTour: (id: number, body: Partial<PartnerTourDraftRequest>) => patch<PartnerTourDto>(tourPath(`/partner/tours/${id}`), body),
  archivePartnerTour: (id: number) => remove<{ message: string }>(tourPath(`/partner/tours/${id}`)),
  restorePartnerTour: (id: number) => post<{ message: string }>(tourPath(`/partner/tours/${id}/restore`), {}),
  submitPartnerTour: (id: number) => post<{ message: string }>(tourPath(`/partner/tours/${id}/submit`), {}),
  createSchedule: (tourId: number, body: PartnerScheduleRequest) => post(tourPath(`/partner/tours/${tourId}/schedules`), body),
  updateSchedule: (tourId: number, scheduleId: number, body: Partial<PartnerScheduleRequest>) => patch(tourPath(`/partner/tours/${tourId}/schedules/${scheduleId}`), body),
  scheduleAction: (tourId: number, scheduleId: number, action: 'cancel' | 'complete', reason?: string) => post(tourPath(`/partner/tours/${tourId}/schedules/${scheduleId}/${action}`), { reason }),
  replaceEquipment: (tourId: number, packageRequest: EquipmentPackageWriteRequest) => put(tourPath(`/partner/tours/${tourId}/equipment-packages`), packageRequest),
  getRoster: (tourId: number, scheduleId: number, params: { page?: number; size?: number } = {}) => get<TourRosterDto>(tourPath(`/partner/tours/${tourId}/schedules/${scheduleId}/roster`), { params }),
  downloadRoster: async (tourId: number, scheduleId: number) => {
    const url = new URL(`${APP_CONFIG.API_BASE_URL.replace(/\/$/, '')}${tourPath(`/partner/tours/${tourId}/schedules/${scheduleId}/roster.xlsx`)}`, window.location.origin);
    const token = authStore.getState().token;
    const response = await fetch(url, { method: 'GET', credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Your session expired or you are not signed in. Sign in again before downloading the roster.');
      if (response.status === 403) throw new Error('Your account is not authorized to view this departure roster.');
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(body?.message || `Roster download failed (${response.status}).`);
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.includes('spreadsheetml.sheet') && !contentType.includes('application/octet-stream')) {
      throw new Error('The server did not return an Excel roster file.');
    }
    return response.blob();
  },
  getModerationQueue: (page = 0, size = 20) => get<{ items: TourReviewQueueItem[]; page: number; size: number; totalItems: number; totalPages: number }>(tourPath('/admin/tours/review'), { params: { page, size } }),
  moderateTour: (tourId: number, action: 'approve' | 'reject', reason = '') => post(tourPath(`/admin/tours/${tourId}/${action}`), action === 'reject' ? { reason } : {}),
};
