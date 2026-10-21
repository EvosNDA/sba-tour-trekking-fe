import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { partnerApplicationsApi } from '../../../features/partners/api/partnerApplications.api';
import { ScreenId } from '../../../types/expedition';

export default function PartnerActivationPage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const token = React.useMemo(() => new URLSearchParams(window.location.search).get('partnerActivation') ?? '', []);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [resent, setResent] = React.useState(false);
  const [error, setError] = React.useState('');
  const [canResend, setCanResend] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [complete, setComplete] = React.useState(false);
  const missingToken = !token;

  const resend = async () => {
    setResending(true);
    try {
      await partnerApplicationsApi.resendActivation(email);
    } catch {
      // Keep the response generic so the page does not reveal whether an email has an application.
    } finally {
      setResent(true);
      setResending(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError(t('partner.passwordMismatch')); return; }
    setSubmitting(true);
    setError('');
    try {
      await partnerApplicationsApi.activate(token, password);
      try { sessionStorage.removeItem('wetrek_partner_application_email'); } catch { /* Session storage is optional. */ }
      window.history.replaceState(null, '', window.location.pathname);
      setComplete(true);
    } catch {
      setError(t('partner.activationError'));
      setCanResend(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[65vh] bg-[#F7F8F6] px-4 py-12 md:px-8">
      <section className="mx-auto max-w-md rounded-xl border border-[#E2E7E4] bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[#1C2526]">{t(complete ? 'partner.activationDone' : 'partner.activationTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#64716D]">{t(complete ? 'partner.activationDoneHelp' : missingToken ? 'partner.activationMissingToken' : 'partner.activationHelp')}</p>
        {complete ? (
          <button type="button" onClick={() => onNavigate('login')} className="mt-6 w-full rounded-md bg-[#1F4E43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173C34]">{t('header.signIn')}</button>
        ) : (
          <>
          {!missingToken && <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="partner-password" className="mb-1.5 block text-sm font-medium">{t('partner.newPassword')}</label>
              <input id="partner-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-md border border-[#CAD4CF] px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15" />
              <p className="mt-1 text-xs text-[#64716D]">{t('partner.passwordHint')}</p>
            </div>
            <div>
              <label htmlFor="partner-confirm-password" className="mb-1.5 block text-sm font-medium">{t('partner.confirmPassword')}</label>
              <input id="partner-confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-md border border-[#CAD4CF] px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15" />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-[#1F4E43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50">{submitting ? t('partner.activating') : t('partner.setPassword')}</button>
          </form>
          }
          {(missingToken || canResend) && <div className="mt-6 space-y-3 border-t border-[#E6EAE7] pt-5">
            <label htmlFor="partner-resend-email" className="block text-sm font-medium">{t('partner.email')}</label>
            <input id="partner-resend-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-md border border-[#CAD4CF] px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15" />
            <button type="button" disabled={!email || resending} onClick={() => void resend()} className="text-sm font-semibold text-[#1F4E43] underline disabled:opacity-50">{resending ? t('partner.resendingActivation') : t('partner.resendActivation')}</button>
            {resent && <p role="status" className="text-sm text-[#52605D]">{t('partner.resendActivationSent')}</p>}
          </div>}
          </>
        )}
      </section>
    </main>
  );
}
