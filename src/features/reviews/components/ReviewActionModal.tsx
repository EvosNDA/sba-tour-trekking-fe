import React, { useState, useEffect } from 'react';
import { EyeOff, RotateCcw, X, Loader2, AlertCircle } from 'lucide-react';
import type { ApiError } from '../../../types/api.types';
import { AdminReviewItem } from '../types/review.types';

export interface ReviewActionModalProps {
  isOpen: boolean;
  review: AdminReviewItem | null;
  actionType: 'hide' | 'restore';
  isSubmitting: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const ReviewActionModal: React.FC<ReviewActionModalProps> = ({
  isOpen,
  review,
  actionType,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen, review]);

  if (!isOpen || !review) return null;

  const isHide = actionType === 'hide';
  const trimmedReason = reason.trim();
  const isValidReason = trimmedReason.length > 0 && trimmedReason.length <= 2000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidReason || isSubmitting) return;
    onConfirm(trimmedReason);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-action-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isHide ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isHide ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="review-action-modal-title"
                className="text-base font-bold text-stone-900"
              >
                {isHide ? 'Ẩn đánh giá của khách hàng' : 'Khôi phục hiển thị đánh giá'}
              </h2>
              <p className="text-xs text-stone-500">
                {isHide
                  ? 'Đánh giá bị ẩn sẽ không còn xuất hiện công khai trên trang chi tiết tour.'
                  : 'Đánh giá sẽ được hiển thị công khai trở lại cho khách hàng.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin đối tượng review */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone-500">Khách hàng:</span>
            <strong className="text-stone-900">{review.customerName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Tour:</span>
            <span className="font-medium text-stone-800 truncate max-w-[220px]" title={review.tourName}>
              {review.tourName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Đánh giá:</span>
            <span className="font-bold text-amber-600 font-mono">
              ★ {review.rating}/5
            </span>
          </div>
          {review.comment && (
            <div className="pt-1 border-t border-stone-200/60 mt-1">
              <span className="text-stone-500 block mb-0.5">Nội dung tóm tắt:</span>
              <p className="italic text-stone-600 line-clamp-2">"{review.comment}"</p>
            </div>
          )}
        </div>

        {/* Nhắc nhở quy tắc nghiệp vụ */}
        {isHide && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Quy tắc nghiệp vụ:</strong> Không ẩn đánh giá chỉ vì điểm thấp. Chỉ ẩn khi nội dung vi phạm tiêu chuẩn cộng đồng, từ ngữ xúc phạm hoặc spam.
            </p>
          </div>
        )}

        {/* Form lý do */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="review-action-reason"
                className="text-xs font-semibold text-stone-700"
              >
                Lý do {isHide ? 'ẩn' : 'khôi phục'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  reason.length > 2000 ? 'text-rose-600 font-bold' : 'text-stone-400'
                }`}
              >
                {reason.length} / 2000
              </span>
            </div>

            <textarea
              id="review-action-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isHide
                  ? 'Nhập lý do ẩn đánh giá (bắt buộc, tối đa 2000 ký tự)...'
                  : 'Nhập lý do khôi phục đánh giá (bắt buộc, tối đa 2000 ký tự)...'
              }
              maxLength={2000}
              disabled={isSubmitting}
              className="w-full text-xs p-3 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-800 transition-colors resize-none disabled:bg-stone-100 text-stone-800"
            />

            {error?.fieldErrors?.reason && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {error.fieldErrors.reason}
              </p>
            )}
          </div>

          {/* Lỗi chung từ API */}
          {error && !error.fieldErrors?.reason && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1"
            >
              <p className="font-semibold">{error.message}</p>
              {error.code && (
                <p className="font-mono text-[11px] text-rose-600">Mã lỗi: {error.code}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValidReason || isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                isHide
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isHide ? 'Xác nhận ẩn' : 'Xác nhận khôi phục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
