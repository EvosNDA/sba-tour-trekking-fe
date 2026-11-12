import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, CalendarDays, Check, ChevronDown,
  FileText, Link2, Loader2, MapPin, Mountain, Package, Plus, Save, X,
} from 'lucide-react';
import { apiClient } from '../../../lib/axios';
import { toursApi, type LocationOption } from '../api/tours.api';
import type { CreateTourRequest, DifficultyLevel, TourDetailResponse, UpdateTourRequest } from '../types/tour.types';
import { DIFFICULTY_OPTIONS } from '../types/tour.types';
import { toast } from '../../../components/ui/Toast';

interface PolicyVersionOption {
  id: number;
  policyId: number;
  title: string;
  versionNumber: number;
  effectiveFrom: string;
  approvedAt: string | null;
  kind: string;
}

interface TourCreateFormProps {
  initialData?: TourDetailResponse | null;
  onCancel: () => void;
  onCreated: (tourId: number) => void;
}

const fieldClass = 'w-full rounded-lg border border-[#cbd4cc] bg-white px-3.5 py-2.5 text-sm text-[#18352b] placeholder:text-[#7b8980] outline-none transition focus:border-[#176a50] focus:ring-2 focus:ring-[#176a50]/15 disabled:bg-[#f1f3ef]';
const labelClass = 'mb-1.5 block text-sm font-semibold text-[#273b31]';
const panelClass = 'overflow-hidden rounded-xl border border-[#d5ddd3] bg-white';

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date);
};

