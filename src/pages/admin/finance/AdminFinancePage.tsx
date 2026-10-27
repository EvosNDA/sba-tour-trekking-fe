import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Banknote, Check, ChevronLeft, ChevronRight, CircleAlert, FileCheck2, Landmark, ReceiptText, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { formatVND } from '../../../lib/utils';
import { useI18n } from '../../../i18n/I18nProvider';
import { AdminStatement, EligibleFinanceCompany, PendingReviewPayment, RefundRequest, adminFinanceApi } from '../../../features/admin/api/adminFinance.api';
import { ScreenId } from '../../../types/expedition';

type Tab = 'payments' | 'refunds' | 'statements';
type FinanceAction = { kind: 'verifyPayment'; payment: PendingReviewPayment } | { kind: 'refundDecision'; refund: RefundRequest; decision: 'approve' | 'reject' } | { kind: 'recordRefund'; refund: RefundRequest } | { kind: 'createStatement' } | { kind: 'approveStatement'; statement: AdminStatement } | { kind: 'recordTransfer'; statement: AdminStatement };
const pageSize = 20;
const card = 'rounded-2xl border border-[#E2E7E4] bg-white shadow-sm';
const input = 'min-h-11 w-full rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm text-[#1C2526] outline-none focus-visible:border-[#1F4E43] focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20';
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const previousMonth = () => { const d = new Date(); d.setDate(0); return d; };
const safeEvidenceLink = (value: string) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null; } catch { return null; } };

function FinanceDialog({ title, description, busy, onClose, onSubmit, children, submitLabel }: { title: string; description: string; busy: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: React.ReactNode; submitLabel: string }) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { formRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]),select,textarea,button')?.focus(); }, []);
  const onKeyDown: React.KeyboardEventHandler<HTMLFormElement> = event => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const els = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])'));
    if (!els.length) return;
    if (event.shiftKey && document.activeElement === els[0]) { event.preventDefault(); els.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === els.at(-1)) { event.preventDefault(); els[0].focus(); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1C2526]/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}><form ref={formRef} role="dialog" aria-modal="true" aria-labelledby="finance-dialog-title" onSubmit={onSubmit} onKeyDown={onKeyDown} className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-6"><header className="flex items-start justify-between gap-4"><div><h2 id="finance-dialog-title" className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-5 text-[#52605D]">{description}</p></div><button type="button" disabled={busy} aria-label={t('adminFinance.close')} onClick={onClose} className="rounded p-1 text-[#64716D] hover:bg-[#F1F5F2]"><X aria-hidden="true" className="h-5 w-5"/></button></header><div className="mt-5 space-y-4">{children}</div><footer className="mt-6 flex justify-end gap-2 border-t border-[#E8ECE9] pt-4"><button type="button" disabled={busy} onClick={onClose} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold">{t('adminFinance.close')}</button><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? t('adminFinance.saving') : submitLabel}</button></footer></form></div>;
}

