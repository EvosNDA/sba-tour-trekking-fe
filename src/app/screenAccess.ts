import { ScreenId } from '../types/expedition';
import { UserRole } from '../types/common.types';

const publicScreens: ScreenId[] = ['marketplace', 'login', 'registration', 'account_activation', 'booking_payment_result'];
const customerScreens: ScreenId[] = ['eticket', 'paybalance', 'review'];
const adminScreens: ScreenId[] = ['admin_home', 'admin_accounts', 'admin_tours'];
const staffScreens: ScreenId[] = ['staff_home'];
const guideScreens: ScreenId[] = ['guide_home'];

export function canAccessScreen(role: UserRole | null, screen: ScreenId): boolean {
  if (publicScreens.includes(screen)) return true;
  if (!role) return false;
  if (screen === 'account_profile') return true;
  if (customerScreens.includes(screen)) return role === 'customer';
  if (role === 'admin') return adminScreens.includes(screen);
  if (role === 'staff') return staffScreens.includes(screen);
  if (role === 'guide') return guideScreens.includes(screen);
  return false;
}

export function homeScreenForRole(role: UserRole): ScreenId {
  if (role === 'admin') return 'admin_home';
  if (role === 'staff') return 'staff_home';
  if (role === 'guide') return 'guide_home';
  return 'marketplace';
}
