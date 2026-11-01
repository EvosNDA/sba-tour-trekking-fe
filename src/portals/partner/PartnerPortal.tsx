import React from 'react';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { RequireXRole } from '../guard/RequireXRole';
import { PartnerPortalLayout } from './PartnerPortalLayout';

// Partner pages
import PartnerDashboardPage from '../../pages/partner/dashboard/PartnerDashboardPage';
import PartnerTourManagementPage from '../../pages/partner/tour-management/PartnerTourManagementPage';
import PartnerBookingManagementPage from '../../pages/partner/booking-management/PartnerBookingManagementPage';
import PartnerFinalReviewPage from '../../pages/partner/final-review/PartnerFinalReviewPage';

import { Compass } from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const { pathname } = useLocation();

  const renderContent = () => {
    if (
      pathname === ROUTES.PARTNER.COMPANY_INFO ||
      pathname === ROUTES.PARTNER.DASHBOARD ||
      pathname === '/partner' ||
      pathname === '/partner/'
    ) {
      return <PartnerDashboardPage />;
    }

    if (
      pathname === ROUTES.PARTNER.CERTIFICATES ||
      pathname === ROUTES.PARTNER.TOUR_MANAGEMENT
    ) {
      return <PartnerTourManagementPage />;
    }

    if (
      pathname === ROUTES.PARTNER.PAYOUTS ||
      pathname === ROUTES.PARTNER.BOOKING_MANAGEMENT
    ) {
      return <PartnerBookingManagementPage />;
    }

    if (pathname === '/partner/final-review' || pathname === '/partner/final-review/') {
      return <PartnerFinalReviewPage />;
    }

    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Không tìm thấy trang đối tác</h2>
          <p className="text-xs text-stone-600">
            Đường dẫn <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">{pathname}</code> không hợp lệ trong Partner Portal.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PARTNER.DASHBOARD)}
            className="px-5 py-2.5 rounded-xl bg-[#C2410C] text-white text-xs font-semibold cursor-pointer"
          >
            Quay lại Partner Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <RequireXRole
      allowedRoles={['PARTNER', 'GUIDE', 'ADMIN']}
      fallbackTitle="Yêu cầu quyền Đối tác (PARTNER / GUIDE)"
      fallbackMessage="Bạn đang cố gắng truy cập Partner Portal nhưng tài khoản hiện tại không có vai trò PARTNER hoặc GUIDE."
    >
      <PartnerPortalLayout>{renderContent()}</PartnerPortalLayout>
    </RequireXRole>
  );
};

export default PartnerPortal;
