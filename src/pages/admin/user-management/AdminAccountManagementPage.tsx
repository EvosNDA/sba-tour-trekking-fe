import React, { useState } from 'react';
import { Search, Shield, UserPlus, UserRound, CircleAlert, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { adminAccountsApi, AdminAccount } from '../../../features/admin/api/adminAccounts.api';
import { ScreenId } from '../../../types/expedition';
import { useI18n } from '../../../i18n/I18nProvider';

const roles = ['customer', 'guide'];
const field = 'min-h-11 w-full rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm outline-none focus-visible:border-[#1F4E43] focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20';
const card = 'rounded-2xl border border-[#E2E7E4] bg-white p-5 shadow-sm md:p-6';

export default function AdminAccountManagementPage({ onNavigate = () => {} }: { onNavigate?: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const [lookupId, setLookupId] = useState('');
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [reason, setReason] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [invite, setInvite] = useState({ email: '', fullName: '', phone: '', role: 'admin' as const });
  const [invitedAccountId, setInvitedAccountId] = useState<number | null>(null);
  const [inviteDelivery, setInviteDelivery] = useState<'sent' | 'retry_required' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const showError = (value: unknown) => {
    if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
    return t('adminAccounts.actionError');
  };
  const loadAccount = async (id = Number(lookupId)) => {
    if (!Number.isSafeInteger(id) || id < 1) { setError(t('adminAccounts.invalidId')); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await adminAccountsApi.get(id);
      setAccount(result); setSelectedRoles(result.roles); setLookupId(String(result.id));
    } catch (cause) { setAccount(null); setError(showError(cause)); }
    finally { setBusy(false); }
  };
  const updateAccount = async (action: 'block' | 'unblock' | 'roles') => {
    if (!account || !reason.trim()) { setError(t('adminAccounts.reasonRequired')); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const next = action === 'block' ? await adminAccountsApi.block(account.id, reason.trim())
        : action === 'unblock' ? await adminAccountsApi.unblock(account.id, reason.trim())
          : await adminAccountsApi.replaceRoles(account.id, selectedRoles, reason.trim());
      setAccount(next); setSelectedRoles(next.roles); setReason(''); setNotice(t('adminAccounts.accountUpdated'));
    } catch (cause) { setError(showError(cause)); }
    finally { setBusy(false); }
  };
  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice(''); setInvitedAccountId(null);
    try {
      const result = await adminAccountsApi.inviteStaff({ ...invite, phone: invite.phone || undefined });
      setInvitedAccountId(result.accountId); setInviteDelivery(result.deliveryStatus); setInvite({ email: '', fullName: '', phone: '', role: 'admin' });
      setNotice(result.deliveryStatus === 'sent' ? t('adminAccounts.invitationSent') : t('adminAccounts.invitationRetryFailed'));
    } catch (cause) { setError(showError(cause)); }
    finally { setBusy(false); }
  };
  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  const retryInvitation = async () => {
    if (!invitedAccountId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await adminAccountsApi.resendStaffInvite(invitedAccountId);
      setInviteDelivery(result.deliveryStatus); setNotice(result.deliveryStatus === 'sent' ? t('adminAccounts.invitationSent') : t('adminAccounts.invitationRetryFailed'));
    } catch (cause) { setError(showError(cause)); }
    finally { setBusy(false); }
  };

  return <DashboardLayout role="admin" currentScreen="admin_accounts" onNavigate={onNavigate} title={t('adminAccounts.title')} subtitle={t('adminAccounts.subtitle')}>
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className={card} aria-labelledby="account-search-title">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-[#EAF1ED] p-3 text-[#1F4E43]"><UserRound className="h-5 w-5" /></div><div><h2 id="account-search-title" className="text-lg font-bold">{t('adminAccounts.lookupTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminAccounts.lookupDescription')}</p></div></div>
          <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={event => { event.preventDefault(); void loadAccount(); }}>
            <label className="sr-only" htmlFor="account-id">{t('adminAccounts.accountId')}</label>
            <input id="account-id" className={field} inputMode="numeric" pattern="[0-9]+" value={lookupId} onChange={event => setLookupId(event.target.value)} placeholder={t('adminAccounts.accountIdPlaceholder')} />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-60" disabled={busy}><Search className="h-4 w-4" />{busy ? t('adminAccounts.loading') : t('adminAccounts.lookup')}</button>
          </form>
          {account && <div className="mt-5 rounded-xl border border-[#E2E7E4] bg-[#F8FAF8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#64716D]">{t('adminAccounts.account')} #{account.id}</p><h3 className="mt-1 text-lg font-bold">{account.fullName}</h3><p className="text-sm text-[#52605D]">{account.email} · {account.phone || t('adminAccounts.noPhone')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${account.status === 'active' ? 'bg-emerald-100 text-emerald-800' : account.status === 'blocked' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'}`}>{t(`adminAccounts.status.${account.status}`)}</span></div>
            {account.blockedReason && <p className="mt-3 text-sm text-rose-800">{t('adminAccounts.blockReason')}: {account.blockedReason}</p>}
            <div className="mt-4 flex flex-wrap gap-2">{account.roles.map(role => <span key={role} className="rounded-md border border-[#CAD4CF] bg-white px-2.5 py-1 text-xs font-medium">{t(`adminAccounts.role.${role}`)}</span>)}</div>
            <dl className="mt-4 grid gap-2 border-t border-[#E2E7E4] pt-4 text-sm sm:grid-cols-2"><div><dt className="text-[#64716D]">{t('adminAccounts.emailVerified')}</dt><dd className="font-medium">{account.emailVerifiedAt ? t('adminAccounts.yes') : t('adminAccounts.no')}</dd></div><div><dt className="text-[#64716D]">{t('adminAccounts.mustChangePassword')}</dt><dd className="font-medium">{account.mustChangePassword ? t('adminAccounts.yes') : t('adminAccounts.no')}</dd></div></dl>
          </div>}
          {!account && !busy && <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-[#CAD4CF] p-4 text-sm text-[#64716D]"><Shield className="h-5 w-5 shrink-0" />{t('adminAccounts.lookupHint')}</div>}
        </section>

        <section className={card}>
          <div className="flex items-start gap-3"><div className="rounded-xl bg-[#FFF3E7] p-3 text-[#9B4C13]"><UserPlus className="h-5 w-5" /></div><div><h2 className="text-lg font-bold">{t('adminAccounts.inviteTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminAccounts.inviteDescription')}</p></div></div>
          <form onSubmit={event => void sendInvite(event)} className="mt-5 space-y-3">
            <label className="block text-sm font-medium">{t('adminAccounts.fullName')}<input required maxLength={200} className={`${field} mt-1`} value={invite.fullName} onChange={e => setInvite({ ...invite, fullName: e.target.value })} /></label>
            <label className="block text-sm font-medium">{t('adminAccounts.email')}<input required type="email" maxLength={254} className={`${field} mt-1`} value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} /></label>
            <label className="block text-sm font-medium">{t('adminAccounts.phone')}<input type="tel" maxLength={30} className={`${field} mt-1`} value={invite.phone} onChange={e => setInvite({ ...invite, phone: e.target.value })} /></label>
            <p className="rounded-lg bg-[#F7F8F6] p-3 text-sm text-[#52605D]">{t('adminAccounts.adminInviteNote')}</p>
            <button disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-60"><UserPlus className="h-4 w-4" />{busy ? t('adminAccounts.sending') : t('adminAccounts.sendInvite')}</button>
            {invitedAccountId && <div className="space-y-2"><p className="text-sm text-[#1F4E43]">{t('adminAccounts.inviteAccountId', { id: invitedAccountId })}</p>{inviteDelivery === 'retry_required' && <button type="button" disabled={busy} onClick={() => void retryInvitation()} className="rounded-lg border border-[#CAD4CF] px-3 py-2 text-sm font-semibold text-[#1F4E43] disabled:opacity-50">{t('adminAccounts.retryInvitation')}</button>}</div>}
          </form>
        </section>
      </div>

      {account && <div className="grid gap-6 xl:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-bold">{t('adminAccounts.accessTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('adminAccounts.accessDescription')}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{roles.map(role => <label key={role} className="flex items-center gap-2 rounded-lg border border-[#E2E7E4] p-3 text-sm"><input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggle(selectedRoles, role, setSelectedRoles)} />{t(`adminAccounts.role.${role}`)}</label>)}</div>
          <label className="mt-4 block text-sm font-medium">{t('adminAccounts.reason')}<textarea required maxLength={2000} rows={2} className={`${field} mt-1 py-2`} value={reason} onChange={e => setReason(e.target.value)} /></label>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy || !reason.trim() || !selectedRoles.length || account.roles.includes('admin')} onClick={() => void updateAccount('roles')} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{t('adminAccounts.saveRoles')}</button>
            {account.status === 'active' ? <button type="button" disabled={busy || !reason.trim() || account.roles.includes('admin')} onClick={() => void updateAccount('block')} className="min-h-10 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-800 disabled:opacity-50">{t('adminAccounts.block')}</button> : account.status === 'blocked' ? <button type="button" disabled={busy || !reason.trim()} onClick={() => void updateAccount('unblock')} className="min-h-10 rounded-lg border border-emerald-300 px-4 text-sm font-semibold text-emerald-800 disabled:opacity-50">{t('adminAccounts.unblock')}</button> : null}</div>
          {account.roles.includes('admin') && <p className="mt-3 text-xs text-[#64716D]">{t('adminAccounts.protectedAdmin')}</p>}
        </section>

      </div>}

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}</div>}
    </div>
  </DashboardLayout>;
}
