import React, { useId, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

interface CancelBookingDialogProps {
  isOpen: boolean;
  bookingCode: string;
  description?: React.ReactNode;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  /** Extra fields rendered under the reason, e.g. the refund destination. */
  children?: React.ReactNode;
}

export function CancelBookingDialog({ isOpen, bookingCode, description, reason, onReasonChange, onClose, onSubmit, isSubmitting, children }: CancelBookingDialogProps) {
  const id = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Hủy đặt chỗ #${bookingCode}`} maxWidth="lg" preventClose={isSubmitting} initialFocusRef={reasonRef}>
      <form onSubmit={onSubmit} className="space-y-5" aria-busy={isSubmitting}>
        <p className="text-sm leading-7 text-[#5C645E]">{description || 'Đặt chỗ sẽ được hủy. Nếu bạn đã thanh toán, yêu cầu hoàn tiền sẽ được đối soát theo chính sách của tour.'}</p>
        <div>
          <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#1C2526]">Lý do hủy <span aria-hidden="true" className="text-[#C2410C]">*</span></label>
          <textarea ref={reasonRef} id={id} rows={4} required disabled={isSubmitting} value={reason} onChange={(event) => onReasonChange(event.target.value)} className="w-full rounded-xl border border-[#D6CEBE] p-3 text-base text-[#1C2526]" />
        </div>
        {children}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#E6E1D8] pt-5 sm:flex-row">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-12 rounded-xl border border-[#D6CEBE] px-5 py-3 text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] disabled:opacity-50">Giữ lại đặt chỗ</button>
          <button type="submit" disabled={isSubmitting || !reason.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{isSubmitting ? 'Đang hủy…' : 'Xác nhận hủy'}</button>
        </div>
      </form>
    </Modal>
  );
}
