import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';
import { authStore } from '../../../stores/auth.store';
import type {
  ActivityResponse,
  CreateActivityRequest,
  CreateScheduleRequest,
  CreateTourRequest,
  ScheduleDetailResponse,
  ScheduleSummaryResponse,
  TourDetailResponse,
  TourPageResponse,
  TourSearchParams,
  TourSummaryResponse,
  TourMediaResponse,
  TourEquipmentResponse,
  RequiredItemResponse,
  UpdateTourRequest,
  UpdateScheduleRequest,
  UpdateActivityRequest,
  EquipmentCatalogResponse,
  RentalPackageTemplateResponse,
  SaveEquipmentRequest,
  SaveRentalPackageRequest,
  AssignTourEquipmentRequest,
} from '../types/tour-contract.types';

const base = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const version = base.endsWith('/api/v1') ? '' : base.endsWith('/api') ? '/v1' : '/api/v1';
const tours = `${version}/tours`;
const path = (tourId: number, suffix = '') => `${tours}/${tourId}${suffix}`;

async function request<T>(url: string, method: string, data?: unknown): Promise<T> {
  const result = await apiClient.request<T>(url, { method, data }) as unknown as T;
  return result;
}

async function fetchNoContent(url: string, method: 'DELETE'): Promise<void> {
  const token = authStore.getState().token;
  const response = await fetch(new URL(`${base}${url}`, window.location.origin), {
    method,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.ok) return;
  const body = await response.json().catch(() => null) as { code?: string; message?: string; fieldErrors?: Record<string, string> } | null;
  throw body || new Error(response.statusText || `Request failed (${response.status}).`);
}

async function upload(tourId: number, file: File, caption: string): Promise<TourMediaResponse> {
  const query = new URLSearchParams();
  if (caption.trim()) query.set('caption', caption.trim());
  const token = authStore.getState().token;
  const response = await fetch(new URL(`${base}${path(tourId, '/media')}${query.size ? `?${query}` : ''}`, window.location.origin), {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: (() => { const form = new FormData(); form.append('file', file); return form; })(),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw body || new Error(response.statusText || `Request failed (${response.status}).`);
  return body as TourMediaResponse;
}

async function uploadFile<T>(url: string, file: File): Promise<T> {
  const token = authStore.getState().token;
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(new URL(`${base}${url}`, window.location.origin), {
    method: 'POST', credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw body || new Error(response.statusText || `Request failed (${response.status}).`);
  return body as T;
}

export const tourAdminApi = {
  list: async (params: TourSearchParams & { status?: string }) => await apiClient.get<TourPageResponse<TourSummaryResponse>>(
    tours, { params: { ...params, page: params.page ?? 0, size: params.size ?? 20 } }) as unknown as TourPageResponse<TourSummaryResponse>,
  read: async (tourId: number) => await apiClient.get<TourDetailResponse>(path(tourId)) as unknown as TourDetailResponse,
  create: (body: CreateTourRequest) => request<TourDetailResponse>(tours, 'POST', body),
  update: (tourId: number, body: UpdateTourRequest) => request<TourDetailResponse>(path(tourId), 'PUT', body),
  delete: (tourId: number) => fetchNoContent(path(tourId), 'DELETE'),
  schedules: async (tourId: number, page = 0) => await apiClient.get<TourPageResponse<ScheduleSummaryResponse>>(
    path(tourId, '/schedules'), { params: { page, size: 100 } }) as unknown as TourPageResponse<ScheduleSummaryResponse>,
  schedule: async (tourId: number, scheduleId: number) => await apiClient.get<ScheduleDetailResponse>(
    path(tourId, `/schedules/${scheduleId}`)) as unknown as ScheduleDetailResponse,
  createSchedule: (tourId: number, body: CreateScheduleRequest) => request<ScheduleDetailResponse>(path(tourId, '/schedules'), 'POST', body),
  updateSchedule: (tourId: number, scheduleId: number, body: UpdateScheduleRequest) => request<ScheduleDetailResponse>(
    path(tourId, `/schedules/${scheduleId}`), 'PUT', body),
  deleteSchedule: (tourId: number, scheduleId: number) => fetchNoContent(path(tourId, `/schedules/${scheduleId}`), 'DELETE'),
  activities: async (tourId: number) => await apiClient.get<ActivityResponse[]>(path(tourId, '/activities')) as unknown as ActivityResponse[],
  createActivity: (tourId: number, body: CreateActivityRequest) => request<ActivityResponse>(path(tourId, '/activities'), 'POST', body),
  updateActivity: (tourId: number, activityId: number, body: UpdateActivityRequest) => request<ActivityResponse>(
    path(tourId, `/activities/${activityId}`), 'PUT', body),
  deleteActivity: (tourId: number, activityId: number) => fetchNoContent(path(tourId, `/activities/${activityId}`), 'DELETE'),
  uploadMedia: upload,
  updateCaption: (tourId: number, mediaId: number, caption: string | null) => request<TourMediaResponse>(
    path(tourId, `/media/${mediaId}`), 'PATCH', { caption }),
  setCover: (tourId: number, mediaId: number) => request<TourMediaResponse>(path(tourId, `/media/${mediaId}/cover`), 'PATCH'),
  reorderMedia: (tourId: number, mediaIds: number[]) => request<TourMediaResponse[]>(path(tourId, '/media/order'), 'PUT', { mediaIds }),
  deleteMedia: (tourId: number, mediaId: number) => fetchNoContent(path(tourId, `/media/${mediaId}`), 'DELETE'),
  requiredItems: async (tourId: number) => await apiClient.get<RequiredItemResponse[]>(path(tourId, '/required-items')) as unknown as RequiredItemResponse[],
  equipment: async (tourId: number) => await apiClient.get<TourEquipmentResponse>(path(tourId, '/equipment')) as unknown as TourEquipmentResponse,
  assignEquipment: (tourId: number, body: AssignTourEquipmentRequest) => request<TourEquipmentResponse>(path(tourId, '/equipment'), 'PUT', body),
  equipmentCatalog: async () => await apiClient.get<EquipmentCatalogResponse[]>(`${tours}/equipment-catalog`) as unknown as EquipmentCatalogResponse[],
  createEquipment: (body: SaveEquipmentRequest) => request<EquipmentCatalogResponse>(`${tours}/equipment-catalog`, 'POST', body),
  updateEquipment: (id: number, body: SaveEquipmentRequest) => request<EquipmentCatalogResponse>(`${tours}/equipment-catalog/${id}`, 'PUT', body),
  uploadEquipmentImage: (id: number, file: File) => uploadFile<EquipmentCatalogResponse>(`${tours}/equipment-catalog/${id}/image`, file),
  deleteEquipmentImage: (id: number) => fetchNoContent(`${tours}/equipment-catalog/${id}/image`, 'DELETE'),
  deleteEquipment: (id: number) => fetchNoContent(`${tours}/equipment-catalog/${id}`, 'DELETE'),
  rentalPackages: async () => await apiClient.get<RentalPackageTemplateResponse[]>(`${tours}/rental-packages`) as unknown as RentalPackageTemplateResponse[],
  createRentalPackage: (body: SaveRentalPackageRequest) => request<RentalPackageTemplateResponse>(`${tours}/rental-packages`, 'POST', body),
  updateRentalPackage: (id: number, body: SaveRentalPackageRequest) => request<RentalPackageTemplateResponse>(`${tours}/rental-packages/${id}`, 'PUT', body),
  uploadRentalPackageImage: (id: number, file: File) => uploadFile<RentalPackageTemplateResponse>(`${tours}/rental-packages/${id}/image`, file),
  deleteRentalPackageImage: (id: number) => fetchNoContent(`${tours}/rental-packages/${id}/image`, 'DELETE'),
  deleteRentalPackage: (id: number) => fetchNoContent(`${tours}/rental-packages/${id}`, 'DELETE'),
};
