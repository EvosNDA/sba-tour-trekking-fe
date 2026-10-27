import React, { useState } from 'react';
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react';
import { authApi } from '../../features/auth/api/auth.api';
import { useI18n } from '../../i18n/I18nProvider';
import { ScreenId } from '../../types/expedition';

export default function ActivateInvitedAccountPage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (password !== confirm) { setError(t('accountActivation.passwordMismatch')); return; }
    if (new TextEncoder().encode(password).length > 72) { setError(t('accountActivation.passwordTooLong')); return; }
    setBusy(true);
    try { await authApi.activateInvitedAccount(email.trim(), otp.trim(), password); setComplete(true); }
    catch (cause) {
      const message = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : t('accountActivation.failed');
      setError(message);
    } finally { setBusy(false); }
  };

  return <main className="min-h-[70vh] bg-[#F6F8F6] px-4 py-12 text-[#1C2526]">
    <section className="mx-auto max-w-xl rounded-2xl border border-[#E2E7E4] bg-white p-6 shadow-sm sm:p-9">
      <button type="button" onClick={() => onNavigate('login')} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#52605D] hover:text-[#1F4E43]"><ArrowLeft className="h-4 w-4" />{t('accountActivation.backToSignIn')}</button>
      <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#EAF1ED] p-3 text-[#1F4E43]">{complete ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}</div><div><p className="text-xs font-semibold uppercase tracking-wider text-[#1F4E43]">{t('accountActivation.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold">{t(complete ? 'accountActivation.completeTitle' : 'accountActivation.title')}</h1></div></div>
      <p className="mb-6 text-sm leading-6 text-[#64716D]">{t(complete ? 'accountActivation.completeDescription' : 'accountActivation.description')}</p>
      {complete ? <button type="button" onClick={() => onNavigate('login')} className="min-h-11 w-full rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34]">{t('accountActivation.signIn')}</button> : <form onSubmit={event => void submit(event)} className="space-y-4">
        <label className="block text-sm font-medium">{t('accountActivation.email')}<input type="email" required autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#CAD4CF] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20" /></label>
        <label className="block text-sm font-medium">{t('accountActivation.otp')}<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1 min-h-11 w-full rounded-lg border border-[#CAD4CF] px-3 font-mono tracking-[.3em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20" /></label>
        <label className="block text-sm font-medium">{t('accountActivation.newPassword')}<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#CAD4CF] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20" /><span className="mt-1 block text-xs font-normal text-[#64716D]">{t('accountActivation.passwordHint')}</span></label>
        <label className="block text-sm font-medium">{t('accountActivation.confirmPassword')}<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#CAD4CF] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20" /></label>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <button disabled={busy || otp.length !== 6} className="min-h-11 w-full rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34] disabled:cursor-wait disabled:opacity-60">{busy ? t('accountActivation.activating') : t('accountActivation.activate')}</button>
      </form>}
    </section>
  </main>;
}
