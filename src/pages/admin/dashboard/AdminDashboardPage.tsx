import React from 'react';
import { ScreenId } from '../../../types/expedition';
import { TourModerationQueue } from '../../../features/tours/components/TourModerationQueue';

export interface AdminDashboardPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

/** Kept as a compatibility page; moderation data and actions are server-backed. */
export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => <TourModerationQueue />;

export default AdminDashboardPage;
