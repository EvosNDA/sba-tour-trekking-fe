import type { ReactNode } from 'react';
import type { Booking, ExpeditionReview, ScreenId } from '../../types/expedition';
import ProfilePage from '../../pages/customer/profile/ProfilePage';
import MyBookingsPage from '../../pages/customer/my-bookings/MyBookingsPage';
import AccountProfilePage from '../../pages/customer/profile/AccountProfilePage';
import CheckoutPage from '../../pages/customer/checkout/CheckoutPage';

interface CustomerAreaRoutesProps {
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  booking: Booking;
  review: ExpeditionReview;
  onUpdateBooking: (booking: Booking | ((prev: Booking) => Booking)) => void;
  onUpdateReview: (review: ExpeditionReview | ((prev: ExpeditionReview) => ExpeditionReview)) => void;
  onOpenAIRanger: () => void;
}

export function CustomerAreaRoutes({ screen, onNavigate, booking, review, onUpdateBooking, onUpdateReview, onOpenAIRanger }: CustomerAreaRoutesProps): ReactNode {
  switch (screen) {
    case 'account_profile':
      return <AccountProfilePage />;
    case 'eticket':
      return <MyBookingsPage onNavigate={onNavigate} />;
    case 'paybalance':
      return <CheckoutPage booking={booking} onUpdateBooking={onUpdateBooking} onNavigate={onNavigate} onOpenAIRanger={onOpenAIRanger} />;
    case 'review':
      return <ProfilePage review={review} onUpdateReview={onUpdateReview} onNavigate={onNavigate} />;
    default:
      return null;
  }
}
