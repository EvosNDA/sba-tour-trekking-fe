import React from 'react';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { RequireXRole } from '../guard/RequireXRole';
import { CustomerPortalLayout } from './CustomerPortalLayout';

// Customer pages
import BookingWizardPage from '../../pages/customer/booking/BookingWizardPage';
import BookingDetailPage from '../../pages/customer/booking/BookingDetailPage';
import MyBookingsPage from '../../pages/customer/my-bookings/MyBookingsPage';
import { ProfilePage } from '../../pages/customer/profile/ProfilePage';
import { CheckoutPage } from '../../pages/customer/checkout/CheckoutPage';

import { Compass, Ticket } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { pathname } = useLocation();

  const renderContent = () => {
    // 1. Booking Wizard `/booking/new`
    if (pathname === ROUTES.BOOKING.NEW || pathname === '/booking/new/') {
      return <BookingWizardPage />;
    }

    // 2. Booking Detail `/booking/:bookingId`
    const bookingDetailMatch = pathname.match(/^\/booking\/(\d+)\/?$/);
    if (bookingDetailMatch) {
      const bookingId = Number(bookingDetailMatch[1]);
      return <BookingDetailPage bookingIdProp={bookingId} />;
    }

    // 3. Payment callbacks from PayOS (`/payment/result`, `/payment/cancel`, `/payment/...`)
    if (
      pathname === ROUTES.BOOKING.PAYMENT_RESULT ||
      pathname === ROUTES.BOOKING.PAYMENT_CANCEL ||
      pathname.startsWith('/payment/')
    ) {
      return <BookingDetailPage />;
    }

    // 4. My Bookings list `/account/bookings` or `/customer/bookings`
    if (
      pathname === ROUTES.ACCOUNT.BOOKINGS ||
      pathname === '/account/bookings/' ||
      pathname === '/customer/bookings' ||
      pathname === '/customer/my-bookings'
    ) {
      return <MyBookingsPage />;
    }

    // 5. Customer Profile `/customer/profile` or `/account/profile`
    if (
      pathname === ROUTES.CUSTOMER.PROFILE ||
      pathname === '/customer/profile/' ||
      pathname === '/account/profile' ||
      pathname === '/account/profile/'
    ) {
      return <ProfilePage />;
    }

    // 6. Checkout Page fallback
    if (pathname === '/customer/checkout' || pathname === ROUTES.CUSTOMER.CHECKOUT) {
      return <CheckoutPage />;
    }

    // Fallback within Customer Portal
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Không tìm thấy trang đặt chỗ</h2>
          <p className="text-xs text-stone-600">
            Đường dẫn <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">{pathname}</code> không hợp lệ trong Customer Portal.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
              className="px-4 py-2.5 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Đặt chỗ của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer hover:bg-stone-50"
            >
              Khám phá tour
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <RequireXRole
      allowedRoles={['CUSTOMER', 'PARTNER', 'GUIDE', 'ADMIN']}
      fallbackTitle="Yêu cầu đăng nhập tài khoản Trekker"
      fallbackMessage="Vui lòng đăng nhập để quản lý lịch đặt chỗ và xem thông tin thanh toán chuyến đi."
    >
      <CustomerPortalLayout>{renderContent()}</CustomerPortalLayout>
    </RequireXRole>
  );
};

export default CustomerPortal;
