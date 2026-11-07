import { apiClient } from '../../../lib/axios';
import {
  TourReviewsParams,
  TourReviewsResponse,
} from '../types/customer-review.types';

/**
 * Cờ điều khiển yêu cầu đăng nhập để xem đánh giá:
 * - Hiện tại: backend yêu cầu Bearer JWT (401 nếu chưa đăng nhập) -> REQUIRE_AUTH_FOR_REVIEWS = true.
 * - Sau này: nếu backend mở public endpoint cho khách xem tự do -> chỉ cần đổi thành false.
 */
export const REQUIRE_AUTH_FOR_REVIEWS = true;

export const customerReviewsApi = {
  // GET /api/v1/reviews?tourId={id}&page=0&size=20
  getTourReviews: async (
    params: TourReviewsParams,
    signal?: AbortSignal
  ): Promise<TourReviewsResponse> => {
    return apiClient.get<TourReviewsResponse>('/api/v1/reviews', {
      params: {
        tourId: params.tourId,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
      signal,
    });
  },
};
