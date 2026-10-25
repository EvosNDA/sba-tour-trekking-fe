import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';
import type {
  ActivityResponse, TourSearchParams, RequiredItemResponse, ScheduleDetailResponse,
  ScheduleSummaryResponse, TourDetailResponse, TourEquipmentResponse, TourPageResponse, TourSummaryResponse,
} from '../types/tour-contract.types';

const base = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const version = base.endsWith('/api/v1') ? '' : base.endsWith('/api') ? '/v1' : '/api/v1';
const tours = `${version}/tours`;
const idPath = (id: number | string) => `${tours}/${encodeURIComponent(id)}`;

// The shared client types assume an envelope; tour controllers return the DTO directly.
async function get<T>(path: string, signal?: AbortSignal, params?: Record<string, unknown>): Promise<T> {
  return await apiClient.get<T>(path, { signal, params }) as unknown as T;
}

export const tourReadApi = {
  list: (query: TourSearchParams, signal?: AbortSignal) => get<TourPageResponse<TourSummaryResponse>>(
    tours, signal, { ...query, status: 'PUBLISHED', page: query.page ?? 0, size: query.size ?? 12 }),
  detail: (tourId: number | string, signal?: AbortSignal) => get<TourDetailResponse>(idPath(tourId), signal),
  schedules: (tourId: number | string, page = 0, signal?: AbortSignal) => get<TourPageResponse<ScheduleSummaryResponse>>(
    `${idPath(tourId)}/schedules`, signal, { page, size: 4, upcomingOnly: true }),
  schedule: (tourId: number | string, scheduleId: number, signal?: AbortSignal) => get<ScheduleDetailResponse>(
    `${idPath(tourId)}/schedules/${scheduleId}`, signal),
  activities: (tourId: number | string, signal?: AbortSignal) => get<ActivityResponse[]>(`${idPath(tourId)}/activities`, signal),
  requiredItems: (tourId: number | string, signal?: AbortSignal) => get<RequiredItemResponse[]>(`${idPath(tourId)}/required-items`, signal),
  equipment: (tourId: number | string, signal?: AbortSignal) => get<TourEquipmentResponse>(`${idPath(tourId)}/equipment`, signal),
};
