export type ReviewStatus = 'visible' | 'hidden';
export type ReviewStatusParam = 'VISIBLE' | 'HIDDEN';

export interface AdminReviewItem {
  id: number;
  bookingId: number;
  tourId: number;
  tourName: string;
  scheduleId: number;
  customerId: number;
  customerName: string;
  rating: number; // 1..5
  comment: string | null;
  status: ReviewStatus;
  moderationReason: string | null;
  moderatedBy: number | null;
  moderatedAt: null;
  createdAt: string; // ISO
}

export interface AdminReviewDetail {
  id: number;
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  tourId: number;
  tourName: string;
  scheduleId: number;
  customerId: number;
  customerName: string;
  rating: number; // 1..5
  comment: string | null;
  status: ReviewStatus;
  moderationReason: string | null;
  moderatedBy: number | null;
  moderatedAt: null;
  createdAt: string;
}

export interface AdminReviewListResponse {
  items: AdminReviewItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminReviewsParams {
  page?: number;
  size?: number;
  q?: string;
  status?: ReviewStatusParam;
  rating?: number;
  tourId?: number;
  createdFrom?: string; // yyyy-MM-dd, inclusive
  createdTo?: string; // yyyy-MM-dd, exclusive
  sort?: string; // createdAt|rating,asc|desc (mặc định createdAt,desc)
}

export interface ReviewActionRequest {
  reason: string;
}
