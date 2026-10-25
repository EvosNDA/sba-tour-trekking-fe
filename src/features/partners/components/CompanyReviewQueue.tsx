import React from 'react';
import { AlertTriangle, Building2, Download, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { adminCompaniesApi, AdminCompany, CompanyStatus } from '../../admin/api/adminCompanies.api';

const statuses: Array<CompanyStatus | ''> = ['', 'pending', 'approved', 'rejected', 'suspended'];
const field = 'min-h-10 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm outline-none focus-visible:border-[#1F4E43] focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20';
const pageSize = 20;

export default function CompanyReviewQueue() {
  const { t, language } = useI18n();
  const [status, setStatus] = React.useState<CompanyStatus | ''>('pending');
  const [page, setPage] = React.useState(0);
  const [items, setItems] = React.useState<AdminCompany[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selected, setSelected] = React.useState<AdminCompany | null>(null);
  const [decision, setDecision] = React.useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  const load = React.useCallback(async (targetPage = page) => {
    setLoading(true); setError('');
    try {
      const result = await adminCompaniesApi.list(status, targetPage, pageSize);
      setItems(result.items); setPage(result.page); setTotalPages(result.totalPages); setTotalItems(result.totalElements);
      if (selected) {
        const latest = result.items.find(item => item.id === selected.id);
        if (latest) setSelected(latest);
        else setSelected(null);
      }
    } catch { setError(t('companyReview.loadError')); }
    finally { setLoading(false); }
  }, [page, status, selected, t]);

  React.useEffect(() => { void load(0); }, [status]);

  const openDetails = async (company: AdminCompany) => {
    setBusy(true); setError(''); setNotice('');
    try { setSelected(await adminCompaniesApi.read(company.id)); }
    catch { setError(t('companyReview.detailError')); }
    finally { setBusy(false); }
  };

  const decide = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !decision || !reason.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await adminCompaniesApi.decide(selected.id, decision, reason.trim());
      setSelected(updated); setDecision(null); setReason(''); setNotice(t('companyReview.decisionSaved'));
      await load(page);
    } catch (cause) {
      const key = cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string'
        ? `companyReview.error.${cause.code}` : '';
      setError(key ? t(key) : t('companyReview.decisionError'));
    } finally { setBusy(false); }
  };

  const downloadLicense = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const file = await adminCompaniesApi.downloadLicense(selected.id);
      const objectUrl = URL.createObjectURL(file.blob);
      const link = document.createElement('a'); link.href = objectUrl; link.download = file.filename; link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'LICENSE_NOT_FOUND' ? t('companyReview.licenseMissing') : t('companyReview.licenseError'));
    } finally { setBusy(false); }
  };

  const date = (value: string | null) => value ? new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('companyReview.notAvailable');
  const startDecision = (next: 'approve' | 'reject' | 'suspend') => { setReason(''); setError(''); setDecision(next); };

  return <section className="rounded-2xl border border-[#E2E7E4] bg-white p-5 shadow-sm md:p-6">
    <header className="flex flex-col gap-4 border-b border-[#E2E7E4] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-[#EAF1ED] p-3 text-[#1F4E43]"><Building2 className="h-5 w-5" /></span><div><h2 className="text-xl font-bold text-[#1C2526]">{t('companyReview.title')}</h2><p className="mt-1 max-w-2xl text-sm leading-5 text-[#64716D]">{t('companyReview.description')}</p></div></div>
      <div className="flex gap-2"><label className="sr-only" htmlFor="company-review-status">{t('companyReview.filter')}</label><select id="company-review-status" value={status} onChange={event => { setStatus(event.target.value as CompanyStatus | ''); setPage(0); setSelected(null); }} className={field}>{statuses.map(value => <option key={value || 'all'} value={value}>{t(value ? `companyReview.status.${value}` : 'companyReview.allStatuses')}</option>)}</select><button type="button" onClick={() => void load()} disabled={loading} aria-label={t('companyReview.refresh')} className="rounded-lg border border-[#CAD4CF] px-3 text-[#1F4E43] hover:bg-[#F4F7F5] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
    </header>

    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,.9fr)]">
      <div>
        {loading ? <p role="status" className="rounded-xl bg-[#F7F8F6] p-5 text-sm text-[#64716D]">{t('companyReview.loading')}</p> : items.length === 0 ? <div className="rounded-xl border border-dashed border-[#CAD4CF] p-6 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-[#1F4E43]" /><p className="mt-2 text-sm font-medium">{t('companyReview.empty')}</p></div> : <div className="divide-y divide-[#E8ECE9] rounded-xl border border-[#E2E7E4]">{items.map(company => <button type="button" key={company.id} onClick={() => void openDetails(company)} className={`w-full px-4 py-4 text-left hover:bg-[#F7F9F7] ${selected?.id === company.id ? 'bg-[#F2F6F3]' : ''}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><span><span className="block font-semibold text-[#1C2526]">{company.name}</span><span className="mt-1 block text-xs text-[#64716D]">#{company.id} · {company.taxCode}</span></span><span className="rounded-full bg-[#EEF2EF] px-2.5 py-1 text-xs font-semibold text-[#52605D]">{t(`companyReview.status.${company.status}`)}</span></div><span className="mt-2 block text-xs text-[#64716D]">{company.contactEmail} · {date(company.createdAt)}</span>
        </button>)}</div>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#64716D]"><span>{t('companyReview.results', { count: totalItems })}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 0 || loading} onClick={() => void load(page - 1)} className="rounded-lg border border-[#CAD4CF] px-3 py-2 disabled:opacity-40">{t('companyReview.previous')}</button><span>{totalPages ? t('companyReview.page', { current: page + 1, total: totalPages }) : t('companyReview.page', { current: 0, total: 0 })}</span><button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => void load(page + 1)} className="rounded-lg border border-[#CAD4CF] px-3 py-2 disabled:opacity-40">{t('companyReview.next')}</button></div></div>
      </div>

      <aside className="rounded-xl border border-[#E2E7E4] bg-[#F8FAF8] p-4 sm:p-5" aria-live="polite">
        {!selected ? <div className="flex min-h-40 flex-col items-center justify-center text-center text-sm text-[#64716D]"><Building2 className="h-6 w-6" /><p className="mt-2">{t('companyReview.selectHint')}</p></div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#64716D]">{t('companyReview.companyId', { id: selected.id })}</p><h3 className="mt-1 text-lg font-bold">{selected.name}</h3></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">{t(`companyReview.status.${selected.status}`)}</span></div>
          <dl className="mt-4 grid gap-x-4 gap-y-3 border-t border-[#E2E7E4] pt-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#64716D]">{t('companyReview.taxCode')}</dt><dd className="font-medium">{selected.taxCode}</dd></div><div><dt className="text-xs text-[#64716D]">{t('companyReview.representative')}</dt><dd className="font-medium">{selected.representativeName}</dd></div><div><dt className="text-xs text-[#64716D]">{t('companyReview.email')}</dt><dd className="break-all font-medium">{selected.contactEmail}</dd></div><div><dt className="text-xs text-[#64716D]">{t('companyReview.phone')}</dt><dd className="font-medium">{selected.contactPhone || t('companyReview.notAvailable')}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-[#64716D]">{t('companyReview.address')}</dt><dd className="font-medium">{selected.address || t('companyReview.notAvailable')}</dd></div></dl>
          {selected.description && <p className="mt-3 text-sm leading-5 text-[#52605D]">{selected.description}</p>}
          {selected.decisionReason && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{t('companyReview.decisionReason')}: {selected.decisionReason}</p>}
          <div className="mt-4 flex flex-wrap gap-2">{selected.licenseAvailable && <button type="button" disabled={busy} onClick={() => void downloadLicense()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm font-semibold text-[#1F4E43] disabled:opacity-50"><Download className="h-4 w-4" />{t('companyReview.downloadLicense')}</button>}{selected.licenseUrl && <span className="inline-flex items-center gap-1 text-xs text-[#64716D]"><ExternalLink className="h-3.5 w-3.5" />{t('companyReview.privateStorage')}</span>}</div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E2E7E4] pt-4">{selected.status === 'pending' && <><button type="button" disabled={busy} onClick={() => startDecision('approve')} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white disabled:opacity-50">{t('companyReview.approve')}</button><button type="button" disabled={busy} onClick={() => startDecision('reject')} className="min-h-10 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-800 disabled:opacity-50">{t('companyReview.reject')}</button></>}{selected.status === 'approved' && <button type="button" disabled={busy} onClick={() => startDecision('suspend')} className="min-h-10 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-800 disabled:opacity-50">{t('companyReview.suspend')}</button>}{selected.status === 'suspended' && <p className="text-sm text-rose-800">{t('companyReview.noRestore')}</p>}{selected.status === 'rejected' && <p className="text-sm text-[#64716D]">{t('companyReview.rejectedHelp')}</p>}</div>
        </>}
      </aside>
    </div>

    {decision && selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1C2526]/55 p-4"><form role="dialog" aria-modal="true" aria-labelledby="company-decision-title" onSubmit={event => void decide(event)} className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"><div className="flex items-start gap-3"><span className={`rounded-xl p-3 ${decision === 'suspend' ? 'bg-rose-50 text-rose-700' : 'bg-[#EAF1ED] text-[#1F4E43]'}`}>{decision === 'suspend' ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</span><div><h3 id="company-decision-title" className="text-lg font-bold">{t(`companyReview.confirm.${decision}`)}</h3><p className="mt-1 text-sm leading-5 text-[#64716D]">{t(`companyReview.confirmHelp.${decision}`)}</p></div></div><label className="mt-5 block text-sm font-medium">{t('companyReview.reason')}<textarea required maxLength={2000} rows={4} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-[#CAD4CF] p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setDecision(null)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold">{t('companyReview.cancel')}</button><button type="submit" disabled={busy || !reason.trim()} className={`min-h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${decision === 'suspend' || decision === 'reject' ? 'bg-rose-700' : 'bg-[#1F4E43]'}`}>{busy ? t('companyReview.saving') : t(`companyReview.confirmButton.${decision}`)}</button></div></form></div>}
  </section>;
}
