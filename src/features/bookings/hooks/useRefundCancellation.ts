import { useEffect, useState } from 'react';
import { bookingsApi } from '../api/bookings.api';
import type { RefundAccountRequest, RefundPreviewResponse } from '../../payments/types/payment.types';

const CANCEL_ERRORS: Record<string, string> = {
  REFUND_ACCOUNT_REQUIRED: 'Booking đã thanh toán: vui lòng nhập tài khoản nhận tiền hoàn.',
  REFUND_ACCOUNT_LOCKED: 'Tiền hoàn chỉ được chuyển về đúng tài khoản đã thanh toán.',
  REFUND_ALREADY_REQUESTED: 'Booking này đã có yêu cầu hoàn tiền đang xử lý.',
};

/** Vietnamese message for a failed cancel request, falling back to the server message. */
export function cancelErrorMessage(error: unknown, fallback: string): string {
  const e = error as { code?: string; message?: string } | undefined;
  return (e?.code && CANCEL_ERRORS[e.code]) || e?.message || fallback;
}

export const EMPTY_REFUND_ACCOUNT: RefundAccountRequest = {
  bankBin: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
};

/**
 * Loads GET /bookings/{id}/refund-preview while the cancel dialog is open and keeps the refund account draft.
 * The backend decides whether an account is needed: it is locked to the paying account when one is known,
 * otherwise the customer must enter one whenever something is refundable.
 */
export function useRefundCancellation(bookingId: number | null) {
  const [preview, setPreview] = useState<RefundPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RefundAccountRequest>(EMPTY_REFUND_ACCOUNT);

  useEffect(() => {
    setPreview(null);
    setError(null);
    setAccount(EMPTY_REFUND_ACCOUNT);
    if (bookingId == null) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    bookingsApi
      .getRefundPreview(bookingId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPreview(result);
      })
      .catch((reason: { message?: string }) => {
        if (!controller.signal.aborted) setError(reason?.message || 'Không tính được số tiền hoàn lúc này.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [bookingId]);

  const needsAccount = Boolean(preview?.refundAccountRequired && !preview.refundAccountLocked);

  /** Returns an error message, or null when the cancel request may be sent. */
  const validate = (): string | null => {
    if (!needsAccount) return null;
    if (!account.bankName.trim()) return 'Vui lòng nhập tên ngân hàng nhận tiền hoàn.';
    if (!/^\d{6,8}$/.test(account.bankBin.trim())) return 'Mã ngân hàng (BIN) gồm 6–8 chữ số, ví dụ 970436.';
    if (!/^\d{6,19}$/.test(account.accountNumber.trim())) return 'Số tài khoản gồm 6–19 chữ số.';
    const holder = account.accountHolderName.trim();
    if (holder.length < 2 || holder.length > 120) return 'Vui lòng nhập đúng tên chủ tài khoản.';
    return null;
  };

  const refundAccount: RefundAccountRequest | undefined = needsAccount
    ? {
        bankBin: account.bankBin.trim(),
        bankName: account.bankName.trim(),
        accountNumber: account.accountNumber.trim(),
        accountHolderName: account.accountHolderName.trim(),
      }
    : undefined;

  return { preview, loading, error, account, setAccount, needsAccount, refundAccount, validate };
}

export type RefundCancellationState = ReturnType<typeof useRefundCancellation>;
