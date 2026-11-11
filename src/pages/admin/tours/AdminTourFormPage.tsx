import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourDetailResponse } from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { TourAdminForm } from '../../../features/tours/components/TourAdminForm';
import { TourCreateForm } from '../../../features/tours/components/TourCreateForm';
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
  const { pathname, search } = useLocation();
  const duplicateIdValue = Number(new URLSearchParams(search).get('duplicate'));
  const duplicateTourId = Number.isFinite(duplicateIdValue) && duplicateIdValue > 0 ? duplicateIdValue : null;

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
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(mode === 'edit' || duplicateTourId !== null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  const fetchExistingTour = useCallback(async () => {
    const sourceId = mode === 'edit' ? resolvedTourId : duplicateTourId;
    if (!sourceId) {
      setIsLoadingDetail(false);
      return;
    }

    setIsLoadingDetail(true);
    setLoadError(null);
    try {
      const detail = await toursApi.getTourDetail(sourceId);
      setTourDetail(mode === 'edit' ? detail : { ...detail, id: 0, title: `${detail.title} (Bản sao)`, status: 'DRAFT', media: [] });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(
            mode === 'edit' && resolvedTourId ? ROUTES.ADMIN.TOUR_EDIT(resolvedTourId) : `${ROUTES.ADMIN.TOUR_NEW}?duplicate=${sourceId}`
          )}`,
          { replace: true }
        );
        return;
      }
      setLoadError(apiErr);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [mode, resolvedTourId, duplicateTourId]);

  useEffect(() => {
    fetchExistingTour();
  }, [fetchExistingTour]);

  return (
    <AdminAccessGuard forbiddenError={loadError?.status === 403}>
      <div className="min-h-full bg-transparent px-4 py-6 text-[#172033] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-5">
          {/* Top Breadcrumb */}
          {mode === 'edit' && <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  mode === 'edit' && resolvedTourId
                    ? ROUTES.ADMIN.TOUR_DETAIL(resolvedTourId)
                    : ROUTES.ADMIN.TOURS
                )
              }
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-600 hover:text-[#0B7058] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại chi tiết tour</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider text-[#0B7058] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
              <span>Chỉnh sửa</span>
            </span>
          </div>}

          {/* Header Card */}
          {mode === 'edit' && <div className="rounded-xl border border-[#d5ddd3] bg-white p-6">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#172033]">
              {`Chỉnh sửa Tour: ${tourDetail?.title || 'tour'}`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Cập nhật toàn bộ thông tin chi tiết và trạng thái xuất bản của tour.
            </p>
          </div>}

          {/* Content Area */}
          {isLoadingDetail ? (
            <div className="bg-white rounded-2xl border border-[#E0E6EE] p-8 space-y-5 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-11 bg-slate-200 rounded-xl w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-11 bg-slate-200 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-32 bg-slate-200 rounded-xl w-full" />
              <div className="h-24 bg-slate-200 rounded-xl w-full" />
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
                <h2 className="text-lg font-bold text-slate-900">
                  Không thể tải dữ liệu tour để chỉnh sửa
                </h2>
                <p className="text-sm sm:text-base text-slate-600">{loadError.message}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={fetchExistingTour}
                  className="px-5 py-2.5 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Về danh sách
                </button>
              </div>
            </div>
          ) : (
            mode === 'create' ? (
              <TourCreateForm
                initialData={tourDetail}
                onCancel={() => navigateTo(ROUTES.ADMIN.TOURS)}
                onCreated={(tourId) => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(tourId))}
              />
            ) : (
              <TourAdminForm
                mode="edit"
                initialData={tourDetail}
                onCancel={() =>
                navigateTo(
                  resolvedTourId ? ROUTES.ADMIN.TOUR_DETAIL(resolvedTourId) : ROUTES.ADMIN.TOURS
                )
              }
              />
            )
          )}
        </div>
      </div>
    </AdminAccessGuard>
  );
};

export default AdminTourFormPage;
