import React, { useMemo, useState } from 'react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { adminPoliciesApi } from '../../../../features/policies/api/admin-policies.api';
import type { PolicyKind, PolicyPublishRequest, RefundTier } from '../../../../features/policies/types/admin-policy.types';
import { FieldLabel, buttonClass, fieldClass, hoursLabel, policyErrorMessage, toLocalInputValue } from './policy-ui';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TIERS = 20;

type TierDraft = { key: number; hours: string; percent: string };

interface PolicyVersionFormProps {
  /** Kind of the policy this version belongs to; refund tiers only show for cancellation. */
  kind: PolicyKind;
  initialContent?: string;
  initialTiers?: RefundTier[] | null;
  /** effectiveFrom of the newest non-revoked version; the new one must start after it. */
  previousEffectiveFrom?: string | null;
  busy: boolean;
  submitLabel: string;
  /** Fields rendered above the version fields, inside the same form (e.g. policy title and code). */
  header?: React.ReactNode;
  /** Validates the header fields; return an error message to block submission. */
  validateHeader?: () => string | null;
  onSubmit: (request: PolicyPublishRequest) => void;
  onCancel: () => void;
}

let tierKey = 0;
const toDrafts = (tiers?: RefundTier[] | null): TierDraft[] =>
  (tiers ?? []).map((tier) => ({ key: ++tierKey, hours: String(tier.minHoursBeforeDeparture), percent: String(tier.refundPercent) }));

