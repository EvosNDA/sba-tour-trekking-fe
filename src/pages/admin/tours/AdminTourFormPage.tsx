import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourDetailResponse } from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { TourAdminForm } from '../../../features/tours/components/TourAdminForm';
import { useLocation, navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

export interface AdminTourFormPageProps {
  mode?: 'create' | 'edit';
  tourIdProp?: number;
}

export const AdminTourFormPage: React.FC<AdminTourFormPageProps> = ({
  mode: propMode,
  tourIdProp,
}) => {
  const { pathname } = useLocation();

  const resolvedTourId = React.useMemo(() => {
    if (tourIdProp && Number.isFinite(tourIdProp)) return tourIdProp;
    const match = pathname.match(/^\/admin\/tours\/(\d+)\/edit/);
    if (match) return Number(match[1]);
    return null;
  }, [tourIdProp, pathname]);

  const mode: 'create' | 'edit' = propMode
    ? propMode
    : resolvedTourId !== null
    ? 'edit'
    : 'create';

  const [tourDetail, setTourDetail] = useState<TourDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(mode === 'edit');
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  const fetchExistingTour = useCallback(async () => {
    if (mode !== 'edit' || !resolvedTourId) {
      setIsLoadingDetail(false);
      return;
    }

    setIsLoadingDetail(true);
    setLoadError(null);
    try {
      const detail = await toursApi.getTourDetail(resolvedTourId);
      setTourDetail(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(
            ROUTES.ADMIN.TOUR_EDIT(resolvedTourId)
          )}`,
          { replace: true }
        );
        return;
      }
      setLoadError(apiErr);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [mode, resolvedTourId]);

  useEffect(() => {
    fetchExistingTour();
  }, [fetchExistingTour]);

  return (
    <AdminAccessGuard forbiddenError={loadError?.status === 403}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  mode === 'edit' && resolvedTourId
                    ? ROUTES.ADMIN.TOUR_DETAIL(resolvedTourId)
                    : ROUTES.ADMIN.TOURS
                )
              }
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-stone-600 hover:text-[#1F4E43] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {mode === 'edit' ? 'Quay lại chi tiết tour' : 'Quay lại danh sách tour'}
              </span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider text-[#1F4E43] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
              <span>{mode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}</span>
            </span>
          </div>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
              {mode === 'create'
                ? 'Tạo Tour Trekking Mới'
                : `Chỉnh sửa Tour: ${tourDetail?.title || 'tour'}`}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1">
              {mode === 'create'
                ? 'Điền đầy đủ các thông tin cung đường để khởi tạo tour mới trên hệ thống.'
                : 'Cập nhật toàn bộ thông tin chi tiết và trạng thái xuất bản của tour.'}
            </p>
          </div>

          {/* Content Area */}
          {isLoadingDetail ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-8 space-y-5 animate-pulse">
              <div className="h-6 bg-stone-200 rounded w-1/3" />
              <div className="h-11 bg-stone-200 rounded-xl w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-11 bg-stone-200 rounded-xl" />
                <div className="h-11 bg-stone-200 rounded-xl" />
                <div className="h-11 bg-stone-200 rounded-xl" />
              </div>
              <div className="h-32 bg-stone-200 rounded-xl w-full" />
              <div className="h-24 bg-stone-200 rounded-xl w-full" />
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="text-lg font-bold text-stone-900">
                  Không thể tải dữ liệu tour để chỉnh sửa
                </h2>
                <p className="text-sm sm:text-base text-stone-600">{loadError.message}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={fetchExistingTour}
                  className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Về danh sách
                </button>
              </div>
            </div>
          ) : (
            <TourAdminForm
              mode={mode}
              initialData={tourDetail}
              onCancel={() =>
                navigateTo(
                  mode === 'edit' && resolvedTourId
                    ? ROUTES.ADMIN.TOUR_DETAIL(resolvedTourId)
                    : ROUTES.ADMIN.TOURS
                )
              }
            />
          )}
        </div>
      </div>
    </AdminAccessGuard>
  );
};

export default AdminTourFormPage;
