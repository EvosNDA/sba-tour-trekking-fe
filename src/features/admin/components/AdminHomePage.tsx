import { ArrowRight, ClipboardList, Users } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { ScreenId } from '../../../types/expedition';

export default function AdminHomePage({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { t } = useI18n();
  const areas: { title: string; description: string; action: string; screen: ScreenId; icon: typeof ClipboardList }[] = [
    { title: t('adminTour.title'), description: t('roleArea.adminToursHelp'), action: t('roleArea.openArea'), screen: 'admin_tours', icon: ClipboardList },
    { title: t('adminAccounts.title'), description: t('roleArea.adminAccountsHelp'), action: t('roleArea.openArea'), screen: 'admin_accounts', icon: Users },
  ];

  return <section className="mx-auto max-w-6xl">
    <p className="text-sm text-[#64716D]">{t('roleArea.adminIntro')}</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {areas.map(({ title, description, action, screen, icon: Icon }) => <button key={screen} onClick={() => onNavigate(screen)} className="group rounded-2xl border border-[#E2E7E4] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#A9BFB5] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0EC] text-[#1F4E43]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="mt-4 text-lg font-semibold text-[#1C2526]">{title}</h2>
        <p className="mt-2 min-h-10 text-sm leading-5 text-[#64716D]">{description}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1F4E43]">{action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
      </button>)}
    </div>
  </section>;
}
