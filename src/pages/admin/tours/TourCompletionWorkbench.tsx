import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, Circle, FileText,
  Image as ImageIcon, Info, MapPin, Mountain, Package, RefreshCw, Shield, Sparkles,
} from 'lucide-react';
import { apiClient } from '../../../lib/axios';
import { toursApi } from '../../../features/tours/api/tours.api';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type { TourDetailResponse, ScheduleSummaryResponse } from '../../../features/tours/types/tour.types';
import { TourItineraryEditor } from '../../../features/tours/components/TourItineraryEditor';
import { TourTermsEditor } from '../../../features/tours/components/TourTermsEditor';
import { TourEquipmentEditor } from '../../../features/tours/components/TourEquipmentEditor';
import { TourLocationEditor } from '../../../features/tours/components/TourLocationEditor';
import { TourStatistics } from '../../../features/tours/components/TourStatistics';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatDateTime, formatVND, isFileNameOrPath } from '../../../lib/utils';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

type StepId = 'basic' | 'locations' | 'itinerary' | 'terms' | 'equipment' | 'media-schedules' | 'statistics';
type CompletionStepId = Exclude<StepId, 'statistics'>;
type StepState = 'complete' | 'pending' | 'optional';
type ProgressData = { locations: number; itineraryDays: number; hasTerms: boolean; hasEquipment: boolean };

type Props = {
  tour: TourDetailResponse;
  scheduleTotal: number;
  schedules: ScheduleSummaryResponse[];
  schedulePage: number;
  scheduleTotalPages: number;
  scheduleError: string;
  isLoadingSchedules: boolean;
  isUploadingMedia: boolean;
  mediaActionId: number | null;
  onBack: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onAddSchedule: () => void;
  onSchedulePageChange: (page: number) => void;
  onRefreshSchedules: () => void;
  onUploadMedia: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSetCover: (mediaId: number) => void;
  onDeleteMedia: (mediaId: number) => void;
  onUpdated: () => void;
};

const STEPS: Array<{ id: CompletionStepId; title: string; description: string; icon: React.ComponentType<{ className?: string }>; optional?: boolean }> = [
  { id: 'basic', title: 'Thông tin cơ bản', description: 'Tên, độ khó, thời lượng', icon: FileText },
  { id: 'locations', title: 'Địa điểm & hành trình', description: 'Chọn điểm đến và thứ tự', icon: MapPin },
  { id: 'itinerary', title: 'Lịch trình theo ngày', description: 'Hoạt động từng ngày', icon: CalendarDays },
  { id: 'terms', title: 'Điều khoản', description: 'Chính sách, lưu ý, hủy đổi', icon: Shield },
  { id: 'equipment', title: 'Thiết bị & combo', description: 'Thiết bị cần thiết, combo đi kèm', icon: Package, optional: true },
  { id: 'media-schedules', title: 'Hình ảnh & khởi hành', description: 'Ảnh tour và lịch mở bán', icon: ImageIcon },
];

