import React from 'react';
import { ScreenId, Booking, ExpeditionReview } from '../types/expedition';

// Public pages
import HomePage from '../pages/public/home/HomePage';
import TourListPage from '../pages/public/tour-list/TourListPage';
import TourDetailPage from '../pages/public/tour-detail/TourDetailPage';

// Auth pages
import LoginPage from '../pages/auth/login/LoginPage';
import RegisterPage from '../pages/auth/register/RegisterPage';
import PartnerActivationHelpPage from '../pages/auth/PartnerActivationHelpPage';
import PartnerApplicationSubmittedPage from '../pages/auth/PartnerApplicationSubmittedPage';

// Customer pages
import ProfilePage from '../pages/customer/profile/ProfilePage';
import MyBookingsPage from '../pages/customer/my-bookings/MyBookingsPage';
import AccountProfilePage from '../pages/customer/profile/AccountProfilePage';
import CheckoutPage from '../pages/customer/checkout/CheckoutPage';

// Partner pages
import PartnerDashboardPage from '../pages/partner/dashboard/PartnerDashboardPage';
import PartnerTourManagementPage from '../pages/partner/tour-management/PartnerTourManagementPage';
import PartnerBookingManagementPage from '../pages/partner/booking-management/PartnerBookingManagementPage';
import PartnerActivationPage from '../pages/partner/dashboard/PartnerActivationPage';
import PartnerApplicationStatusPage from '../pages/partner/dashboard/PartnerApplicationStatusPage';
import PartnerApplicationQueue from '../features/partners/components/PartnerApplicationQueue';

// Admin pages
import TourModerationQueue from '../features/tours/components/TourModerationQueue';

// Layout & Switcher
import PartnerFinalReviewPage from '../pages/partner/final-review/PartnerFinalReviewPage';

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
  switch (currentScreen) {
    case 'account_profile':
      return <AccountProfilePage />;
    case 'marketplace':
      return <HomePage onNavigate={onNavigate} searchTerm={searchTerm} onSearch={onSearch} />;

    case 'login':
      return <LoginPage onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;

    case 'partner_activation_help':
      return <PartnerActivationHelpPage onNavigate={onNavigate} />;

    case 'partner_application_submitted':
      return <PartnerApplicationSubmittedPage onNavigate={onNavigate} />;

    case 'registration':
      return <RegisterPage onSuccess={onRegistrationSuccess} onNavigate={onNavigate} />;

    case 'eticket':
      return (
        <MyBookingsPage
          booking={booking}
          onUpdateBooking={onUpdateBooking}
          onNavigate={onNavigate}
          onOpenAIRanger={onOpenAIRanger}
        />
      );

    case 'paybalance':
      return (
        <CheckoutPage
          booking={booking}
          onUpdateBooking={onUpdateBooking}
          onNavigate={onNavigate}
          onOpenAIRanger={onOpenAIRanger}
        />
      );

    case 'review':
      return (
        <ProfilePage
          review={review}
          onUpdateReview={onUpdateReview}
          onNavigate={onNavigate}
        />
      );

    case 'partner_company_info':
      return <PartnerDashboardPage onNavigate={onNavigate} />;

    case 'partner_activate':
      return <PartnerActivationPage onNavigate={onNavigate} />;

    case 'partner_application_status':
      return <PartnerApplicationStatusPage onNavigate={onNavigate} />;

    case 'partner_certificates':
      return <PartnerTourManagementPage />;

    case 'partner_bank_payouts':
      return <PartnerBookingManagementPage onNavigate={onNavigate} />;

    case 'partner_final_review':
      return <PartnerFinalReviewPage onNavigate={onNavigate} />;

    case 'ops_moderation':
      return <div className="space-y-8"><PartnerApplicationQueue /><TourModerationQueue /></div>;

    case 'staff_escalations':
      return <HomePage onNavigate={onNavigate} />;

    case 'platform_analytics':
      return <HomePage onNavigate={onNavigate} />;

    default:
      return <HomePage onNavigate={onNavigate} searchTerm={searchTerm} onSearch={onSearch} />;
  }
};
