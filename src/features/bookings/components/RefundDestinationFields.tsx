import React from 'react';
import { Landmark, Loader2, Lock } from 'lucide-react';
import { formatVND } from '../../../lib/utils';
import type { RefundCancellationState } from '../hooks/useRefundCancellation';

interface Props {
  idPrefix: string;
  state: RefundCancellationState;
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none';

/** Refund estimate and destination inside the cancel dialog, driven by GET /bookings/{id}/refund-preview. */
export const RefundDestinationFields: React.FC<Props> = ({ idPrefix, state }) => {
  const { preview, loading, error, account, setAccount, needsAccount } = state;
  const update = (patch: Partial<typeof account>) => setAccount({ ...account, ...patch });

  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tính số tiền được hoàn…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        {error} Bạn vẫn có thể huỷ; nếu đã thanh toán, nhân viên sẽ liên hệ để xử lý hoàn tiền.
      </p>
    );
  }

  if (!preview || preview.paidAmountVnd <= 0) return null;

  const refundable = preview.estimatedRefundVnd > 0;

  return (
    <section className="space-y-3 rounded-xl border border-[#B7D2C8] bg-[#F5F9F6] p-4" aria-label="Hoàn tiền khi huỷ">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-stone-800">Dự kiến được hoàn</span>
        <strong className="text-lg text-[#1F4E43] tabular-nums">{formatVND(preview.estimatedRefundVnd)}</strong>
      </div>
      <p className="text-[11px] leading-relaxed text-stone-600">
        {preview.policyTiersConfigured && preview.refundPercent != null
          ? `Hoàn ${preview.refundPercent}% số tiền đã trả vì huỷ trước khởi hành ${Math.max(0, preview.hoursBeforeDeparture)} giờ.`
          : 'Tour chưa có bậc hoàn tiền tự động, nhân viên sẽ xét số tiền hoàn theo chính sách huỷ của tour.'}{' '}
        Đã trả {formatVND(preview.paidAmountVnd)}
        {preview.alreadyRefundedVnd > 0 ? `, đã hoàn trước đó ${formatVND(preview.alreadyRefundedVnd)}` : ''}.
      </p>

      {!refundable && (
        <p className="rounded-lg bg-white p-3 text-[11px] text-stone-700">Theo chính sách huỷ, lần huỷ này không được hoàn tiền.</p>
      )}

      {refundable && preview.refundAccountLocked && (
        <p className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-3 text-[11px] leading-relaxed text-stone-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4E43]" aria-hidden="true" />
          <span>
            Tiền hoàn sẽ chuyển về đúng tài khoản đã thanh toán:{' '}
            <strong>
              {preview.lockedBankName || 'Ngân hàng'} {preview.lockedAccountMasked || ''}
            </strong>
            . Bạn không cần nhập tài khoản.
          </span>
        </p>
      )}

      {refundable && needsAccount && (
        <>
          <p className="text-[11px] font-semibold text-stone-800">Tài khoản nhận tiền hoàn</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${idPrefix}-bank-name`} className="mb-1 block text-[11px] font-semibold text-stone-700">Ngân hàng</label>
              <input id={`${idPrefix}-bank-name`} maxLength={120} required value={account.bankName} onChange={(e) => update({ bankName: e.target.value })} placeholder="Ví dụ: Vietcombank" className={inputClass} />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-bank-bin`} className="mb-1 block text-[11px] font-semibold text-stone-700">Mã ngân hàng (BIN)</label>
              <input id={`${idPrefix}-bank-bin`} inputMode="numeric" maxLength={8} required value={account.bankBin} onChange={(e) => update({ bankBin: e.target.value.replace(/\D/g, '') })} placeholder="Ví dụ: 970436" className={inputClass} />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-account-number`} className="mb-1 block text-[11px] font-semibold text-stone-700">Số tài khoản</label>
              <input id={`${idPrefix}-account-number`} inputMode="numeric" maxLength={19} required value={account.accountNumber} onChange={(e) => update({ accountNumber: e.target.value.replace(/\D/g, '') })} placeholder="6–19 chữ số" className={inputClass} />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-account-holder`} className="mb-1 block text-[11px] font-semibold text-stone-700">Tên chủ tài khoản</label>
              <input id={`${idPrefix}-account-holder`} autoComplete="name" maxLength={120} required value={account.accountHolderName} onChange={(e) => update({ accountHolderName: e.target.value.toLocaleUpperCase('vi-VN') })} placeholder="NGUYEN VAN A" className={`${inputClass} uppercase`} />
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Nhân viên kiểm tra tên và số tài khoản trước khi chuyển. Thông tin được mã hoá và chỉ dùng để hoàn tiền.
          </p>
        </>
      )}
    </section>
  );
};
