import { apiClient } from '../../../lib/axios';
import { SpringPage } from '../../../types/api.types';
import {
  TourSummaryResponse,
  TourDetailResponse,
  TourMediaResponse,
  CreateTourRequest,
  UpdateTourRequest,
  CreateScheduleRequest,
  TourScheduleRangeResponse,
  TourScheduleOverviewResponse,
  ScheduleSummaryResponse,
  ScheduleDetailResponse,
  ScheduleAvailabilityResponse,
  ActivityResponse,
  TourQueryParams,
  TourEquipmentResponse,
} from '../types/tour.types';
import { EXPLORE_TOURS, POPULAR_DESTINATIONS, TOUR_COMPANIES } from '../../../data/mockData';
import { Tour, Destination, TourCompany } from '../../../types/expedition';

export interface LocationOption {
  id: number;
  name: string;
  provinceName: string | null;
  latitude: number | null;
  longitude: number | null;
  visitOrder: number | null;
}

export const toursApi = {
  listLocations: async (): Promise<LocationOption[]> =>
    apiClient.get<LocationOption[]>('/api/v1/admin/tour-locations'),

  createLocation: async (payload: { name: string; provinceName?: string }): Promise<LocationOption> =>
    apiClient.post<LocationOption>('/api/v1/admin/tour-locations', payload),

  getTourLocations: async (tourId: number | string): Promise<LocationOption[]> =>
    apiClient.get<LocationOption[]>(`/api/v1/tours/${tourId}/locations`),

  saveTourLocations: async (tourId: number | string, locationIds: number[]): Promise<LocationOption[]> =>
    apiClient.put<LocationOption[]>(`/api/v1/tours/${tourId}/locations`, { locationIds }),

  listScheduleOverview: async (
    params: { page: number; size: number; query?: string },
    signal?: AbortSignal
  ): Promise<SpringPage<TourScheduleOverviewResponse>> =>
    apiClient.get<SpringPage<TourScheduleOverviewResponse>>('/api/v1/admin/schedules/overview', { params, signal }),

  listTours: async (
    params: TourQueryParams = {},
    signal?: AbortSignal
  ): Promise<SpringPage<TourSummaryResponse>> => {
    const queryParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };
    if (params.query !== undefined && params.query.trim() !== '') {
      queryParams.query = params.query.trim();
    }
    if (params.difficulty) {
      queryParams.difficulty = params.difficulty;
    }
    if (params.durationDays !== undefined && params.durationDays !== '') {
      queryParams.durationDays = Number(params.durationDays);
    }
    if (params.departureDate) {
      queryParams.departureDate = params.departureDate;
    }
    if (params.status) {
      queryParams.status = params.status;
    }

    // Do not skipAuth so that if an ADMIN (or authenticated user) is logged in,
    // Authorization: Bearer <access-token> is sent to retrieve admin-level tour data.
    return apiClient.get<SpringPage<TourSummaryResponse>>('/api/v1/tours', {
      params: queryParams,
      signal,
    });
  },

  getTourDetail: async (
    tourId: number | string,
    signal?: AbortSignal
  ): Promise<TourDetailResponse> => {
    return apiClient.get<TourDetailResponse>(`/api/v1/tours/${tourId}`, {
      signal,
    });
  },

  createTour: async (
    payload: CreateTourRequest,
    signal?: AbortSignal
  ): Promise<TourDetailResponse> => {
    return apiClient.post<TourDetailResponse>('/api/v1/tours', payload, {
      signal,
    });
  },

  updateTour: async (
    tourId: number | string,
    payload: UpdateTourRequest,
    signal?: AbortSignal
  ): Promise<TourDetailResponse> => {
    return apiClient.put<TourDetailResponse>(`/api/v1/tours/${tourId}`, payload, {
      signal,
    });
  },

  deleteTour: async (
    tourId: number | string,
    signal?: AbortSignal
  ): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/tours/${tourId}`, {
      signal,
    });
  },

  getTourActivities: async (
    tourId: number | string,
    signal?: AbortSignal
  ): Promise<ActivityResponse[]> => {
    return apiClient.get<ActivityResponse[]>(`/api/v1/tours/${tourId}/activities`, {
      signal,
    });
  },

  getTourSchedules: async (
    tourId: number | string,
    params: { page?: number; size?: number; upcomingOnly?: boolean } = {},
    signal?: AbortSignal
  ): Promise<SpringPage<ScheduleSummaryResponse>> => {
    return apiClient.get<SpringPage<ScheduleSummaryResponse>>(
      `/api/v1/tours/${tourId}/schedules`,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          upcomingOnly: params.upcomingOnly ?? true,
        },
        signal,
      }
    );
  },

  getScheduleDetail: async (
    tourId: number | string,
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleDetailResponse> => {
    return apiClient.get<ScheduleDetailResponse>(
      `/api/v1/tours/${tourId}/schedules/${scheduleId}`,
      {
        signal,
      }
    );
  },

  getScheduleAvailability: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleAvailabilityResponse> => {
    return apiClient.get<ScheduleAvailabilityResponse>(
      `/api/v1/schedules/${scheduleId}/availability`,
      {
        signal,
      }
    );
  },

  getScheduleDefaults: async (tourId: number) => (await apiClient.get<{capacity:number; basePriceVnd:number; equipmentFeeVnd:number; depositPercent:number; meetingPoint:string | null; contactPhone:string | null} | null>(`/api/v1/tours/${tourId}/schedule-defaults`)) || null,
  saveScheduleDefaults: async (tourId: number, payload: {capacity:number; basePriceVnd:number; equipmentFeeVnd:number; depositPercent:number; meetingPoint?:string; contactPhone?:string}) => apiClient.put(`/api/v1/tours/${tourId}/schedule-defaults`, payload),

  latestSchedule: async (tourId: number): Promise<ScheduleDetailResponse | null> =>
    (await apiClient.get<ScheduleDetailResponse | null>(`/api/v1/tours/${tourId}/schedules/latest`)) || null,

  createSchedule: async (
    tourId: number | string,
    payload: CreateScheduleRequest,
    signal?: AbortSignal
  ): Promise<ScheduleDetailResponse> => {
    return apiClient.post<ScheduleDetailResponse>(
      `/api/v1/tours/${tourId}/schedules`,
      payload,
      {
        signal,
      }
    );
  },

  updateSchedule: async (
    tourId: number | string,
    scheduleId: number | string,
    payload: CreateScheduleRequest,
    signal?: AbortSignal
  ): Promise<ScheduleDetailResponse> => apiClient.put<ScheduleDetailResponse>(
    `/api/v1/tours/${tourId}/schedules/${scheduleId}`,
    payload,
    { signal }
  ),

  listSchedulesInRangePage: async (
    start: string,
    end: string,
    page = 0,
    size = 20,
    signal?: AbortSignal
  ): Promise<SpringPage<TourScheduleRangeResponse>> => {
    return apiClient.get<SpringPage<TourScheduleRangeResponse>>(
      '/api/v1/tours/schedules',
      { params: { start, end, page, size }, signal }
    );
  },

  listSchedulesInRange: async (
    start: string,
    end: string,
    signal?: AbortSignal
  ): Promise<TourScheduleRangeResponse[]> => {
    const results: TourScheduleRangeResponse[] = [];
    let page = 0;
    let last = false;
    while (!last) {
      const result = await toursApi.listSchedulesInRangePage(start, end, page, 100, signal);
      results.push(...result.content);
      last = result.last;
      page += 1;
    }
    return results;
  },

  uploadTourMedia: async (
    tourId: number | string,
    file: File,
    caption?: string,
    signal?: AbortSignal
  ): Promise<TourMediaResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<TourMediaResponse>(
      `/api/v1/tours/${tourId}/media`,
      formData,
      {
        params: caption ? { caption } : undefined,
        signal,
      }
    );
  },

  setCoverMedia: async (
    tourId: number | string,
    mediaId: number | string,
    signal?: AbortSignal
  ): Promise<TourMediaResponse> => {
    return apiClient.patch<TourMediaResponse>(
      `/api/v1/tours/${tourId}/media/${mediaId}/cover`,
      undefined,
      {
        signal,
      }
    );
  },

  deleteTourMedia: async (
    tourId: number | string,
    mediaId: number | string,
    signal?: AbortSignal
  ): Promise<void> => {
    return apiClient.delete<void>(
      `/api/v1/tours/${tourId}/media/${mediaId}`,
      {
        signal,
      }
    );
  },

  getTourEquipment: async (
    tourId: number | string,
    signal?: AbortSignal
  ): Promise<TourEquipmentResponse> => {
    return apiClient.get<TourEquipmentResponse>(`/api/v1/tours/${tourId}/equipment`, { signal });
  },

  // Legacy helpers kept for admin/partner demo screens
  getTours: async (): Promise<Tour[]> => {
    return EXPLORE_TOURS;
  },

  getTourById: async (id: string): Promise<Tour | undefined> => {
    return EXPLORE_TOURS.find((t) => t.id === id);
  },

  getDestinations: async (): Promise<Destination[]> => {
    return POPULAR_DESTINATIONS;
  },

  getCompanies: async (): Promise<TourCompany[]> => {
    return TOUR_COMPANIES;
  },
};
