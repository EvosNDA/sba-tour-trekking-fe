import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  CancellationPolicyVersionDto,
  EquipmentPackageWriteRequest,
  PartnerTourItemDto,
  PartnerTourDraftRequest,
  PartnerScheduleRequest,
  TourRosterDto,
} from '../../../features/tours/types/tour.types';

const emptyDraft: PartnerTourDraftRequest = { title: '', description: '', difficulty: 'moderate', durationDays: 1, itinerary: [], media: [], packingList: [], cancellationPolicyVersionId: 0, locationIds: [] };
const emptyEquipment: EquipmentPackageWriteRequest = { title: '', includedItems: '', sharedItems: '', personalItemsToBring: '' };
interface ScheduleFormState { startsAt: string; endsAt: string; capacity: string; basePriceVnd: string; equipmentFeeVnd: string; depositPercent: string; balanceDueAt: string; meetingPoint: string; contactPhone: string; }
const emptySchedule: ScheduleFormState = { startsAt: '', endsAt: '', capacity: '', basePriceVnd: '', equipmentFeeVnd: '', depositPercent: '', balanceDueAt: '', meetingPoint: '', contactPhone: '' };
const errorText = (error: unknown) => typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Request failed. No changes were confirmed.';
const dateTimeValue = (value: string) => value ? new Date(value).toISOString().slice(0, 16) : '';
const inputClass = 'mt-1.5 block w-full rounded-lg border border-[#D7DFDA] bg-white px-3 py-2.5 text-sm text-[#1C2526] placeholder:text-[#87918D] shadow-sm outline-none transition focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15';
const fieldClass = 'block min-w-0 text-sm font-medium text-[#34413D]';
const cardClass = 'rounded-2xl border border-[#E2E7E4] bg-white p-5 shadow-sm md:p-6';

