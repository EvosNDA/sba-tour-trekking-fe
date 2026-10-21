import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { partnerApplicationsApi } from '../../features/partners/api/partnerApplications.api';
import { useI18n } from '../../i18n/I18nProvider';
import { ScreenId } from '../../types/expedition';

export default function PartnerApplicationSubmittedPage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState(() => {
    try {
      const submittedEmail = sessionStorage.getItem('wetrek_partner_activation_email') ?? '';
      sessionStorage.removeItem('wetrek_partner_activation_email');
      return submittedEmail;
    } catch {
      return '';
    }
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setSent(false);
    setError(false);
    try {
      await partnerApplicationsApi.resendActivation(email.trim());
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#F7F8F6] px-4 py-12">
      <section className="w-full max-w-lg rounded-xl border border-[#E2E7E4] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F2EE] text-[#1F4E43]">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1C2526]">{t('partner.applicationReceivedTitle')}</h1>
        <p className="mt-3 text-sm leading-6 text-[#52605D]">{t('partner.applicationSent')}</p>
        {email && <p className="mt-4 rounded-md bg-[#F7F8F6] px-3 py-2 text-sm font-medium text-[#1C2526]">{email}</p>}
        <form onSubmit={resend} className="mt-6 space-y-3">
          {!email && <div>
            <label htmlFor="submitted-application-email" className="mb-1.5 block text-sm font-medium text-[#1C2526]">{t('partner.email')}</label>
            <input id="submitted-application-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-md border border-[#CAD4CF] px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15" />
          </div>}
          <button type="submit" disabled={sending} className="w-full rounded-md border border-[#CAD4CF] px-4 py-2.5 text-sm font-semibold text-[#1F4E43] hover:bg-[#F7F8F6] disabled:cursor-wait disabled:opacity-60">
            {sending ? t('auth.partnerActivationSending') : t('partner.resendActivation')}
          </button>
          {sent && <p role="status" aria-live="polite" className="rounded-md bg-[#F1F6F3] p-3 text-sm text-[#365C4E]">{t('auth.partnerActivationResent')}</p>}
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{t('auth.partnerActivationResendError')}</p>}
        </form>
        <button type="button" onClick={() => onNavigate('marketplace')} className="mt-4 w-full rounded-md bg-[#1F4E43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173C34]">{t('auth.backMarketplace')}</button>
      </section>
    </main>
  );
}
