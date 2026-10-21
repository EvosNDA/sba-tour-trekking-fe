import React from 'react';
import { partnerApplicationsApi, PartnerApplicationQueueItem } from '../api/partnerApplications.api';
import { useI18n } from '../../../i18n/I18nProvider';

export default function PartnerApplicationQueue() {
  const { t } = useI18n();
  const [items, setItems] = React.useState<PartnerApplicationQueueItem[]>([]);
  const [busy, setBusy] = React.useState<number | null>(null);
  const [reason, setReason] = React.useState<Record<number, string>>({});
  const [error, setError] = React.useState(false);
  const load = React.useCallback(async () => {
    try { setError(false); setItems(await partnerApplicationsApi.pending()); }
    catch { setError(true); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const decide = async (item: PartnerApplicationQueueItem, approve: boolean) => {
    if (!approve && !reason[item.companyId]?.trim()) return;
    setBusy(item.companyId);
    try {
      if (approve) await partnerApplicationsApi.approve(item.companyId);
      else await partnerApplicationsApi.reject(item.companyId, reason[item.companyId].trim());
      await load();
    } catch { setError(true); }
    finally { setBusy(null); }
  };

  return <section className="mx-auto max-w-6xl px-4 pt-8 md:px-8">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-[#1C2526]">{t('partner.queueTitle')}</h1><p className="mt-1 text-sm text-[#64716D]">{t('partner.queueHelp')}</p></div>
      <button type="button" onClick={() => void load()} className="rounded border border-[#CAD4CF] px-3 py-2 text-sm">{t('partner.refreshQueue')}</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">{t('partner.queueError')}</p>}
    {items.length === 0 && !error && <p className="rounded-lg border border-[#E2E7E4] bg-white p-5 text-sm text-[#64716D]">{t('partner.queueEmpty')}</p>}
    <div className="grid gap-4 md:grid-cols-2">{items.map(item => <article key={item.companyId} className="rounded-xl border border-[#E2E7E4] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{item.businessName}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-[#64716D]">{t('partner.contactName')}</dt><dd>{item.contactName || '—'}</dd>
        <dt className="text-[#64716D]">{t('partner.email')}</dt><dd className="break-all">{item.email || '—'}</dd>
        <dt className="text-[#64716D]">{t('partner.phone')}</dt><dd>{item.phone || '—'}</dd>
        <dt className="text-[#64716D]">{t('partner.taxCode')}</dt><dd>{item.taxCode}</dd>
        <dt className="text-[#64716D]">{t('partner.address')}</dt><dd>{item.address || '—'}</dd>
        <dt className="text-[#64716D]">{t('partner.tourAreas')}</dt><dd>{item.tourRegions.join(', ') || '—'}</dd>
      </dl>
      {item.description && <p className="mt-3 text-sm text-[#52605D]">{item.description}</p>}
      <p className="mt-3 text-xs text-emerald-800">{t('partner.safetyAccepted')}</p>
      <div className="mt-4 space-y-3 border-t border-[#E6EAE7] pt-4">
        <label className="block text-sm font-medium" htmlFor={`reason-${item.companyId}`}>{t('partner.rejectReason')}</label>
        <textarea id={`reason-${item.companyId}`} rows={2} value={reason[item.companyId] || ''} onChange={e => setReason(value => ({ ...value, [item.companyId]: e.target.value }))} className="w-full rounded border border-[#CAD4CF] px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button type="button" disabled={busy === item.companyId} onClick={() => void decide(item, true)} className="rounded bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('partner.approve')}</button>
          <button type="button" disabled={busy === item.companyId || !reason[item.companyId]?.trim()} onClick={() => void decide(item, false)} className="rounded border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50">{t('partner.reject')}</button>
        </div>
      </div>
    </article>)}</div>
  </section>;
}