export function PolicyVersionForm({
  kind,
  initialContent = '',
  initialTiers,
  previousEffectiveFrom,
  busy,
  submitLabel,
  header,
  validateHeader,
  onSubmit,
  onCancel,
}: PolicyVersionFormProps) {
  const previousStart = previousEffectiveFrom ? new Date(previousEffectiveFrom) : null;
  const immediateAllowed = !previousStart || previousStart.getTime() < Date.now();

  const [content, setContent] = useState(initialContent);
  const [immediate, setImmediate] = useState(immediateAllowed);
  const [effective, setEffective] = useState('');
  const [tiers, setTiers] = useState<TierDraft[]>(() => toDrafts(initialTiers));
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const minEffective = useMemo(() => {
    const floor = previousStart && previousStart.getTime() > Date.now() ? new Date(previousStart.getTime() + 60_000) : new Date();
    return toLocalInputValue(floor);
  }, [previousEffectiveFrom]);

  const isCancellation = kind === 'cancellation';

  const extractFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('Tệp không được vượt quá 5 MB.');
      return;
    }
    setExtracting(true);
    setError('');
    try {
      const result = await adminPoliciesApi.extractDocument(file);
      setContent(result.content);
      setFileName(file.name);
    } catch (reason) {
      setError(policyErrorMessage(reason));
    } finally {
      setExtracting(false);
    }
  };

  const parseTiers = (): RefundTier[] | string => {
    const parsed: RefundTier[] = [];
    for (const draft of tiers) {
      const hours = Number(draft.hours);
      const percent = Number(draft.percent);
      if (draft.hours.trim() === '' || !Number.isInteger(hours) || hours < 0 || hours > 87600) {
        return 'Mốc giờ phải là số nguyên từ 0 đến 87.600.';
      }
      if (draft.percent.trim() === '' || !Number.isInteger(percent) || percent < 0 || percent > 100) {
        return 'Tỷ lệ hoàn phải là số nguyên từ 0 đến 100.';
      }
      parsed.push({ minHoursBeforeDeparture: hours, refundPercent: percent });
    }
    const sorted = [...parsed].sort((a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].minHoursBeforeDeparture === sorted[i].minHoursBeforeDeparture) return 'Các mốc giờ phải khác nhau.';
      if (sorted[i - 1].refundPercent < sorted[i].refundPercent) {
        return `Huỷ từ ${hoursLabel(sorted[i - 1].minHoursBeforeDeparture)} không được hoàn ít hơn huỷ từ ${hoursLabel(sorted[i].minHoursBeforeDeparture)}.`;
      }
    }
    return sorted;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const headerError = validateHeader?.();
    if (headerError) return setError(headerError);
    if (!content.trim()) return setError('Vui lòng nhập nội dung điều khoản.');

    let effectiveFrom: Date;
    if (immediate) {
      effectiveFrom = new Date();
    } else {
      if (!effective) return setError('Chọn thời điểm có hiệu lực hoặc bật “Áp dụng ngay”.');
      effectiveFrom = new Date(effective);
      if (Number.isNaN(effectiveFrom.getTime())) return setError('Thời điểm có hiệu lực không hợp lệ.');
      if (previousStart && effectiveFrom.getTime() <= previousStart.getTime()) {
        return setError('Thời điểm có hiệu lực phải sau phiên bản gần nhất.');
      }
    }

    let refundTiers: RefundTier[] | null = null;
    if (isCancellation && tiers.length > 0) {
      const result = parseTiers();
      if (typeof result === 'string') return setError(result);
      refundTiers = result;
    }

    onSubmit({ content: content.trim(), effectiveFrom: effectiveFrom.toISOString(), refundTiers });
  };

  const updateTier = (key: number, patch: Partial<TierDraft>) =>
    setTiers((current) => current.map((tier) => (tier.key === key ? { ...tier, ...patch } : tier)));

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {header}

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="policy-content" className="text-sm font-medium text-slate-800">
            Nội dung <span className="text-rose-700">*</span>
          </label>
          <label className={`${buttonClass.outline} min-h-9 px-3 text-xs ${extracting || busy ? 'pointer-events-none opacity-50' : ''}`}>
            <FileUp aria-hidden="true" className="size-4" />
            {extracting ? 'Đang đọc tệp…' : 'Lấy nội dung từ tệp'}
            <input type="file" accept=".pdf,.doc,.docx" className="sr-only" disabled={extracting || busy} onChange={extractFile} />
          </label>
        </div>
        <textarea
          id="policy-content"
          className={`${fieldClass} min-h-56 resize-y font-[inherit] leading-relaxed`}
          rows={10}
          maxLength={100000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Nhập nội dung hoặc lấy từ tệp PDF / Word…"
        />
        <p className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
          <span>{fileName ? `Đã đọc “${fileName}”. Kiểm tra lại nội dung trước khi lưu.` : 'PDF, DOC, DOCX tối đa 5 MB, không nhận bản scan.'}</span>
          <span className="shrink-0 tabular-nums">{content.length.toLocaleString('vi-VN')}/100.000</span>
        </p>
      </div>

      {isCancellation && (
        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-800">Bậc hoàn tiền khi huỷ</legend>
          <p className="mb-3 text-xs text-slate-500">
            Khách huỷ trước khởi hành ít nhất số giờ đã đặt thì được hoàn tỷ lệ tương ứng. Huỷ càng sớm phải được hoàn càng nhiều. Để trống nếu không áp dụng hoàn tự động.
          </p>
          {tiers.length > 0 && (
            <ul className="mb-3 space-y-2">
              {tiers.map((tier, index) => (
                <li key={tier.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                  <label className="block">
                    {index === 0 && <FieldLabel>Huỷ trước (giờ)</FieldLabel>}
                    <input
                      className={fieldClass}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={87600}
                      step={1}
                      aria-label={`Bậc ${index + 1}: số giờ trước khởi hành`}
                      value={tier.hours}
                      onChange={(event) => updateTier(tier.key, { hours: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    {index === 0 && <FieldLabel>Hoàn (%)</FieldLabel>}
                    <input
                      className={fieldClass}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      aria-label={`Bậc ${index + 1}: phần trăm hoàn`}
                      value={tier.percent}
                      onChange={(event) => updateTier(tier.key, { percent: event.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className={`${buttonClass.dangerGhost} min-h-[42px] px-2.5`}
                    aria-label={`Xoá bậc ${index + 1}`}
                    onClick={() => setTiers((current) => current.filter((item) => item.key !== tier.key))}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={`${buttonClass.outline} min-h-9 px-3 text-xs`}
            disabled={tiers.length >= MAX_TIERS}
            onClick={() => setTiers((current) => [...current, { key: ++tierKey, hours: '', percent: '' }])}
          >
            <Plus aria-hidden="true" className="size-4" /> Thêm bậc
          </button>
        </fieldset>
      )}

      <div className="space-y-3">
        <label className={`flex items-center gap-2 text-sm text-slate-800 ${immediateAllowed ? '' : 'opacity-60'}`}>
          <input
            type="checkbox"
            className="size-4 accent-[#0B7058]"
            checked={immediate}
            disabled={!immediateAllowed}
            onChange={(event) => setImmediate(event.target.checked)}
          />
          Áp dụng ngay khi lưu
        </label>
        {!immediateAllowed && (
          <p className="text-xs text-amber-800">
            Đã có phiên bản lên lịch lúc {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' }).format(previousStart!)}. Bản mới phải áp dụng sau thời điểm đó.
          </p>
        )}
        {!immediate && (
          <label className="block max-w-xs">
            <FieldLabel>Có hiệu lực từ</FieldLabel>
            <input className={fieldClass} type="datetime-local" min={minEffective} value={effective} onChange={(event) => setEffective(event.target.value)} />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" className={buttonClass.outline} onClick={onCancel} disabled={busy}>
          Huỷ
        </button>
        <button type="submit" className={buttonClass.primary} disabled={busy || extracting}>
          {busy ? 'Đang lưu…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
