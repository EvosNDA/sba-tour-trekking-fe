import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Link2,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Star,
  FileText,
  UploadCloud,
  Plus,
  Loader2,
  Users,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { apiClient } from '../../../lib/axios';
import type {
  TourDetailResponse,
  ScheduleSummaryResponse,
} from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { TourDeleteModal } from '../../../features/tours/components/TourDeleteModal';
import { TourItineraryEditor } from '../../../features/tours/components/TourItineraryEditor';
import { TourTermsEditor } from '../../../features/tours/components/TourTermsEditor';
import { TourEquipmentEditor } from '../../../features/tours/components/TourEquipmentEditor';
import { CreateScheduleModal } from '../../../features/tours/components/CreateScheduleModal';
import { TourPublishModal } from '../../../features/tours/components/TourPublishModal';
import { useLocation, navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';
import { formatDateTime, formatVND, isFileNameOrPath } from '../../../lib/utils';

export interface AdminTourDetailPageProps {
  tourIdProp?: number;
}

export const AdminTourDetailPage: React.FC<AdminTourDetailPageProps> = ({ tourIdProp }) => {
  const { pathname } = useLocation();

  const resolvedTourId = React.useMemo(() => {
    if (tourIdProp && Number.isFinite(tourIdProp)) return tourIdProp;
    const match = pathname.match(/^\/admin\/tours\/(\d+)\/?$/);
    if (match) return Number(match[1]);
    return null;
  }, [tourIdProp, pathname]);

  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulePage, setSchedulePage] = useState(0);
  const [scheduleTotalPages, setScheduleTotalPages] = useState(0);
  const [scheduleTotal, setScheduleTotal] = useState(0);
  const [scheduleError, setScheduleError] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSummaryResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(true);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [mediaActionId, setMediaActionId] = useState<number | null>(null);

  const fetchTourDetail = useCallback(async () => {
    if (!resolvedTourId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const detail = await toursApi.getTourDetail(resolvedTourId);
      setTour(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(
            ROUTES.ADMIN.TOUR_DETAIL(resolvedTourId)
          )}`,
          { replace: true }
        );
        return;
      }
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedTourId]);

  const fetchSchedules = useCallback(async () => {
    if (!resolvedTourId) return;
    setIsLoadingSchedules(true);
    setScheduleError('');
    try {
      const res = await toursApi.getTourSchedules(resolvedTourId, {
        page: schedulePage,
        size: 10,
        upcomingOnly: false,
      });
      setSchedules(res.content || []);
      setScheduleTotalPages(res.totalPages || 0);
      setScheduleTotal(res.totalElements || 0);
    } catch {
      setScheduleError('Không thể tải lịch khởi hành. Vui lòng thử lại.');
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [resolvedTourId, schedulePage]);

  useEffect(() => {
    fetchTourDetail();
    fetchSchedules();
  }, [fetchTourDetail, fetchSchedules]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !tour) return;
    setIsUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await toursApi.uploadTourMedia(tour.id, files[i], files[i].name);
      }
      toast.success('Đã tải ảnh lên hệ thống lưu trữ thành công!');
      await fetchTourDetail();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải ảnh lên.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSetCover = async (mediaId: number) => {
    if (!tour) return;
    setMediaActionId(mediaId);
    try {
      await toursApi.setCoverMedia(tour.id, mediaId);
      toast.success('Đã đặt làm ảnh bìa chính!');
      await fetchTourDetail();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đặt ảnh bìa.');
    } finally {
      setMediaActionId(null);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!tour || !window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi tour?')) return;
    setMediaActionId(mediaId);
    try {
      await toursApi.deleteTourMedia(tour.id, mediaId);
      toast.success('Đã xóa ảnh thành công.');
      await fetchTourDetail();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa ảnh.');
    } finally {
      setMediaActionId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tour) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await toursApi.deleteTour(tour.id);
      toast.success(`Đã xóa tour "${tour.title}" thành công.`);
      setIsDeleteModalOpen(false);
      navigateTo(ROUTES.ADMIN.TOURS, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        navigateTo(
          `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(
            ROUTES.ADMIN.TOUR_DETAIL(tour.id)
          )}`,
          { replace: true }
        );
        return;
      }
      setDeleteError(apiErr);
      toast.error(apiErr.message || 'Không thể xóa tour.');
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedMedia = React.useMemo(() => {
    if (!tour?.media) return [];
    return [...tour.media].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [tour?.media]);

  return (
    <AdminAccessGuard forbiddenError={error?.status === 403}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#1F4E43] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách tour</span>
            </button>

            {tour && (
              <div className="flex flex-wrap items-center gap-2.5">
                {tour.status === 'DRAFT' && <button type="button" onClick={() => setPublishOpen(true)} className="rounded-xl bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white">Xuất bản</button>}
                <button
                  type="button"
                  onClick={fetchTourDetail}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOUR_EDIT(tour.id))}
                  className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa tour</span>
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-36 bg-white rounded-2xl border border-stone-200 p-6" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-stone-200" />
                <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-stone-200" />
              </div>
            </div>
          ) : error || !tour ? (
            <div
              role="alert"
              className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h1 className="font-editorial text-2xl font-bold text-[#1C2526]">
                  {error?.status === 404
                    ? 'Không tìm thấy tour này'
                    : 'Không thể tải thông tin chi tiết tour'}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600">
                  {error?.message || 'Tour không tồn tại hoặc đã bị xóa khỏi hệ thống.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchTourDetail}
                  className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header Overview Card */}
              <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 sm:p-8 shadow-2xs space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
                  <div className="space-y-1.5">
                    <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C2526]">
                      {tour.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tourStatus={tour.status} />
                    <StatusBadge difficulty={tour.difficulty} />
                  </div>
                </div>

                {/* Key Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E6E1D8]/80 flex flex-col justify-between">
                    <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1.5">
                      Trạng thái
                    </span>
                    <div>
                      <StatusBadge tourStatus={tour.status} size="sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E6E1D8]/80 flex flex-col justify-between">
                    <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1.5">
                      Độ khó
                    </span>
                    <div>
                      <StatusBadge difficulty={tour.difficulty} size="sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E6E1D8]/80 flex flex-col justify-between">
                    <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1.5">
                      Thời lượng
                    </span>
                    <strong className="font-mono text-stone-900 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                      <span>{tour.durationDays} ngày</span>
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E6E1D8]/80 flex flex-col justify-between">
                    <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1.5">
                      Số lượng media
                    </span>
                    <strong className="font-mono text-stone-900">
                      {sortedMedia.length} tệp đính kèm
                    </strong>
                  </div>
                </div>
              </div>

              <TourItineraryEditor tourId={tour.id} durationDays={tour.durationDays} />
              <TourTermsEditor tourId={tour.id} cancellationId={tour.cancellationPolicyVersionId} status={tour.status} onUpdated={fetchTourDetail} />
              <TourEquipmentEditor tourId={tour.id} />

              {/* Detail Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Columns: Description, Experience, Services, Route File */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Description */}
                  <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-3">
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2 border-b border-stone-200 pb-3">
                      <FileText className="w-4 h-4 text-[#1F4E43]" />
                      <span>Giới thiệu tour</span>
                    </h2>
                    {tour.description ? (
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                        {tour.description}
                      </p>
                    ) : (
                      <p className="text-xs italic text-stone-400">Chưa có mô tả chi tiết.</p>
                    )}
                  </div>

                  {/* Required Experience */}
                  <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-3">
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2 border-b border-stone-200 pb-3">
                      <Award className="w-4 h-4 text-[#C2410C]" />
                      <span>Yêu cầu kinh nghiệm & thể lực</span>
                    </h2>
                    {tour.requiredExperience ? (
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                        {tour.requiredExperience}
                      </p>
                    ) : (
                      <p className="text-xs italic text-stone-400">
                        Chưa cập nhật yêu cầu kinh nghiệm.
                      </p>
                    )}
                  </div>

                  {/* Included & Excluded Services */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-3">
                      <h2 className="text-sm font-bold text-[#1C2526] flex items-center gap-2 border-b border-stone-200 pb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Dịch vụ bao gồm</span>
                      </h2>
                      {tour.includedServices ? (
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                          {tour.includedServices}
                        </p>
                      ) : (
                        <p className="text-xs italic text-stone-400">Chưa cập nhật.</p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-3">
                      <h2 className="text-sm font-bold text-[#1C2526] flex items-center gap-2 border-b border-stone-200 pb-3">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Dịch vụ không bao gồm</span>
                      </h2>
                      {tour.excludedServices ? (
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                          {tour.excludedServices}
                        </p>
                      ) : (
                        <p className="text-xs italic text-stone-400">Chưa cập nhật.</p>
                      )}
                    </div>
                  </div>

                  {/* Route File URL */}
                  <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-3">
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2 border-b border-stone-200 pb-3">
                      <Link2 className="w-4 h-4 text-[#1F4E43]" />
                      <span>Đường dẫn tệp bản đồ / cung đường GPS</span>
                    </h2>
                    {tour.routeFileUrl ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FDFBF7] border border-stone-200">
                        <span className="font-mono text-xs text-stone-700 break-all">
                          {tour.routeFileUrl}
                        </span>
                        <a
                          href={tour.routeFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold shrink-0 transition-colors"
                        >
                          <span>Mở liên kết</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs italic text-stone-400">
                        Chưa đính kèm URL file cung đường.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right 5 Columns: Media List */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#C2410C]" />
                      <span>Hình ảnh tour ({sortedMedia.length})</span>
                    </h2>

                    {/* Upload new photo input button */}
                    <label className={`px-3 py-1.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                      isUploadingMedia ? 'opacity-60 cursor-not-allowed' : ''
                    }`}>
                      {isUploadingMedia ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B9EADB]" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm ảnh</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingMedia}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {sortedMedia.length === 0 ? (
                    <div className="py-10 text-center space-y-2 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                      <ImageIcon className="w-7 h-7 text-stone-400 mx-auto" />
                      <p className="text-xs text-stone-500">
                        Tour này hiện chưa có hình ảnh nào. Bạn có thể bấm "Thêm ảnh" ở trên để tải ảnh lên.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedMedia.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-stone-200 overflow-hidden bg-[#FDFBF7]"
                        >
                          <div className="aspect-video bg-stone-900 relative overflow-hidden flex items-center justify-center">
                            {m.mediaType === 'VIDEO' ? (
                              <video
                                src={m.url}
                                controls
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={m.url}
                                alt={!isFileNameOrPath(m.caption) ? m.caption! : tour.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            )}

                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              {m.isCover && (
                                <span className="px-2 py-0.5 rounded-md bg-[#C2410C] text-white font-mono text-[10px] font-bold inline-flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  Ảnh bìa
                                </span>
                              )}
                            </div>

                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px]">
                              Thứ tự: {m.displayOrder}
                            </span>
                          </div>

                          <div className="p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between text-stone-500 font-mono text-[11px]">
                              
                              <div className="flex items-center gap-2">
                                {!m.isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetCover(m.id)}
                                    disabled={mediaActionId === m.id}
                                    className="text-[#C2410C] hover:underline font-semibold cursor-pointer text-xs"
                                  >
                                    Đặt làm ảnh bìa
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedia(m.id)}
                                  disabled={mediaActionId === m.id}
                                  className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                                  title="Xóa ảnh này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {m.caption && !isFileNameOrPath(m.caption) && (
                              <p className="text-stone-800 font-medium">{m.caption}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Departure Schedules List */}
              <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1C2526] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1F4E43]" />
                      <span>Danh sách lịch khởi hành của tour ({scheduleTotal})</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Các đợt xuất phát đã được lên lịch và mở đặt chỗ cho chuyến đi này.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setScheduleOpen(true)} className="px-3.5 py-2 rounded-xl bg-[#1F4E43] text-white text-sm font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Thêm lịch khởi hành</button>
                  <button
                    type="button"
                    onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULES)}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Xem lịch tuần chung</span>
                  </button>
                  </div>
                </div>

                {isLoadingSchedules ? (
                  <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1F4E43]" />
                    <span>Đang tải danh sách lịch khởi hành...</span>
                  </div>
                ) : scheduleError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{scheduleError} <button type="button" onClick={fetchSchedules} className="underline">Thử lại</button></div>
                ) : schedules.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <Calendar className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                    <span>Tour này hiện chưa có lịch khởi hành nào.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase tracking-wider text-stone-600">
                          
                          <th className="py-3 px-3.5 font-bold">Bắt đầu</th>
                          <th className="py-3 px-3.5 font-bold">Kết thúc</th>
                          <th className="py-3 px-3.5 font-bold text-center">Sức chứa</th>
                          <th className="py-3 px-3.5 font-bold text-center">Đã đặt / giữ</th>
                          <th className="py-3 px-3.5 font-bold">Giá cơ bản</th>
                          <th className="py-3 px-3.5 font-bold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {schedules.map((s) => (
                          <tr key={s.id} className="hover:bg-[#FDFBF7] transition-colors">
                            
                            <td className="py-3 px-3.5 font-medium text-stone-900">
                              {formatDateTime(s.startsAt)}
                            </td>
                            <td className="py-3 px-3.5 text-stone-700">
                              {formatDateTime(s.endsAt)}
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold">
                                {s.capacity} chỗ
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono text-stone-600">
                              {s.confirmedSeats} / {s.heldSeats} giữ
                            </td>
                            <td className="py-3 px-3.5 font-mono font-semibold text-[#1F4E43]">
                              {formatVND(s.basePriceVnd)}
                            </td>
                            <td className="py-3 px-3.5">
                              <StatusBadge scheduleStatus={s.status} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {scheduleTotalPages > 1 && <div className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={schedulePage === 0} onClick={() => setSchedulePage(p => p - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Trước</button><span>{schedulePage + 1} / {scheduleTotalPages}</span><button type="button" disabled={schedulePage + 1 >= scheduleTotalPages} onClick={() => setSchedulePage(p => p + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Sau</button></div>}
              </div>
            </>
          )}
        </div>
      </div>

      {scheduleOpen && tour && <CreateScheduleModal tourId={tour.id} title={tour.title} durationDays={tour.durationDays} onClose={() => setScheduleOpen(false)} onCreated={() => { setScheduleOpen(false); toast.success('Đã thêm lịch khởi hành.'); if (schedulePage !== Math.floor(scheduleTotal / 10)) setSchedulePage(Math.floor(scheduleTotal / 10)); else fetchSchedules(); }} />}
      {publishOpen && tour && <TourPublishModal tourId={tour.id} onClose={() => setPublishOpen(false)} onPublished={updated => { setTour(updated); setPublishOpen(false); toast.success('Đã xuất bản tour.'); }} />}
      {/* Delete Confirmation Modal */}
      <TourDeleteModal
        isOpen={isDeleteModalOpen}
        tourId={tour?.id ?? null}
        tourTitle={tour?.title ?? ''}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </AdminAccessGuard>
  );
};

export default AdminTourDetailPage;