export const TourCreateForm: React.FC<TourCreateFormProps> = ({ initialData, onCancel, onCreated }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialData?.difficulty || 'MODERATE');
  const [durationDays, setDurationDays] = useState(String(initialData?.durationDays || 2));
  const [requiredExperience, setRequiredExperience] = useState(initialData?.requiredExperience || '');
  const [includedServices, setIncludedServices] = useState(initialData?.includedServices || '');
  const [excludedServices, setExcludedServices] = useState(initialData?.excludedServices || '');
  const [routeFileUrl, setRouteFileUrl] = useState(initialData?.routeFileUrl || '');
  const [capacity, setCapacity] = useState('10');
  const [basePriceVnd, setBasePriceVnd] = useState('');
  const [equipmentFeeVnd, setEquipmentFeeVnd] = useState('0');
  const [depositPercent, setDepositPercent] = useState('30');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersionOption[]>([]);
  const [cancellationVersions, setCancellationVersions] = useState<PolicyVersionOption[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
  const [policyId, setPolicyId] = useState(initialData?.cancellationPolicyVersionId ? String(initialData.cancellationPolicyVersionId) : '');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationOptionsError, setLocationOptionsError] = useState('');
  const [policyOptionsError, setPolicyOptionsError] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [createdTourId, setCreatedTourId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [titleError, setTitleError] = useState('');

  const loadOptions = async () => {
    setOptionsLoading(true);
    setLocationOptionsError('');
    setPolicyOptionsError('');
    const [locationResult, termsResult, cancellationResult] = await Promise.allSettled([
      toursApi.listLocations(),
      apiClient.get<PolicyVersionOption[]>('/api/v1/admin/policies/available'),
      apiClient.get<PolicyVersionOption[]>('/api/v1/admin/policies/cancellation/available'),
    ]);
    if (locationResult.status === 'fulfilled') setLocations(locationResult.value);
    else setLocationOptionsError('Không tải được danh mục địa điểm. Thử tải lại để chọn đúng địa điểm đã có trong hệ thống.');

    if (termsResult.status === 'fulfilled' && cancellationResult.status === 'fulfilled') {
      setPolicyVersions(termsResult.value.filter((item) => item.kind !== 'cancellation'));
      setCancellationVersions(cancellationResult.value);
    } else {
      setPolicyOptionsError('Không tải được danh sách phiên bản chính sách.');
    }
    setOptionsLoading(false);
  };

  useEffect(() => { void loadOptions(); }, []);

  useEffect(() => {
    if (!initialData?.id) return;
    toursApi.getScheduleDefaults(initialData.id).then((defaults) => {
      if (!defaults) return;
      setCapacity(String(defaults.capacity));
      setBasePriceVnd(String(defaults.basePriceVnd));
      setEquipmentFeeVnd(String(defaults.equipmentFeeVnd));
      setDepositPercent(String(defaults.depositPercent));
      setMeetingPoint(defaults.meetingPoint || '');
      setContactPhone(defaults.contactPhone || '');
    }).catch(() => setSubmitError('Không tải được cấu hình giá hiện tại của tour.'));
  }, [initialData?.id]);

  const availableLocations = useMemo(() => {
    const query = locationSearch.trim().toLocaleLowerCase('vi');
    return locations.filter((location) => !selectedLocationIds.includes(location.id)
      && (!query || `${location.name} ${location.provinceName || ''}`.toLocaleLowerCase('vi').includes(query)));
  }, [locations, selectedLocationIds, locationSearch]);

  const selectedLocations = selectedLocationIds
    .map((id) => locations.find((location) => location.id === id))
    .filter((location): location is LocationOption => Boolean(location));

  const toggleTerm = (id: number) => setSelectedTerms((current) => current.includes(id)
    ? current.filter((selected) => selected !== id)
    : [...current, id]);

  const moveLocation = (index: number, direction: -1 | 1) => {
    const next = [...selectedLocationIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedLocationIds(next);
  };

  const saveTour = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Vui lòng nhập tên tour.');
      document.getElementById('tour-title')?.focus();
      return;
    }
    if (trimmedTitle.length > 250) {
      setTitleError('Tên tour không được vượt quá 250 ký tự.');
      document.getElementById('tour-title')?.focus();
      return;
    }
    const duration = Number(durationDays);
    if (!Number.isInteger(duration) || duration < 1) {
      setSubmitError('Thời lượng phải là số nguyên dương.');
      return;
    }
    const seats = Number(capacity);
    const price = Number(basePriceVnd);
    const equipmentFee = Number(equipmentFeeVnd);
    const deposit = Number(depositPercent);
    if (!Number.isSafeInteger(seats) || seats < 1
      || basePriceVnd.trim() === '' || !Number.isSafeInteger(price) || price < 0 || price > 1_000_000_000_000
      || equipmentFeeVnd.trim() === '' || !Number.isSafeInteger(equipmentFee) || equipmentFee < 0 || equipmentFee > 1_000_000_000_000
      || !Number.isFinite(deposit) || deposit <= 0 || deposit > 100 || !/^\d+(\.\d{1,2})?$/.test(depositPercent)) {
      setSubmitError('Vui lòng nhập số chỗ, giá tour, phụ phí và tỷ lệ đặt cọc hợp lệ.');
      return;
    }
    if (routeFileUrl.trim()) {
      try {
        const url = new URL(routeFileUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL');
      } catch {
        setSubmitError('Đường dẫn tệp lộ trình cần là URL http hoặc https hợp lệ.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');
    setTitleError('');
    try {
      const payload: CreateTourRequest = {
        title: trimmedTitle,
        description: description.trim(),
        difficulty,
        durationDays: duration,
        requiredExperience: requiredExperience.trim(),
        includedServices: includedServices.trim(),
        excludedServices: excludedServices.trim(),
        routeFileUrl: routeFileUrl.trim(),
      };

      let tour: TourDetailResponse;
      if (createdTourId) {
        const updatePayload: UpdateTourRequest = {
          ...payload,
          status: 'DRAFT',
          ...(policyId ? { cancellationPolicyVersionId: Number(policyId) } : {}),
        };
        tour = await toursApi.updateTour(createdTourId, updatePayload);
      } else {
        tour = await toursApi.createTour(payload);
        setCreatedTourId(tour.id);
      }

      await Promise.all([
        toursApi.saveScheduleDefaults(tour.id, {
          capacity: seats,
          basePriceVnd: price,
          equipmentFeeVnd: equipmentFee,
          depositPercent: deposit,
          meetingPoint: meetingPoint.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        }),
        apiClient.put(`/api/v1/tours/${tour.id}/terms`, {
          versionIds: selectedTerms,
          ...(policyId ? { cancellationPolicyVersionId: Number(policyId) } : { removeCancellationPolicy: true }),
        }),
        toursApi.saveTourLocations(tour.id, selectedLocationIds),
      ]);

      toast.success(createdTourId ? 'Đã cập nhật bản nháp tour.' : 'Đã tạo tour ở trạng thái bản nháp.');
      onCreated(tour.id);
    } catch (error) {
      const message = (error as { message?: string })?.message || 'Có lỗi khi lưu tour.';
      setSubmitError(createdTourId
        ? `Tour đã được tạo (mã ${createdTourId}), nhưng chưa lưu đủ các liên kết. Kiểm tra danh sách địa điểm/chính sách rồi bấm lưu để thử lại. ${message}`
        : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={saveTour} noValidate aria-busy={isSubmitting} className="pb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#66766c]">
            <span>Tour trekking</span><span>/</span><span>Danh sách tour</span><span>/</span>
            <span className="font-semibold text-[#294338]">Tạo tour mới</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#153a2b]">Tạo tour mới</h1>
            <span className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-bold text-[#9a5a12]">● Bản nháp</span>
          </div>
          <div className="mt-2 h-1 w-16 rounded bg-[#176a50]" />
        </div>
        {createdTourId && <span className="text-sm font-medium text-[#176a50]">Tour #{createdTourId} đã lưu · đang hoàn tất liên kết</span>}
      </div>

      {submitError && <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{submitError}</div>}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(350px,0.95fr)]">
        <div className="space-y-4">
          <section className={panelClass} aria-labelledby="tour-basic-heading">
            <div className="border-b border-[#e1e6df] bg-[#fbfcfa] px-5 py-3"><h2 id="tour-basic-heading" className="flex items-center gap-2 text-lg font-bold text-[#153a2b]"><FileText className="h-5 w-5 text-[#176a50]" />Thông tin cơ bản</h2></div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-[145px_1fr] items-center gap-3">
                <span className="text-sm font-semibold text-[#34493d]">Công ty vận hành</span>
                <div className="flex min-h-10 items-center gap-2 rounded-lg border border-[#d3dad2] bg-[#f3f5f2] px-3.5 text-sm font-medium text-[#294338]"><Mountain className="h-4 w-4 text-[#176a50]" />WeTrek Việt Nam<span className="ml-1 rounded-full bg-[#dff1e4] px-2 py-0.5 text-[11px] font-semibold text-[#246344]">Đơn vị quản trị</span></div>
              </div>
              <div className="grid grid-cols-[145px_1fr] items-start gap-3">
                <label htmlFor="tour-title" className={`${labelClass} mt-2`}>Tên tour <span className="text-rose-600">*</span></label>
                <div><input id="tour-title" value={title} onChange={(event) => { setTitle(event.target.value); setTitleError(''); }} maxLength={250} placeholder="VD: Tà Năng – Phan Dũng" className={fieldClass} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? 'tour-title-error' : undefined} />{titleError && <p id="tour-title-error" className="mt-1 text-xs text-rose-700">{titleError}</p>}</div>
              </div>
              <div className="grid grid-cols-[145px_1fr] items-start gap-3">
                <label htmlFor="tour-description" className={`${labelClass} mt-2`}>Mô tả tour</label>
                <textarea id="tour-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Giới thiệu cung đường, cảnh quan, trải nghiệm nổi bật và đối tượng phù hợp…" className={`${fieldClass} resize-y`} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="tour-difficulty" className={labelClass}>Độ khó</label><select id="tour-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyLevel)} className={fieldClass}>{DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                <div><label htmlFor="tour-duration" className={labelClass}>Thời lượng (ngày)</label><input id="tour-duration" type="number" min={1} step={1} value={durationDays} onChange={(event) => setDurationDays(event.target.value)} className={fieldClass} /></div>
              </div>
              <div><label htmlFor="tour-experience" className={labelClass}>Kinh nghiệm yêu cầu</label><textarea id="tour-experience" value={requiredExperience} onChange={(event) => setRequiredExperience(event.target.value)} rows={2} placeholder="VD: Thể lực cơ bản, quen đi bộ đường dài…" className={`${fieldClass} resize-y`} /></div>
            </div>
          </section>

          <section className={panelClass} aria-labelledby="tour-pricing-heading">
            <div className="border-b border-[#e1e6df] bg-[#fbfcfa] px-5 py-3"><h2 id="tour-pricing-heading" className="flex items-center gap-2 text-lg font-bold text-[#153a2b]">Cấu hình giá và lịch khởi hành</h2></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className={labelClass}>Số chỗ mặc định *<input required type="number" min="1" step="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} className={fieldClass} /></label>
              <label className={labelClass}>Giá tour / khách (đ) *<input required type="number" min="0" max="1000000000000" step="1" value={basePriceVnd} onChange={(event) => setBasePriceVnd(event.target.value)} className={fieldClass} placeholder="VD: 1.500.000" /></label>
              <label className={labelClass}>Phụ phí thiết bị (đ)<input required type="number" min="0" max="1000000000000" step="1" value={equipmentFeeVnd} onChange={(event) => setEquipmentFeeVnd(event.target.value)} className={fieldClass} /></label>
              <label className={labelClass}>Tiền cọc (%) *<input required type="number" min="0.01" max="100" step="0.01" value={depositPercent} onChange={(event) => setDepositPercent(event.target.value)} className={fieldClass} /></label>
              <label className={labelClass}>Điểm tập trung<input value={meetingPoint} onChange={(event) => setMeetingPoint(event.target.value)} className={fieldClass} /></label>
              <label className={labelClass}>Số điện thoại liên hệ<input type="tel" maxLength={30} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className={fieldClass} /></label>
              <p className="sm:col-span-2 text-xs text-[#66766c]">Giá và thông tin này được lưu làm mặc định cho tour; khi tạo lịch khởi hành, bạn có thể chỉnh riêng cho từng đợt.</p>
            </div>
          </section>

          <section className={panelClass} aria-labelledby="tour-locations-heading">
            <div className="border-b border-[#e1e6df] bg-[#fbfcfa] px-5 py-3"><h2 id="tour-locations-heading" className="flex items-center gap-2 text-lg font-bold text-[#153a2b]"><MapPin className="h-5 w-5 text-[#176a50]" />Địa điểm & hành trình</h2></div>
            <div className="space-y-3 p-5">
              {locationOptionsError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><span>{locationOptionsError}</span><button type="button" onClick={() => void loadOptions()} className="shrink-0 font-semibold underline">Tải lại</button></div>}
              <label htmlFor="tour-location-search" className={labelClass}>Chọn địa điểm <span className="font-normal text-[#78877d]">(liên kết danh mục)</span></label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1"><input id="tour-location-search" value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} disabled={optionsLoading || locations.length === 0} placeholder={optionsLoading ? 'Đang tải danh mục địa điểm…' : 'Tìm địa điểm trong danh mục…'} className={`${fieldClass} pr-9`} /><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#68786d]" /></div>
                <button type="button" disabled={!availableLocations[0]} onClick={() => { if (availableLocations[0]) { setSelectedLocationIds((current) => [...current, availableLocations[0].id]); setLocationSearch(''); } }} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#b7c9ba] px-3 text-sm font-semibold text-[#176a50] hover:bg-[#eef5ef] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Thêm</button>
              </div>
              {locationSearch && availableLocations.length > 0 && <div className="-mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#d5ddd3] bg-white shadow-sm">{availableLocations.slice(0, 6).map((location) => <button type="button" key={location.id} onClick={() => { setSelectedLocationIds((current) => [...current, location.id]); setLocationSearch(''); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f1f6f1]"><span>{location.name}</span><span className="text-xs text-[#738176]">{location.provinceName || 'Địa điểm'}</span></button>)}</div>}
              <p className="text-xs font-medium text-[#68786d]">Các điểm trong hành trình (theo thứ tự di chuyển)</p>
              {selectedLocations.length ? <ol className="space-y-1.5">{selectedLocations.map((location, index) => <li key={location.id} className="flex items-center gap-2 rounded-lg border border-[#dce3dc] bg-white px-3 py-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#e4f2e6] text-xs font-bold text-[#285e3d]">{index + 1}</span><MapPin className="h-4 w-4 shrink-0 text-[#176a50]" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-[#2d4035]">{location.name}<span className="ml-1 font-normal text-[#7b8980]">{location.provinceName ? `· ${location.provinceName}` : ''}</span></span><button type="button" aria-label={`Chuyển ${location.name} lên`} disabled={index === 0} onClick={() => moveLocation(index, -1)} className="rounded p-1 text-[#607267] hover:bg-[#eef3ed] disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label={`Chuyển ${location.name} xuống`} disabled={index === selectedLocations.length - 1} onClick={() => moveLocation(index, 1)} className="rounded p-1 text-[#607267] hover:bg-[#eef3ed] disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" aria-label={`Xóa ${location.name}`} onClick={() => setSelectedLocationIds((current) => current.filter((id) => id !== location.id))} className="rounded p-1 text-[#7b8980] hover:bg-rose-50 hover:text-rose-700"><X className="h-4 w-4" /></button></li>)}</ol> : locations.length === 0 && !optionsLoading ? <p className="rounded-lg border border-dashed border-[#cbd7cc] bg-[#fafcf9] px-3 py-3 text-sm leading-relaxed text-[#77857b]">Danh mục hiện chưa có địa điểm. Tour vẫn lưu được dưới dạng bản nháp; liên kết địa điểm sẽ thêm sau khi danh mục được cấu hình.</p> : <p className="rounded-lg border border-dashed border-[#cbd7cc] bg-[#fafcf9] px-3 py-4 text-sm text-[#77857b]">Chưa chọn địa điểm. Có thể thêm các điểm từ danh mục.</p>}
            </div>
          </section>

          <section className={panelClass} aria-labelledby="tour-services-heading">
            <div className="border-b border-[#e1e6df] bg-[#fbfcfa] px-5 py-3"><h2 id="tour-services-heading" className="flex items-center gap-2 text-lg font-bold text-[#153a2b]"><Check className="h-5 w-5 text-[#176a50]" />Dịch vụ</h2></div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-[145px_1fr] items-start gap-3"><label htmlFor="tour-included" className={`${labelClass} mt-2`}>Dịch vụ bao gồm</label><textarea id="tour-included" value={includedServices} onChange={(event) => setIncludedServices(event.target.value)} rows={2} placeholder="VD: Hướng dẫn viên, ăn uống theo chương trình, lều trại…" className={`${fieldClass} resize-y`} /></div>
              <div className="grid grid-cols-[145px_1fr] items-start gap-3"><label htmlFor="tour-excluded" className={`${labelClass} mt-2`}>Dịch vụ không bao gồm</label><textarea id="tour-excluded" value={excludedServices} onChange={(event) => setExcludedServices(event.target.value)} rows={2} placeholder="VD: Chi phí cá nhân, di chuyển đến điểm tập kết…" className={`${fieldClass} resize-y`} /></div>
              <div><label htmlFor="tour-route-url" className={labelClass}>Tệp lộ trình (URL, tuỳ chọn)</label><input id="tour-route-url" type="url" value={routeFileUrl} onChange={(event) => setRouteFileUrl(event.target.value)} placeholder="https://…/route.gpx" className={fieldClass} /></div>
            </div>
          </section>
        </div>

        <aside className={`${panelClass} xl:sticky xl:top-4`} aria-labelledby="tour-links-heading">
          <div className="border-b border-[#e1e6df] bg-[#fbfcfa] px-5 py-3"><h2 id="tour-links-heading" className="flex items-center gap-2 text-lg font-bold text-[#153a2b]"><Link2 className="h-5 w-5 text-[#176a50]" />Cấu hình liên kết</h2></div>
          <div className="divide-y divide-[#e5e9e3] px-4">
            <section className="space-y-2.5 py-4">
              <label htmlFor="tour-cancellation-policy" className="flex items-center justify-between gap-3 text-sm font-semibold text-[#2a3d32]">Chính sách hủy (phiên bản)<span className="text-xs font-normal text-[#78877d]">Tuỳ chọn khi lưu nháp</span></label>
              <select id="tour-cancellation-policy" value={policyId} onChange={(event) => setPolicyId(event.target.value)} className={fieldClass}><option value="">Chưa chọn chính sách</option>{cancellationVersions.map((policy) => <option key={policy.id} value={policy.id}>{policy.title} · Phiên bản {policy.versionNumber}</option>)}</select>
              {policyId && (() => { const selected = cancellationVersions.find((item) => item.id === Number(policyId)); return selected ? <div className="rounded-lg bg-[#eef5ee] px-3 py-2 text-xs text-[#385a42]"><div className="font-semibold">Phiên bản {selected.versionNumber} · Hiệu lực từ {dateLabel(selected.effectiveFrom)}</div><div className="mt-1 flex items-center gap-1"><Check className="h-3.5 w-3.5" />Đã được duyệt và đang có hiệu lực</div></div> : null; })()}
              <p className="rounded-lg bg-[#f3f5f3] px-3 py-2.5 text-xs leading-relaxed text-[#58685e]">Tour cần có phiên bản chính sách hủy đã duyệt để xuất bản. Bản nháp có thể lưu trước.</p>
              {policyOptionsError && <p role="alert" className="text-xs text-rose-700">{policyOptionsError}</p>}
            </section>

            <section className="space-y-2.5 py-4">
              <div><h3 className="text-sm font-semibold text-[#2a3d32]">Điều khoản áp dụng</h3><p className="mt-0.5 text-xs text-[#78877d]">Chọn phiên bản có hiệu lực</p></div>
              {policyVersions.length ? <div className="space-y-2">{policyVersions.map((policy) => <label key={policy.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${selectedTerms.includes(policy.id) ? 'border-[#a9c8aa] bg-[#f0f6ef]' : 'border-[#e0e5df] hover:bg-[#fafbf9]'}`}><input type="checkbox" checked={selectedTerms.includes(policy.id)} onChange={() => toggleTerm(policy.id)} className="mt-0.5 accent-[#176a50]" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-snug text-[#35483a]">{policy.title} · Phiên bản {policy.versionNumber}</span><span className="mt-0.5 block text-xs text-[#78877d]">Hiệu lực từ {dateLabel(policy.effectiveFrom)}</span></span></label>)}</div> : !policyOptionsError ? <p className="rounded-lg border border-dashed border-[#ccd7cd] p-3 text-sm text-[#78877d]">Chưa có điều khoản phù hợp đang có hiệu lực.</p> : null}
            </section>

            <section className="py-4">
              <h3 className="flex items-center gap-2 rounded-lg bg-[#fbfcfa] py-1 text-base font-bold text-[#263c30]"><CalendarDays className="h-5 w-5 text-[#176a50]" />Lịch trình tour (theo ngày)</h3>
              <p className="mt-2 rounded-lg bg-[#f2f6f1] px-3 py-2.5 text-xs leading-relaxed text-[#58685e]">Tạo tour trước, sau đó thêm lịch trình từng ngày trong phần chỉnh sửa tour.</p>
            </section>

            <section className="py-4">
              <h3 className="flex items-center justify-between gap-2 rounded-lg bg-[#fbfcfa] py-1 text-base font-bold text-[#263c30]"><span className="flex items-center gap-2"><Package className="h-5 w-5 text-[#176a50]" />Thiết bị & combo thuê</span><ChevronDown className="h-4 w-4 text-[#718075]" /></h3>
              <p className="mt-2 rounded-lg bg-[#f2f6f1] px-3 py-2.5 text-xs leading-relaxed text-[#58685e]">Lưu bản nháp để cấu hình combo và thiết bị thuê từ danh mục thiết bị.</p>
            </section>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 mt-5 flex justify-end gap-3 border-t border-[#d5ddd3] bg-[#fbfcfa]/95 px-4 py-3 backdrop-blur-sm">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-[#bdc8bf] bg-white px-5 py-2.5 text-sm font-semibold text-[#3a4b40] hover:bg-[#f4f7f3] disabled:opacity-60">Huỷ</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#176a50] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#10583f] focus:outline-none focus:ring-2 focus:ring-[#176a50]/30 disabled:cursor-wait disabled:opacity-70">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{createdTourId ? 'Lưu và hoàn tất' : 'Lưu bản nháp'}</button>
      </div>
    </form>
  );
};

export default TourCreateForm;

