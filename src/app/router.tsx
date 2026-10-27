import React from 'react';
import { ScreenId, Booking, ExpeditionReview } from '../types/expedition';

// Public pages
import HomePage from '../pages/public/home/HomePage';
import CustomerPaymentResultPage from '../pages/public/tour-detail/CustomerPaymentResultPage';

// Auth pages
import LoginPage from '../pages/auth/login/LoginPage';
import RegisterPage from '../pages/auth/register/RegisterPage';
import ActivateInvitedAccountPage from '../pages/auth/ActivateInvitedAccountPage';

// Admin pages
import { AdminAreaRoutes } from '../features/admin/AdminAreaRoutes';
import { StaffAreaRoutes } from '../features/staff/StaffAreaRoutes';
import { GuideAreaRoutes } from '../features/guides/GuideAreaRoutes';
import { CustomerAreaRoutes } from '../features/customer/CustomerAreaRoutes';

export interface AppRouterProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  booking: Booking;
  review: ExpeditionReview;
  onUpdateBooking: (booking: Booking | ((prev: Booking) => Booking)) => void;
  onUpdateReview: (review: ExpeditionReview | ((prev: ExpeditionReview) => ExpeditionReview)) => void;
  onLoginSuccess: (email: string) => void;
  onRegistrationSuccess: (userData: { name: string; email: string; phone: string }) => void;
  onOpenAIRanger: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentScreen,
  onNavigate,
  searchTerm,
  onSearch,
  booking,
  review,
  onUpdateBooking,
  onUpdateReview,
  onLoginSuccess,
  onRegistrationSuccess,
  onOpenAIRanger,
}) => {
  if (['admin_home', 'admin_accounts', 'admin_tours'].includes(currentScreen)) {
    return <AdminAreaRoutes screen={currentScreen} onNavigate={onNavigate} />;
  }
  if (currentScreen === 'staff_home') return <StaffAreaRoutes screen={currentScreen} onNavigate={onNavigate} />;
  if (currentScreen === 'guide_home') return <GuideAreaRoutes screen={currentScreen} onNavigate={onNavigate} />;
  if (['account_profile', 'eticket', 'paybalance', 'review'].includes(currentScreen)) {
    return <CustomerAreaRoutes screen={currentScreen} onNavigate={onNavigate} booking={booking} review={review} onUpdateBooking={onUpdateBooking} onUpdateReview={onUpdateReview} onOpenAIRanger={onOpenAIRanger} />;
  }
  switch (currentScreen) {
    case 'booking_payment_result':
      return <CustomerPaymentResultPage onNavigate={onNavigate} />;
    case 'marketplace':
      return <HomePage onNavigate={onNavigate} searchTerm={searchTerm} onSearch={onSearch} />;

    case 'login':
      return <LoginPage onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;

    case 'registration':
      return <RegisterPage onSuccess={onRegistrationSuccess} onNavigate={onNavigate} />;

    case 'account_activation':
      return <ActivateInvitedAccountPage onNavigate={onNavigate} />;

    default:
      return <HomePage onNavigate={onNavigate} searchTerm={searchTerm} onSearch={onSearch} />;
  }
};
