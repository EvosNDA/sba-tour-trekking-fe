import { Modal } from '../../../components/ui/Modal';
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
    <Modal isOpen={isOpen} onClose={onClose} title={<>{isHide ? 'Ẩn đánh giá của khách hàng' : 'Khôi phục hiển thị đánh giá'}</>} subtitle={<>{isHide
                  ? 'Đánh giá bị ẩn sẽ không còn xuất hiện công khai trên trang chi tiết tour.'
                  : 'Đánh giá sẽ được hiển thị công khai trở lại cho khách hàng.'}</>} preventClose={isSubmitting} maxWidth="lg">
      <div className="space-y-5">

        {/* Thông tin đối tượng review */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-700 space-y-1.5">
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
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
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
                className="text-sm font-semibold text-stone-700"
              >
                Lý do {isHide ? 'ẩn' : 'khôi phục'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs font-mono ${
                  reason.length > 2000 ? 'text-rose-600 font-bold' : 'text-stone-400'
                }`}
              >
                {reason.length} / 2000
              </span>
            </div>

            <textarea
              id="review-action-reason"
              required
              aria-invalid={Boolean(error?.fieldErrors?.reason)}
              aria-describedby={error?.fieldErrors?.reason ? 'review-reason-error' : undefined}
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
              className="w-full text-sm p-3 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-800 transition-colors resize-none disabled:bg-stone-100 text-stone-800"
            />

            {error?.fieldErrors?.reason && (
              <p id="review-reason-error" className="text-sm text-rose-700 mt-1">
                {error.fieldErrors.reason}
              </p>
            )}
          </div>

          {/* Lỗi chung từ API */}
          {error && !error.fieldErrors?.reason && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-1"
            >
              <p className="font-semibold">{error.message}</p>
              {error.code && (
                <p className="font-mono text-xs text-rose-600">Mã lỗi: {error.code}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValidReason || isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
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
    </Modal>
  );
};
