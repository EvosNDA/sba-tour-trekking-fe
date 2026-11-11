import React from 'react';
import { POLICY_DOCUMENTS } from '../../../../features/policies/policy-documents';
import type { PolicyVersionStatus } from '../../../../features/policies/types/admin-policy.types';

export const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B7058] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-50 disabled:text-slate-500';

export const buttonClass = {
  primary:
    'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B7058] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#075743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7058] disabled:cursor-not-allowed disabled:opacity-50',
  outline:
    'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7058] disabled:cursor-not-allowed disabled:opacity-50',
  danger:
    'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-50',
  dangerGhost:
    'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-50',
};

const ERROR_MESSAGES: Record<string, string> = {
  POLICY_CODE_EXISTS: 'Mã tham chiếu đã tồn tại. Chọn mã khác hoặc để trống để hệ thống tự tạo.',
  POLICY_EFFECTIVE_FROM_OUT_OF_ORDER:
    'Thời điểm áp dụng phải sau phiên bản gần nhất. Thu hồi bản đã lên lịch trước nếu muốn áp dụng sớm hơn.',
  POLICY_NOT_PUBLISHABLE: 'Điều khoản đang ngừng áp dụng. Kích hoạt lại trước khi phát hành phiên bản.',
  REFUND_TIERS_INVALID: 'Bậc hoàn tiền không hợp lệ: mốc giờ phải khác nhau và huỷ sớm hơn phải được hoàn nhiều hơn hoặc bằng.',
  REFUND_TIERS_NOT_ALLOWED: 'Chỉ điều khoản loại Đổi / huỷ mới có bậc hoàn tiền.',
  POLICY_DOCUMENT_INVALID: 'Không đọc được tệp. Dùng PDF, DOC hoặc DOCX dưới 5 MB, không phải bản scan.',
  INVALID_POLICY_KIND: 'Loại điều khoản không hợp lệ.',
  RESOURCE_NOT_FOUND: 'Điều khoản không còn tồn tại. Tải lại danh sách.',
};

export function policyErrorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string } | undefined;
  return (e?.code && ERROR_MESSAGES[e.code]) || e?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.';
}

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' });

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date);
}

/** `Date` → value for `<input type="datetime-local">` in the viewer's local time. */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function hoursLabel(hours: number): string {
  if (hours === 0) return 'đến giờ khởi hành';
  if (hours % 24 === 0) return `${hours / 24} ngày`;
  return hours > 24 ? `${hours} giờ (~${Math.floor(hours / 24)} ngày)` : `${hours} giờ`;
}

export function publicDocumentOf(code: string) {
  return POLICY_DOCUMENTS.find((document) => document.code === code.toUpperCase());
}

const STATUS_STYLES: Record<PolicyVersionStatus, { label: string; className: string }> = {
  current: { label: 'Đang hiệu lực', className: 'bg-[#D5F0DD] text-[#176239]' },
  scheduled: { label: 'Đã lên lịch', className: 'bg-amber-100 text-amber-800' },
  superseded: { label: 'Đã thay thế', className: 'bg-slate-100 text-slate-600' },
  revoked: { label: 'Đã thu hồi', className: 'bg-rose-100 text-rose-800' },
};

export function VersionStatusBadge({ status }: { status: PolicyVersionStatus }) {
  const style = STATUS_STYLES[status];
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? 'bg-[#D5F0DD] text-[#176239]' : 'bg-rose-100 text-rose-800'
      }`}
    >
      {active ? 'Đang áp dụng' : 'Ngừng áp dụng'}
    </span>
  );
}

export function RefundTierTable({ tiers }: { tiers: { minHoursBeforeDeparture: number; refundPercent: number }[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-slate-500">
        <tr>
          <th className="py-1.5 pr-3 font-medium">Huỷ trước khởi hành</th>
          <th className="py-1.5 text-right font-medium">Hoàn tiền</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tiers.map((tier) => (
          <tr key={tier.minHoursBeforeDeparture}>
            <td className="py-1.5 pr-3 text-slate-700">Từ {hoursLabel(tier.minHoursBeforeDeparture)}</td>
            <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">{tier.refundPercent}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <span className="mb-1 flex items-baseline justify-between gap-3 text-sm font-medium text-slate-800">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
    </span>
  );
}
