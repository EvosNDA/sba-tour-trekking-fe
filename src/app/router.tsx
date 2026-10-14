import React from 'react';
import { ScreenId, Booking, ExpeditionReview, Tour } from '../types/expedition';

// Public pages
import HomePage from '../pages/public/home/HomePage';
import TourListPage from '../pages/public/tour-list/TourListPage';
import TourDetailPage from '../pages/public/tour-detail/TourDetailPage';

// Auth pages
import LoginPage from '../pages/auth/login/LoginPage';
import RegisterPage from '../pages/auth/register/RegisterPage';

// Customer pages
import ProfilePage from '../pages/customer/profile/ProfilePage';
import MyBookingsPage from '../pages/customer/my-bookings/MyBookingsPage';
import CheckoutPage from '../pages/customer/checkout/CheckoutPage';

// Partner pages
import PartnerDashboardPage from '../pages/partner/dashboard/PartnerDashboardPage';
import PartnerTourManagementPage from '../pages/partner/tour-management/PartnerTourManagementPage';
import PartnerBookingManagementPage from '../pages/partner/booking-management/PartnerBookingManagementPage';

// Admin pages
import AdminDashboardPage from '../pages/admin/dashboard/AdminDashboardPage';
import AdminUserManagementPage from '../pages/admin/user-management/AdminUserManagementPage';
import AdminPartnerManagementPage from '../pages/admin/partner-management/AdminPartnerManagementPage';

// Layout & Switcher
import PartnerFinalReviewPage from '../pages/partner/final-review/PartnerFinalReviewPage';

export interface AppRouterProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  booking: Booking;
  review: ExpeditionReview;
  onUpdateBooking: (booking: Booking | ((prev: Booking) => Booking)) => void;
  onUpdateReview: (review: ExpeditionReview | ((prev: ExpeditionReview) => ExpeditionReview)) => void;
  onBookTour: (tour: Tour) => void;
  onLoginSuccess: (email: string) => void;
  onRegistrationSuccess: (userData: { name: string; email: string; phone: string }) => void;
  onOpenAIRanger: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentScreen,
  onNavigate,
  booking,
  review,
  onUpdateBooking,
  onUpdateReview,
  onBookTour,
  onLoginSuccess,
  onRegistrationSuccess,
  onOpenAIRanger,
}) => {
  switch (currentScreen) {
    case 'marketplace':
      return <HomePage onBookTour={onBookTour} onNavigate={onNavigate} />;

    case 'login':
      return <LoginPage onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;

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

    case 'partner_certificates':
      return <PartnerTourManagementPage onNavigate={onNavigate} />;

    case 'partner_bank_payouts':
      return <PartnerBookingManagementPage onNavigate={onNavigate} />;

    case 'partner_final_review':
      return <PartnerFinalReviewPage onNavigate={onNavigate} />;

    case 'ops_moderation':
      return <AdminDashboardPage onNavigate={onNavigate} />;

    case 'staff_escalations':
      return <AdminUserManagementPage onNavigate={onNavigate} />;

    case 'platform_analytics':
      return <AdminPartnerManagementPage onNavigate={onNavigate} />;

    default:
      return <HomePage onBookTour={onBookTour} onNavigate={onNavigate} />;
  }
};
