import type { ReactNode } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import type { ScreenId } from '../../types/expedition';
import AdminAccountManagementPage from '../../pages/admin/user-management/AdminAccountManagementPage';
import AdminHomePage from './components/AdminHomePage';
import AdminTourManagementPage from '../tours/components/AdminTourManagementPage';

export function AdminAreaRoutes({ screen, onNavigate }: { screen: ScreenId; onNavigate: (screen: ScreenId) => void }): ReactNode {
  const { t } = useI18n();
  switch (screen) {
    case 'admin_home':
      return <DashboardLayout role="admin" currentScreen={screen} onNavigate={onNavigate} title={t('roleArea.adminTitle')} subtitle={t('roleArea.adminSubtitle')}><AdminHomePage onNavigate={onNavigate} /></DashboardLayout>;
    case 'admin_accounts':
      return <AdminAccountManagementPage onNavigate={onNavigate} />;
    case 'admin_tours':
      return <DashboardLayout role="admin" currentScreen={screen} onNavigate={onNavigate} title={t('adminTour.title')} subtitle={t('adminTour.subtitle')}><AdminTourManagementPage /></DashboardLayout>;
    default:
      return null;
  }
}
