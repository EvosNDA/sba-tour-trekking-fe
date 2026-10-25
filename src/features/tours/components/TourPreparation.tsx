import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Plus, Trash2, Users } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { formatVND } from '../../../lib/utils';
import { tourReadApi } from '../api/tourRead.api';
import { availablePlaces, cleanTraveler, isUpcoming, rentalCost, travelerErrors } from '../tourSelection';
import type { RequiredItemResponse, ScheduleDetailResponse, TourDetailResponse, TourEquipmentResponse, TourSelectionDraft, TravelerDraft } from '../types/tour-contract.types';
import { TourState } from './TourState';

const emptyTraveler = (): TravelerDraft => ({ fullName: '', email: '', phone: '' });
type Props = {
  tour: TourDetailResponse;
  schedule: ScheduleDetailResponse;
  equipment: TourEquipmentResponse | null;
  equipmentError?: string | null;
  retryEquipment: () => void;
  requiredItems: RequiredItemResponse[] | null;
  requiredError?: string | null;
  retryRequired: () => void;
  initialDraft?: TourSelectionDraft | null;
  onExit: (draft: TourSelectionDraft) => void;
  onBrowse: () => void;
  onSelectionReady?: (draft: TourSelectionDraft) => void;
};

export function TourPreparation(props: Props) {
  const { t, language } = useI18n();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [schedule, setSchedule] = useState(props.schedule);
  const [equipmentOverride, setEquipmentOverride] = useState<TourEquipmentResponse | null>(null);
  const equipment = equipmentOverride ?? props.equipment;
  const [draft, setDraft] = useState<TourSelectionDraft>(() => props.initialDraft?.scheduleId === props.schedule.id ? props.initialDraft : {
    version: 1, tourId: props.tour.id, scheduleId: props.schedule.id,
    contact: { fullName: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
    travelers: [emptyTraveler()], rental: { mode: 'NONE' },
  });
  const [copyContact, setCopyContact] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { title.current?.focus(); window.scrollTo({ top: 0 }); }, [step]);
  const money = (value: number) => formatVND(value, language);
  const date = (value: string) => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const cost = rentalCost(draft.rental, equipment, draft.travelers.length);
  const previewCost = draft.rental.mode === 'ITEMS' && draft.rental.items.length === 0 ? 0 : cost;
  const baseCost = schedule.basePriceVnd * draft.travelers.length;
  const total = previewCost == null || !Number.isSafeInteger(baseCost + previewCost) ? null : baseCost + previewCost;
  const packageInfo = equipment?.equipmentPackage;
  const individualItems = equipment?.items.filter(item => item.individualRentalPriceVnd !== null) ?? [];

  const updatePerson = (index: number | 'contact', field: keyof TravelerDraft, value: string) => {
    setErrors(current => { const next = { ...current }; delete next[`${index}.${field}`]; return next; });
    setDraft(current => {
      if (index === 'contact') {
        const contact = { ...current.contact, [field]: value };
        return { ...current, contact, travelers: copyContact ? current.travelers.map((person, i) => i === 0 ? { ...contact } : person) : current.travelers };
      }
      return { ...current, travelers: current.travelers.map((person, i) => i === index ? { ...person, [field]: value } : person) };
    });
  };
  const fields = (person: TravelerDraft, index: number | 'contact', contact = false) => <div className="trip-person-fields">
    {(['fullName', 'email', 'phone'] as const).map(field => {
      const id = `trip-${index}-${field}`;
      const fieldError = errors[`${index}.${field}`];
      const required = contact || field === 'fullName';
      return <label key={field} className={field === 'fullName' ? 'trip-field-name' : ''} htmlFor={id}>
        <span>{t(field === 'fullName' ? 'trip.name' : `trip.${field}`)} {!required && <small>{t('trip.optional')}</small>}{required && <span aria-hidden="true"> *</span>}</span>
        <input id={id} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} autoComplete={field === 'fullName' ? 'name' : field === 'phone' ? 'tel' : 'email'}
          value={person[field]} maxLength={field === 'fullName' ? 200 : field === 'email' ? 254 : 30}
          disabled={busy || (index === 0 && copyContact)} required={required} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${id}-error` : undefined}
          onChange={event => updatePerson(index, field, event.target.value)} />
        {fieldError && <small className="trip-field-error" id={`${id}-error`}>{t(fieldError)}</small>}
      </label>;
    })}
  </div>;

  const validateTravelers = () => {
    const next: Record<string, string> = {};
    Object.entries(travelerErrors(draft.contact, true)).forEach(([key, value]) => { next[`contact.${key}`] = value; });
    draft.travelers.forEach((person, index) => Object.entries(travelerErrors(person)).forEach(([key, value]) => { next[`${index}.${key}`] = value; }));
    setErrors(next);
    if (Object.keys(next).length) {
      setError('trip.formErrors');
      window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.trip-preparation [aria-invalid="true"]')?.focus());
      return false;
    }
    if (!isUpcoming(schedule) || draft.travelers.length > availablePlaces(schedule)) { setError('trip.seatLimit'); return false; }
    return true;
  };

  const review = async () => {
    if (!validateTravelers()) { setStep(0); return; }
    if (cost === null) { setError(draft.rental.mode === 'ITEMS' && !draft.rental.items.length ? 'trip.chooseItems' : 'trip.rentalInvalid'); return; }
    if (total === null) { setError('trip.tooLarge'); return; }
    setBusy(true); setError(null);
    try {
      const [freshSchedule, freshEquipment, freshTour] = await Promise.all([
        tourReadApi.schedule(props.tour.id, schedule.id),
        draft.rental.mode === 'NONE' ? Promise.resolve(equipment) : tourReadApi.equipment(props.tour.id),
        tourReadApi.detail(props.tour.id),
      ]);
      if (!mounted.current) return;
      setSchedule(freshSchedule);
      if (freshEquipment) setEquipmentOverride(freshEquipment);
      if (freshTour.status !== 'PUBLISHED' || !isUpcoming(freshSchedule)) { setError('trip.selectionInvalid'); return; }
      if (availablePlaces(freshSchedule) < draft.travelers.length) { setError('trip.seatLimit'); return; }
      const freshRentalCost = rentalCost(draft.rental, freshEquipment, draft.travelers.length);
      if (freshRentalCost == null) { setError('trip.selectionInvalid'); return; }
      if (freshSchedule.basePriceVnd !== schedule.basePriceVnd || freshRentalCost !== cost
        || freshSchedule.startsAt !== schedule.startsAt || freshSchedule.endsAt !== schedule.endsAt) {
        setError('trip.priceChanged'); return;
      }
      const cleaned = { ...draft, contact: cleanTraveler(draft.contact), travelers: draft.travelers.map(cleanTraveler) };
      setDraft(cleaned); setStep(2); props.onSelectionReady?.(cleaned);
    } catch (cause: unknown) {
      if (mounted.current) {
        const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
        setError(code === 'UNAUTHORIZED' ? 'trip.signInHelp' : code === 'FORBIDDEN' ? 'trip.forbidden' : code === 'RESOURCE_NOT_FOUND' ? 'trip.notFound' : 'trip.error');
      }
    }
    finally { if (mounted.current) setBusy(false); }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (step === 0) { if (validateTravelers()) setStep(1); }
    else if (step === 1) void review();
  };
  const itemQuantity = (id: number) => draft.rental.mode === 'ITEMS' ? draft.rental.items.find(item => item.itemId === id)?.quantity ?? 0 : 0;
  const changeQuantity = (id: number, value: string) => {
    const quantity = value === '' ? 0 : Number(value);
    setDraft(current => ({ ...current, rental: { mode: 'ITEMS', items: [
      ...(current.rental.mode === 'ITEMS' ? current.rental.items.filter(item => item.itemId !== id) : []),
      ...(quantity === 0 ? [] : [{ itemId: id, quantity }]),
    ] } }));
    setError(null);
  };

  return <main className="tour-flow trip-preparation">
    <div className="trip-container">
      <nav aria-label={t('trip.progress')} className="trip-steps"><ol>{['trip.travelersStep', 'trip.rentalStep', 'trip.reviewStep'].map((key, index) => <li key={key} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}>
        <button disabled={index >= step || busy} aria-current={index === step ? 'step' : undefined} onClick={() => { setError(null); setStep(index); }}><span>{index < step ? <Check size={16} aria-hidden="true" /> : index + 1}</span>{t(key)}</button>
      </li>)}</ol></nav>
      <header className="trip-stage-header"><h1 ref={title} tabIndex={-1}>{t(step === 0 ? 'trip.travelersTitle' : step === 1 ? 'trip.rentalTitle' : 'trip.reviewTitle')}</h1><p>{t(step === 0 ? 'trip.travelersIntro' : step === 1 ? 'trip.rentalIntro' : 'trip.reviewIntro')}</p></header>
      <div className="trip-columns">
        <div className="trip-stage-content">
          {error && <p className="trip-alert" role="alert">{t(error)}</p>}
          {step !== 2 ? <form onSubmit={submit} noValidate>
            {step === 0 && <>
              <section className="trip-form-section"><h2>{t('trip.contact')}</h2><p className="trip-help">{t('trip.contactHelp')}</p>{fields(draft.contact, 'contact', true)}
                <label className="trip-checkbox"><input type="checkbox" checked={copyContact} onChange={event => {
                  setCopyContact(event.target.checked); setError(null);
                  setErrors(current => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith('0.'))));
                  if (event.target.checked) setDraft(current => ({ ...current, travelers: current.travelers.map((person, i) => i === 0 ? { ...current.contact } : person) }));
                }} />{t('trip.copyContact')}</label>
              </section>
              <section className="trip-form-section"><div className="trip-section-title"><h2><Users size={20} aria-hidden="true" />{t('trip.travelersCount', { count: draft.travelers.length })}</h2></div>
                {draft.travelers.map((person, index) => <fieldset key={index} className="trip-traveler"><legend>{t('trip.traveler', { number: index + 1 })}</legend>
                  {draft.travelers.length > 1 && index !== 0 && <button type="button" className="trip-remove" aria-label={t('trip.removeTraveler', { number: index + 1 })} onClick={() => { setDraft(current => ({ ...current, travelers: current.travelers.filter((_, i) => i !== index) })); setErrors({}); setError(null); }}><Trash2 size={17} aria-hidden="true" /></button>}{fields(person, index)}
                </fieldset>)}
                <button type="button" className="trip-button trip-button-secondary" disabled={draft.travelers.length >= availablePlaces(schedule)} onClick={() => setDraft(current => ({ ...current, travelers: [...current.travelers, emptyTraveler()] }))}><Plus size={17} aria-hidden="true" />{t('trip.addTraveler')}</button>
                <p className="trip-help">{t('trip.seats', { count: availablePlaces(schedule) })}</p>
              </section>
            </>}
            {step === 1 && <>
              <fieldset className="trip-rental-options" disabled={busy}><legend className="sr-only">{t('trip.rentalTitle')}</legend>
                {(['NONE', 'PACKAGE', 'ITEMS'] as const).map(mode => {
                  const disabled = mode === 'PACKAGE' ? packageInfo?.rentalPriceVnd == null : mode === 'ITEMS' ? individualItems.length === 0 : false;
                  const key = mode === 'NONE' ? 'own' : mode === 'PACKAGE' ? 'package' : 'items';
                  return <label key={mode} className={`trip-rental-option ${draft.rental.mode === mode ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}>
                    <input type="radio" name="rental-mode" checked={draft.rental.mode === mode} disabled={disabled} onChange={() => { setError(null); setDraft(current => ({ ...current, rental: mode === 'PACKAGE' && packageInfo ? { mode, packageId: packageInfo.id } : mode === 'ITEMS' ? { mode, items: [] } : { mode: 'NONE' } })); }} />
                    <span><strong>{t(`trip.${key}`)}</strong><small>{t(disabled ? mode === 'PACKAGE' ? 'trip.packageUnavailable' : 'trip.itemsUnavailable' : `trip.${key}Help`)}</small>
                      {mode === 'PACKAGE' && packageInfo?.rentalPriceVnd != null && <b>{money(packageInfo.rentalPriceVnd)} <small>{t('trip.perPerson')}</small></b>}</span>
                  </label>;
                })}
              </fieldset>
              {props.equipmentError && !equipmentOverride && <TourState errorCode={props.equipmentError} retry={props.retryEquipment} />}
              {!props.equipmentError && !packageInfo && <p className="trip-help">{t('trip.noEquipment')}</p>}
              {draft.rental.mode === 'PACKAGE' && packageInfo && <section className="trip-form-section"><h2>{packageInfo.title}</h2>
                {equipment?.items.length ? <ul className="trip-equipment-list">{equipment.items.map(item => <li key={item.id}><span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}</span><span>{t('trip.inPackage', { count: item.quantityInPackage })}</span></li>)}</ul> : <p className="trip-prose">{packageInfo.includedItems}</p>}
                {packageInfo.sharedItems && <><h3>{t('trip.shared')}</h3><p className="trip-prose">{packageInfo.sharedItems}</p></>}
                {packageInfo.personalItemsToBring && <><h3>{t('trip.personal')}</h3><p className="trip-prose">{packageInfo.personalItemsToBring}</p></>}
              </section>}
              {draft.rental.mode === 'ITEMS' && <section className="trip-form-section"><h2>{t('trip.items')}</h2><p className="trip-help">{t('trip.itemsHelp')}</p>
                <div className="trip-item-rentals">{individualItems.map(item => <div className="trip-rental-row" key={item.id}><div><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}<strong>{money(item.individualRentalPriceVnd!)} <small>{t('trip.wholeTrip')}</small></strong></div>
                  <label><span>{t('trip.quantity')}</span><input aria-label={t('trip.quantityFor', { name: item.name })} type="number" min={0} step={1} inputMode="numeric" value={itemQuantity(item.id)} disabled={busy} onChange={event => changeQuantity(item.id, event.target.value)} /></label></div>)}</div>
              </section>}
              <section className="trip-form-section"><h2>{t('trip.required')}</h2><p className="trip-help">{t('trip.requiredHint')}</p>
                {props.requiredError ? <TourState errorCode={props.requiredError} retry={props.retryRequired} /> : <RequiredChecklist items={props.requiredItems} />}
              </section>
            </>}
            <div className="trip-form-actions"><button type="button" disabled={busy} className="trip-text-button" onClick={() => { setError(null); step === 0 ? props.onExit(draft) : setStep(0); }}><ArrowLeft size={17} aria-hidden="true" />{t(step === 0 ? 'trip.changeTour' : 'trip.previous')}</button>
              <button className="trip-button" disabled={busy}>{t(busy ? 'trip.checking' : step === 0 ? 'trip.continue' : 'trip.review')}<ArrowRight size={18} aria-hidden="true" /></button></div>
          </form> : <>
            <div className="trip-ready" role="status"><CheckCircle2 size={24} aria-hidden="true" /><div><strong>{t('trip.notBooked')}</strong><p>{t('trip.handoff')}</p></div></div>
            <section className="trip-form-section"><div className="trip-section-title"><h2>{t('trip.contact')}</h2><button className="trip-text-button" onClick={() => setStep(0)}>{t('trip.edit')}</button></div><p className="trip-person-review"><strong>{draft.contact.fullName}</strong><span>{draft.contact.email}</span><span>{draft.contact.phone}</span></p></section>
            <section className="trip-form-section"><h2>{t('trip.travelersCount', { count: draft.travelers.length })}</h2><ol className="trip-review-travelers">{draft.travelers.map((person, index) => <li key={index}><span>{index + 1}</span><div><strong>{person.fullName}</strong>{person.email && <p>{person.email}</p>}{person.phone && <p>{person.phone}</p>}</div></li>)}</ol></section>
            <section className="trip-form-section"><div className="trip-section-title"><h2>{t('trip.rentalStep')}</h2><button className="trip-text-button" onClick={() => setStep(1)}>{t('trip.editEquipment')}</button></div>
              {draft.rental.mode === 'NONE' ? <p>{t('trip.noRental')}</p> : draft.rental.mode === 'PACKAGE' ? <p>{packageInfo?.title} × {draft.travelers.length}</p> : <ul className="trip-equipment-list">{draft.rental.items.map(item => <li key={item.itemId}><span>{equipment?.items.find(value => value.id === item.itemId)?.name}</span><strong>× {item.quantity}</strong></li>)}</ul>}
            </section>
            <div className="trip-form-actions"><button className="trip-text-button" onClick={() => setStep(1)}><ArrowLeft size={17} aria-hidden="true" />{t('trip.previous')}</button><button className="trip-button trip-button-secondary" onClick={props.onBrowse}>{t('trip.browse')}<ArrowRight size={18} aria-hidden="true" /></button></div>
          </>}
        </div>
        <aside className="trip-summary"><h2>{t('trip.summary')}</h2><h3>{props.tour.title}</h3><p className="trip-summary-dates">{date(schedule.startsAt)}<span>— {date(schedule.endsAt)}</span></p>
          <p className="trip-summary-people"><Users size={17} aria-hidden="true" />{t('trip.travelersCount', { count: draft.travelers.length })}</p>
          {schedule.meetingPoint && <div className="trip-summary-meeting"><small>{t('trip.meeting')}</small><p>{schedule.meetingPoint}</p></div>}
          <dl><div><dt>{t('trip.tourCost', { count: draft.travelers.length })}</dt><dd>{money(baseCost)}</dd></div><div><dt>{t('trip.rentalCost')}</dt><dd>{previewCost == null ? t('trip.emptyEquipmentPrice') : money(previewCost)}</dd></div><div className="trip-summary-total"><dt>{t('trip.total')}</dt><dd>{total == null ? t('trip.emptyEquipmentPrice') : money(total)}</dd></div></dl>
          <p className="trip-help">{t('trip.estimateNote')}</p><button className="trip-text-button" disabled={busy} onClick={() => props.onExit(draft)}>{t('trip.changeTour')}</button>
        </aside>
      </div>
    </div>
  </main>;
}

export function RequiredChecklist({ items }: { items: RequiredItemResponse[] | null }) {
  const { t } = useI18n();
  if (!items) return <p role="status">{t('trip.loading')}</p>;
  if (!items.length) return <p className="trip-help">{t('trip.noRequired')}</p>;
  return <ul className="trip-checklist">{items.map(item => <li key={item.id}><Check size={17} aria-hidden="true" /><div><strong>{item.name}</strong><small>{t(item.isRequired ? 'trip.requiredItem' : 'trip.optionalItem')}</small>{item.note && <p>{item.note}</p>}</div></li>)}</ul>;
}