export const PartnerTourManagementPage: React.FC = () => {
  const { t } = useI18n();
  const [tours, setTours] = useState<PartnerTourItemDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [draft, setDraft] = useState<PartnerTourDraftRequest>(emptyDraft);
  const [schedule, setSchedule] = useState<ScheduleFormState>(emptySchedule);
  const [equipment, setEquipment] = useState<EquipmentPackageWriteRequest>(emptyEquipment);
  const [policies, setPolicies] = useState<CancellationPolicyVersionDto[]>([]);
  const [roster, setRoster] = useState<TourRosterDto | null>(null);
  const [rosterScheduleId, setRosterScheduleId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [leadGuideId, setLeadGuideId] = useState('');
  const [supportGuideIds, setSupportGuideIds] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const editorRef = useRef<HTMLElement>(null);

  const loadTours = async () => {
    setLoading(true); setError(null);
    try { const result = await toursApi.getPartnerTours({ page: 0, size: 50 }); setTours(result.items); }
    catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTours(); }, []);
  useEffect(() => { void toursApi.getCancellationPolicyVersions().then(result => setPolicies(result.items)).catch(e => setError(errorText(e))); }, []);
  useEffect(() => {
    if (isCreating || selectedId !== null) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isCreating, selectedId]);

  const chooseTour = async (id: number) => {
    setSelectedId(id); setIsCreating(false); setDraft(emptyDraft); setEquipment(emptyEquipment); setNotice(null); setError(null); setRoster(null); setLoadingTour(true);
    try {
      const tour = await toursApi.getPartnerTour(id);
      setDraft({ title: tour.title, description: tour.description || '', difficulty: tour.difficulty || 'moderate', durationDays: tour.durationDays || 1, requiredExperience: tour.requiredExperience, itinerary: tour.itinerary, media: tour.media.map(({ id: _id, ...item }) => item), includedServices: tour.includedServices, excludedServices: tour.excludedServices, packingList: tour.packingList.map(({ id: _id, ...item }) => item), cancellationPolicyVersionId: tour.cancellationPolicyVersionId || 0, routeFileUrl: tour.routeFileUrl, locationIds: tour.locationIds });
      const currentEquipment = tour.equipmentOptions?.[0];
      setEquipment(currentEquipment ? { title: currentEquipment.title, includedItems: currentEquipment.includedItems, sharedItems: currentEquipment.sharedItems, personalItemsToBring: currentEquipment.personalItemsToBring } : emptyEquipment);
    } catch (e) { setError(errorText(e)); }
    finally { setLoadingTour(false); }
  };
  const startNewTour = () => { setSelectedId(null); setIsCreating(true); setDraft(emptyDraft); setEquipment(emptyEquipment); setSchedule(emptySchedule); setRoster(null); setError(null); setNotice(null); };
  const closeEditor = () => { setSelectedId(null); setIsCreating(false); setDraft(emptyDraft); setEquipment(emptyEquipment); setSchedule(emptySchedule); setRoster(null); setError(null); };
  const mutate = async (action: () => Promise<unknown>, successKey: string, reload = true): Promise<boolean> => {
    setBusy(true); setError(null); setNotice(null);
    try { await action(); setNotice(t(successKey)); if (reload) await loadTours(); return true; }
    catch (e) { setError(errorText(e)); return false; }
    finally { setBusy(false); }
  };
  const updateDraft = <K extends keyof PartnerTourDraftRequest>(key: K, value: PartnerTourDraftRequest[K]) => setDraft(d => ({ ...d, [key]: value }));
  const scheduleRequest = (): PartnerScheduleRequest | null => {
    const requiredNumbers = [schedule.capacity, schedule.basePriceVnd, schedule.equipmentFeeVnd, schedule.depositPercent];
    if (!schedule.startsAt || !schedule.endsAt || !schedule.balanceDueAt || requiredNumbers.some(value => value.trim() === '' || !Number.isFinite(Number(value)))) return null;
    const startsAt = new Date(schedule.startsAt).getTime(); const endsAt = new Date(schedule.endsAt).getTime();
    const capacity = Number(schedule.capacity); const basePriceVnd = Number(schedule.basePriceVnd); const equipmentFeeVnd = Number(schedule.equipmentFeeVnd); const depositPercent = Number(schedule.depositPercent);
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt || capacity < 1 || basePriceVnd < 0 || equipmentFeeVnd < 0 || depositPercent < 0.01 || depositPercent > 100) return null;
    return { startsAt: schedule.startsAt, endsAt: schedule.endsAt, capacity, basePriceVnd, equipmentFeeVnd, depositPercent, balanceDueAt: schedule.balanceDueAt, meetingPoint: schedule.meetingPoint, contactPhone: schedule.contactPhone, guideAssignments: [...(leadGuideId && Number(leadGuideId) > 0 ? [{ guideId: Number(leadGuideId), isLead: true }] : []), ...supportGuideIds.split(',').map(x => Number(x.trim())).filter(guideId => Number.isFinite(guideId) && guideId > 0).map(guideId => ({ guideId, isLead: false }))] };
  };
  const selectedTour = tours.find(tour => tour.id === selectedId);
  const statusText = (status: string) => t(`partnerTour.status.${status}`);
  const saveTour = async () => {
    if (!draft.cancellationPolicyVersionId) { setError(t('partnerTour.selectPolicyError')); return; }
    const creating = selectedId === null;
    const saved = await mutate(() => creating ? toursApi.createPartnerTour(draft) : toursApi.updatePartnerTour(selectedId as number, draft), creating ? 'partnerTour.created' : 'partnerTour.saved');
    if (saved && creating) setIsCreating(false);
  };
  const startArchive = async (tourId: number) => {
    if (!window.confirm(t('partnerTour.archiveConfirm'))) return;
    if (await mutate(() => toursApi.archivePartnerTour(tourId), 'partnerTour.archived')) {
      if (selectedId === tourId) closeEditor();
    }
  };
  const restoreTour = async (tourId: number) => {
    if (await mutate(() => toursApi.restorePartnerTour(tourId), 'partnerTour.restored')) {
      await chooseTour(tourId);
      setNotice(t('partnerTour.restoreNextSteps'));
    }
  };

  return <main className="min-h-[70vh] bg-[#F7F8F6] px-4 py-8 text-[#1C2526] md:px-8 md:py-10">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-[#E2E7E4] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">{t('partnerTour.eyebrow')}</p><h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t('partnerTour.title')}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#64716D]">{t('partnerTour.description')}</p>
      </header>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span>{!tours.length && <button type="button" onClick={() => void loadTours()} disabled={loading} className="self-start rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 sm:self-auto">{loading ? t('partnerTour.loading') : t('partnerTour.retry')}</button>}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

      <section className={cardClass}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">{t('partnerTour.yourTours')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.tourListHelp')}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#F4F6F4] px-3 py-1 text-xs font-semibold text-[#52605D]">{t('partnerTour.tourCount', { count: tours.length })}</span>{tours.length > 0 && <button type="button" onClick={startNewTour} className="inline-flex items-center justify-center rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173C34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]">{t('partnerTour.addTour')}</button>}</div></div>
        {loading ? <p role="status" className="rounded-lg bg-[#F7F8F6] p-4 text-sm text-[#64716D]">{t('partnerTour.loading')}</p> : tours.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tours.map(tour => <article key={tour.id} className={`rounded-xl border p-4 transition ${selectedId === tour.id ? 'border-[#1F4E43] bg-[#F1F6F3] shadow-sm' : 'border-[#E2E7E4] bg-white hover:border-[#A9BFB5] hover:shadow-sm'}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="block truncate font-semibold text-[#1C2526]">{tour.title}</span><span className="mt-1 block text-xs text-[#64716D]">{t('partnerTour.tourId', { id: tour.id })}</span></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tour.status === 'published' ? 'bg-emerald-50 text-emerald-800' : tour.status === 'rejected' ? 'bg-rose-50 text-rose-800' : tour.status === 'archived' ? 'bg-stone-100 text-stone-600' : 'bg-amber-50 text-amber-800'}`}>{statusText(tour.status)}</span></div>
          <div className="mt-4 flex flex-wrap gap-2">{tour.status === 'archived' ? <button type="button" disabled={busy} onClick={() => void restoreTour(tour.id)} className="rounded-md border border-[#CAD4CF] px-3 py-1.5 text-xs font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.restore')}</button> : <button type="button" disabled={busy} onClick={() => void chooseTour(tour.id)} className="rounded-md border border-[#CAD4CF] px-3 py-1.5 text-xs font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.edit')}</button>}
            {tour.status !== 'archived' && <button type="button" disabled={busy} onClick={() => void startArchive(tour.id)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{t('partnerTour.archive')}</button>}</div>
        </article>)}</div> : !error && <div className="rounded-xl border border-dashed border-[#CAD4CF] bg-[#FAFBFA] px-5 py-10 text-center"><p className="font-semibold">{t('partnerTour.emptyTitle')}</p><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.emptyHelp')}</p><button type="button" onClick={startNewTour} className="mt-4 rounded-lg bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white">{t('partnerTour.createFirst')}</button></div>}
        {new Set(tours.map(tour => tour.companyId)).size > 1 && <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('partnerTour.multipleCompanyWarning')}</p>}
      </section>

      {(isCreating || selectedId !== null) && <section ref={editorRef} className={`${cardClass} scroll-mt-6`}>
        <div className="mb-5 flex flex-col gap-2 border-b border-[#E8ECE9] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#C2410C]">{selectedTour ? t('partnerTour.editing') : t('partnerTour.newTour')}</p><h2 className="mt-1 text-xl font-bold">{selectedTour?.title || t('partnerTour.tourDetails')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.draftHelp')}</p></div>{selectedTour && <span className="self-start rounded-full bg-[#F4F6F4] px-3 py-1 text-xs font-semibold text-[#52605D]">{statusText(selectedTour.status)}</span>}</div>
        {loadingTour ? <p role="status" className="rounded-lg bg-[#F7F8F6] p-4 text-sm text-[#64716D]">{t('partnerTour.loadingTour')}</p> : <form className="grid gap-x-5 gap-y-4 md:grid-cols-2" onSubmit={e => { e.preventDefault(); void saveTour(); }}>
          <label className={fieldClass}>{t('partnerTour.name')}<input required maxLength={160} value={draft.title} onChange={e => updateDraft('title', e.target.value)} className={inputClass} placeholder={t('partnerTour.namePlaceholder')} /></label>
          <label className={fieldClass}>{t('partnerTour.difficulty')}<select value={draft.difficulty} onChange={e => updateDraft('difficulty', e.target.value)} className={inputClass}>{['easy', 'moderate', 'hard', 'expert'].map(value => <option key={value} value={value}>{t(`tour.${value}`)}</option>)}</select></label>
          <label className={fieldClass}>{t('partnerTour.duration')}<input type="number" min="1" max="60" value={draft.durationDays} onChange={e => updateDraft('durationDays', Number(e.target.value))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.experience')}<input value={draft.requiredExperience || ''} onChange={e => updateDraft('requiredExperience', e.target.value)} className={inputClass} /></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.descriptionField')}<textarea required value={draft.description} onChange={e => updateDraft('description', e.target.value)} className={inputClass} rows={4} /></label>
          <label className={fieldClass}>{t('partnerTour.included')}<textarea value={draft.includedServices || ''} onChange={e => updateDraft('includedServices', e.target.value)} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.excluded')}<textarea value={draft.excludedServices || ''} onChange={e => updateDraft('excludedServices', e.target.value)} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.packing')}<textarea value={draft.packingList.map(item => `${item.required ? '* ' : ''}${item.name}${item.note ? ` | ${item.note}` : ''}`).join('\n')} onChange={e => updateDraft('packingList', e.target.value.split('\n').filter(Boolean).map((line, index) => { const required = line.startsWith('*'); const [name, note] = line.replace(/^\*\s*/, '').split('|'); return { name: name.trim(), note: note?.trim() || null, required, displayOrder: index }; }))} className={inputClass} rows={4} /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.packingHint')}</span></label>
          <label className={fieldClass}>{t('partnerTour.policy')}<select required value={draft.cancellationPolicyVersionId || ''} onChange={e => updateDraft('cancellationPolicyVersionId', Number(e.target.value))} className={inputClass}><option value="">{t('partnerTour.selectPolicy')}</option>{policies.map(policy => <option key={policy.id} value={policy.id}>{policy.policyTitle} · v{policy.versionNumber} · {new Date(policy.effectiveFrom).toLocaleDateString()}</option>)}</select>{!policies.length && <span className="mt-1 block text-xs font-normal text-amber-800">{t('partnerTour.noPolicies')}</span>}{policies.find(policy => policy.id === draft.cancellationPolicyVersionId)?.content && <span className="mt-1 block text-xs font-normal text-[#64716D]">{policies.find(policy => policy.id === draft.cancellationPolicyVersionId)?.content}</span>}</label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.route')}<input value={draft.routeFileUrl || ''} onChange={e => updateDraft('routeFileUrl', e.target.value || null)} className={inputClass} placeholder="https://…" /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.routeHint')}</span></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.media')}<textarea value={draft.media.map(item => item.url).join('\n')} onChange={e => updateDraft('media', e.target.value.split('\n').map(value => value.trim()).filter(Boolean).map((url, index) => ({ mediaType: 'image', url, displayOrder: index, cover: index === 0 })))} className={inputClass} rows={3} /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.mediaHint')}</span></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.locations')}<input value={draft.locationIds.join(',')} onChange={e => updateDraft('locationIds', e.target.value.split(',').map(value => Number(value.trim())).filter(Number.isFinite))} className={inputClass} placeholder="1, 2, 3" /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.locationsHint')}</span></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.itinerary')}<textarea value={draft.itinerary.map(item => `${item.title} | ${item.description || ''}`).join('\n')} onChange={e => updateDraft('itinerary', e.target.value.split('\n').filter(Boolean).map((line, index) => { const [title, description] = line.split('|'); return { dayNumber: index + 1, displayOrder: index, title: title.trim(), description: description?.trim() || null, startTime: null, locationId: null }; }))} className={inputClass} rows={4} /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.itineraryHint')}</span></label>
          <div className="md:col-span-2 flex flex-col gap-2 border-t border-[#E8ECE9] pt-4 sm:flex-row sm:flex-wrap">
            <button disabled={busy || !policies.length || !draft.cancellationPolicyVersionId} className="rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50">{busy ? t('partnerTour.saving') : selectedId ? t('partnerTour.saveChanges') : t('partnerTour.createDraft')}</button>
            {selectedId && <button type="button" disabled={busy} onClick={() => void mutate(() => toursApi.submitPartnerTour(selectedId), 'partnerTour.submitted')} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.submitReview')}</button>}
            <button type="button" disabled={busy} onClick={closeEditor} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.cancelEdit')}</button>
          </div>
        </form>}
      </section>}

      {selectedId && <div className="grid gap-6 xl:grid-cols-2">
        <section className={cardClass}><div className="mb-4"><h2 className="text-lg font-bold">{t('partnerTour.equipmentTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.equipmentHelp')}</p></div><div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldClass}>{t('partnerTour.packageTitle')}<input value={equipment.title} onChange={e => setEquipment(value => ({ ...value, title: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.includedItems')}<textarea value={equipment.includedItems} onChange={e => setEquipment(value => ({ ...value, includedItems: e.target.value }))} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.sharedItems')}<textarea value={equipment.sharedItems || ''} onChange={e => setEquipment(value => ({ ...value, sharedItems: e.target.value }))} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.personalItems')}<textarea value={equipment.personalItemsToBring || ''} onChange={e => setEquipment(value => ({ ...value, personalItemsToBring: e.target.value }))} className={inputClass} rows={3} /></label>
        </div><button disabled={busy || !equipment.title.trim() || !equipment.includedItems.trim()} onClick={() => void mutate(() => toursApi.replaceEquipment(selectedId, equipment), 'partnerTour.equipmentSaved')} className="mt-4 rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50">{t('partnerTour.saveEquipment')}</button></section>

        <section className={cardClass}><div className="mb-4"><h2 className="text-lg font-bold">{t('partnerTour.scheduleTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.scheduleHelp')}</p></div><form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); const request = scheduleRequest(); if (!request) { setError(t('partnerTour.scheduleInvalid')); return; } void mutate(() => toursApi.createSchedule(selectedId, request), 'partnerTour.scheduleCreated'); }}>
          <label className={fieldClass}>{t('partnerTour.starts')}<input required type="datetime-local" value={dateTimeValue(schedule.startsAt)} onChange={e => setSchedule(value => ({ ...value, startsAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.ends')}<input required type="datetime-local" value={dateTimeValue(schedule.endsAt)} onChange={e => setSchedule(value => ({ ...value, endsAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.capacity')}<input required min="1" type="number" value={schedule.capacity} onChange={e => setSchedule(value => ({ ...value, capacity: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.basePrice')}<input required min="0" type="number" value={schedule.basePriceVnd} onChange={e => setSchedule(value => ({ ...value, basePriceVnd: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.equipmentFee')}<input required min="0" type="number" value={schedule.equipmentFeeVnd} onChange={e => setSchedule(value => ({ ...value, equipmentFeeVnd: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.deposit')}<input required min="0.01" max="100" step="0.01" type="number" value={schedule.depositPercent} onChange={e => setSchedule(value => ({ ...value, depositPercent: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.balanceDue')}<input required type="datetime-local" value={dateTimeValue(schedule.balanceDueAt)} onChange={e => setSchedule(value => ({ ...value, balanceDueAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.leadGuideId')}<input type="number" min="1" value={leadGuideId} onChange={e => setLeadGuideId(e.target.value)} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.otherGuideIds')}<input value={supportGuideIds} onChange={e => setSupportGuideIds(e.target.value)} placeholder={t('partnerTour.commaSeparated')} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.meetingPoint')}<textarea value={schedule.meetingPoint} onChange={e => setSchedule(value => ({ ...value, meetingPoint: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.contactPhone')}<input value={schedule.contactPhone} onChange={e => setSchedule(value => ({ ...value, contactPhone: e.target.value }))} className={inputClass} /></label>
          <button disabled={busy} className="self-end rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50 sm:col-span-2 sm:justify-self-start">{t('partnerTour.createSchedule')}</button>
        </form></section>

        <section className={`${cardClass} xl:col-span-2`}><div className="mb-4"><h2 className="text-lg font-bold">{t('partnerTour.operationsTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.operationsHelp')}</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className={fieldClass}>{t('partnerTour.scheduleId')}<input aria-label={t('partnerTour.scheduleId')} type="number" min="1" value={rosterScheduleId} onChange={e => setRosterScheduleId(e.target.value)} className={inputClass} /></label><label className={fieldClass}>{t('partnerTour.cancelReason')}<input value={cancelReason} onChange={e => setCancelReason(e.target.value)} className={inputClass} /></label>
            <button disabled={!rosterScheduleId || busy} onClick={() => void (async () => { setError(null); try { setRoster(await toursApi.getRoster(selectedId, Number(rosterScheduleId))); } catch (e) { setError(errorText(e)); } })()} className="self-end rounded-lg border border-[#CAD4CF] px-3 py-2.5 text-sm font-semibold hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.loadRoster')}</button>
            <button disabled={!rosterScheduleId || !scheduleRequest() || busy} onClick={() => { const request = scheduleRequest(); if (request) void mutate(() => toursApi.updateSchedule(selectedId, Number(rosterScheduleId), request), 'partnerTour.scheduleUpdated'); }} className="rounded-lg border border-[#CAD4CF] px-3 py-2.5 text-sm font-semibold hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.updateSchedule')}</button>
            <button disabled={!rosterScheduleId || !cancelReason.trim() || busy} onClick={() => void mutate(() => toursApi.scheduleAction(selectedId, Number(rosterScheduleId), 'cancel', cancelReason), 'partnerTour.scheduleCanceled')} className="rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{t('partnerTour.cancelSchedule')}</button>
            <button disabled={!rosterScheduleId || busy} onClick={() => void mutate(() => toursApi.scheduleAction(selectedId, Number(rosterScheduleId), 'complete'), 'partnerTour.scheduleCompleted')} className="rounded-lg border border-[#CAD4CF] px-3 py-2.5 text-sm font-semibold hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.markComplete')}</button>
            <button disabled={!rosterScheduleId || busy} onClick={() => void (async () => { setBusy(true); setError(null); try { const blob = await toursApi.downloadRoster(selectedId, Number(rosterScheduleId)); const objectUrl = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = objectUrl; link.download = `tour-${selectedId}-schedule-${Number(rosterScheduleId)}-roster.xlsx`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } })()} className="rounded-lg border border-[#CAD4CF] px-3 py-2.5 text-sm font-semibold hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.downloadRoster')}</button>
          </div>
          {roster && <div className="mt-5 overflow-hidden rounded-xl border border-[#E2E7E4]"><div className="border-b border-[#E2E7E4] bg-[#F7F8F6] px-4 py-3 text-sm font-semibold">{t('partnerTour.participants', { count: roster.participants.length })}</div>{roster.participants.length ? <ul className="divide-y divide-[#E8ECE9]">{roster.participants.map((participant, index) => <li key={`${participant.bookingCode}-${index}`} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"><span className="font-medium">{participant.fullName}</span><span className="text-xs text-[#64716D]">{participant.bookingCode}{participant.phone ? ` · ${participant.phone}` : ''}{participant.emergencyContact ? ` · ${t('partnerTour.emergencyContact')}: ${participant.emergencyContact}` : ''}</span></li>)}</ul> : <p className="px-4 py-4 text-sm text-[#64716D]">{t('partnerTour.noParticipants')}</p>}</div>}
        </section>
      </div>}
    </div>
  </main>;
};

export default PartnerTourManagementPage;