export function TourCompletionWorkbench(props: Props) {
  const [activeStep, setActiveStep] = useState<StepId>('locations');
  const [progress, setProgress] = useState<ProgressData>({ locations: 0, itineraryDays: 0, hasTerms: false, hasEquipment: false });
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const media = useMemo(() => [...(props.tour.media || [])].sort((a, b) => a.displayOrder - b.displayOrder), [props.tour.media]);

  useEffect(() => {
    let active = true;
    setProgressLoading(true);
    setProgressError('');
    Promise.allSettled([
      toursApi.getTourLocations(props.tour.id),
      apiClient.get<Array<{ dayNumber: number }>>(`/api/v1/tours/${props.tour.id}/itinerary`),
      apiClient.get<Array<{ primaryCancellation: boolean }>>(`/api/v1/tours/${props.tour.id}/terms`),
      equipmentApi.getTourEquipment(props.tour.id),
    ]).then((results) => {
      if (!active) return;
      const [locations, itinerary, terms, equipment] = results;
      const failed = results.some((result) => result.status === 'rejected');
      setProgressError(failed ? 'Một số mục chưa thể kiểm tra trạng thái. Tải lại tiến độ để thử lại.' : '');
      setProgress({
        locations: locations.status === 'fulfilled' ? locations.value.length : 0,
        itineraryDays: itinerary.status === 'fulfilled' ? itinerary.value.length : 0,
        hasTerms: terms.status === 'fulfilled' ? terms.value.some((term) => term.primaryCancellation) : false,
        hasEquipment: equipment.status === 'fulfilled'
          ? ((equipment.value.packages?.length || 0) + (equipment.value.individualItems?.length || equipment.value.items?.length || 0)) > 0
          : false,
      });
    }).finally(() => { if (active) setProgressLoading(false); });
    return () => { active = false; };
  }, [props.tour.id, props.tour.cancellationPolicyVersionId, refreshToken]);

  const states: Record<CompletionStepId, StepState> = {
    basic: props.tour.title && props.tour.description ? 'complete' : 'pending',
    locations: progress.locations > 0 ? 'complete' : 'pending',
    itinerary: progress.itineraryDays >= Math.max(1, props.tour.durationDays || 1) ? 'complete' : 'pending',
    terms: props.tour.cancellationPolicyVersionId || progress.hasTerms ? 'complete' : 'pending',
    equipment: progress.hasEquipment ? 'complete' : 'optional',
    'media-schedules': media.length > 0 && props.scheduleTotal > 0 ? 'complete' : 'pending',
  };
  const completed = Object.values(states).filter((state) => state === 'complete').length;
  const progressPct = Math.round((completed / STEPS.length) * 100);

  const refreshProgress = () => setRefreshToken((value) => value + 1);
  const goToPolicyAdmin = () => navigateTo(ROUTES.ADMIN.POLICIES);

  const statusMarker = (status: StepState, active: boolean) => status === 'complete'
    ? <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#147A52] text-white"><Check className="h-3.5 w-3.5" /></span>
    : status === 'optional'
      ? <span className="rounded-full bg-[#edf0f2] px-2 py-1 text-[10px] font-semibold text-[#596a78]">Tùy chọn</span>
      : <Circle className={`h-6 w-6 shrink-0 ${active ? 'text-[#168353]' : 'text-[#95a2ae]'}`} />;

  const renderActivePanel = () => {
    switch (activeStep) {
      case 'basic':
        return <section className="rounded-xl border border-[#d8e0e7] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-[#142f42]">Thông tin cơ bản</h2><p className="mt-1 text-sm text-[#596d7c]">Thông tin đã lưu cho tour này.</p></div><button type="button" onClick={props.onEdit} className="rounded-lg border border-[#0b765c] px-4 py-2 text-sm font-semibold text-[#0b765c] hover:bg-[#eef7f3]">Chỉnh sửa thông tin</button></div>
          <dl className="mt-5 grid gap-x-7 gap-y-5 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Tên tour</dt><dd className="mt-1 font-semibold text-[#213a4c]">{props.tour.title}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Độ khó · Thời lượng</dt><dd className="mt-1 flex items-center gap-2 font-semibold text-[#213a4c]"><StatusBadge difficulty={props.tour.difficulty} size="sm" />{props.tour.durationDays} ngày</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Mô tả</dt><dd className="mt-1 whitespace-pre-line text-sm leading-6 text-[#405665]">{props.tour.description || 'Chưa có mô tả.'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Kinh nghiệm yêu cầu</dt><dd className="mt-1 whitespace-pre-line text-sm text-[#405665]">{props.tour.requiredExperience || 'Chưa cập nhật.'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Dịch vụ bao gồm</dt><dd className="mt-1 whitespace-pre-line text-sm text-[#405665]">{props.tour.includedServices || 'Chưa cập nhật.'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Dịch vụ không bao gồm</dt><dd className="mt-1 whitespace-pre-line text-sm text-[#405665]">{props.tour.excludedServices || 'Chưa cập nhật.'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[#70818d]">Tệp bản đồ / GPS</dt><dd className="mt-1 break-all text-sm text-[#405665]">{props.tour.routeFileUrl || 'Chưa đính kèm.'}</dd></div></dl>
        </section>;
      case 'locations':
        return <section className="rounded-xl border border-[#d8e0e7] bg-white p-5 sm:p-6"><TourLocationEditor tourId={props.tour.id} onUpdated={() => { refreshProgress(); props.onUpdated(); }} /></section>;
      case 'itinerary':
        return <TourItineraryEditor tourId={props.tour.id} durationDays={props.tour.durationDays} onUpdated={() => { refreshProgress(); props.onUpdated(); }} onContinue={() => setActiveStep('terms')} />;
      case 'terms':
        return <div className="space-y-4">
          {!props.tour.cancellationPolicyVersionId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ead8ad] bg-[#fff8e9] p-4"><div><p className="font-semibold text-[#664b19]">Chưa có chính sách hủy đang áp dụng</p><p className="mt-1 text-sm text-[#78643e]">Tạo một phiên bản đã duyệt trong danh mục trước khi xuất bản tour.</p></div><button type="button" onClick={goToPolicyAdmin} className="rounded-lg border border-[#ae8742] px-3.5 py-2 text-sm font-semibold text-[#71541e] hover:bg-[#fff1cd]">Tạo điều khoản</button></div>}
          <TourTermsEditor tourId={props.tour.id} cancellationId={props.tour.cancellationPolicyVersionId} status={props.tour.status} onUpdated={() => { refreshProgress(); props.onUpdated(); }} />
        </div>;
      case 'equipment':
        return <section className="rounded-xl border border-[#d8e0e7] bg-white p-5 sm:p-6"><TourEquipmentEditor tourId={props.tour.id} onUpdated={() => { refreshProgress(); props.onUpdated(); }} /></section>;
      case 'statistics':
        return <TourStatistics tourId={props.tour.id} scheduleTotal={props.scheduleTotal} />;
      case 'media-schedules':
        return <div className="grid items-start gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-[#d8e0e7] bg-white p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold text-[#142f42]"><ImageIcon className="h-5 w-5 text-[#08775b]" />Hình ảnh tour</h2><p className="mt-1 text-sm text-[#596d7c]">{media.length} ảnh/video</p></div><label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#08775b] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#056148] ${props.isUploadingMedia ? 'pointer-events-none opacity-60' : ''}`}>{props.isUploadingMedia ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}{props.isUploadingMedia ? 'Đang tải…' : 'Thêm ảnh'}<input type="file" accept="image/*" multiple disabled={props.isUploadingMedia} onChange={props.onUploadMedia} className="hidden" /></label></div>
            {media.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{media.map((item) => <article key={item.id} className="overflow-hidden rounded-lg border border-[#dce3e8] bg-white"><div className="relative aspect-video bg-[#e7edf1]">{item.mediaType === 'VIDEO' ? <video src={item.url} controls className="h-full w-full object-cover" /> : <img src={item.url} alt={!isFileNameOrPath(item.caption) ? item.caption || props.tour.title : props.tour.title} className="h-full w-full object-cover" loading="lazy" />}<span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#2f4858]">{item.isCover ? 'Ảnh bìa' : `Ảnh ${item.displayOrder + 1}`}</span></div><div className="flex items-center justify-between gap-2 p-3"><span className="truncate text-xs text-[#536a78]">{item.caption && !isFileNameOrPath(item.caption) ? item.caption : 'Ảnh tour'}</span><div className="flex gap-2">{!item.isCover && <button type="button" disabled={props.mediaActionId === item.id} onClick={() => props.onSetCover(item.id)} className="text-xs font-semibold text-[#08775b] hover:underline">Đặt ảnh bìa</button>}<button type="button" disabled={props.mediaActionId === item.id} onClick={() => props.onDeleteMedia(item.id)} className="text-xs font-semibold text-rose-700 hover:underline">Xóa</button></div></div></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#cdd9e0] bg-[#f8fafb] px-4 py-8 text-center"><ImageIcon className="mx-auto h-7 w-7 text-[#8294a0]" /><p className="mt-2 text-sm font-semibold text-[#344f60]">Chưa có ảnh cho tour này</p><p className="mt-1 text-xs text-[#637784]">Thêm ảnh để khách dễ hình dung hành trình.</p></div>}
          </section>
          <section className="rounded-xl border border-[#d8e0e7] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold text-[#142f42]"><CalendarDays className="h-5 w-5 text-[#08775b]" />Lịch khởi hành</h2><p className="mt-1 text-sm text-[#596d7c]">{props.scheduleTotal} chuyến đã lên lịch</p></div><button type="button" onClick={props.onAddSchedule} className="inline-flex items-center gap-2 rounded-lg bg-[#08775b] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#056148]">+ Thêm lịch khởi hành</button></div>
            {props.isLoadingSchedules ? <p role="status" className="mt-5 py-5 text-center text-sm text-[#637784]">Đang tải lịch khởi hành…</p> : props.scheduleError ? <div role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{props.scheduleError}<button type="button" onClick={props.onRefreshSchedules} className="ml-2 underline">Thử lại</button></div> : props.schedules.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#dce3e8] text-xs uppercase tracking-wide text-[#667986]"><tr><th className="py-2 pr-3">Bắt đầu</th><th className="py-2 pr-3">Kết thúc</th><th className="py-2 pr-3">Sức chứa</th><th className="py-2 pr-3">Giá / khách</th><th className="py-2 pr-3">Trạng thái</th><th className="py-2 text-right">Mở</th></tr></thead><tbody className="divide-y divide-[#edf0f2]">{props.schedules.map((schedule) => <tr key={schedule.id}><td className="py-3 pr-3 font-medium text-[#243e50]">{formatDateTime(schedule.startsAt)}</td><td className="py-3 pr-3 text-[#536a78]">{formatDateTime(schedule.endsAt)}</td><td className="py-3 pr-3">{schedule.capacity} chỗ</td><td className="py-3 pr-3 font-semibold text-[#08775b]">{formatVND(schedule.basePriceVnd)}</td><td className="py-3 pr-3"><StatusBadge scheduleStatus={schedule.status} size="sm" /></td><td className="py-3 text-right"><button type="button" onClick={() => navigateTo(ROUTES.ADMIN.SCHEDULE_DETAIL(schedule.id))} className="font-semibold text-[#08775b] hover:underline">Chi tiết</button></td></tr>)}</tbody></table>{props.scheduleTotalPages > 1 && <div className="mt-3 flex items-center justify-end gap-3 text-sm"><button type="button" disabled={props.schedulePage === 0} onClick={() => props.onSchedulePageChange(props.schedulePage - 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Trước</button><span>{props.schedulePage + 1} / {props.scheduleTotalPages}</span><button type="button" disabled={props.schedulePage + 1 >= props.scheduleTotalPages} onClick={() => props.onSchedulePageChange(props.schedulePage + 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Sau</button></div>}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#cdd9e0] bg-[#f8fafb] px-4 py-8 text-center"><CalendarDays className="mx-auto h-7 w-7 text-[#8294a0]" /><p className="mt-2 text-sm font-semibold text-[#344f60]">Chưa có lịch khởi hành</p><p className="mt-1 text-xs text-[#637784]">Tạo chuyến đầu tiên để mở đặt chỗ cho tour.</p></div>}
          </section>
        </div>;
    }
  };

  return <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><button type="button" onClick={props.onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#516776] hover:text-[#08775b]"><ArrowLeft className="h-4 w-4" />Danh sách tour</button><div className="flex flex-wrap items-center gap-2.5"><h1 className="text-3xl font-extrabold tracking-tight text-[#142f42]">{props.tour.title}</h1><StatusBadge tourStatus={props.tour.status} /><StatusBadge difficulty={props.tour.difficulty} /></div></div>
      <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={props.onRefresh} className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5dd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#40596a] hover:bg-[#f7f9fa]"><RefreshCw className="h-4 w-4" />Làm mới</button><button type="button" onClick={props.onEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#08775b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#056148]">Chỉnh sửa cơ bản</button><button type="button" onClick={props.onPublish} disabled={props.tour.status !== 'DRAFT'} title={props.tour.status !== 'DRAFT' ? 'Chỉ tour bản nháp mới có thể xuất bản' : undefined} className="inline-flex items-center gap-2 rounded-lg bg-[#08775b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#056148] disabled:cursor-not-allowed disabled:bg-[#a5c4b8]">Xuất bản</button><button type="button" onClick={props.onDelete} className="rounded-lg border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Xóa tour</button></div>
    </div>

    <section aria-label="Tiến độ hoàn thiện tour" className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-[#d7e0e7] bg-white px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2.5"><Sparkles className="h-5 w-5 text-[#08775b]" /><h2 className="text-lg font-bold text-[#18364a]">Hoàn thiện tour</h2></div><span className="text-sm font-semibold text-[#526a7a]">{progressLoading ? 'Đang kiểm tra…' : `${completed}/6 mục đã hoàn tất`}</span><div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#e4eaf0]"><div className="h-full rounded-full bg-[#08775b] transition-[width] duration-300" style={{ width: `${progressPct}%` }} /></div><button type="button" onClick={refreshProgress} aria-label="Tải lại tiến độ" className="rounded-md p-2 text-[#627785] hover:bg-[#f0f4f6]"><RefreshCw className="h-4 w-4" /></button></section>
    {progressError && <p role="status" className="flex items-center gap-2 text-xs text-[#6c7e8b]"><Info className="h-4 w-4" />{progressError}</p>}

    <div className="grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-xl border border-[#d7e0e7] bg-white lg:sticky lg:top-4">
        <nav aria-label="Các mục hoàn thiện tour" className="flex gap-1.5 overflow-x-auto p-2 lg:block lg:space-y-1.5 lg:overflow-visible">
          {STEPS.map((step) => {
            const active = activeStep === step.id;
            const status = states[step.id];
            return <button type="button" key={step.id} onClick={() => setActiveStep(step.id)} aria-current={active ? 'step' : undefined} className={`flex min-w-[205px] items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors lg:min-w-0 lg:w-full ${active ? 'bg-[#e6f5ef] text-[#123f32] ring-1 ring-inset ring-[#c1e6d4]' : 'text-[#294353] hover:bg-[#f5f8fa]'}`}>
              <step.icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#08775b]' : 'text-[#546d7c]'}`} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{step.title}</span><span className={`mt-0.5 block truncate text-xs ${active ? 'text-[#416556]' : 'text-[#6a7d89]'}`}>{step.description}</span></span>
              {statusMarker(status, active)}
            </button>;
          })}
          <div className="border-t border-[#e5eaee] pt-1.5 lg:mt-2"><button type="button" onClick={() => setActiveStep('statistics')} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold ${activeStep === 'statistics' ? 'bg-[#e6f5ef] text-[#123f32]' : 'text-[#5a6f7d] hover:bg-[#f5f8fa]'}`}><Mountain className="h-4 w-4" />Thống kê tour</button></div>
        </nav>
      </aside>

      <main className="min-h-[510px] min-w-0">{renderActivePanel()}</main>
    </div>
    <p className="flex items-center gap-2 pb-2 text-sm text-[#6a7d89]"><Check className="h-4 w-4 text-[#178052]" />Lưu theo từng mục; bạn có thể chuyển qua lại mà không mất nội dung đã lưu.</p>
  </div>;
}
