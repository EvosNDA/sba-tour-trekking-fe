import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  User,
  Compass,
  Bookmark,
  Calendar,
  AlertCircle,
  EyeOff,
  RotateCcw,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { AdminReviewDetail } from '../types/review.types';
import { reviewsApi } from '../api/reviews.api';
import type { ApiError } from '../../../types/api.types';

export interface ReviewDetailModalProps {
  isOpen: boolean;
  reviewId: number | null;
  onClose: () => void;
  onRequestAction?: (review: AdminReviewDetail, action: 'hide' | 'restore') => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isOpen,
  reviewId,
  onClose,
  onRequestAction,
}) => {
  const [detail, setDetail] = useState<AdminReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!isOpen || reviewId === null) {
      setDetail(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    reviewsApi
      .getReviewDetail(reviewId)
      .then((res) => {
        if (active) setDetail(res);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, reviewId]);

  if (!isOpen || reviewId === null) return null;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
            }`}
          />
        ))}
        <span className="ml-1.5 font-bold text-stone-900 font-mono text-sm">
          {rating}/5
        </span>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600 fill-amber-100" />
            <h2
              id="review-detail-modal-title"
              className="text-base font-bold text-stone-900"
            >
              Chi tiết đánh giá #{reviewId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
            <span className="text-xs text-stone-500">Đang tải thông tin đánh giá...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error.message || 'Không thể tải chi tiết đánh giá'}</span>
            </div>
          </div>
        )}

        {!isLoading && detail && (
          <div className="space-y-4 text-xs">
            {/* Header info box */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-stone-500 mb-0.5">Mức độ hài lòng</div>
                {renderStars(detail.rating)}
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium text-xs ${
                    detail.status === 'visible'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      detail.status === 'visible' ? 'bg-emerald-600' : 'bg-stone-500'
                    }`}
                  />
                  {detail.status === 'visible' ? 'Đang hiển thị' : 'Đã ẩn'}
                </span>
              </div>
            </div>

            {/* Nội dung đánh giá */}
            <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-1">
              <span className="text-stone-400 text-[11px] font-semibold uppercase tracking-wider block">
                Nội dung nhận xét của khách
              </span>
              <p className="text-stone-800 text-xs leading-relaxed whitespace-pre-wrap">
                {detail.comment || (
                  <span className="italic text-stone-400">Khách hàng không để lại nhận xét bằng chữ.</span>
                )}
              </p>
            </div>

            {/* Thông tin Tour & Booking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" /> Khách hàng
                </span>
                <p className="font-semibold text-stone-900 truncate">
                  {detail.customerName}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  Mã khách: #{detail.customerId}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-stone-400" /> Tuyến tour
                </span>
                <p className="font-semibold text-stone-900 truncate" title={detail.tourName}>
                  {detail.tourName}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  Tour ID: #{detail.tourId} • Lịch: #{detail.scheduleId}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-stone-400" /> Đơn đặt chỗ (Booking)
                </span>
                <p className="font-mono text-stone-800 font-medium">
                  {detail.bookingCode || `#${detail.bookingId}`}
                </p>
                <p className="text-[10px] text-stone-500">
                  Trạng thái: <span className="font-semibold">{detail.bookingStatus}</span>
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" /> Thời gian gửi đánh giá
                </span>
                <p className="font-mono text-stone-800 font-medium">
                  {formatDate(detail.createdAt)}
                </p>
              </div>
            </div>

            {/* Khối thông tin kiểm duyệt nếu status = hidden */}
            {detail.status === 'hidden' && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Thông tin ẩn đánh giá</span>
                </div>
                <div className="text-stone-700 text-xs">
                  <span className="text-stone-500">Lý do ẩn: </span>
                  <span className="font-medium text-stone-900">
                    {detail.moderationReason || 'Không có lý do chi tiết'}
                  </span>
                </div>
                {detail.moderatedBy && (
                  <div className="text-[11px] text-stone-500">
                    Người thực hiện: <span className="font-mono text-stone-800">Admin ID #{detail.moderatedBy}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div>
            {!isLoading && detail && onRequestAction && (
              detail.status === 'visible' ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestAction(detail, 'hide');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Ẩn đánh giá
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestAction(detail, 'restore');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Khôi phục hiển thị
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
