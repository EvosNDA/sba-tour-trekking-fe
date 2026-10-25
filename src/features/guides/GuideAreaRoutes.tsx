import type { ReactNode } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import type { ScreenId } from '../../types/expedition';
import GuideWorkspacePage from './components/GuideWorkspacePage';

export function GuideAreaRoutes({ screen, onNavigate }: { screen: ScreenId; onNavigate: (screen: ScreenId) => void }): ReactNode {
  const { t } = useI18n();
  if (screen !== 'guide_home') return null;
  return <DashboardLayout role="guide" currentScreen={screen} onNavigate={onNavigate} title={t('roleArea.guideTitle')} subtitle={t('roleArea.guideSubtitle')}><GuideWorkspacePage /></DashboardLayout>;
}
