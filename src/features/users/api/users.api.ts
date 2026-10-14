import { UserProfile } from '../types/user.types';

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    return {
      id: 'usr_eleanor',
      name: 'Eleanor Vance',
      email: 'eleanor.vance@wetrek.org',
      phone: '+84 912 345 678',
      role: 'customer',
      nationalParkPassNo: 'HLP-89241',
      emergencyContactName: 'Marcus Vance',
      emergencyContactPhone: '+84 987 654 321',
    };
  },

  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    return {
      ...(await usersApi.getProfile()),
      ...profile,
    };
  },
};
