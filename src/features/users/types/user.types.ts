import { UserRole } from '../../../types/common.types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  nationalParkPassNo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
