import { Modal } from '../../../components/ui/Modal';
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
    <Modal isOpen={isOpen} onClose={onClose} preventClose={isDeleting} title={<>Xác nhận xóa tour</>}>
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-sm text-stone-700 leading-relaxed space-y-2">
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
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-1"
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
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-sm font-semibold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
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
    </Modal>
  );
};
