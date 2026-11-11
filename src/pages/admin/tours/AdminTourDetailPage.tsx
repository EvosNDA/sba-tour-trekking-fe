import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import type { TourDetailResponse, ScheduleSummaryResponse } from '../../../features/tours/types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { AdminAccessGuard } from '../../../features/tours/components/AdminAccessGuard';
import { TourDeleteModal } from '../../../features/tours/components/TourDeleteModal';
import { TourPublishModal } from '../../../features/tours/components/TourPublishModal';
import { CreateScheduleModal } from '../../../features/tours/components/CreateScheduleModal';
import { TourCompletionWorkbench } from './TourCompletionWorkbench';
import { useLocation, navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';

export interface AdminTourDetailPageProps { tourIdProp?: number; }

export const AdminTourDetailPage: React.FC<AdminTourDetailPageProps> = ({ tourIdProp }) => {
  const { pathname } = useLocation();
  const match = pathname.match(/^\/admin\/tours\/(\d+)\/?$/);
  const tourId = tourIdProp || (match ? Number(match[1]) : null);
  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleSummaryResponse[]>([]);
  const [schedulePage, setSchedulePage] = useState(0);
  const [scheduleTotal, setScheduleTotal] = useState(0);
  const [schedulePages, setSchedulePages] = useState(0);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaActionId, setMediaActionId] = useState<number | null>(null);

  const loadTour = useCallback(async (showLoading = true) => {
    if (!tourId) { setLoading(false); return; }
    if (showLoading) setLoading(true);
    setError(null);
    try { setTour(await toursApi.getTourDetail(tourId)); }
    catch (e) { const apiErr = e as ApiError; setError(apiErr); if (apiErr.status === 401) navigateTo(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(ROUTES.ADMIN.TOUR_DETAIL(tourId))}`, { replace: true }); }
    finally { if (showLoading) setLoading(false); }
  }, [tourId]);

  const loadSchedules = useCallback(async () => {
    if (!tourId) return;
    setScheduleLoading(true); setScheduleError('');
    try { const page = await toursApi.getTourSchedules(tourId, { page: schedulePage, size: 10, upcomingOnly: false }); setSchedules(page.content || []); setScheduleTotal(page.totalElements || 0); setSchedulePages(page.totalPages || 0); }
    catch { setScheduleError('Không thể tải lịch khởi hành. Vui lòng thử lại.'); }
    finally { setScheduleLoading(false); }
  }, [tourId, schedulePage]);
  useEffect(() => { void loadTour(); }, [loadTour]);
  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); if (!tour || !files.length) return;
    setUploading(true);
    try { for (const file of files) await toursApi.uploadTourMedia(tour.id, file, file.name); toast.success('Đã tải ảnh lên.'); await loadTour(); }
    catch (e) { toast.error((e as Error).message || 'Không thể tải ảnh lên.'); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const setCover = async (id: number) => { if (!tour) return; setMediaActionId(id); try { await toursApi.setCoverMedia(tour.id, id); toast.success('Đã đặt ảnh bìa.'); await loadTour(); } catch (e) { toast.error((e as Error).message || 'Không thể đặt ảnh bìa.'); } finally { setMediaActionId(null); } };
  const deleteMedia = async (id: number) => { if (!tour || !window.confirm('Xóa ảnh này khỏi tour?')) return; setMediaActionId(id); try { await toursApi.deleteTourMedia(tour.id, id); toast.success('Đã xóa ảnh.'); await loadTour(); } catch (e) { toast.error((e as Error).message || 'Không thể xóa ảnh.'); } finally { setMediaActionId(null); } };
  const deleteTour = async () => { if (!tour) return; setDeleting(true); setDeleteError(null); try { await toursApi.deleteTour(tour.id); toast.success('Đã xóa tour.'); navigateTo(ROUTES.ADMIN.TOURS, { replace: true }); } catch (e) { setDeleteError(e as ApiError); } finally { setDeleting(false); } };

  if (loading) return <div className="mx-auto max-w-5xl animate-pulse p-8"><div className="h-10 w-1/3 rounded bg-slate-200"/><div className="mt-5 h-80 rounded-xl bg-white"/></div>;
  if (error && !tour) return <AdminAccessGuard forbiddenError={error.status === 403}><div className="mx-auto max-w-2xl p-10 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-rose-600"/><h1 className="mt-3 text-xl font-bold">Không thể tải tour</h1><p className="mt-2 text-sm text-slate-600">{error.message}</p><button type="button" onClick={() => void loadTour()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-white"><RefreshCw className="h-4 w-4"/>Thử lại</button></div></AdminAccessGuard>;
  if (!tour) return <div className="mx-auto max-w-2xl p-10 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-rose-600"/><h1 className="mt-3 text-xl font-bold">Không tìm thấy tour</h1><button type="button" onClick={() => void loadTour()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-white"><RefreshCw className="h-4 w-4"/>Thử lại</button></div>;
  return <AdminAccessGuard forbiddenError={error?.status === 403}>
    <TourCompletionWorkbench tour={tour} scheduleTotal={scheduleTotal} schedules={schedules} schedulePage={schedulePage} scheduleTotalPages={schedulePages} scheduleError={scheduleError} isLoadingSchedules={scheduleLoading} isUploadingMedia={uploading} mediaActionId={mediaActionId} onBack={() => navigateTo(ROUTES.ADMIN.TOURS)} onRefresh={() => { void loadTour(); void loadSchedules(); }} onEdit={() => navigateTo(ROUTES.ADMIN.TOUR_EDIT(tour.id))} onPublish={() => setPublishOpen(true)} onDelete={() => setDeleteOpen(true)} onAddSchedule={() => setScheduleOpen(true)} onSchedulePageChange={setSchedulePage} onRefreshSchedules={() => void loadSchedules()} onUploadMedia={upload} onSetCover={setCover} onDeleteMedia={deleteMedia} onUpdated={() => void loadTour(false)} />
    {scheduleOpen && <CreateScheduleModal tourId={tour.id} title={tour.title} durationDays={tour.durationDays} onClose={() => setScheduleOpen(false)} onCreated={() => { setScheduleOpen(false); toast.success('Đã thêm lịch khởi hành.'); void loadSchedules(); }} />}
    {publishOpen && <TourPublishModal tourId={tour.id} onClose={() => setPublishOpen(false)} onPublished={(updated) => { setTour(updated); setPublishOpen(false); toast.success('Đã xuất bản tour.'); }} />}
    <TourDeleteModal isOpen={deleteOpen} tourId={tour.id} tourTitle={tour.title} isDeleting={deleting} error={deleteError} onClose={() => setDeleteOpen(false)} onConfirm={() => void deleteTour()} />
  </AdminAccessGuard>;
};
export default AdminTourDetailPage;
