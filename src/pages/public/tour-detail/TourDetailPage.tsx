import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Clock3, ExternalLink, Mountain } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { formatVND } from '../../../lib/utils';
import type { ScreenId } from '../../../types/expedition';
import { tourReadApi } from '../../../features/tours/api/tourRead.api';
import { useTourResource } from '../../../features/tours/hooks/useTourData';
import { availablePlaces, isUpcoming } from '../../../features/tours/tourSelection';
import { TourPagination, TourState } from '../../../features/tours/components/TourState';
import { RequiredChecklist, TourPreparation } from '../../../features/tours/components/TourPreparation';
import type { TourMediaResponse, TourSelectionDraft } from '../../../features/tours/types/tour-contract.types';
import '../../../features/tours/tour-flow.css';

export interface TourDetailPageProps {
  tourId?: string;
  onBack?: () => void;
  onNavigate?: (screen: ScreenId) => void;
  onSelectionReady?: (draft: TourSelectionDraft) => void;
}

export function TourDetailPage({ tourId, onBack = () => {}, onNavigate, onSelectionReady }: TourDetailPageProps) {
  const { t, language } = useI18n();
  const id = tourId ?? '';
  const [schedulePage, setSchedulePage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'about' | 'plan' | 'packing'>('about');
  const [preparing, setPreparing] = useState(false);
  const [savedDraft, setSavedDraft] = useState<TourSelectionDraft | null>(null);
  const tour = useTourResource(`tour:${id}`, signal => tourReadApi.detail(id, signal));
  const schedules = useTourResource(`schedules:${id}:${schedulePage}`, signal => tourReadApi.schedules(id, schedulePage, signal));
  const selected = useTourResource(`schedule:${id}:${selectedId}`, signal => selectedId === null ? Promise.resolve(null) : tourReadApi.schedule(id, selectedId, signal));
  const activities = useTourResource(`activities:${id}`, signal => tourReadApi.activities(id, signal));
  const equipment = useTourResource(`equipment:${id}`, signal => tourReadApi.equipment(id, signal));
  const required = useTourResource(`required:${id}`, signal => tourReadApi.requiredItems(id, signal));
  const signIn = () => onNavigate?.('login');
  const money = (amount: number) => formatVND(amount, language);
  const date = (value: string) => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

  if (tour.loading || tour.errorCode || !tour.data || tour.data.status !== 'PUBLISHED') return <main className="tour-flow"><div className="trip-container"><button className="trip-text-button trip-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />{t('trip.back')}</button><TourState loading={tour.loading} errorCode={tour.errorCode ?? 'RESOURCE_NOT_FOUND'} retry={tour.retry} onSignIn={signIn} /></div></main>;
  const data = tour.data;
  if (preparing && selected.data && isUpcoming(selected.data)) return <TourPreparation key={selected.data.id} tour={data} schedule={selected.data}
    equipment={equipment.data} equipmentError={equipment.errorCode} retryEquipment={equipment.retry}
    requiredItems={required.data} requiredError={required.errorCode} retryRequired={required.retry} initialDraft={savedDraft}
    onExit={draft => { setSavedDraft(draft); setPreparing(false); tour.retry(); selected.retry(); schedules.retry(); window.scrollTo({ top: 0 }); }} onBrowse={onBack} onSelectionReady={onSelectionReady} />;

  const days = [...new Set(activities.data?.map(activity => activity.dayNumber) ?? [])];
  return <main className="tour-flow"><div className="trip-container">
    <button className="trip-text-button trip-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />{t('trip.back')}</button>
    <header className="trip-detail-heading"><div><h1>{data.title}</h1><div className="trip-detail-meta">
      {data.durationDays != null && <span><Clock3 size={17} aria-hidden="true" />{data.durationDays === 1 ? t('trip.dayOne') : t('trip.days', { count: data.durationDays })}</span>}
      {data.difficulty && <span><Mountain size={17} aria-hidden="true" />{t(`tour.${data.difficulty.toLowerCase()}`)}</span>}
    </div></div></header>
    <div className="trip-columns trip-detail-columns">
      <div className="trip-detail-content">
        <TourGallery media={data.media} title={data.title} />
        <nav className="trip-detail-tabs" aria-label={t('tour.information')}>
          {([['about', 'trip.overview'], ['plan', 'trip.dayPlan'], ['packing', 'trip.required']] as const).map(([value, key]) => <button key={value} aria-current={tab === value ? 'page' : undefined} className={tab === value ? 'is-active' : ''} onClick={() => setTab(value)}>{t(key)}</button>)}
        </nav>
        {tab === 'about' && <section className="trip-tab-panel"><h2>{t('trip.overview')}</h2><p className="trip-prose">{data.description || t('trip.noDescription')}</p>
          {data.requiredExperience && <section className="trip-content-section"><h3>{t('trip.experience')}</h3><p className="trip-prose">{data.requiredExperience}</p></section>}
          <div className="trip-services">{data.includedServices && <section><h3>{t('trip.included')}</h3><p className="trip-prose">{data.includedServices}</p></section>}{data.excludedServices && <section><h3>{t('trip.excluded')}</h3><p className="trip-prose">{data.excludedServices}</p></section>}</div>
          {data.routeFileUrl && /^https?:\/\//i.test(data.routeFileUrl) && <a className="trip-text-button" href={data.routeFileUrl} target="_blank" rel="noreferrer">{t('trip.route')}<ExternalLink size={16} aria-hidden="true" /></a>}
        </section>}
        {tab === 'plan' && <section className="trip-tab-panel"><h2>{t('trip.dayPlan')}</h2>
          {activities.loading || activities.errorCode ? <TourState {...activities} /> : days.length ? <div className="trip-day-plan">{days.map((day, index) => <details key={day} open={index === 0}><summary><span>{t('trip.day', { day })}</span><ChevronDown size={18} aria-hidden="true" /></summary><ol>{activities.data?.filter(activity => activity.dayNumber === day).map(activity => <li key={activity.id}><time>{activity.startTime?.slice(0, 5) ?? ''}</time><div><h3>{activity.title}</h3>{activity.description && <p className="trip-prose">{activity.description}</p>}</div></li>)}</ol></details>)}</div> : <p className="trip-help">{t('trip.noPlan')}</p>}
        </section>}
        {tab === 'packing' && <section className="trip-tab-panel"><h2>{t('trip.required')}</h2>{required.loading || required.errorCode ? <TourState {...required} /> : <RequiredChecklist items={required.data} />}<p className="trip-help">{t('trip.requiredHint')}</p></section>}
      </div>
      <aside className="trip-departures"><h2><CalendarDays size={21} aria-hidden="true" />{t('trip.departures')}</h2>
        {schedules.loading || schedules.errorCode ? <TourState {...schedules} onSignIn={signIn} /> : schedules.data?.content.length ? <>
          <fieldset className="trip-schedule-list"><legend className="sr-only">{t('trip.dates')}</legend>{schedules.data.content.map(schedule => {
            const available = availablePlaces(schedule);
            const disabled = available === 0 || !isUpcoming(schedule);
            return <label key={schedule.id} className={`trip-schedule-option ${selectedId === schedule.id ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}><input type="radio" name="departure" checked={selectedId === schedule.id} disabled={disabled} onChange={() => setSelectedId(schedule.id)} />
              <span><strong>{date(schedule.startsAt)} — {date(schedule.endsAt)}</strong><small className={available === 0 ? 'trip-full' : ''}>{available ? t('trip.seats', { count: available }) : t('trip.full')}</small><b>{money(schedule.basePriceVnd)} <small>{t('trip.perPerson')}</small></b></span></label>;
          })}</fieldset>
          <TourPagination schedules page={schedules.data.number} totalPages={schedules.data.totalPages} onChange={setSchedulePage} />
        </> : <div className="trip-departure-empty"><h3>{t('trip.noSchedules')}</h3><p>{t('trip.noSchedulesHelp')}</p></div>}
        {selectedId !== null && selected.loading && <p className="trip-help" role="status">{t('trip.loadingDate')}</p>}
        {selected.errorCode && <TourState {...selected} onSignIn={signIn} />}
        {selected.data && <dl className="trip-departure-info">{selected.data.meetingPoint && <div><dt>{t('trip.meeting')}</dt><dd>{selected.data.meetingPoint}</dd></div>}{selected.data.contactPhone && <div><dt>{t('trip.organizerPhone')}</dt><dd>{selected.data.contactPhone}</dd></div>}<div><dd>{t('trip.deposit', { percent: selected.data.depositPercent })}</dd></div><div><dd>{t('trip.balanceDue', { date: date(selected.data.balanceDueAt) })}</dd></div></dl>}
        <button className="trip-button trip-button-wide" disabled={!selected.data || selected.loading || !isUpcoming(selected.data) || availablePlaces(selected.data) === 0} onClick={() => setPreparing(true)}>{t('trip.continue')}<ArrowRight size={18} aria-hidden="true" /></button>
        <p className="trip-help">{t(selectedId === null ? 'trip.selectDate' : 'trip.availabilityNote')}</p>
      </aside>
    </div>
  </div></main>;
}

function TourGallery({ media, title }: { media: TourMediaResponse[]; title: string }) {
  const { t } = useI18n();
  const images = media.filter(item => item.mediaType === 'IMAGE');
  const [selected, setSelected] = useState<number | null>(null);
  const [failed, setFailed] = useState<number[]>([]);
  const image = images.find(item => item.id === selected) ?? images.find(item => item.isCover) ?? images[0];
  return <section className="trip-gallery" aria-label={t('trip.gallery')}>
    <div className="trip-gallery-main">{image && !failed.includes(image.id) ? <img src={image.url} alt={image.caption || title} onError={() => setFailed(value => [...value, image.id])} /> : <div className="trip-photo-empty"><Mountain size={40} aria-hidden="true" /><span>{t('trip.coverMissing')}</span></div>}</div>
    {images.length > 1 && <div className="trip-thumbnails">{images.map((item, index) => <button key={item.id} aria-label={t('trip.photo', { number: index + 1 })} aria-pressed={image?.id === item.id} onClick={() => setSelected(item.id)}><img src={item.url} alt="" loading="lazy" /></button>)}</div>}
    {image?.caption && <p className="trip-photo-caption">{image.caption}</p>}
  </section>;
}
export default TourDetailPage;
