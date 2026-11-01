import React from 'react';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { RequireXRole } from '../guard/RequireXRole';
import { AdminPortalLayout } from './AdminPortalLayout';

// Admin pages
import AdminTourListPage from '../../pages/admin/tours/AdminTourListPage';
import AdminTourFormPage from '../../pages/admin/tours/AdminTourFormPage';
import AdminTourDetailPage from '../../pages/admin/tours/AdminTourDetailPage';
import AdminScheduleListPage from '../../pages/admin/schedules/AdminScheduleListPage';
import AdminPoliciesPage from '../../pages/admin/policies/AdminPoliciesPage';
import AdminEquipmentPage from '../../pages/admin/equipment/AdminEquipmentPage';
import AdminBookingListPage from '../../pages/admin/bookings/AdminBookingListPage';

import { ShieldCheck, Compass } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { pathname } = useLocation();

  const renderContent = () => {
    if (pathname === ROUTES.ADMIN.POLICIES || pathname === '/admin/policies/') return <AdminPoliciesPage />;

    // Equipment & Combos `/admin/equipment`
    if (pathname === ROUTES.ADMIN.EQUIPMENT || pathname.startsWith('/admin/equipment')) {
      return <AdminEquipmentPage />;
    }

    // Bookings search `/admin/bookings`
    if (pathname === ROUTES.ADMIN.BOOKINGS || pathname === '/admin/bookings/') {
      return <AdminBookingListPage />;
    }

    // 1. Tours list `/admin/tours`
    if (pathname === ROUTES.ADMIN.TOURS || pathname === '/admin/tours/') {
      return <AdminTourListPage />;
    }

    // 2. Schedules list `/admin/schedules`
    if (pathname === ROUTES.ADMIN.SCHEDULES || pathname === '/admin/schedules/') {
      return <AdminScheduleListPage />;
    }

    // 2. Create tour `/admin/tours/new`
    if (pathname === ROUTES.ADMIN.TOUR_NEW || pathname === '/admin/tours/new/') {
      return <AdminTourFormPage mode="create" />;
    }

    // 3. Edit tour `/admin/tours/:tourId/edit`
    const editMatch = pathname.match(/^\/admin\/tours\/(\d+)\/edit\/?$/);
    if (editMatch) {
      return <AdminTourFormPage mode="edit" tourIdProp={Number(editMatch[1])} />;
    }

    // 4. Tour detail `/admin/tours/:tourId`
    const detailMatch = pathname.match(/^\/admin\/tours\/(\d+)\/?$/);
    if (detailMatch) {
      return <AdminTourDetailPage tourIdProp={Number(detailMatch[1])} />;
    }

    if (pathname === ROUTES.ADMIN.DASHBOARD || pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/dashboard/') {
      return <AdminTourListPage />;
    }

    // Fallback 404 inside Admin Portal
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Không tìm thấy trang quản trị</h2>
          <p className="text-xs text-stone-600">
            Đường dẫn <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">{pathname}</code> không hợp lệ trong Admin Portal.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
            className="px-5 py-2.5 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer"
          >
            Quay lại Quản trị Tour
          </button>
        </div>
      </div>
    );
  };

  return (
    <RequireXRole
      allowedRoles={['ADMIN']}
      fallbackTitle="Yêu cầu quyền quản trị viên"
      fallbackMessage="Bạn đang cố gắng truy cập Admin Portal nhưng tài khoản hiện tại không có vai trò ADMIN."
    >
      <AdminPortalLayout>{renderContent()}</AdminPortalLayout>
    </RequireXRole>
  );
};

export default AdminPortal;
