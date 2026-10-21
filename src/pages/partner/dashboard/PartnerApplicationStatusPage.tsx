import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { authApi } from '../../../features/auth/api/auth.api';
import { partnerApplicationsApi, PartnerApplicationStatus } from '../../../features/partners/api/partnerApplications.api';
import { authStore } from '../../../stores/auth.store';
import { ScreenId } from '../../../types/expedition';

export default function PartnerApplicationStatusPage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const [application, setApplication] = React.useState<PartnerApplicationStatus | null>(null);
  const [error, setError] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  const load = React.useCallback(async () => {
    setChecking(true);
    setError(false);
    try {
      const result = await partnerApplicationsApi.status();
      setApplication(result);
      authStore.updateUser({ partnerApplicationStatus: result.status });
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const continueToTours = async () => {
    try {
      const session = await authApi.refresh();
      authStore.login(session.user, session.token);
      authStore.updateUser({ partnerApplicationStatus: 'approved' });
    } catch {
      // The status is still approved; a fresh sign-in will receive the new partner role.
    } finally {
      onNavigate('partner_certificates');
    }
  };

  const titleKey = application?.status === 'approved' ? 'partner.statusApproved'
    : application?.status === 'rejected' ? 'partner.statusRejected'
    : application?.status === 'none' ? 'partner.statusNone' : 'partner.statusPending';
  const helpKey = application?.status === 'approved' ? 'partner.statusApprovedHelp'
    : application?.status === 'rejected' ? 'partner.statusRejectedHelp'
    : application?.status === 'none' ? 'partner.statusNoneHelp' : 'partner.statusPendingHelp';

  return (
    <main className="min-h-[65vh] bg-[#F7F8F6] px-4 py-12 md:px-8">
      <section className="mx-auto max-w-2xl rounded-xl border border-[#E2E7E4] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">{t('partner.title')}</p>
        {checking && !application ? <p role="status" className="mt-4 text-sm text-[#64716D]">{t('partner.statusLoading')}</p> : error ? <div className="mt-4 rounded-md bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-800">{t('partner.statusError')}</p>
          <button type="button" onClick={() => void load()} disabled={checking} className="mt-3 rounded-md bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{checking ? t('partner.checking') : t('partner.retryStatus')}</button>
        </div> : <>
          <h1 className="mt-2 text-2xl font-bold text-[#1C2526]">{t(titleKey)}</h1>
          <p className="mt-3 text-sm leading-6 text-[#64716D]">{t(helpKey)}</p>
          {application?.businessName && <p className="mt-4 rounded-md bg-[#F7F8F6] p-3 text-sm font-medium">{application.businessName}</p>}
          {application?.decisionReason && <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{application.decisionReason}</p>}
        </>}
        {!checking && !error && <div className="mt-6 flex flex-wrap gap-3">
          {application?.status === 'approved'
            ? <button type="button" onClick={() => void continueToTours()} className="rounded-md bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white">{t('partner.openTours')}</button>
            : <button type="button" onClick={() => void load()} disabled={checking} className="rounded-md bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{checking ? t('partner.checking') : t('partner.checkStatus')}</button>}
          {application?.status === 'none' && <button type="button" onClick={() => onNavigate('partner_company_info')} className="rounded-md border border-[#CAD4CF] px-4 py-2.5 text-sm font-semibold">{t('partner.startApplication')}</button>}
        </div>}
      </section>
    </main>
  );
}
