export interface CustomerReviewItem {
  id: number;
  customerId: number;
  customerName: string;
  rating: number; // 1..5
  comment: string | null;
  createdAt: string; // ISO
}

export interface TourReviewsResponse {
  items: CustomerReviewItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  averageRating: number | string | null; // BigDecimal từ backend có thể là string/number
  reviewCount: number;
}

export interface TourReviewsParams {
  tourId: number;
  page?: number;
  size?: number;
}
