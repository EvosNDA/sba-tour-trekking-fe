import { ScreenId } from '../types/expedition';
import { UserRole } from '../types/common.types';

const publicScreens: ScreenId[] = ['marketplace', 'login', 'registration', 'partner_company_info', 'partner_activate', 'partner_activation_help', 'partner_application_submitted', 'booking_payment_result'];
// These prototype screens have no backend API yet.
const partnerScreens: ScreenId[] = ['partner_certificates'];
const adminScreens: ScreenId[] = ['ops_moderation'];

export function canAccessScreen(role: UserRole | null, screen: ScreenId): boolean {
  if (screen === 'account_profile') return role !== null;
  if (screen === 'partner_application_status') return role !== null;
  if (publicScreens.includes(screen)) return true;
  if (!role) return false;
  if (role === 'admin') return adminScreens.includes(screen);
  if (role === 'partner') return partnerScreens.includes(screen);
  if (role === 'staff') return false;
  if (role === 'customer') return false;
  // Guide features are not implemented yet; keep guide accounts on public pages.
  return false;
}

export function homeScreenForRole(role: UserRole): ScreenId {
  if (role === 'partner') return 'partner_certificates';
  if (role === 'admin') return 'ops_moderation';
  if (role === 'staff') return 'marketplace';
  return 'marketplace';
}
