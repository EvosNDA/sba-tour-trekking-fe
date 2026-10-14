import { useState, useEffect } from 'react';
import { UserProfile } from '../types/user.types';
import { usersApi } from '../api/users.api';

export function useUsers() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    usersApi.getProfile().then((data) => {
      setProfile(data);
      setIsLoading(false);
    });
  }, []);

  const updateProfile = async (partial: Partial<UserProfile>) => {
    const updated = await usersApi.updateProfile(partial);
    setProfile(updated);
    return updated;
  };

  return {
    profile,
    isLoading,
    updateProfile,
  };
}
