import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { tourAdminApi } from '../api/tourAdmin.api';
import type {
  ActivityResponse, CreateActivityRequest, CreateScheduleRequest, CreateTourRequest, RequiredItemResponse,
  ScheduleDetailResponse, ScheduleSummaryResponse, TourDetailResponse, TourMediaResponse,
  TourStatus, TourSummaryResponse, UpdateTourRequest, EquipmentCatalogResponse, RentalPackageTemplateResponse,
} from '../types/tour-contract.types';
import AdminEquipmentCatalogPage from './AdminEquipmentCatalogPage';
import AdminTourReviewPanel, { type TourSetupTab } from './AdminTourReviewPanel';

type Tab = TourSetupTab | 'review';
type TourForm = Required<CreateTourRequest>;
type ScheduleForm = {
  startsAt: string; endsAt: string; capacity: string; basePriceVnd: string;
  depositPercent: string; balanceDueAt: string; meetingPoint: string; contactPhone: string;
};
type ActivityForm = { dayNumber: string; displayOrder: string; startTime: string; title: string; description: string; locationId: string };

const blankTour = (): TourForm => ({ title: '', description: '', difficulty: null, durationDays: null, requiredExperience: '', includedServices: '', excludedServices: '', routeFileUrl: '' });
const blankSchedule = (): ScheduleForm => ({ startsAt: '', endsAt: '', capacity: '', basePriceVnd: '0', depositPercent: '0', balanceDueAt: '', meetingPoint: '', contactPhone: '' });
const blankActivity = (): ActivityForm => ({ dayNumber: '1', displayOrder: '1', startTime: '', title: '', description: '', locationId: '' });
const errorText = (error: unknown) => {
  if (error && typeof error === 'object') {
    const body = error as { message?: string; fieldErrors?: Record<string, string>; errors?: Record<string, string[]> };
    const fields = body.fieldErrors ? Object.entries(body.fieldErrors).map(([key, value]) => `${key}: ${value}`).join(' · ')
      : body.errors ? Object.entries(body.errors).map(([key, value]) => `${key}: ${value.join(', ')}`).join(' · ') : '';
    return [body.message, fields].filter(Boolean).join(' · ') || 'Request failed.';
  }
  return error instanceof Error ? error.message : 'Request failed.';
};
const localDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const two = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
};
const iso = (value: string) => value ? new Date(value).toISOString() : '';
const inputClass = 'mt-1 w-full rounded-lg border border-[#CAD4CF] bg-white px-3 py-2.5 text-sm text-[#1C2526] outline-none focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15';
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B33] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#CAD4CF] bg-white px-3 py-2 text-sm font-semibold text-[#34413D] hover:bg-[#F5F7F5] disabled:opacity-50';