export default function AdminFinancePage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<Tab>('payments');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingPayments, setPendingPayments] = useState<PendingReviewPayment[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [statements, setStatements] = useState<AdminStatement[]>([]);
  const [refundStatus, setRefundStatus] = useState('requested');
  const [statementStatus, setStatementStatus] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<number | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [action, setAction] = useState<FinanceAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => localDate(previousMonth()));
  const [periodEnd, setPeriodEnd] = useState(() => localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 0)));
  const [companies, setCompanies] = useState<EligibleFinanceCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const opener = useRef<HTMLElement | null>(null);
  const idempotency = useRef(new Map<string, { fingerprint: string; key: string }>());
  const money = (amount: number) => formatVND(amount, language);
  const date = (value: string | null | undefined, time = false) => value ? new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value)) : '—';
  const showAction = (next: FinanceAction) => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setError(''); setAction(next); };
  const closeAction = () => { setAction(null); window.requestAnimationFrame(() => opener.current?.focus()); };
  const mutationKey = (scope: string, body: unknown) => {
    const fingerprint = `${scope}:${JSON.stringify(body)}`;
    const prior = idempotency.current.get(scope);
    if (prior?.fingerprint !== fingerprint) idempotency.current.set(scope, { fingerprint, key: window.crypto.randomUUID() });
    return idempotency.current.get(scope)!.key;
  };
  const runMutation = async (scope: string, body: unknown, execute: (key: string) => Promise<unknown>) => {
    const result = await execute(mutationKey(scope, body));
    idempotency.current.delete(scope);
    return result;
  };

  const load = useCallback(async (nextPage = 0) => {
    setLoading(true); setError('');
    try {
      if (tab === 'payments') {
        const result = await adminFinanceApi.pendingReview(nextPage, pageSize);
        setPendingPayments(result.items); setPage(result.page); setTotalPages(result.totalPages); setTotalItems(result.totalItems);
      } else if (tab === 'refunds') {
        const result = await adminFinanceApi.refunds({ status: refundStatus || undefined, page: nextPage, size: pageSize });
        setRefunds(result.items); setPage(result.page); setTotalPages(result.totalPages); setTotalItems(result.totalItems);
      } else {
        const result = await adminFinanceApi.statements({ status: statementStatus || undefined, page: nextPage, size: pageSize });
        setStatements(result.items); setPage(result.page); setTotalPages(result.totalPages); setTotalItems(result.totalItems);
      }
    } catch { setError(t('adminFinance.loadError')); }
    finally { setLoading(false); }
  }, [refundStatus, statementStatus, tab, t]);
  useEffect(() => { setPage(0); void load(0); }, [load]);
  useEffect(() => {
    if (action?.kind !== 'createStatement' || !periodStart || !periodEnd || periodStart > periodEnd) return;
    setCompaniesLoading(true); setCompaniesError(false); setCompanyId('');
    void adminFinanceApi.eligibleCompanies({ periodStart, periodEnd, page: 0, size: 100 }).then(result => setCompanies(result.items)).catch(() => { setCompanies([]); setCompaniesError(true); }).finally(() => setCompaniesLoading(false));
  }, [action, periodEnd, periodStart]);

  const submitAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!action) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    const iso = (key: string) => new Date(text(key)).toISOString();
    const evidence = text('evidenceUrl');
    if (evidence && !/^https?:\/\//i.test(evidence)) { setError(t('adminFinance.invalidEvidence')); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      if (action.kind === 'verifyPayment') {
        const body = { evidenceUrl: evidence, reason: text('reason') };
        await runMutation(`verify:${action.payment.id}`, body, key => adminFinanceApi.verifyPendingPayment(action.payment.id, body, key));
        setNotice(t('adminFinance.paymentVerified'));
      } else if (action.kind === 'refundDecision') {
        const body = { decision: action.decision, approvedAmountVnd: action.decision === 'approve' ? Number(text('approvedAmountVnd')) : undefined, note: text('note') };
        await runMutation(`refund-decision:${action.refund.id}`, body, key => adminFinanceApi.decideRefund(action.refund.id, body, key));
        setNotice(t(action.decision === 'approve' ? 'adminFinance.refundApproved' : 'adminFinance.refundRejected'));
      } else if (action.kind === 'recordRefund') {
        const body = { amountVnd: Number(text('amountVnd')), channel: text('channel') as 'payos' | 'vnpay' | 'bank_transfer', transactionReference: text('transactionReference'), refundedAt: iso('refundedAt'), evidenceUrl: evidence };
        await runMutation(`record-refund:${action.refund.id}`, body, key => adminFinanceApi.recordRefund(action.refund.id, body, key));
        setNotice(t('adminFinance.refundRecorded'));
      } else if (action.kind === 'createStatement') {
        const body = { companyId: Number(text('companyId')), periodStart: text('periodStart'), periodEnd: text('periodEnd'), note: text('note') || undefined };
        await runMutation(`create-statement:${body.companyId}`, body, key => adminFinanceApi.createStatement(body, key));
        setNotice(t('adminFinance.statementCreated'));
      } else if (action.kind === 'approveStatement') {
        const body = { note: text('note') || undefined };
        await runMutation(`approve-statement:${action.statement.id}`, body, key => adminFinanceApi.approveStatement(action.statement.id, body, key));
        setNotice(t('adminFinance.statementApproved'));
      } else if (action.kind === 'recordTransfer') {
        const body = { amountVnd: Number(text('amountVnd')), bankReference: text('bankReference'), transferredAt: iso('transferredAt'), evidenceUrl: evidence };
        await runMutation(`record-transfer:${action.statement.id}`, body, key => adminFinanceApi.recordTransfer(action.statement.id, body, key));
        setNotice(t('adminFinance.transferRecorded'));
      }
      closeAction(); await load(page);
    } catch { setError(t('adminFinance.actionError')); }
    finally { setBusy(false); }
  };

  const tabs: { id: Tab; label: string; icon: typeof Banknote }[] = [
    { id: 'payments', label: t('adminFinance.tabPayments'), icon: Banknote },
    { id: 'refunds', label: t('adminFinance.tabRefunds'), icon: ReceiptText },
    { id: 'statements', label: t('adminFinance.tabStatements'), icon: Landmark },
  ];
  const field = (name: string, label: string, type = 'text', required = true, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label key={name} className="grid gap-1.5 text-sm font-semibold text-[#34413D]">{label}<input name={name} type={type} required={required} className={input} {...props}/></label>;
  const statusPill = (status: string) => <span className="inline-flex rounded-full bg-[#F1F5F2] px-2.5 py-1 text-xs font-semibold text-[#34413D]">{t(`adminFinance.status.${status}`)}</span>;
  const range = totalPages > 1 && <nav aria-label={t('adminFinance.pagination')} className="flex items-center justify-between border-t border-[#E8ECE9] pt-4"><button type="button" disabled={page <= 0 || loading} onClick={() => void load(page - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#CAD4CF] px-3 text-sm disabled:opacity-40"><ChevronLeft aria-hidden="true" className="h-4 w-4"/>{t('adminFinance.previous')}</button><span className="text-sm text-[#64716D]">{t('adminFinance.page', { current: page + 1, total: totalPages })}</span><button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => void load(page + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#CAD4CF] px-3 text-sm disabled:opacity-40">{t('adminFinance.next')}<ChevronRight aria-hidden="true" className="h-4 w-4"/></button></nav>;
  const title = !action ? '' : action.kind === 'refundDecision' ? action.decision === 'approve' ? t('adminFinance.approveRefund') : t('adminFinance.rejectRefund') : ({ verifyPayment: t('adminFinance.verifyPayment'), recordRefund: t('adminFinance.recordRefund'), createStatement: t('adminFinance.createStatement'), approveStatement: t('adminFinance.approveStatement'), recordTransfer: t('adminFinance.recordTransfer') }[action.kind]);
  const description = !action ? '' : action.kind === 'refundDecision' ? action.decision === 'approve' ? t('adminFinance.approveRefundHelp') : t('adminFinance.rejectRefundHelp') : ({ verifyPayment: t('adminFinance.verifyHelp'), recordRefund: t('adminFinance.recordRefundHelp'), createStatement: t('adminFinance.createStatementHelp'), approveStatement: t('adminFinance.approveStatementHelp'), recordTransfer: t('adminFinance.recordTransferHelp') }[action.kind]);
  const submitLabel = action ? ({ verifyPayment: t('adminFinance.confirm'), refundDecision: t('adminFinance.confirm'), recordRefund: t('adminFinance.recordOnly'), createStatement: t('adminFinance.createDraft'), approveStatement: t('adminFinance.confirm'), recordTransfer: t('adminFinance.recordOnly') }[action.kind]) : '';
  const activeRefund = action?.kind === 'refundDecision' || action?.kind === 'recordRefund' ? action.refund : null;
  const activeStatement = action?.kind === 'approveStatement' || action?.kind === 'recordTransfer' ? action.statement : null;
  const rowHelp = t('adminFinance.noData');

  return <DashboardLayout role="admin" currentScreen="admin_finance" onNavigate={onNavigate}>
    <div className="mx-auto max-w-7xl space-y-6 px-1 pb-8">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#1F4E43] p-6 text-white md:flex-row md:items-end md:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#F6C7A9]">{t('adminFinance.eyebrow')}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{t('adminFinance.title')}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{t('adminFinance.intro')}</p></div><button type="button" onClick={() => void load(page)} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>{t('adminFinance.refresh')}</button></header>
      <nav aria-label={t('adminFinance.sections')} className="flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => { setNotice(''); setError(''); setTab(id); }} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === id ? 'bg-[#1C2526] text-white shadow-sm' : 'border border-[#E2E7E4] bg-white text-[#52605D] hover:bg-[#F1F5F2]'}`}><Icon aria-hidden="true" className="h-4 w-4"/>{label}</button>)}</nav>
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><Check aria-hidden="true" className="mr-2 inline h-4 w-4"/>{notice}</p>}
      {error && !action && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><CircleAlert aria-hidden="true" className="h-4 w-4"/>{error}<button type="button" onClick={() => void load(page)} className="ml-auto underline">{t('adminFinance.retry')}</button></p>}
      {loading ? <p role="status" className={`${card} p-8 text-sm text-[#64716D]`}>{t('adminFinance.loading')}</p> : <>
        {tab === 'payments' && <section className="space-y-4"><header><h2 className="text-xl font-bold">{t('adminFinance.pendingPayments')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminFinance.pendingPaymentsHelp')}</p></header>{pendingPayments.length ? <div className="grid gap-3">{pendingPayments.map(item => <article key={item.id} className={`${card} grid gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(11rem,.7fr)_auto] md:items-center md:p-5`}><div><div className="flex flex-wrap items-center gap-2"><strong>{item.bookingCode}</strong>{statusPill('pending_review')}<span className="text-xs text-[#64716D]">{date(item.receivedAt, true)}</span></div><p className="mt-2 text-sm text-[#52605D]">{t('adminFinance.paymentReference', { provider: t(`adminFinance.provider.${item.provider}`), reference: item.transactionReference })}</p><p className="mt-1 text-xs text-[#64716D]">{t('adminFinance.requestedAmount', { amount: item.attempt ? money(item.attempt.requestedAmountVnd) : t('adminFinance.notAvailable'), purpose: item.attempt ? t(`adminFinance.purpose.${item.attempt.purpose}`) : t('adminFinance.notAvailable') })}</p></div><div><span className="text-xs text-[#64716D]">{t('adminFinance.receivedAmount')}</span><p className="text-lg font-bold">{money(item.amountVnd)}</p></div><button type="button" onClick={() => showAction({ kind: 'verifyPayment', payment: item })} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34]">{t('adminFinance.reviewPayment')}</button></article>)}</div> : <div className={`${card} border-dashed p-10 text-center`}><ShieldCheck aria-hidden="true" className="mx-auto h-8 w-8 text-[#1F4E43]"/><p className="mt-3 text-sm text-[#64716D]">{rowHelp}</p></div>}{range}</section>}

        {tab === 'refunds' && <section className="space-y-4"><header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">{t('adminFinance.refundsTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminFinance.refundsHelp')}</p></div><label className="grid gap-1 text-xs font-semibold text-[#52605D]">{t('adminFinance.statusFilter')}<select value={refundStatus} onChange={e => setRefundStatus(e.target.value)} className={input}><option value="">{t('adminFinance.allStatuses')}</option>{['requested','approved','processing','completed','failed','rejected'].map(s => <option value={s} key={s}>{t(`adminFinance.status.${s}`)}</option>)}</select></label></header>{refunds.length ? <div className="grid gap-3">{refunds.map(item => { const expanded = selectedRefund === item.id; const remaining = Math.max(0, (item.approvedAmountVnd ?? 0) - item.refundedVnd); return <article key={item.id} className={`${card} overflow-hidden`}><div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,.8fr)_auto] md:items-center md:p-5"><div><button type="button" aria-expanded={expanded} onClick={() => setSelectedRefund(expanded ? null : item.id)} className="text-left font-bold underline decoration-[#CAD4CF] underline-offset-4">{item.bookingCode} · {item.companyName}</button><p className="mt-1 text-sm text-[#52605D]">{item.reason}</p><p className="mt-1 text-xs text-[#64716D]">{date(item.createdAt, true)}{item.decisionNote ? ` · ${item.decisionNote}` : ''}</p></div><div className="flex flex-wrap items-center gap-2">{statusPill(item.status)}<span className="font-semibold">{money(item.approvedAmountVnd ?? item.requestedAmountVnd)}</span></div><div className="flex flex-wrap gap-2">{item.status === 'requested' && <><button type="button" onClick={() => showAction({ kind: 'refundDecision', refund: item, decision: 'approve' })} className="min-h-10 rounded-lg bg-[#1F4E43] px-3 text-sm font-semibold text-white">{t('adminFinance.approve')}</button><button type="button" onClick={() => showAction({ kind: 'refundDecision', refund: item, decision: 'reject' })} className="min-h-10 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-800">{t('adminFinance.reject')}</button></>}{['approved','processing'].includes(item.status) && remaining > 0 && <button type="button" onClick={() => showAction({ kind: 'recordRefund', refund: item })} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold text-[#1F4E43]">{t('adminFinance.recordRefund')}</button>}</div></div>{expanded && <div className="border-t border-[#E8ECE9] bg-[#FAFBFA] p-4"><p className="text-sm font-semibold">{t('adminFinance.refundProgress', { refunded: money(item.refundedVnd), approved: money(item.approvedAmountVnd ?? item.requestedAmountVnd) })}</p>{item.refunds.length > 0 ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{item.refunds.map(refund => <li key={refund.id} className="rounded-lg border border-[#E2E7E4] bg-white p-3 text-sm"><strong>{money(refund.amountVnd)}</strong><span className="ml-2 text-xs text-[#64716D]">{t(`adminFinance.channel.${refund.channel}`)} · {date(refund.refundedAt, true)}</span><p className="mt-1 text-xs text-[#64716D]">{refund.transactionReference}</p>{safeEvidenceLink(refund.evidenceUrl) && <a className="mt-1 inline-block text-xs text-[#1F4E43] underline" href={safeEvidenceLink(refund.evidenceUrl)!} target="_blank" rel="noreferrer">{t('adminFinance.viewEvidence')}</a>}</li>)}</ul> : <p className="mt-2 text-xs text-[#64716D]">{t('adminFinance.noRefundRecords')}</p>}</div>}</article>; })}</div> : <div className={`${card} border-dashed p-10 text-center text-sm text-[#64716D]`}>{t('adminFinance.noData')}</div>}{range}</section>}

        {tab === 'statements' && <section className="space-y-4"><header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">{t('adminFinance.statementsTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminFinance.statementsHelp')}</p></div><div className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-xs font-semibold text-[#52605D]">{t('adminFinance.statusFilter')}<select value={statementStatus} onChange={e => setStatementStatus(e.target.value)} className={`${input} min-w-40`}><option value="">{t('adminFinance.allStatuses')}</option>{['draft','approved','paying','paid'].map(s => <option key={s} value={s}>{t(`adminFinance.status.${s}`)}</option>)}</select></label><button type="button" onClick={() => showAction({ kind: 'createStatement' })} className="min-h-11 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white">{t('adminFinance.createStatement')}</button></div></header>{statements.length ? <div className="grid gap-3">{statements.map(item => { const expanded = selectedStatement === item.id; return <article key={item.id} className={`${card} overflow-hidden`}><div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(13rem,1fr)_auto] md:items-center md:p-5"><div><button type="button" aria-expanded={expanded} onClick={() => setSelectedStatement(expanded ? null : item.id)} className="text-left font-bold underline decoration-[#CAD4CF] underline-offset-4">{item.companyName}</button><p className="mt-1 text-sm text-[#64716D]">{date(item.periodStart)} – {date(item.periodEnd)} · {t('adminFinance.settledCutoff', { date: date(item.cutoffAt) })}</p><p className="mt-1 text-xs text-[#64716D]">{item.items.length} {t('adminFinance.statementItems')}</p></div><div className="flex flex-wrap items-center gap-3">{statusPill(item.status)}<div><p className="text-lg font-bold">{money(item.payableVnd)}</p><p className="text-xs text-[#64716D]">{t('adminFinance.remainingTransfer', { amount: money(item.remainingVnd) })}</p></div></div><div className="flex flex-wrap gap-2">{item.status === 'draft' && <button type="button" onClick={() => showAction({ kind: 'approveStatement', statement: item })} className="min-h-10 rounded-lg bg-[#1F4E43] px-3 text-sm font-semibold text-white">{t('adminFinance.approveStatement')}</button>}{['approved','paying'].includes(item.status) && item.remainingVnd > 0 && <button type="button" onClick={() => showAction({ kind: 'recordTransfer', statement: item })} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold text-[#1F4E43]">{t('adminFinance.recordTransfer')}</button>}</div></div>{expanded && <div className="border-t border-[#E8ECE9] bg-[#FAFBFA] p-4"><p className="text-xs text-[#64716D]">{item.note || t('adminFinance.noNote')}</p><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-xs"><thead className="text-[#64716D]"><tr><th className="pb-2 pr-3">{t('adminFinance.booking')}</th><th className="pb-2 pr-3">{t('adminFinance.lineType')}</th><th className="pb-2 pr-3">{t('adminFinance.retained')}</th><th className="pb-2 pr-3">{t('adminFinance.fee')}</th><th className="pb-2 pr-3">{t('adminFinance.held')}</th><th className="pb-2">{t('adminFinance.payable')}</th></tr></thead><tbody>{item.items.map((line,index)=><tr key={`${line.bookingId}-${index}`} className="border-t border-[#E2E7E4]"><td className="py-2 pr-3">{line.bookingCode}</td><td className="py-2 pr-3">{t(`adminFinance.line.${line.kind}`)}</td><td className="py-2 pr-3">{money(line.retainedRevenueVnd)}</td><td className="py-2 pr-3">{money(line.platformFeeVnd)}</td><td className="py-2 pr-3">{money(line.heldAmountVnd)}</td><td className="py-2">{money(line.payableVnd)}</td></tr>)}</tbody></table></div></div>}</article>; })}</div> : <div className={`${card} border-dashed p-10 text-center text-sm text-[#64716D]`}>{t('adminFinance.noData')}</div>}{range}</section>}
      </>}
      {totalItems > 0 && <p className="text-right text-xs text-[#64716D]">{t('adminFinance.resultCount', { count: totalItems })}</p>}
    </div>
    {action && <FinanceDialog title={title} description={description} busy={busy} onClose={closeAction} onSubmit={submitAction} submitLabel={submitLabel}>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {action.kind === 'verifyPayment' && <><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t('adminFinance.verifyAmount', { amount: money(action.payment.amountVnd), booking: action.payment.bookingCode })}</p>{field('evidenceUrl', t('adminFinance.evidenceUrl'), 'url')}{field('reason', t('adminFinance.reason'), 'text', true, { minLength: 3 })}<label className="flex items-start gap-3 text-sm text-[#52605D]"><input type="checkbox" name="externalConfirmed" required className="mt-1 accent-[#1F4E43]"/><span>{t('adminFinance.confirmReceived')}</span></label></>}
      {action.kind === 'refundDecision' && activeRefund && <><div className="rounded-lg bg-[#F7F8F6] p-3 text-sm"><strong>{activeRefund.bookingCode} · {activeRefund.companyName}</strong><p className="mt-1">{activeRefund.reason}</p><p className="mt-1">{t('adminFinance.refundRequestedAmount', { amount: money(activeRefund.requestedAmountVnd) })}</p></div>{action.decision === 'approve' && field('approvedAmountVnd', t('adminFinance.approvedAmount'), 'number', true, { min: 1, max: Math.min(activeRefund.requestedAmountVnd, activeRefund.requestedAmountVnd - activeRefund.refundedVnd), step: 1, defaultValue: Math.min(activeRefund.requestedAmountVnd, activeRefund.requestedAmountVnd - activeRefund.refundedVnd) })}{field('note', action.decision === 'reject' ? t('adminFinance.rejectionNote') : t('adminFinance.decisionNote'), 'text', action.decision === 'reject', { minLength: action.decision === 'reject' ? 3 : undefined })}</>}
      {action.kind === 'recordRefund' && activeRefund && <><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t('adminFinance.recordRefundHelp')} {t('adminFinance.remainingRefund', { amount: money(Math.max(0,(activeRefund.approvedAmountVnd ?? 0) - activeRefund.refundedVnd)) })}</p>{field('amountVnd', t('adminFinance.amount'), 'number', true, { min: 1, max: Math.max(0,(activeRefund.approvedAmountVnd ?? 0) - activeRefund.refundedVnd), step: 1 })}<label className="grid gap-1.5 text-sm font-semibold text-[#34413D]">{t('adminFinance.channel')}<select name="channel" required className={input}><option value="payos">PayOS</option><option value="vnpay">VNPay</option><option value="bank_transfer">{t('adminFinance.channel.bank_transfer')}</option></select></label>{field('transactionReference', t('adminFinance.transactionReference'))}{field('refundedAt', t('adminFinance.executedAt'), 'datetime-local')}{field('evidenceUrl', t('adminFinance.evidenceUrl'), 'url')}<label className="flex items-start gap-3 text-sm text-[#52605D]"><input type="checkbox" required className="mt-1 accent-[#1F4E43]"/><span>{t('adminFinance.confirmExecuted')}</span></label></>}
      {action.kind === 'createStatement' && <><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t('adminFinance.createStatementHelp')}</p>{field('periodStart', t('adminFinance.periodStart'), 'date', true, { value: periodStart, max: periodEnd, onChange: e => setPeriodStart(e.target.value) })}{field('periodEnd', t('adminFinance.periodEnd'), 'date', true, { value: periodEnd, min: periodStart, onChange: e => setPeriodEnd(e.target.value) })}<label className="grid gap-1.5 text-sm font-semibold text-[#34413D]">{t('adminFinance.company')}<select name="companyId" value={companyId} onChange={e => setCompanyId(e.target.value)} required disabled={companiesLoading || companies.length === 0} className={input}><option value="">{companiesLoading ? t('adminFinance.loadingCompanies') : t('adminFinance.chooseCompany')}</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name} · {t('adminFinance.eligibleBookings', { count: c.eligibleBookingCount })}</option>)}</select></label>{companiesError && <p role="alert" className="text-sm text-rose-800">{t('adminFinance.companyLoadError')}</p>}{!companiesLoading && !companiesError && companies.length === 0 && <p className="text-sm text-[#64716D]">{t('adminFinance.noEligibleCompanies')}</p>}{field('note', t('adminFinance.note'), 'text', false)}</>}
      {action.kind === 'approveStatement' && activeStatement && <><p className="rounded-lg bg-[#F7F8F6] p-3 text-sm">{activeStatement.companyName} · {date(activeStatement.periodStart)} – {date(activeStatement.periodEnd)}<br/><strong>{money(activeStatement.payableVnd)}</strong></p><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t('adminFinance.approveStatementHelp')}</p>{field('note', t('adminFinance.note'), 'text', false)}</>}
      {action.kind === 'recordTransfer' && activeStatement && <><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t('adminFinance.recordTransferHelp')} {t('adminFinance.remainingTransfer', { amount: money(activeStatement.remainingVnd) })}</p>{field('amountVnd', t('adminFinance.transferAmount'), 'number', true, { min: 1, max: activeStatement.remainingVnd, step: 1 })}{field('bankReference', t('adminFinance.bankReference'))}{field('transferredAt', t('adminFinance.executedAt'), 'datetime-local')}{field('evidenceUrl', t('adminFinance.evidenceUrl'), 'url')}<label className="flex items-start gap-3 text-sm text-[#52605D]"><input type="checkbox" required className="mt-1 accent-[#1F4E43]"/><span>{t('adminFinance.confirmExecuted')}</span></label></>}
    </FinanceDialog>}
  </DashboardLayout>;
}
