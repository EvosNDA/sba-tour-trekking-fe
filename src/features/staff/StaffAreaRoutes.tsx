import type { ReactNode } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import type { ScreenId } from '../../types/expedition';
import StaffWorkspacePage from './components/StaffWorkspacePage';

export function StaffAreaRoutes({ screen, onNavigate }: { screen: ScreenId; onNavigate: (screen: ScreenId) => void }): ReactNode {
  const { t } = useI18n();
  if (screen !== 'staff_home') return null;
  return <DashboardLayout role="staff" currentScreen={screen} onNavigate={onNavigate} title={t('roleArea.staffTitle')} subtitle={t('roleArea.staffSubtitle')}><StaffWorkspacePage /></DashboardLayout>;
}