export default function AdminTourManagementPage() {
  const { t, language } = useI18n();
  const [page, setPage] = useState(0);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [tours, setTours] = useState<TourSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<TourDetailResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<TourForm>(blankTour);
  const [tab, setTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSummaryResponse[]>([]);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [requiredItems, setRequiredItems] = useState<RequiredItemResponse[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogResponse[]>([]);
  const [rentalPackages, setRentalPackages] = useState<RentalPackageTemplateResponse[]>([]);
  const [selectedPackageTemplateId, setSelectedPackageTemplateId] = useState('');
  const [selectedIndividualEquipmentIds, setSelectedIndividualEquipmentIds] = useState<number[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(blankSchedule);
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityForm>(blankActivity);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<TourMediaResponse[]>([]);
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [showEquipmentCatalog, setShowEquipmentCatalog] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await tourAdminApi.list({ page, size: 10, query: query || undefined, status: status || undefined });
      setTours(result.content); setTotalPages(result.totalPages);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }, [page, query, status]);

  useEffect(() => { void loadList(); }, [loadList]);

  const selectTour = async (id: number) => {
    setLoading(true); setError(''); setNotice('');
    try {
      const detail = await tourAdminApi.read(id);
      setSelected(detail); setIsCreating(false); setForm({
        title: detail.title, description: detail.description ?? '', difficulty: detail.difficulty,
        durationDays: detail.durationDays, requiredExperience: detail.requiredExperience ?? '',
        includedServices: detail.includedServices ?? '', excludedServices: detail.excludedServices ?? '', routeFileUrl: detail.routeFileUrl ?? '',
      });
      setMedia(detail.media || []); setCaptions({}); setTab('details');
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selected) return;
    let active = true;
    const loadTab = async () => {
      setError('');
      try {
        if (tab === 'schedule') {
          const [pageData, details] = await Promise.all([
            tourAdminApi.schedules(selected.id), tourAdminApi.read(selected.id),
          ]);
          if (active) { setSchedules(pageData.content); setMedia(details.media || []); }
        } else if (tab === 'activities') {
          const result = await tourAdminApi.activities(selected.id); if (active) setActivities(result);
        } else if (tab === 'photos') {
          const detail = await tourAdminApi.read(selected.id); if (active) setMedia(detail.media || []);
        } else if (tab === 'equipment') {
          const [required, rental, catalog, templates] = await Promise.all([tourAdminApi.requiredItems(selected.id), tourAdminApi.equipment(selected.id), tourAdminApi.equipmentCatalog(), tourAdminApi.rentalPackages()]);
          if (active) {
            const assignedTemplate = rental.equipmentPackage?.packageTemplateId;
            const template = templates.find((row) => row.id === assignedTemplate);
            const bundledIds = new Set(template?.items.map((row) => row.equipmentId) ?? []);
            setRequiredItems(required); setEquipmentCatalog(catalog); setRentalPackages(templates);
            setSelectedPackageTemplateId(template ? String(template.id) : '');
            setSelectedIndividualEquipmentIds(rental.items.map((row) => row.equipmentId).filter((id) => !bundledIds.has(id)));
          }
        } else if (tab === 'review') {
          setReviewLoading(true);
          const [detail, schedulePage, activityRows, required, rental, catalog, templates] = await Promise.all([
            tourAdminApi.read(selected.id), tourAdminApi.schedules(selected.id), tourAdminApi.activities(selected.id),
            tourAdminApi.requiredItems(selected.id), tourAdminApi.equipment(selected.id),
            tourAdminApi.equipmentCatalog(), tourAdminApi.rentalPackages(),
          ]);
          if (active) {
            const assignedTemplate = rental.equipmentPackage?.packageTemplateId;
            const template = templates.find((row) => row.id === assignedTemplate) ?? null;
            const bundledIds = new Set(template?.items.map((row) => row.equipmentId) ?? []);
            setMedia(detail.media || []); setSchedules(schedulePage.content); setActivities(activityRows);
            setRequiredItems(required); setEquipmentCatalog(catalog); setRentalPackages(templates);
            setSelectedPackageTemplateId(template ? String(template.id) : '');
            setSelectedIndividualEquipmentIds(rental.items.map((row) => row.equipmentId).filter((id) => !bundledIds.has(id)));
          }
        }
      } catch (e) { if (active) setError(errorText(e)); }
      finally { if (active && tab === 'review') setReviewLoading(false); }
    };
    void loadTab();
    return () => { active = false; };
  }, [selected, tab]);

  const saveTour = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const body: CreateTourRequest = { ...form, durationDays: form.durationDays ? Number(form.durationDays) : null };
    try {
      const result = selected
        ? await tourAdminApi.update(selected.id, body as UpdateTourRequest)
        : await tourAdminApi.create(body);
      setSelected(result); setIsCreating(false); setForm({ ...form, durationDays: body.durationDays ?? null }); setMedia(result.media || []);
      setNotice(t(selected ? 'adminTour.saved' : 'adminTour.created')); await loadList();
    } catch (e) { setError(errorText(e)); }
    finally { setSaving(false); }
  };

  const createDraft = () => { setSelected(null); setIsCreating(true); setForm(blankTour()); setMedia([]); setTab('details'); setNotice(''); setError(''); };
  const deleteTour = async () => {
    if (!selected || !window.confirm(t('adminTour.deleteConfirm'))) return;
    setBusy(true); setError(''); setNotice('');
    try { await tourAdminApi.delete(selected.id); setSelected(null); setIsCreating(false); setForm(blankTour()); setMedia([]); setNotice(t('adminTour.deleted')); await loadList(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const saveSchedule = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    const body: CreateScheduleRequest = {
      startsAt: iso(scheduleForm.startsAt), endsAt: iso(scheduleForm.endsAt), capacity: Number(scheduleForm.capacity),
      basePriceVnd: Number(scheduleForm.basePriceVnd), equipmentFeeVnd: 0,
      depositPercent: Number(scheduleForm.depositPercent), balanceDueAt: iso(scheduleForm.balanceDueAt),
      meetingPoint: scheduleForm.meetingPoint || null, contactPhone: scheduleForm.contactPhone || null,
    };
    try {
      if (editingSchedule) await tourAdminApi.updateSchedule(selected.id, editingSchedule, body);
      else await tourAdminApi.createSchedule(selected.id, body);
      setScheduleForm(blankSchedule()); setEditingSchedule(null); setNotice(t('adminTour.scheduleSaved'));
      setSchedules((await tourAdminApi.schedules(selected.id)).content);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const editSchedule = async (id: number) => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const row: ScheduleDetailResponse = await tourAdminApi.schedule(selected.id, id);
      setEditingSchedule(id); setScheduleForm({ startsAt: localDateTime(row.startsAt), endsAt: localDateTime(row.endsAt), capacity: String(row.capacity), basePriceVnd: String(row.basePriceVnd), depositPercent: String(row.depositPercent), balanceDueAt: localDateTime(row.balanceDueAt), meetingPoint: row.meetingPoint || '', contactPhone: row.contactPhone || '' });
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const removeSchedule = async (id: number) => {
    if (!selected || !window.confirm(t('adminTour.deleteItemConfirm'))) return;
    setBusy(true); setError('');
    try { await tourAdminApi.deleteSchedule(selected.id, id); setSchedules((await tourAdminApi.schedules(selected.id)).content); setNotice(t('adminTour.scheduleDeleted')); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const saveActivity = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    const body: CreateActivityRequest = { dayNumber: Number(activityForm.dayNumber), displayOrder: Number(activityForm.displayOrder), startTime: activityForm.startTime ? `${activityForm.startTime}:00` : null, title: activityForm.title, description: activityForm.description || null, locationId: activityForm.locationId ? Number(activityForm.locationId) : null };
    try {
      if (editingActivity) await tourAdminApi.updateActivity(selected.id, editingActivity, body);
      else await tourAdminApi.createActivity(selected.id, body);
      setActivityForm(blankActivity()); setEditingActivity(null); setActivities(await tourAdminApi.activities(selected.id)); setNotice(t('adminTour.activitySaved'));
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const editActivity = (item: ActivityResponse) => {
    setEditingActivity(item.id); setActivityForm({ dayNumber: String(item.dayNumber), displayOrder: String(item.displayOrder), startTime: item.startTime?.slice(0, 5) || '', title: item.title, description: item.description || '', locationId: item.locationId === null ? '' : String(item.locationId) });
  };
  const removeActivity = async (id: number) => {
    if (!selected || !window.confirm(t('adminTour.deleteItemConfirm'))) return;
    setBusy(true); setError('');
    try { await tourAdminApi.deleteActivity(selected.id, id); setActivities(await tourAdminApi.activities(selected.id)); setNotice(t('adminTour.activityDeleted')); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const uploadPhoto = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !uploadFile) return;
    if (uploadFile.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(uploadFile.type)) { setError(t('adminTour.imageLimit')); return; }
    setBusy(true); setError(''); setNotice('');
    try { await tourAdminApi.uploadMedia(selected.id, uploadFile, caption); setUploadFile(null); setCaption(''); setMedia((await tourAdminApi.read(selected.id)).media || []); setNotice(t('adminTour.imageUploaded')); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  const mediaAction = async (action: () => Promise<unknown>, success: string) => {
    if (!selected) return; setBusy(true); setError(''); setNotice('');
    try { await action(); setMedia((await tourAdminApi.read(selected.id)).media || []); setNotice(t(success)); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  const moveMedia = async (index: number, delta: number) => {
    const next = [...media]; const target = index + delta;
    if (target < 0 || target >= next.length || !selected) return;
    [next[index], next[target]] = [next[target], next[index]];
    await mediaAction(() => tourAdminApi.reorderMedia(selected.id, next.map((item) => item.id)), 'adminTour.orderSaved');
  };
  const saveEquipmentAssignment = async () => {
    if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await tourAdminApi.assignEquipment(selected.id, {
        packageTemplateId: selectedPackageTemplateId ? Number(selectedPackageTemplateId) : null,
        individualEquipmentIds: selectedIndividualEquipmentIds,
      });
      setNotice(t('adminEquipment.tourEquipmentSaved'));
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  const returnFromEquipmentCatalog = async () => {
    setShowEquipmentCatalog(false); setError('');
    try {
      const [catalog, templates] = await Promise.all([tourAdminApi.equipmentCatalog(), tourAdminApi.rentalPackages()]);
      setEquipmentCatalog(catalog); setRentalPackages(templates);
      const included = new Set(templates.find((item) => String(item.id) === selectedPackageTemplateId)?.items.map((item) => item.equipmentId) ?? []);
      setSelectedIndividualEquipmentIds((ids) => ids.filter((id) => !included.has(id)));
    } catch (e) { setError(errorText(e)); }
  };
  const selectedTemplate = rentalPackages.find((item) => String(item.id) === selectedPackageTemplateId);
  const templateEquipmentIds = new Set(selectedTemplate?.items.map((item) => item.equipmentId) ?? []);
  const individualOptions = equipmentCatalog.filter((item) => !templateEquipmentIds.has(item.id));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: t('adminTour.details') }, { id: 'activities', label: t('adminTour.activities') },
    { id: 'photos', label: t('adminTour.photos') }, { id: 'equipment', label: t('adminTour.equipment') },
    { id: 'schedule', label: t('adminTour.schedule') }, { id: 'review', label: t('adminTour.review.tab') },
  ];
  const statusLabel = (value: TourStatus) => t(`adminTour.status.${value.toLowerCase()}`);
  const formatter = useMemo(() => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }), [language]);
  const currency = useMemo(() => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-GB'), [language]);
  const label = (name: string, child: ReactNode) => <label className="block text-sm font-medium text-[#34413D]">{name}{child}</label>;

  if (showEquipmentCatalog) return <AdminEquipmentCatalogPage onBack={() => void returnFromEquipmentCatalog()} />;

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-[#697671]">{t('adminTour.subtitle')}</p><h2 className="mt-1 text-2xl font-bold text-[#1C2526]">{t('adminTour.title')}</h2></div>
      <div className="flex flex-wrap gap-2"><button type="button" className={secondaryClass} onClick={() => setShowEquipmentCatalog(true)}><Plus className="h-4 w-4" />{t('adminEquipment.manageCatalog')}</button><button className={buttonClass} onClick={createDraft}><Plus className="h-4 w-4" />{t('adminTour.new')}</button></div>
    </div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="h-4 w-4" />{notice}</div>}

    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white">
        <form className="space-y-3 border-b border-[#E6E1D8] p-4" onSubmit={(event) => { event.preventDefault(); setPage(0); setQuery(queryInput.trim()); }}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#697671]">{t('adminTour.list')}
            <input className={inputClass} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder={t('adminTour.search')} />
          </label>
          <label className="block text-xs font-semibold text-[#697671]">{t('adminTour.status')}
            <select className={inputClass} value={status} onChange={(event) => { setPage(0); setStatus(event.target.value); }}>
              <option value="">{t('adminTour.allStatuses')}</option>{(['DRAFT','PENDING','PUBLISHED','REJECTED','ARCHIVED'] as TourStatus[]).map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
            </select>
          </label>
        </form>
        <div className="max-h-[62vh] divide-y divide-[#F0EEE9] overflow-y-auto">
          {loading && tours.length === 0 ? <p className="p-4 text-sm text-[#697671]">{t('adminTour.loading')}</p> : tours.length === 0 ? <p className="p-4 text-sm text-[#697671]">{t('adminTour.empty')}</p> : tours.map((item) => <button key={item.id} onClick={() => void selectTour(item.id)} className={`flex w-full items-start gap-3 p-3 text-left hover:bg-[#F7F8F6] ${selected?.id === item.id ? 'bg-[#F1F6F3]' : ''}`}>
            {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="h-14 w-16 rounded-lg object-cover" /> : <div className="flex h-14 w-16 items-center justify-center rounded-lg bg-[#F2F0EA] text-xs text-[#697671]">{t('adminTour.noCover')}</div>}
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#1C2526]">{item.title}</span><span className="mt-1 block text-xs text-[#697671]">#{item.id} · {statusLabel(item.status)}</span></span>
          </button>)}
        </div>
        <div className="flex items-center justify-between border-t border-[#E6E1D8] px-3 py-2 text-xs text-[#697671]">
          <button className="rounded px-2 py-1 hover:bg-[#F5F7F5] disabled:opacity-40" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>{t('adminTour.previous')}</button>
          <span>{t('adminTour.page', { current: page + 1, total: Math.max(totalPages, 1) })}</span>
          <button className="rounded px-2 py-1 hover:bg-[#F5F7F5] disabled:opacity-40" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>{t('adminTour.next')}</button>
        </div>
      </aside>

      <section className="min-w-0 rounded-2xl border border-[#E6E1D8] bg-white">
        {!selected && !isCreating ? <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><p className="max-w-sm text-sm text-[#697671]">{t('adminTour.select')}</p><button className={`${buttonClass} mt-4`} onClick={createDraft}><Plus className="h-4 w-4" />{t('adminTour.create')}</button></div> : <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D8] px-5 py-4">
            <div><p className="text-xs uppercase tracking-wide text-[#697671]">{selected ? t('adminTour.id', { id: selected.id }) : t('adminTour.create')}</p><h3 className="mt-1 text-lg font-bold text-[#1C2526]">{form.title || t('adminTour.titleField')}</h3></div>
            <div className="flex items-center gap-2">{selected && <><span className="rounded-full bg-[#F2F0EA] px-3 py-1 text-xs font-semibold text-[#52605D]">{statusLabel(selected.status)}</span><button className={secondaryClass} onClick={() => void deleteTour()} disabled={busy}><Trash2 className="h-4 w-4" />{t('adminTour.delete')}</button></>}</div>
          </div>
          {selected && <div className="flex gap-1 overflow-x-auto border-b border-[#E6E1D8] px-4" role="tablist" aria-label={t('adminTour.title')}>
            {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${tab === item.id ? 'border-[#1F4E43] text-[#1F4E43]' : 'border-transparent text-[#697671] hover:text-[#1C2526]'}`}>{item.label}</button>)}
          </div>}

          {(!selected || tab === 'details') && <form onSubmit={(event) => void saveTour(event)} className="space-y-5 p-5">
            {selected && <div className="rounded-lg bg-[#F7F8F6] p-3 text-sm text-[#52605D]"><strong>{t('adminTour.statusLabel')}:</strong> {statusLabel(selected.status)}. {t('adminTour.publishNote')}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              {label(t('adminTour.titleField'), <input required maxLength={200} className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />)}
              {label(t('adminTour.difficulty'), <select className={inputClass} value={form.difficulty || ''} onChange={(e) => setForm({ ...form, difficulty: (e.target.value || null) as TourForm['difficulty'] })}><option value="">{t('adminTour.chooseDifficulty')}</option><option value="EASY">Easy</option><option value="MODERATE">Moderate</option><option value="HARD">Hard</option><option value="EXPERT">Expert</option></select>)}
              {label(t('adminTour.duration'), <input type="number" min="1" className={inputClass} value={form.durationDays ?? ''} onChange={(e) => setForm({ ...form, durationDays: e.target.value ? Number(e.target.value) : null })} />)}
              {label(t('adminTour.experience'), <input className={inputClass} value={form.requiredExperience || ''} onChange={(e) => setForm({ ...form, requiredExperience: e.target.value })} />)}
            </div>
            {label(t('adminTour.description'), <textarea rows={4} className={inputClass} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />)}
            <div className="grid gap-4 md:grid-cols-2">
              {label(t('adminTour.included'), <textarea rows={3} className={inputClass} value={form.includedServices || ''} onChange={(e) => setForm({ ...form, includedServices: e.target.value })} />)}
              {label(t('adminTour.excluded'), <textarea rows={3} className={inputClass} value={form.excludedServices || ''} onChange={(e) => setForm({ ...form, excludedServices: e.target.value })} />)}
            </div>
            {label(t('adminTour.route'), <input type="url" className={inputClass} value={form.routeFileUrl || ''} onChange={(e) => setForm({ ...form, routeFileUrl: e.target.value })} />)}
            <div className="flex justify-end"><button className={buttonClass} disabled={saving}><Save className="h-4 w-4" />{saving ? t('adminTour.saving') : selected ? t('adminTour.save') : t('adminTour.create')}</button></div>
          </form>}

          {selected && tab === 'schedule' && <div className="space-y-5 p-5">
            <form onSubmit={(event) => void saveSchedule(event)} className="rounded-xl border border-[#E6E1D8] bg-[#FDFBF7] p-4">
              <h4 className="mb-4 font-semibold text-[#1C2526]">{editingSchedule ? t('adminTour.editSchedule') : t('adminTour.addSchedule')}</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {label(t('adminTour.startsAt'), <input required type="datetime-local" className={inputClass} value={scheduleForm.startsAt} onChange={(e) => setScheduleForm({ ...scheduleForm, startsAt: e.target.value })} />)}
                {label(t('adminTour.endsAt'), <input required type="datetime-local" className={inputClass} value={scheduleForm.endsAt} onChange={(e) => setScheduleForm({ ...scheduleForm, endsAt: e.target.value })} />)}
                {label(t('adminTour.balanceDue'), <input required type="datetime-local" className={inputClass} value={scheduleForm.balanceDueAt} onChange={(e) => setScheduleForm({ ...scheduleForm, balanceDueAt: e.target.value })} />)}
                {label(t('adminTour.capacity'), <input required type="number" min="1" className={inputClass} value={scheduleForm.capacity} onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: e.target.value })} />)}
                {label(t('adminTour.basePrice'), <input required type="number" min="0" className={inputClass} value={scheduleForm.basePriceVnd} onChange={(e) => setScheduleForm({ ...scheduleForm, basePriceVnd: e.target.value })} />)}
                {label(t('adminTour.deposit'), <input required type="number" min="0.01" max="100" step="0.01" className={inputClass} value={scheduleForm.depositPercent} onChange={(e) => setScheduleForm({ ...scheduleForm, depositPercent: e.target.value })} />)}
                {label(t('adminTour.meetingPoint'), <input className={inputClass} value={scheduleForm.meetingPoint} onChange={(e) => setScheduleForm({ ...scheduleForm, meetingPoint: e.target.value })} />)}
                {label(t('adminTour.contactPhone'), <input className={inputClass} value={scheduleForm.contactPhone} onChange={(e) => setScheduleForm({ ...scheduleForm, contactPhone: e.target.value })} />)}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#697671]">{t('adminTour.rentalPriceIsSeparate')}</p>
              <div className="mt-4 flex gap-2"><button className={buttonClass} disabled={busy}><Save className="h-4 w-4" />{t('adminTour.saveSchedule')}</button>{editingSchedule && <button type="button" className={secondaryClass} onClick={() => { setEditingSchedule(null); setScheduleForm(blankSchedule()); }}>{t('adminTour.cancel')}</button>}</div>
            </form>
            <div className="space-y-2">{schedules.length === 0 ? <p className="text-sm text-[#697671]">{t('adminTour.noSchedules')}</p> : schedules.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6E1D8] p-4">
              <div><h5 className="font-semibold text-[#1C2526]">{formatter.format(new Date(item.startsAt))} – {formatter.format(new Date(item.endsAt))}</h5><p className="mt-1 text-xs text-[#697671]">{t('adminTour.capacity')}: {item.capacity} · {t('adminTour.heldSeats')}: {item.heldSeats} · {t('adminTour.confirmedSeats')}: {item.confirmedSeats} · {currency.format(item.basePriceVnd)} VND</p></div>
              <div className="flex gap-2"><button className={secondaryClass} onClick={() => void editSchedule(item.id)} disabled={busy}>{t('adminTour.edit')}</button><button className={secondaryClass} onClick={() => void removeSchedule(item.id)} disabled={busy}><Trash2 className="h-4 w-4" />{t('adminTour.remove')}</button></div>
            </article>)}</div>
          </div>}

          {selected && tab === 'activities' && <div className="space-y-5 p-5">
            <form onSubmit={(event) => void saveActivity(event)} className="rounded-xl border border-[#E6E1D8] bg-[#FDFBF7] p-4">
              <h4 className="mb-4 font-semibold text-[#1C2526]">{editingActivity ? t('adminTour.editActivity') : t('adminTour.addActivity')}</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {label(t('adminTour.dayNumber'), <input required type="number" min="1" className={inputClass} value={activityForm.dayNumber} onChange={(e) => setActivityForm({ ...activityForm, dayNumber: e.target.value })} />)}
                {label(t('adminTour.order'), <input required type="number" min="0" className={inputClass} value={activityForm.displayOrder} onChange={(e) => setActivityForm({ ...activityForm, displayOrder: e.target.value })} />)}
                {label(t('adminTour.time'), <input type="time" className={inputClass} value={activityForm.startTime} onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })} />)}
                {label(t('adminTour.activityName'), <input required maxLength={200} className={inputClass} value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />)}
                {label(t('adminTour.locationId'), <input type="number" min="1" className={inputClass} value={activityForm.locationId} onChange={(e) => setActivityForm({ ...activityForm, locationId: e.target.value })} />)}
                {label(t('adminTour.activityDescription'), <textarea className={inputClass} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />)}
              </div>
              <div className="mt-4 flex gap-2"><button className={buttonClass} disabled={busy}><Save className="h-4 w-4" />{t('adminTour.saveActivity')}</button>{editingActivity && <button type="button" className={secondaryClass} onClick={() => { setEditingActivity(null); setActivityForm(blankActivity()); }}>{t('adminTour.cancel')}</button>}</div>
            </form>
            <div className="space-y-2">{activities.length === 0 ? <p className="text-sm text-[#697671]">{t('adminTour.noActivities')}</p> : activities.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6E1D8] p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#697671]">{t('trip.day', { day: item.dayNumber })}{item.startTime ? ` · ${item.startTime.slice(0, 5)}` : ''}</p><h5 className="font-semibold text-[#1C2526]">{item.title}</h5>{item.description && <p className="mt-1 text-sm text-[#52605D]">{item.description}</p>}</div><div className="flex gap-2"><button className={secondaryClass} onClick={() => editActivity(item)}>{t('adminTour.edit')}</button><button className={secondaryClass} onClick={() => void removeActivity(item.id)} disabled={busy}><Trash2 className="h-4 w-4" />{t('adminTour.remove')}</button></div></article>)}</div>
          </div>}

          {selected && tab === 'photos' && <div className="space-y-5 p-5">
            <form onSubmit={(event) => void uploadPhoto(event)} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E6E1D8] bg-[#FDFBF7] p-4">
              <label className="min-w-48 flex-1 text-sm font-medium text-[#34413D]">{t('adminTour.uploadImage')}<input required type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#EAF0EC] file:px-3 file:py-1.5`} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /><span className="mt-1 block text-xs text-[#697671]">{t('adminTour.imageLimit')}</span></label>
              <label className="min-w-48 flex-1 text-sm font-medium text-[#34413D]">{t('adminTour.caption')}<input className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
              <button className={buttonClass} disabled={busy || !uploadFile}><ImagePlus className="h-4 w-4" />{busy ? t('adminTour.uploading') : t('adminTour.uploadImage')}</button>
            </form>
            {media.length === 0 ? <p className="text-sm text-[#697671]">{t('adminTour.noImages')}</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{media.map((item, index) => <article key={item.id} className="overflow-hidden rounded-xl border border-[#E6E1D8]">
              <img src={item.url} alt={item.caption || t('trip.photo', { number: index + 1 })} className="h-44 w-full bg-[#F2F0EA] object-cover" />
              <div className="space-y-3 p-3"><div className="flex items-center justify-between gap-2">{item.isCover ? <span className="rounded-full bg-[#EAF0EC] px-2.5 py-1 text-xs font-semibold text-[#1F4E43]">{t('adminTour.cover')}</span> : <button className="text-xs font-semibold text-[#1F4E43] hover:underline" onClick={() => void mediaAction(() => tourAdminApi.setCover(selected.id, item.id), 'adminTour.coverSaved')}>{t('adminTour.setCover')}</button>}</div>
                <div className="flex gap-2"><input aria-label={t('adminTour.caption')} className="min-w-0 flex-1 rounded-lg border border-[#CAD4CF] px-2 py-2 text-sm" value={captions[item.id] ?? item.caption ?? ''} onChange={(e) => setCaptions({ ...captions, [item.id]: e.target.value })} /><button className={secondaryClass} aria-label={t('adminTour.saveCaption')} onClick={() => void mediaAction(() => tourAdminApi.updateCaption(selected.id, item.id, captions[item.id] ?? item.caption), 'adminTour.captionSaved')}><Save className="h-4 w-4" /></button></div>
                <div className="flex justify-between gap-2"><div className="flex gap-1"><button className={secondaryClass} aria-label={t('adminTour.moveUp')} disabled={index === 0 || busy} onClick={() => void moveMedia(index, -1)}><ArrowUp className="h-4 w-4" /></button><button className={secondaryClass} aria-label={t('adminTour.moveDown')} disabled={index === media.length - 1 || busy} onClick={() => void moveMedia(index, 1)}><ArrowDown className="h-4 w-4" /></button></div><button className={secondaryClass} disabled={busy} onClick={() => void mediaAction(() => tourAdminApi.deleteMedia(selected.id, item.id), 'adminTour.imageDeleted')}><Trash2 className="h-4 w-4" />{t('adminTour.remove')}</button></div>
              </div></article>)}</div>}
          </div>}

          {selected && tab === 'equipment' && <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-[#52605D]">{t('adminEquipment.tourAssignmentHelp')}</p><button type="button" className={secondaryClass} onClick={() => setShowEquipmentCatalog(true)}><Plus className="h-4 w-4" />{t('adminEquipment.manageCatalog')}</button></div>
            <section className="rounded-xl border border-[#E6E1D8] p-4"><h4 className="font-semibold text-[#1C2526]">{t('adminTour.requiredItems')}</h4><p className="mt-1 text-xs text-[#697671]">{t('adminTour.readOnly')}</p>{requiredItems.length === 0 ? <p className="mt-2 text-sm text-[#697671]">{t('adminTour.noRequiredItems')}</p> : <ul className="mt-3 divide-y divide-[#F0EEE9]">{requiredItems.map((item) => <li key={item.id} className="flex justify-between gap-4 py-2 text-sm"><span>{item.name}{item.note ? <span className="block text-xs text-[#697671]">{item.note}</span> : null}</span><span className="text-xs text-[#697671]">{item.isRequired ? t('trip.requiredItem') : t('trip.optionalItem')}</span></li>)}</ul>}</section>
            <section className="space-y-4 rounded-xl border border-[#E6E1D8] p-4">
              <div><h4 className="font-semibold text-[#1C2526]">{t('adminEquipment.chooseTourPackage')}</h4><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.chooseTourPackageHelp')}</p></div>
              {rentalPackages.length === 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F7F8F6] p-3"><p className="text-sm text-[#52605D]">{t('adminEquipment.noPackagesForTour')}</p><button type="button" className={secondaryClass} onClick={() => setShowEquipmentCatalog(true)}>{t('adminEquipment.manageCatalog')}</button></div>}
              <label className="block max-w-xl text-sm font-medium text-[#34413D]">{t('adminEquipment.rentalPackage')}<select className={inputClass} value={selectedPackageTemplateId} onChange={(event) => { const nextTemplate = rentalPackages.find((row) => String(row.id) === event.target.value); const included = new Set(nextTemplate?.items.map((item) => item.equipmentId) ?? []); setSelectedPackageTemplateId(event.target.value); setSelectedIndividualEquipmentIds((ids) => ids.filter((id) => !included.has(id))); }}><option value="">{t('adminEquipment.noPackage')}</option>{rentalPackages.map((item) => <option key={item.id} value={item.id}>{item.title} · {currency.format(item.rentalPriceVnd)} VND</option>)}</select></label>
              {selectedTemplate && <div className="rounded-lg bg-[#F7F8F6] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#1C2526]">{selectedTemplate.title}</strong><span className="text-sm font-semibold text-[#1F4E43]">{currency.format(selectedTemplate.rentalPriceVnd)} VND / {t('adminEquipment.perPackage')}</span></div><ul className="mt-2 divide-y divide-[#E6E1D8]">{selectedTemplate.items.map((item) => { const individualPrice = item.individualRentalPriceVnd ?? equipmentCatalog.find((catalogItem) => catalogItem.id === item.equipmentId)?.individualRentalPriceVnd; return <li key={item.equipmentId} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{item.name} · {t('adminTour.quantityInPackage', { count: item.quantityInPackage })}</span><span className="text-xs text-[#697671]">{t('adminTour.individualPrice')}: {individualPrice == null ? '—' : `${currency.format(individualPrice)} VND / ${t('adminEquipment.perItem')}`}</span></li>; })}</ul>{selectedTemplate.sharedItems && <p className="mt-2 text-xs text-[#52605D]"><strong>{t('adminEquipment.sharedEquipment')}:</strong> {selectedTemplate.sharedItems}</p>}{selectedTemplate.personalItemsToBring && <p className="mt-1 text-xs text-[#52605D]"><strong>{t('adminEquipment.personalItems')}:</strong> {selectedTemplate.personalItemsToBring}</p>}</div>}
              <div><h5 className="font-semibold text-[#1C2526]">{t('adminEquipment.individualItems')}</h5><p className="mt-1 text-xs text-[#697671]">{t('adminEquipment.individualItemsHelp')}</p>{individualOptions.length === 0 ? <p className="mt-2 text-sm text-[#697671]">{t('adminEquipment.noIndividualOptions')}</p> : <ul className="mt-2 divide-y divide-[#F0EEE9] rounded-lg border border-[#E6E1D8]">{individualOptions.map((item) => { const included = selectedIndividualEquipmentIds.includes(item.id); const rentable = item.individualRentalPriceVnd !== null; return <li key={item.id} className="flex items-center gap-3 p-3"><input id={`tour-single-item-${item.id}`} type="checkbox" disabled={!rentable && !included} className="h-4 w-4 accent-[#1F4E43] disabled:opacity-40" checked={included} onChange={(event) => setSelectedIndividualEquipmentIds((ids) => event.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id))} /><label htmlFor={`tour-single-item-${item.id}`} className={`flex min-w-0 flex-1 items-center justify-between gap-3 text-sm ${rentable || included ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}><span className="font-medium text-[#1C2526]">{item.name}</span><span className="whitespace-nowrap text-xs text-[#697671]">{item.individualRentalPriceVnd == null ? t('adminEquipment.notForIndividualRental') : `${currency.format(item.individualRentalPriceVnd)} VND / ${t('adminEquipment.perItem')}`}</span></label></li>; })}</ul>}</div>
              <div className="flex flex-wrap items-center gap-3"><button className={buttonClass} disabled={busy} onClick={() => void saveEquipmentAssignment()}><Save className="h-4 w-4" />{busy ? t('adminEquipment.saving') : t('adminEquipment.saveTourEquipment')}</button><span className="text-xs text-[#697671]">{t('adminEquipment.tourEquipmentSnapshotNote')}</span></div>
            </section>
          </div>}

          {selected && tab === 'review' && <AdminTourReviewPanel
            tour={selected}
            schedules={schedules}
            activities={activities}
            requiredItems={requiredItems}
            media={media}
            rentalPackage={rentalPackages.find((item) => String(item.id) === selectedPackageTemplateId) ?? null}
            individualItems={equipmentCatalog.filter((item) => selectedIndividualEquipmentIds.includes(item.id))}
            loading={reviewLoading}
            formatDate={(value) => formatter.format(new Date(value))}
            formatMoney={(value) => currency.format(value)}
            onEdit={setTab}
          />}
        </>}
      </section>
    </div>
  </div>;
}
