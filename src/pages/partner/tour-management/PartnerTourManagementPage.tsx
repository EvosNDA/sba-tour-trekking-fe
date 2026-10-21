import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { toursApi } from '../../../features/tours/api/tours.api';
import {
  CancellationPolicyVersionDto,
  EquipmentPackageWriteRequest,
  LocationDto,
  PartnerTourItemDto,
  PartnerTourDraftRequest,
  PartnerScheduleRequest,
  PartnerGuideDto,
} from '../../../features/tours/types/tour.types';

const defaultRefundRules = [{ daysBeforeDeparture: 30, refundPercent: 100 }, { daysBeforeDeparture: 7, refundPercent: 50 }, { daysBeforeDeparture: 0, refundPercent: 0 }];
const emptyDraft: PartnerTourDraftRequest = { title: '', description: '', difficulty: 'moderate', durationDays: 1, itinerary: [], media: [], packingList: [], cancellationPolicyVersionId: null, cancellationRefundRules: defaultRefundRules, locationIds: [] };
const validRefundRules = (rules: PartnerTourDraftRequest['cancellationRefundRules']) => {
  if (!rules.length || rules.length > 8 || rules.filter(rule => rule.daysBeforeDeparture === 0).length !== 1
      || new Set(rules.map(rule => rule.daysBeforeDeparture)).size !== rules.length) return false;
  const sorted = [...rules].sort((a, b) => b.daysBeforeDeparture - a.daysBeforeDeparture);
  return sorted.every((rule, index) => index === 0 || rule.refundPercent <= sorted[index - 1].refundPercent);
};
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
  const [editorSection, setEditorSection] = useState<'details' | 'content' | 'refunds' | 'equipment' | 'departure'>('details');
  const [isCreating, setIsCreating] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [draft, setDraft] = useState<PartnerTourDraftRequest>(emptyDraft);
  const [schedule, setSchedule] = useState<ScheduleFormState>(emptySchedule);
  const [equipment, setEquipment] = useState<EquipmentPackageWriteRequest>(emptyEquipment);
  const [policies, setPolicies] = useState<CancellationPolicyVersionDto[]>([]);
  const [destinations, setDestinations] = useState<LocationDto[]>([]);
  const [leadGuideId, setLeadGuideId] = useState('');
  const [supportGuideIds, setSupportGuideIds] = useState<string[]>([]);
  const [guides, setGuides] = useState<PartnerGuideDto[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  useEffect(() => { void toursApi.getDestinations().then(setDestinations).catch(() => setDestinations([])); }, []);
  useEffect(() => {
    if (isCreating || selectedId !== null) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isCreating, selectedId]);

  const chooseTour = async (id: number) => {
    setEditorSection('details');
    setSelectedId(id); setIsCreating(false); setDraft(emptyDraft); setEquipment(emptyEquipment); setGuides([]); setLeadGuideId(''); setSupportGuideIds([]); setNotice(null); setError(null); setLoadingTour(true);
    try {
      const tour = await toursApi.getPartnerTour(id);
      setDraft({ title: tour.title, description: tour.description || '', difficulty: tour.difficulty || 'moderate', durationDays: tour.durationDays || 1, requiredExperience: tour.requiredExperience, itinerary: tour.itinerary, media: tour.media.map(({ id: _id, ...item }) => item), includedServices: tour.includedServices, excludedServices: tour.excludedServices, packingList: tour.packingList.map(({ id: _id, ...item }) => item), cancellationPolicyVersionId: tour.cancellationPolicyVersionId || 0, cancellationRefundRules: tour.cancellationRefundRules?.length ? tour.cancellationRefundRules : [], routeFileUrl: tour.routeFileUrl, locationIds: tour.locationIds });
      const currentEquipment = tour.equipmentOptions?.[0];
      setEquipment(currentEquipment ? { title: currentEquipment.title, includedItems: currentEquipment.includedItems, sharedItems: currentEquipment.sharedItems, personalItemsToBring: currentEquipment.personalItemsToBring } : emptyEquipment);
      try {
        const guideResult = await toursApi.getPartnerGuides();
        setGuides(guideResult.items.filter(guide => guide.active && guide.companyId === tour.companyId));
      } catch (e) { setError(errorText(e)); }
    } catch (e) { setError(errorText(e)); }
    finally { setLoadingTour(false); }
  };
  const startNewTour = () => { setSelectedId(null); setEditorSection('details'); setIsCreating(true); setDraft(emptyDraft); setEquipment(emptyEquipment); setSchedule(emptySchedule); setGuides([]); setLeadGuideId(''); setSupportGuideIds([]); setError(null); setNotice(null); };
  const closeEditor = () => { setSelectedId(null); setEditorSection('details'); setIsCreating(false); setDraft(emptyDraft); setEquipment(emptyEquipment); setSchedule(emptySchedule); setGuides([]); setLeadGuideId(''); setSupportGuideIds([]); setError(null); };
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
    return { startsAt: schedule.startsAt, endsAt: schedule.endsAt, capacity, basePriceVnd, equipmentFeeVnd, depositPercent, balanceDueAt: schedule.balanceDueAt, meetingPoint: schedule.meetingPoint, contactPhone: schedule.contactPhone, guideAssignments: [...(leadGuideId ? [{ guideId: Number(leadGuideId), isLead: true }] : []), ...supportGuideIds.filter(id => id !== leadGuideId).map(id => ({ guideId: Number(id), isLead: false }))] };
  };
  const selectedTour = tours.find(tour => tour.id === selectedId);
  const statusText = (status: string) => t(`partnerTour.status.${status}`);
  const saveTour = async () => {
    if (!draft.title.trim()) { setEditorSection('details'); setError(t('partnerTour.nameRequired')); return; }
    const creating = selectedId === null;
    const saved = await mutate(() => creating ? toursApi.createPartnerTour(draft) : toursApi.updatePartnerTour(selectedId as number, draft), creating ? 'partnerTour.created' : 'partnerTour.saved');
    if (saved && creating) setIsCreating(false);
  };
  const submitForReview = async () => {
    if (!draft.title.trim()) { setEditorSection('details'); setError(t('partnerTour.nameRequired')); return; }
    if (!draft.description.trim()) { setEditorSection('content'); setError(t('partnerTour.descriptionRequired')); return; }
    if (!draft.cancellationPolicyVersionId) { setError(t('partnerTour.selectPolicyError')); return; }
    if (draft.media.length < 3) { setEditorSection('content'); setError(t('partnerTour.minimumImages')); return; }
    if (draft.locationIds.length === 0) { setEditorSection('content'); setError(t('partnerTour.destinationRequired')); return; }
    if (!validRefundRules(draft.cancellationRefundRules)) { setEditorSection('refunds'); setError(t('partnerTour.refundRulesInvalid')); return; }
    if (!selectedId) { setError(t('partnerTour.saveBeforeSubmit')); return; }
    const isPublished = selectedTour?.status === 'published';
    const saved = await mutate(() => toursApi.updatePartnerTour(selectedId, draft), isPublished ? 'partnerTour.changesSentForReview' : 'partnerTour.saved');
    if (saved && !isPublished) await mutate(() => toursApi.submitPartnerTour(selectedId), 'partnerTour.submitted');
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
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    if (draft.media.length + selectedFiles.length > 10) { setError(t('partnerTour.imageLimit')); return; }
    if (selectedFiles.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) { setError(t('partnerTour.imageRequirements')); return; }
    setUploadingImages(true); setError(null);
    try {
      const uploaded: PartnerTourDraftRequest['media'] = [];
      for (const file of selectedFiles) {
        const signature = await toursApi.getImageUploadSignature();
        const body = new FormData();
        body.append('file', file); body.append('api_key', signature.apiKey); body.append('timestamp', String(signature.timestamp));
        body.append('folder', signature.folder); body.append('allowed_formats', signature.allowedFormats); body.append('signature', signature.signature);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, { method: 'POST', body });
        const result = await response.json() as { secure_url?: string; error?: { message?: string } };
        if (!response.ok || !result.secure_url) throw new Error(result.error?.message || t('partnerTour.imageUploadFailed'));
        uploaded.push({ mediaType: 'image', url: result.secure_url, caption: null, displayOrder: draft.media.length + uploaded.length, cover: draft.media.length + uploaded.length === 0 });
      }
      setDraft(current => ({ ...current, media: [...current.media, ...uploaded].map((item, index) => ({ ...item, displayOrder: index, cover: index === 0 })) }));
    } catch (e) { setError(errorText(e)); }
    finally { setUploadingImages(false); }
  };
  const moveDestination = (index: number, direction: -1 | 1) => {
    setDraft(current => {
      const locationIds = [...current.locationIds];
      const next = index + direction;
      if (next < 0 || next >= locationIds.length) return current;
      [locationIds[index], locationIds[next]] = [locationIds[next], locationIds[index]];
      return { ...current, locationIds };
    });
  };
  const destinationGroups = Array.from(destinations.reduce((groups, destination) => {
    const province = destination.provinceName || t('partnerTour.otherArea');
    groups.set(province, [...(groups.get(province) || []), destination]);
    return groups;
  }, new Map<string, LocationDto[]>()));

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
        <nav aria-label={t('partnerTour.editorSections')} className="mb-5 grid grid-cols-2 gap-2 border-b border-[#E8ECE9] pb-5 md:grid-cols-3 xl:grid-cols-5">
          {(['details', 'content', 'refunds', 'equipment', 'departure'] as const).map((section, index) => {
            const disabled = !selectedId && (section === 'equipment' || section === 'departure');
            return <button key={section} type="button" disabled={disabled} onClick={() => setEditorSection(section)} aria-current={editorSection === section ? 'step' : undefined}
              className={`min-h-12 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] disabled:cursor-not-allowed disabled:opacity-45 ${editorSection === section ? 'border-[#1F4E43] bg-[#F1F6F3] text-[#1F4E43]' : 'border-[#E2E7E4] bg-white text-[#52605D] hover:bg-[#F7F8F6]'}`}>
              <span className="mr-2 text-xs opacity-70">0{index + 1}</span>{t(`partnerTour.section.${section}`)}
            </button>;
          })}
        </nav>
        {!selectedId && <p className="-mt-2 mb-5 text-xs text-[#64716D]">{t('partnerTour.saveDraftBeforeOperations')}</p>}
        {loadingTour ? <p role="status" className="rounded-lg bg-[#F7F8F6] p-4 text-sm text-[#64716D]">{t('partnerTour.loadingTour')}</p> : (editorSection === 'details' || editorSection === 'content') ? <form className="grid gap-x-5 gap-y-4 md:grid-cols-2" onSubmit={e => { e.preventDefault(); void saveTour(); }}>
          {editorSection === 'details' && <>
          <label className={fieldClass}>{t('partnerTour.name')}<input required maxLength={160} value={draft.title} onChange={e => updateDraft('title', e.target.value)} className={inputClass} placeholder={t('partnerTour.namePlaceholder')} /></label>
          <label className={fieldClass}>{t('partnerTour.difficulty')}<select value={draft.difficulty} onChange={e => updateDraft('difficulty', e.target.value)} className={inputClass}>{['easy', 'moderate', 'hard', 'expert'].map(value => <option key={value} value={value}>{t(`tour.${value}`)}</option>)}</select></label>
          <label className={fieldClass}>{t('partnerTour.duration')}<input type="number" min="1" max="60" value={draft.durationDays} onChange={e => updateDraft('durationDays', Number(e.target.value))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.experience')}<input value={draft.requiredExperience || ''} onChange={e => updateDraft('requiredExperience', e.target.value)} className={inputClass} /></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.policy')}<select value={draft.cancellationPolicyVersionId || ''} onChange={e => updateDraft('cancellationPolicyVersionId', e.target.value ? Number(e.target.value) : null)} className={inputClass}><option value="">{t('partnerTour.selectPolicy')}</option>{policies.map(policy => <option key={policy.id} value={policy.id}>{policy.policyTitle} · v{policy.versionNumber} · {new Date(policy.effectiveFrom).toLocaleDateString()}</option>)}</select>{!policies.length && <span className="mt-1 block text-xs font-normal text-amber-800">{t('partnerTour.noPolicies')}</span>}{policies.find(policy => policy.id === draft.cancellationPolicyVersionId)?.content && <span className="mt-1 block text-xs font-normal text-[#64716D]">{policies.find(policy => policy.id === draft.cancellationPolicyVersionId)?.content}</span>}</label>
          </>}
          {editorSection === 'content' && <>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.descriptionField')}<textarea value={draft.description} onChange={e => updateDraft('description', e.target.value)} className={inputClass} rows={4} /></label>
          <label className={fieldClass}>{t('partnerTour.included')}<textarea value={draft.includedServices || ''} onChange={e => updateDraft('includedServices', e.target.value)} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.excluded')}<textarea value={draft.excludedServices || ''} onChange={e => updateDraft('excludedServices', e.target.value)} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.packing')}<textarea value={draft.packingList.map(item => item.name).join('\n')} onChange={e => updateDraft('packingList', e.target.value.split('\n').map(line => line.trim()).filter(Boolean).map((name, index) => ({ name, note: null, required: false, displayOrder: index })))} className={inputClass} rows={4} /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.packingHint')}</span></label>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.route')}<input value={draft.routeFileUrl || ''} onChange={e => updateDraft('routeFileUrl', e.target.value || null)} className={inputClass} placeholder="https://…" /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.routeHint')}</span></label>
          <fieldset className={`${fieldClass} md:col-span-2 rounded-lg border border-[#E2E7E4] p-3`}><legend className="px-1">{t('partnerTour.media')}</legend><p className="mb-3 text-xs font-normal text-[#75817C]">{t('partnerTour.mediaHint')}</p><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingImages || draft.media.length >= 10} onChange={e => { void uploadImages(e.currentTarget.files); e.currentTarget.value = ''; }} className="block w-full cursor-pointer rounded-lg border border-[#D7DFDA] bg-white text-sm file:mr-3 file:border-0 file:bg-[#F1F6F3] file:px-4 file:py-2.5 file:font-semibold file:text-[#1F4E43]" aria-label={t('partnerTour.uploadImages')} />{uploadingImages && <p role="status" className="mt-2 text-sm text-[#52605D]">{t('partnerTour.uploadingImages')}</p>}{draft.media.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{draft.media.map((item, index) => <figure key={`${item.url}-${index}`} className="overflow-hidden rounded-lg border border-[#E2E7E4] bg-white"><img src={item.url} alt={t('partnerTour.photoNumber', { number: index + 1 })} className="aspect-[4/3] w-full object-cover"/><figcaption className="flex items-center justify-between gap-2 p-2 text-xs"><span className="font-semibold">{index === 0 ? t('partnerTour.coverImage') : t('partnerTour.photoNumber', { number: index + 1 })}</span><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => updateDraft('media', [item, ...draft.media.filter((_, i) => i !== index)].map((mediaItem, i) => ({ ...mediaItem, displayOrder: i, cover: i === 0 })))} className="rounded px-2 py-1 text-[#1F4E43] hover:bg-[#F1F6F3] disabled:opacity-40" aria-label={t('partnerTour.setCover')}>↑</button><button type="button" onClick={() => updateDraft('media', draft.media.filter((_, i) => i !== index).map((mediaItem, i) => ({ ...mediaItem, displayOrder: i, cover: i === 0 })))} className="rounded px-2 py-1 text-rose-700 hover:bg-rose-50" aria-label={t('partnerTour.removeImage')}>×</button></div></figcaption></figure>)}</div>}</fieldset>
          <fieldset className={`${fieldClass} md:col-span-2 rounded-lg border border-[#E2E7E4] p-3`}><legend className="px-1">{t('partnerTour.locations')}</legend><p className="mb-3 text-xs font-normal text-[#75817C]">{t('partnerTour.locationsHint')}</p>{destinationGroups.length ? <div className="grid max-h-56 gap-x-5 gap-y-3 overflow-y-auto sm:grid-cols-2">{destinationGroups.map(([province, items]) => <div key={province}><h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[#75817C]">{province}</h3>{items.map(destination => <label key={destination.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-[#F7F8F6]"><input type="checkbox" checked={draft.locationIds.includes(destination.id)} onChange={e => updateDraft('locationIds', e.target.checked ? [...draft.locationIds, destination.id] : draft.locationIds.filter(id => id !== destination.id))} className="h-4 w-4 accent-[#1F4E43]"/><span>{destination.name}</span></label>)}</div>)}</div> : <p className="text-xs font-normal text-[#75817C]">{t('partnerTour.noDestinations')}</p>}{draft.locationIds.length > 0 && <ol className="mt-4 space-y-1 border-t border-[#E8ECE9] pt-3">{draft.locationIds.map((id, index) => { const destination = destinations.find(item => item.id === id); return <li key={id} className="flex items-center justify-between gap-3 rounded-md bg-[#F7F8F6] px-3 py-2 text-sm"><span>{index + 1}. {destination?.name || t('partnerTour.unknownDestination')}</span><span className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => moveDestination(index, -1)} className="rounded px-2 py-1 hover:bg-white disabled:opacity-40" aria-label={t('partnerTour.moveEarlier')}>↑</button><button type="button" disabled={index === draft.locationIds.length - 1} onClick={() => moveDestination(index, 1)} className="rounded px-2 py-1 hover:bg-white disabled:opacity-40" aria-label={t('partnerTour.moveLater')}>↓</button></span></li>; })}</ol>}</fieldset>
          <label className={`${fieldClass} md:col-span-2`}>{t('partnerTour.itinerary')}<textarea value={draft.itinerary.map(item => item.title).join('\n')} onChange={e => updateDraft('itinerary', e.target.value.split('\n').map(line => line.trim()).filter(Boolean).map((title, index) => ({ dayNumber: index + 1, displayOrder: index, title, description: null, startTime: null, locationId: null })))} className={inputClass} rows={4} /><span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.itineraryHint')}</span></label>
          </>}
          <div className="md:col-span-2 flex flex-col gap-2 border-t border-[#E8ECE9] pt-4 sm:flex-row sm:flex-wrap">
            <button disabled={busy} className="rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50">{busy ? t('partnerTour.saving') : selectedId ? t('partnerTour.saveChanges') : t('partnerTour.createDraft')}</button>
            {selectedId && <button type="button" disabled={busy} onClick={() => void submitForReview()} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.submitReview')}</button>}
            <button type="button" disabled={busy} onClick={closeEditor} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.cancelEdit')}</button>
          </div>
        </form> : null}
      </section>}

      {editorSection === 'refunds' && (isCreating || selectedId !== null) && <section className={cardClass}>
        <div className="mb-5"><h2 className="text-xl font-bold">{t('partnerTour.refundRulesTitle')}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#64716D]">{t('partnerTour.refundRulesHelp')}</p></div>
        <div className="space-y-3">{draft.cancellationRefundRules.map((rule, index) => <div key={`${rule.daysBeforeDeparture}-${index}`} className="grid gap-3 rounded-xl border border-[#E2E7E4] bg-[#FAFBFA] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className={fieldClass}>{t('partnerTour.refundBeforeDays')}<input type="number" min="0" max="3650" value={rule.daysBeforeDeparture} onChange={e => updateDraft('cancellationRefundRules', draft.cancellationRefundRules.map((item, i) => i === index ? { ...item, daysBeforeDeparture: Number(e.target.value) } : item))} className={inputClass}/></label>
          <label className={fieldClass}>{t('partnerTour.refundPercent')}<div className="relative"><input type="number" min="0" max="100" step="1" value={rule.refundPercent} onChange={e => updateDraft('cancellationRefundRules', draft.cancellationRefundRules.map((item, i) => i === index ? { ...item, refundPercent: Number(e.target.value) } : item))} className={`${inputClass} pr-10`}/><span className="absolute right-3 top-3 text-sm text-[#64716D]">%</span></div></label>
          <button type="button" disabled={draft.cancellationRefundRules.length <= 1 || rule.daysBeforeDeparture === 0} onClick={() => updateDraft('cancellationRefundRules', draft.cancellationRefundRules.filter((_, i) => i !== index))} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold text-[#52605D] hover:bg-white disabled:opacity-40">{t('partnerTour.removeRule')}</button>
          <p className="text-xs text-[#64716D] sm:col-span-3">{t('partnerTour.refundRuleExample', { days: rule.daysBeforeDeparture, percent: rule.refundPercent })}</p>
        </div>)}</div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={draft.cancellationRefundRules.length >= 8} onClick={() => setDraft(current => { const days = new Set(current.cancellationRefundRules.map(rule => rule.daysBeforeDeparture)); let threshold = 1; while (days.has(threshold)) threshold++; return { ...current, cancellationRefundRules: [...current.cancellationRefundRules, { daysBeforeDeparture: threshold, refundPercent: 0 }] }; })} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D] hover:bg-[#F7F8F6] disabled:opacity-50">{t('partnerTour.addRefundRule')}</button><p className="self-center text-xs text-[#64716D]">{t('partnerTour.refundRuleOrderHelp')}</p></div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E8ECE9] pt-4"><button type="button" disabled={busy} onClick={() => void saveTour()} className="rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? t('partnerTour.saving') : selectedId ? t('partnerTour.saveChanges') : t('partnerTour.createDraft')}</button>{selectedId && <button type="button" disabled={busy} onClick={() => void submitForReview()} className="rounded-lg border border-[#CAD4CF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34413D]">{t('partnerTour.submitReview')}</button>}</div>
      </section>}

      {selectedId && editorSection === 'equipment' && <section className={cardClass}>
        <div className="mb-4"><h2 className="text-lg font-bold">{t('partnerTour.equipmentTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.equipmentHelp')}</p></div><div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldClass}>{t('partnerTour.packageTitle')}<input value={equipment.title} onChange={e => setEquipment(value => ({ ...value, title: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.includedItems')}<textarea value={equipment.includedItems} onChange={e => setEquipment(value => ({ ...value, includedItems: e.target.value }))} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.sharedItems')}<textarea value={equipment.sharedItems || ''} onChange={e => setEquipment(value => ({ ...value, sharedItems: e.target.value }))} className={inputClass} rows={3} /></label>
          <label className={fieldClass}>{t('partnerTour.personalItems')}<textarea value={equipment.personalItemsToBring || ''} onChange={e => setEquipment(value => ({ ...value, personalItemsToBring: e.target.value }))} className={inputClass} rows={3} /></label>
        </div><button disabled={busy || !equipment.title.trim() || !equipment.includedItems.trim()} onClick={() => void mutate(() => toursApi.replaceEquipment(selectedId, equipment), 'partnerTour.equipmentSaved')} className="mt-4 rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50">{t('partnerTour.saveEquipment')}</button>

      </section>}

      {selectedId && editorSection === 'departure' && <section className={cardClass}><div className="mb-4"><h2 className="text-lg font-bold">{t('partnerTour.scheduleTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerTour.scheduleHelp')}</p></div><form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); const request = scheduleRequest(); if (!request) { setError(t('partnerTour.scheduleInvalid')); return; } void mutate(() => toursApi.createSchedule(selectedId, request), 'partnerTour.scheduleCreated'); }}>
          <label className={fieldClass}>{t('partnerTour.starts')}<input required type="datetime-local" value={dateTimeValue(schedule.startsAt)} onChange={e => setSchedule(value => ({ ...value, startsAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.ends')}<input required type="datetime-local" value={dateTimeValue(schedule.endsAt)} onChange={e => setSchedule(value => ({ ...value, endsAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.capacity')}<input required min="1" type="number" value={schedule.capacity} onChange={e => setSchedule(value => ({ ...value, capacity: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.basePrice')}<input required min="0" type="number" value={schedule.basePriceVnd} onChange={e => setSchedule(value => ({ ...value, basePriceVnd: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.equipmentFee')}<input required min="0" type="number" value={schedule.equipmentFeeVnd} onChange={e => setSchedule(value => ({ ...value, equipmentFeeVnd: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.deposit')}<input required min="0.01" max="100" step="0.01" type="number" value={schedule.depositPercent} onChange={e => setSchedule(value => ({ ...value, depositPercent: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.balanceDue')}<input required type="datetime-local" value={dateTimeValue(schedule.balanceDueAt)} onChange={e => setSchedule(value => ({ ...value, balanceDueAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.leadGuide')}<select value={leadGuideId} onChange={e => { setLeadGuideId(e.target.value); setSupportGuideIds(ids => ids.filter(id => id !== e.target.value)); }} className={inputClass}><option value="">{t('partnerTour.noGuide')}</option>{guides.map(guide => <option key={guide.id} value={guide.id}>{guide.displayName}</option>)}</select>{!guides.length && <span className="mt-1 block text-xs font-normal text-[#75817C]">{t('partnerTour.noEligibleGuides')}</span>}</label>
          <fieldset className={`${fieldClass} rounded-lg border border-[#E2E7E4] p-3`}><legend className="px-1">{t('partnerTour.supportGuides')}</legend>{guides.length ? <div className="mt-1 flex flex-wrap gap-3">{guides.filter(guide => String(guide.id) !== leadGuideId).map(guide => <label key={guide.id} className="inline-flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={supportGuideIds.includes(String(guide.id))} onChange={e => setSupportGuideIds(ids => e.target.checked ? [...ids, String(guide.id)] : ids.filter(id => id !== String(guide.id)))} className="h-4 w-4 accent-[#1F4E43]"/>{guide.displayName}</label>)}</div> : <p className="mt-1 text-xs font-normal text-[#75817C]">{t('partnerTour.noEligibleGuides')}</p>}</fieldset>
          <label className={fieldClass}>{t('partnerTour.meetingPoint')}<textarea value={schedule.meetingPoint} onChange={e => setSchedule(value => ({ ...value, meetingPoint: e.target.value }))} className={inputClass} /></label>
          <label className={fieldClass}>{t('partnerTour.contactPhone')}<input value={schedule.contactPhone} onChange={e => setSchedule(value => ({ ...value, contactPhone: e.target.value }))} className={inputClass} /></label>
          <button disabled={busy} className="self-end rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50 sm:col-span-2 sm:justify-self-start">{t('partnerTour.createSchedule')}</button>
        </form></section>}
    </div>
  </main>;
};

export default PartnerTourManagementPage;
