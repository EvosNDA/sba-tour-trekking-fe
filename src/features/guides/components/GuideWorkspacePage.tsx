import { Mountain } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';

export default function GuideWorkspacePage() {
  const { t } = useI18n();
  return <section className="mx-auto max-w-3xl rounded-2xl border border-[#E2E7E4] bg-white p-8 text-center shadow-sm">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF0EC] text-[#1F4E43]"><Mountain className="h-6 w-6" aria-hidden="true" /></span>
    <h2 className="mt-4 text-xl font-bold text-[#1C2526]">{t('roleArea.guideTitle')}</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64716D]">{t('roleArea.guideBackendNote')}</p>
  </section>;
}
