import React from 'react';
import { useLocation, navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { RequireXRole } from '../guard/RequireXRole';
import { GuidePortalLayout } from './GuidePortalLayout';

// Guide Pages
import GuideScheduleListPage from '../../pages/guide/schedules/GuideScheduleListPage';
import GuideTripDetailPage from '../../pages/guide/schedules/GuideTripDetailPage';

import { Compass } from 'lucide-react';

export const GuidePortal: React.FC = () => {
  const { pathname } = useLocation();

  const renderContent = () => {
    // 1. Trip execution detail `/guide/schedules/:scheduleId`
    const scheduleDetailMatch = pathname.match(/^\/guide\/schedules\/(\d+)\/?$/);
    if (scheduleDetailMatch) {
      return (
        <GuideTripDetailPage scheduleIdProp={Number(scheduleDetailMatch[1])} />
      );
    }

    // 2. Assigned schedules list `/guide/schedules` or `/guide`
    if (
      pathname === ROUTES.GUIDE.SCHEDULES ||
      pathname === '/guide/schedules/' ||
      pathname === ROUTES.GUIDE.DASHBOARD ||
      pathname === '/guide/' ||
      pathname === '/guide'
    ) {
      return <GuideScheduleListPage />;
    }

    // Fallback 404 inside Guide Portal
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs font-sans">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Không tìm thấy trang dẫn tour
          </h2>
          <p className="text-xs text-stone-600">
            Đường dẫn{' '}
            <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">
              {pathname}
            </code>{' '}
            không hợp lệ trong Guide Portal.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
            className="px-5 py-2.5 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer"
          >
            Quay lại Lịch được phân công
          </button>
        </div>
      </div>
    );
  };

  return (
    <RequireXRole
      allowedRoles={['GUIDE']}
      fallbackTitle="Yêu cầu vai trò Hướng dẫn viên (Guide)"
      fallbackMessage="Bạn đang cố gắng truy cập Cổng tác nghiệp Hướng dẫn viên nhưng tài khoản hiện tại không có vai trò GUIDE trong hệ thống."
    >
      <GuidePortalLayout>{renderContent()}</GuidePortalLayout>
    </RequireXRole>
  );
};

export default GuidePortal;
