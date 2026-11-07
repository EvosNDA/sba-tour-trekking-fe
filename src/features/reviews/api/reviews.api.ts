import { apiClient } from '../../../lib/axios';
import {
  AdminReviewItem,
  AdminReviewDetail,
  AdminReviewListResponse,
  AdminReviewsParams,
  ReviewActionRequest,
} from '../types/review.types';

export const reviewsApi = {
  // 1. GET /api/v1/admin/reviews
  getReviews: async (
    params: AdminReviewsParams = {},
    signal?: AbortSignal
  ): Promise<AdminReviewListResponse> => {
    return apiClient.get<AdminReviewListResponse>('/api/v1/admin/reviews', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        q: params.q?.trim() || undefined,
        status: params.status || undefined,
        rating: params.rating || undefined,
        tourId: params.tourId && params.tourId > 0 ? params.tourId : undefined,
        createdFrom: params.createdFrom || undefined,
        createdTo: params.createdTo || undefined,
        sort: params.sort || undefined,
      },
      signal,
    });
  },

  // 2. GET /api/v1/admin/reviews/{id}
  getReviewDetail: async (
    id: number,
    signal?: AbortSignal
  ): Promise<AdminReviewDetail> => {
    return apiClient.get<AdminReviewDetail>(`/api/v1/admin/reviews/${id}`, {
      signal,
    });
  },

  // 3. POST /api/v1/admin/reviews/{id}/hide
  hideReview: async (
    id: number,
    payload: ReviewActionRequest,
    signal?: AbortSignal
  ): Promise<any> => {
    return apiClient.post<any>(`/api/v1/admin/reviews/${id}/hide`, payload, {
      signal,
    });
  },

  // 4. POST /api/v1/admin/reviews/{id}/restore
  restoreReview: async (
    id: number,
    payload: ReviewActionRequest,
    signal?: AbortSignal
  ): Promise<any> => {
    return apiClient.post<any>(`/api/v1/admin/reviews/${id}/restore`, payload, {
      signal,
    });
  },
};
