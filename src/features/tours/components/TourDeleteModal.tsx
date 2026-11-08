import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { ApiError } from '../../../types/api.types';

export interface TourDeleteModalProps {
  isOpen: boolean;
  tourId: number | null;
  tourTitle: string;
  isDeleting: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const TourDeleteModal: React.FC<TourDeleteModalProps> = ({
  isOpen,
  tourId,
  tourTitle,
  isDeleting,
  error,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || tourId === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tour-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-700">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-tour-modal-title" className="text-base font-bold text-stone-900">
                Xác nhận xóa tour
              </h2>
              <p className="text-xs text-stone-500">Tour sẽ không còn hiển thị trong danh sách.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Đóng hộp thoại"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-stone-700 leading-relaxed space-y-2">
          <p>
            Bạn có chắc chắn muốn xóa tour <strong className="text-stone-950">"{tourTitle}"</strong>?
          </p>
          <p className="text-stone-600 bg-white p-2.5 rounded-lg border border-amber-200/70">
            Dữ liệu đặt chỗ và lịch sử liên quan sẽ được giữ lại.
          </p>
        </div>

        {error && (
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
