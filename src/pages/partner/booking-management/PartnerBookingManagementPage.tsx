import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Search, Users, X } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { formatVND } from '../../../lib/utils';
import { PartnerBookingDetail, PartnerBookingListItem, PartnerBookingStatus, PartnerDeparture, PartnerStatement, partnerBookingsApi } from '../../../features/tours/api/partnerBookings.api';
import { toursApi } from '../../../features/tours/api/tours.api';
import { PartnerScheduleDto, PartnerScheduleRequest, TourRosterDto } from '../../../features/tours/types/tour.types';

type ActionDialog = { kind: 'cancel' | 'undoCheckIn' | 'cancelDeparture' | 'completeDeparture'; participantId?: number; tourId?: number; scheduleId?: number } | null;
const pageSize = 20;
const card = 'rounded-2xl border border-[#E2E7E4] bg-white shadow-sm';
const field = 'min-h-11 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm text-[#1C2526] outline-none transition focus-visible:border-[#1F4E43] focus-visible:ring-2 focus-visible:ring-[#1F4E43]/20';
const statusKeys: PartnerBookingStatus[] = ['pending_payment', 'confirmed', 'expired', 'cancelled', 'completed', 'no_show'];
const getError = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  if (error && typeof error === 'object' && 'detail' in error) return String(error.detail);
  return '';
};
const toLocalInput = (value: string) => { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };

function ScheduleEditDialog({ schedule, busy, error, onClose, onSave }: { schedule: PartnerScheduleDto; busy: boolean; error: string; onClose: () => void; onSave: (request: PartnerScheduleRequest) => void }) {
  const { t } = useI18n();
  const [startsAt, setStartsAt] = useState(toLocalInput(schedule.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(schedule.endsAt));
  const [capacity, setCapacity] = useState(String(schedule.capacity));
  const [basePriceVnd, setBasePriceVnd] = useState(String(schedule.basePriceVnd));
  const [equipmentFeeVnd, setEquipmentFeeVnd] = useState(String(schedule.equipmentFeeVnd));
  const [depositPercent, setDepositPercent] = useState(String(schedule.depositPercent));
  const [balanceDueAt, setBalanceDueAt] = useState(toLocalInput(schedule.balanceDueAt));
  const [meetingPoint, setMeetingPoint] = useState(schedule.meetingPoint || '');
  const [contactPhone, setContactPhone] = useState(schedule.contactPhone || '');
  const input = 'mt-1 block w-full rounded-lg border border-[#CAD4CF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), capacity: Number(capacity), basePriceVnd: Number(basePriceVnd), equipmentFeeVnd: Number(equipmentFeeVnd), depositPercent: Number(depositPercent), balanceDueAt: new Date(balanceDueAt).toISOString(), meetingPoint, contactPhone, guideAssignments: schedule.guides.map(guide => ({ guideId: guide.id, isLead: guide.isLead })) });
  };
  const keyDown: React.KeyboardEventHandler<HTMLFormElement> = event => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1C2526]/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}><form role="dialog" aria-modal="true" aria-labelledby="departure-edit-title" onSubmit={submit} onKeyDown={keyDown} className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl md:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="departure-edit-title" className="text-xl font-bold">{t('partnerOps.editDeparture')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerOps.editDepartureHelp')}</p></div><button type="button" autoFocus aria-label={t('partnerOps.close')} onClick={onClose} className="rounded px-2 py-1 text-lg">×</button></div>{error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2">{[[t('partnerTour.starts'), startsAt, setStartsAt, 'datetime-local'], [t('partnerTour.ends'), endsAt, setEndsAt, 'datetime-local'], [t('partnerTour.capacity'), capacity, setCapacity, 'number'], [t('partnerTour.basePrice'), basePriceVnd, setBasePriceVnd, 'number'], [t('partnerTour.equipmentFee'), equipmentFeeVnd, setEquipmentFeeVnd, 'number'], [t('partnerTour.deposit'), depositPercent, setDepositPercent, 'number'], [t('partnerTour.balanceDue'), balanceDueAt, setBalanceDueAt, 'datetime-local'], [t('partnerTour.meetingPoint'), meetingPoint, setMeetingPoint, 'text'], [t('partnerTour.contactPhone'), contactPhone, setContactPhone, 'tel']].map(([label, value, setter, type]) => <label key={String(label)} className="text-xs font-semibold text-[#52605D]">{String(label)}<input type={String(type)} required={type === 'datetime-local' || type === 'number'} min={type === 'number' ? '0' : undefined} step={label === t('partnerTour.deposit') ? '0.01' : '1'} value={String(value)} onChange={event => (setter as (value: string) => void)(event.target.value)} className={input}/></label>)}</div><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold">{t('partnerOps.close')}</button><button type="submit" disabled={busy || !startsAt || !endsAt || !balanceDueAt || Number(capacity) < schedule.confirmedSeats + schedule.heldSeats} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? t('partnerOps.saving') : t('partnerOps.saveDeparture')}</button></div></form></div>;
}

export interface PartnerBookingManagementPageProps { onNavigate?: (screen: import('../../../types/expedition').ScreenId) => void; }

export const PartnerBookingManagementPage: React.FC<PartnerBookingManagementPageProps> = () => {
  const { t, language } = useI18n();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const [items, setItems] = useState<PartnerBookingListItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<PartnerBookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialog, setDialog] = useState<ActionDialog>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'bookings' | 'departures' | 'payments'>('bookings');
  const [departures, setDepartures] = useState<PartnerDeparture[]>([]);
  const [departureLoading, setDepartureLoading] = useState(false);
  const [departureError, setDepartureError] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [activeRoster, setActiveRoster] = useState<number | null>(null);
  const [roster, setRoster] = useState<TourRosterDto | null>(null);
  const [rosterPage, setRosterPage] = useState(0);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [departurePage, setDeparturePage] = useState(0);
  const [departureTotalPages, setDepartureTotalPages] = useState(0);
  const [editSchedule, setEditSchedule] = useState<PartnerScheduleDto | null>(null);
  const [editLoading, setEditLoading] = useState<number | null>(null);
  const [statements, setStatements] = useState<PartnerStatement[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState('');
  const [statementPage, setStatementPage] = useState(0);
  const [statementTotalPages, setStatementTotalPages] = useState(0);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);
  const scheduleEditOpenerRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true); setError('');
    try {
      const result = await partnerBookingsApi.list({ status: (status || undefined) as PartnerBookingStatus | undefined, dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined, dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined, query: query.trim() || undefined, page: nextPage, size: pageSize });
      setItems(result.items); setPage(result.page); setTotalItems(result.totalItems); setTotalPages(result.totalPages);
    } catch (e) { setError(getError(e) || t('partnerOps.error')); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, query, status, t]);

  useEffect(() => { void load(0); }, [status, dateFrom, dateTo]);

  useEffect(() => {
    if (tab !== 'departures') return;
    setDepartureLoading(true); setDepartureError('');
    const from = departureDate ? new Date(`${departureDate}T00:00:00`).toISOString() : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const to = departureDate ? new Date(new Date(`${departureDate}T00:00:00`).getTime() + 86400000).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString();
    void partnerBookingsApi.departures({ from, to, page: departurePage, size: 20 }).then(result => { setDepartures(result.items); setDepartureTotalPages(result.totalPages); }).catch(e => setDepartureError(getError(e) || t('partnerOps.error'))).finally(() => setDepartureLoading(false));
  }, [departureDate, departurePage, tab, t]);

  useEffect(() => {
    if (tab !== 'payments') return;
    setStatementLoading(true); setStatementError('');
    void partnerBookingsApi.statements({ page: statementPage, size: 20 }).then(result => { setStatements(result.items); setStatementTotalPages(result.totalPages); }).catch(e => setStatementError(getError(e) || t('partnerOps.error'))).finally(() => setStatementLoading(false));
  }, [statementPage, tab, t]);

  const openRoster = async (departure: PartnerDeparture) => {
    if (activeRoster === departure.scheduleId) { setActiveRoster(null); setRoster(null); return; }
    setActiveRoster(departure.scheduleId); setRoster(null); setRosterPage(0); setDepartureError('');
    await loadRoster(departure, 0);
  };

  const loadRoster = async (departure: PartnerDeparture, nextPage: number) => {
    setRosterLoading(true); setDepartureError('');
    try { setRoster(await toursApi.getRoster(departure.tourId, departure.scheduleId, { page: nextPage, size: 50 })); setRosterPage(nextPage); }
    catch (e) { setDepartureError(getError(e) || t('partnerOps.rosterError')); }
    finally { setRosterLoading(false); }
  };

  const openScheduleEditor = async (departure: PartnerDeparture) => {
    scheduleEditOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditLoading(departure.scheduleId); setError('');
    try {
      const tour = await toursApi.getPartnerTour(departure.tourId);
      const schedule = tour.schedules.find(item => item.id === departure.scheduleId);
      if (!schedule) throw new Error(t('partnerOps.scheduleUnavailable'));
      setEditSchedule(schedule);
    } catch (e) { setError(getError(e) || t('partnerOps.scheduleUnavailable')); }
    finally { setEditLoading(null); }
  };

  const saveSchedule = async (request: PartnerScheduleRequest) => {
    if (!editSchedule) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await toursApi.updateSchedule(editSchedule.tourId, editSchedule.id, request);
      setNotice(t('partnerOps.departureUpdated')); closeScheduleEditor();
      const from = departureDate ? new Date(`${departureDate}T00:00:00`).toISOString() : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const to = departureDate ? new Date(new Date(`${departureDate}T00:00:00`).getTime() + 86400000).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString();
      const result = await partnerBookingsApi.departures({ from, to, page: departurePage, size: 20 }); setDepartures(result.items); setDepartureTotalPages(result.totalPages);
    } catch (e) { setError(getError(e) || t('partnerOps.actionError')); }
    finally { setBusy(false); }
  };

  const closeScheduleEditor = () => {
    setEditSchedule(null);
    window.requestAnimationFrame(() => scheduleEditOpenerRef.current?.focus());
  };

  const openBooking = async (id: number) => {
    setSelected(null); setDetailLoading(true); setError(''); setNotice('');
    try { setSelected(await partnerBookingsApi.detail(id)); }
    catch (e) { setError(getError(e) || t('partnerOps.error')); }
    finally { setDetailLoading(false); }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    setSelected(await partnerBookingsApi.detail(selected.id));
    await load(page);
  };

  const submitDialog = async (event: FormEvent) => {
    event.preventDefault();
    if (!dialog || (dialog.kind !== 'completeDeparture' && !reason.trim())) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (dialog.kind === 'cancel' && selected) {
        await partnerBookingsApi.cancel(selected.id, reason.trim());
        setNotice(t('partnerOps.bookingCancelled'));
      } else if (dialog.kind === 'undoCheckIn' && selected && dialog.participantId) {
        await partnerBookingsApi.undoCheckIn(selected.id, dialog.participantId, reason.trim());
        setNotice(t('partnerOps.checkInUndone'));
      } else if (dialog.kind === 'cancelDeparture' && dialog.tourId && dialog.scheduleId) {
        await toursApi.scheduleAction(dialog.tourId, dialog.scheduleId, 'cancel', reason.trim());
        setNotice(t('partnerOps.departureCancelled'));
      } else if (dialog.kind === 'completeDeparture' && dialog.tourId && dialog.scheduleId) {
        await toursApi.scheduleAction(dialog.tourId, dialog.scheduleId, 'complete');
        setNotice(t('partnerOps.departureCompleted'));
      }
      closeDialog(); setReason('');
      if (selected && (dialog.kind === 'cancel' || dialog.kind === 'undoCheckIn')) await refreshSelected();
      if (dialog.kind === 'cancelDeparture' || dialog.kind === 'completeDeparture') {
        const from = departureDate ? new Date(`${departureDate}T00:00:00`).toISOString() : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const to = departureDate ? new Date(new Date(`${departureDate}T00:00:00`).getTime() + 86400000).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString();
        const result = await partnerBookingsApi.departures({ from, to, page: departurePage, size: 20 }); setDepartures(result.items); setDepartureTotalPages(result.totalPages);
      }
    } catch (e) { setError(getError(e) || t('partnerOps.actionError')); }
    finally { setBusy(false); }
  };

  const checkIn = async (participantId: number) => {
    if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try { await partnerBookingsApi.checkIn(selected.id, participantId); setNotice(t('partnerOps.checkInSaved')); await refreshSelected(); }
    catch (e) { setError(getError(e) || t('partnerOps.actionError')); }
    finally { setBusy(false); }
  };

  const showDialog = (next: NonNullable<ActionDialog>) => {
    dialogOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog(next);
  };
  const closeDialog = () => {
    setDialog(null);
    window.requestAnimationFrame(() => dialogOpenerRef.current?.focus());
  };
  const handleDialogKeyDown: React.KeyboardEventHandler<HTMLFormElement> = event => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  const date = (value: string | null | undefined, withTime = false) => value ? new Intl.DateTimeFormat(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value)) : '—';
  const money = (value: number) => formatVND(value, language);
  const statusPill = (value: string, departure = false) => <span className="inline-flex rounded-full bg-[#F1F5F2] px-2.5 py-1 text-xs font-semibold text-[#34413D]">{t(`partnerOps.${departure ? 'departureStatus' : 'status'}.${value}`)}</span>;
  const filterSubmit = (event: FormEvent) => { event.preventDefault(); void load(0); };
  const cancelAllowed = selected && ['pending_payment', 'confirmed'].includes(selected.status) && new Date(selected.departure.startsAt).getTime() > Date.now();
  const checkInAllowed = selected?.status === 'confirmed' && new Date(selected.departure.endsAt).getTime() > Date.now();

  return <main className="min-h-[70vh] bg-[#F7F8F6] px-4 py-8 text-[#1C2526] md:px-8 md:py-10">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-[#E2E7E4] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">{t('partnerOps.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t('partnerOps.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64716D]">{t('partnerOps.description')}</p>
      </header>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}
      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void load(page)} className="self-start rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold sm:self-auto">{t('partnerOps.retry')}</button></div>}

      {!selected && !detailLoading && <>
        <nav aria-label={t('partnerOps.title')} className="flex w-full flex-wrap gap-2 border-b border-[#E2E7E4] pb-3">{(['bookings', 'departures', 'payments'] as const).map(key => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C2410C] ${tab === key ? 'bg-[#1F4E43] text-white' : 'bg-white text-[#52605D] hover:bg-[#F1F5F2]'}`}>{t(`partnerOps.tabs.${key}`)}</button>)}</nav>
        {tab === 'departures' && <section className="space-y-4"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">{t('partnerOps.departuresTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerOps.departuresHelp')}</p></div><label className="grid gap-1 text-xs font-semibold text-[#52605D]">{t('partnerOps.from')}<input type="date" value={departureDate} onChange={e => { setDepartureDate(e.target.value); setDeparturePage(0); }} className={field}/></label></header>{departureError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{departureError}</p>}{departureLoading ? <p role="status" className={`${card} p-5 text-sm`}>{t('partnerOps.loading')}</p> : departures.length ? <div className="grid gap-3">{departures.map(departure => <article key={departure.scheduleId} className={`${card} overflow-hidden`}><div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(11rem,.8fr)_auto] md:items-center md:p-5"><div><div className="flex flex-wrap gap-2">{statusPill(departure.status, true)}<span className="text-xs text-[#64716D]">{date(departure.startsAt, true)}</span></div><h3 className="mt-2 text-lg font-bold">{departure.tourTitle}</h3><p className="mt-1 flex items-center gap-2 text-sm text-[#52605D]"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0"/>{departure.meetingPoint || '—'}</p><p className="mt-1 text-xs text-[#64716D]">{t('partnerOps.guides')}: {departure.guideNames.join(', ') || '—'}{departure.contactPhone ? ` · ${departure.contactPhone}` : ''}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><span><span className="block text-xs text-[#75817C]">{t('partnerOps.capacityUse', { used: departure.confirmedSeats + departure.heldSeats, total: departure.capacity })}</span><strong>{t('partnerOps.availableSeats', { count: departure.availableSeats })}</strong></span><span><span className="block text-xs text-[#75817C]">{t('partnerOps.travelers')}</span><strong>{departure.participantCount}</strong></span></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openRoster(departure)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold hover:bg-[#F1F5F2]">{activeRoster === departure.scheduleId ? t('partnerOps.close') : t('partnerOps.openRoster')}</button>{departure.status === 'scheduled' && <button type="button" disabled={editLoading === departure.scheduleId} onClick={() => void openScheduleEditor(departure)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold hover:bg-[#F1F5F2] disabled:opacity-50">{editLoading === departure.scheduleId ? t('partnerOps.loading') : t('partnerOps.editDeparture')}</button>}{departure.status === 'scheduled' && new Date(departure.startsAt).getTime() > Date.now() && <button type="button" onClick={() => { showDialog({ kind: 'cancelDeparture', tourId: departure.tourId, scheduleId: departure.scheduleId }); setReason(''); }} className="min-h-10 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50">{t('partnerOps.cancelDeparture')}</button>}{['scheduled', 'ongoing'].includes(departure.status) && new Date(departure.endsAt).getTime() <= Date.now() && <button type="button" onClick={() => { showDialog({ kind: 'completeDeparture', tourId: departure.tourId, scheduleId: departure.scheduleId }); setReason(''); }} className="min-h-10 rounded-lg bg-[#1F4E43] px-3 text-sm font-semibold text-white hover:bg-[#173C34]">{t('partnerOps.completeDeparture')}</button>}</div></div>{activeRoster === departure.scheduleId && <div className="border-t border-[#E8ECE9] bg-[#FAFBFA] p-4">{rosterLoading || !roster ? <p role="status" className="text-sm text-[#64716D]">{t('partnerOps.rosterLoading')}</p> : roster.participants.length ? <><ul className="grid gap-2 sm:grid-cols-2">{roster.participants.map((person, index) => <li key={`${person.bookingCode}-${index}`} className="rounded-lg border border-[#E2E7E4] bg-white p-3"><p className="text-sm font-semibold">{person.fullName}</p><p className="mt-1 text-xs text-[#64716D]">{person.bookingCode}{person.phone ? ` · ${person.phone}` : ''}</p>{person.checkedInAt && <p className="mt-1 text-xs font-medium text-emerald-800">{t('partnerOps.checkedIn', { date: date(person.checkedInAt, true) })}</p>}</li>)}</ul>{(roster.totalPages ?? 0) > 1 && <nav aria-label={t('partnerOps.rosterTitle')} className="mt-3 flex items-center justify-between"><button type="button" disabled={rosterPage <= 0} onClick={() => void loadRoster(departure, rosterPage - 1)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm disabled:opacity-40">{t('partnerOps.previous')}</button><span className="text-xs text-[#64716D]">{t('partnerOps.page', { current: rosterPage + 1, total: roster.totalPages ?? 1 })}</span><button type="button" disabled={rosterPage + 1 >= (roster.totalPages ?? 0)} onClick={() => void loadRoster(departure, rosterPage + 1)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm disabled:opacity-40">{t('partnerOps.next')}</button></nav>}</> : <p className="text-sm text-[#64716D]">{t('partnerTour.noParticipants')}</p>}</div>}</article>)}</div> : <div className={`${card} border-dashed p-10 text-center text-sm`}>{t('partnerOps.noDepartures')}</div>}</section>}
        {tab === 'payments' && <section className="space-y-4"><header><h2 className="text-xl font-bold">{t('partnerOps.statementsTitle')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('partnerOps.statementsHelp')}</p></header>{statementError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{statementError}</p>}{statementLoading ? <p role="status" className={`${card} p-5 text-sm`}>{t('partnerOps.loading')}</p> : statements.length ? <div className="grid gap-3">{statements.map(statement => <article key={statement.id} className={`${card} p-5`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-[#64716D]">{t('partnerOps.period')}</p><h3 className="mt-1 font-bold">{date(statement.periodStart)} – {date(statement.periodEnd)}</h3></div><span className="rounded-full bg-[#F1F5F2] px-2.5 py-1 text-xs font-semibold">{t(`partnerOps.statementStatus.${statement.status}`)}</span></div><dl className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E8ECE9] pt-4 sm:grid-cols-3"><div><dt className="text-xs text-[#64716D]">{t('partnerOps.payable')}</dt><dd className="mt-1 font-semibold">{money(statement.payableVnd)}</dd></div><div><dt className="text-xs text-[#64716D]">{t('partnerOps.transferred')}</dt><dd className="mt-1 font-semibold text-emerald-800">{money(statement.transferredVnd)}</dd></div><div><dt className="text-xs text-[#64716D]">{t('partnerOps.statementRemaining')}</dt><dd className="mt-1 font-semibold">{money(statement.remainingVnd)}</dd></div></dl>{statement.note && <p className="mt-3 text-sm text-[#52605D]">{statement.note}</p>}<div className="mt-4 border-t border-[#E8ECE9] pt-3"><h4 className="text-sm font-semibold">{t('partnerOps.transfers')}</h4>{statement.transfers.length ? <ul className="mt-2 divide-y divide-[#E8ECE9]">{statement.transfers.map((transfer, index) => <li key={`${transfer.transferredAt}-${index}`} className="flex justify-between gap-3 py-2 text-sm"><time>{date(transfer.transferredAt, true)}</time><strong>{money(transfer.amountVnd)}</strong></li>)}</ul> : <p className="mt-1 text-sm text-[#64716D]">{t('partnerOps.noTransfers')}</p>}</div></article>)}</div> : <div className={`${card} border-dashed p-10 text-center text-sm`}>{t('partnerOps.noStatements')}</div>}</section>}
        {tab === 'bookings' && <>
        <form onSubmit={filterSubmit} className={`${card} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.5fr)_minmax(12rem,1fr)_minmax(11rem,.8fr)_minmax(11rem,.8fr)_auto] xl:items-end`}>
          <label className="grid gap-1.5 text-xs font-semibold text-[#52605D]">{t('partnerOps.search')}<span className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#75817C]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('partnerOps.search')} className={`${field} w-full pl-9`} /></span></label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#52605D]">{t('partnerOps.status')}<select value={status} onChange={e => setStatus(e.target.value)} className={field}><option value="">{t('partnerOps.allStatuses')}</option>{statusKeys.map(key => <option key={key} value={key}>{t(`partnerOps.status.${key}`)}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#52605D]">{t('partnerOps.from')}<input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={field}/></label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#52605D]">{t('partnerOps.to')}<input type="date" min={dateFrom || undefined} value={dateTo} onChange={e => setDateTo(e.target.value)} className={field}/></label>
          <button type="submit" className="min-h-11 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white transition hover:bg-[#173C34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]">{t('partnerOps.filter')}</button>
        </form>
        <section aria-label={t('partnerOps.title')}>
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-[#52605D]">{t('partnerOps.count', { count: totalItems })}</p></div>
          {loading ? <p role="status" className={`${card} p-6 text-sm text-[#64716D]`}>{t('partnerOps.loading')}</p> : items.length ? <div className="grid gap-3">{items.map(item => <article key={item.id} className={`${card} grid gap-4 p-4 transition hover:border-[#A9BFB5] hover:shadow-md md:grid-cols-[minmax(0,1.5fr)_minmax(12rem,1fr)_auto] md:items-center md:p-5`}>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{statusPill(item.status)}<span className="text-xs text-[#64716D]">{item.bookingCode}</span></div><h2 className="mt-2 truncate text-base font-bold">{item.departure.tourTitle}</h2><p className="mt-1 flex items-center gap-2 text-sm text-[#52605D]"><CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0"/>{date(item.departure.startsAt, true)} <span className="text-[#A3ADA8]">·</span><Users aria-hidden="true" className="h-4 w-4 shrink-0"/>{item.participantCount}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-1"><span><span className="block text-xs text-[#75817C]">{t('partnerOps.total')}</span><strong>{money(item.totalPriceVnd)}</strong></span><span><span className="block text-xs text-[#75817C]">{t('partnerOps.received')}</span><strong>{money(item.receivedVnd)}</strong></span>{item.pendingReviewVnd > 0 && <span className="col-span-2 text-xs font-semibold text-amber-800 md:col-span-1">{t('partnerOps.pendingReview', { amount: money(item.pendingReviewVnd) })}</span>}</div>
            <button type="button" onClick={() => void openBooking(item.id)} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold transition hover:bg-[#F1F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]">{t('partnerOps.open')}</button>
          </article>)}</div> : <div className={`${card} border-dashed p-10 text-center`}><p className="font-semibold">{query || status || dateFrom || dateTo ? t('partnerOps.empty') : t('partnerOps.noBookings')}</p></div>}
          {totalPages > 1 && <nav aria-label={t('partnerOps.title')} className="mt-5 flex items-center justify-center gap-4"><button type="button" disabled={page <= 0 || loading} onClick={() => void load(page - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm font-semibold disabled:opacity-40"><ChevronLeft aria-hidden="true" className="h-4 w-4"/>{t('partnerOps.previous')}</button><span aria-live="polite" className="text-sm text-[#52605D]">{t('partnerOps.page', { current: page + 1, total: totalPages })}</span><button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => void load(page + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm font-semibold disabled:opacity-40">{t('partnerOps.next')}<ChevronRight aria-hidden="true" className="h-4 w-4"/></button></nav>}
        </section>
        </>}
      </>}

      {detailLoading && <p role="status" className={`${card} p-6 text-sm text-[#64716D]`}>{t('partnerOps.loading')}</p>}
      {selected && <>
        <button type="button" onClick={() => { setSelected(null); setError(''); setNotice(''); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#34413D] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C2410C]"><ArrowLeft aria-hidden="true" className="h-4 w-4"/>{t('partnerOps.back')}</button>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,.8fr)]">
          <div className="space-y-5">
            <section className={`${card} p-5 md:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3"> <div><p className="text-xs font-semibold uppercase tracking-wide text-[#75817C]">{t('partnerOps.booking')} · {selected.bookingCode}</p><h2 className="mt-2 text-2xl font-bold">{selected.departure.tourTitle}</h2></div>{statusPill(selected.status)}</div>
              <div className="mt-5 grid gap-4 border-t border-[#E8ECE9] pt-4 sm:grid-cols-2"><div><p className="text-xs text-[#75817C]">{t('partnerOps.departure')}</p><p className="mt-1 flex items-start gap-2 text-sm font-semibold"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4E43]"/>{date(selected.departure.startsAt, true)} – {date(selected.departure.endsAt, true)}</p></div><div><p className="text-xs text-[#75817C]">{t('partnerOps.customer')}</p><p className="mt-1 text-sm font-semibold">{selected.customer.displayName}</p><p className="text-sm text-[#64716D]">{selected.customer.email || selected.customer.phone || '—'}</p></div><div><p className="text-xs text-[#75817C]">{t('partnerOps.meetingPoint')}</p><p className="mt-1 flex gap-2 text-sm"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-[#1F4E43]"/>{selected.departure.meetingPoint || '—'}</p></div><div><p className="text-xs text-[#75817C]">{t('partnerOps.contactPhone')}</p><p className="mt-1 text-sm">{selected.departure.contactPhone || '—'}</p></div></div>
            </section>
            <section className={`${card} overflow-hidden`}><div className="flex items-center justify-between border-b border-[#E8ECE9] px-5 py-4"><div><h3 className="font-bold">{t('partnerOps.travelers')}</h3><p className="mt-0.5 text-xs text-[#64716D]">{selected.participants.length} / {selected.participantCount}</p></div><Users aria-hidden="true" className="h-5 w-5 text-[#1F4E43]"/></div><ul className="divide-y divide-[#E8ECE9]">{selected.participants.map(person => <li key={person.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{person.fullName}</p><p className="mt-0.5 truncate text-sm text-[#64716D]">{[person.email, person.phone].filter(Boolean).join(' · ') || '—'}</p>{person.checkedInAt && <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-800"><Check aria-hidden="true" className="h-3.5 w-3.5"/>{t('partnerOps.checkedIn', { date: date(person.checkedInAt, true) })}</p>}</div>
                {checkInAllowed && (person.checkedInAt ? <button type="button" disabled={busy} onClick={() => { showDialog({ kind: 'undoCheckIn', participantId: person.id }); setReason(''); }} className="min-h-10 self-start rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold hover:bg-[#F1F5F2] disabled:opacity-50 sm:self-auto">{t('partnerOps.undoCheckIn')}</button> : <button type="button" disabled={busy} onClick={() => void checkIn(person.id)} className="min-h-10 self-start rounded-lg bg-[#1F4E43] px-3 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-50 sm:self-auto">{busy ? t('partnerOps.saving') : t('partnerOps.checkIn')}</button>)}</li>)}</ul></section>
            <section className={`${card} p-5 md:p-6`}><div className="flex items-center justify-between"><h3 className="font-bold">{t('partnerOps.refunds')}</h3><p className="text-xs text-[#64716D]">{t('partnerOps.readOnlyRefund')}</p></div>{selected.refundRequests.length ? <ul className="mt-4 divide-y divide-[#E8ECE9]">{selected.refundRequests.map(refund => <li key={refund.id} className="py-3 first:pt-0 last:pb-0"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{money(refund.requestedAmountVnd)}</span><span className="rounded-full bg-[#F1F5F2] px-2.5 py-1 text-xs">{t(`partnerOps.refundStatus.${refund.status}`)}</span></div><p className="mt-1 text-sm text-[#52605D]">{refund.reason}</p>{refund.decisionNote && <p className="mt-1 text-xs text-[#64716D]">{t('partnerOps.decisionNote', { note: refund.decisionNote })}</p>}<p className="mt-1 text-xs text-[#75817C]">{date(refund.createdAt, true)}</p></li>)}</ul> : <p className="mt-3 text-sm text-[#64716D]">{t('partnerOps.noRefunds')}</p>}</section>
          </div>
          <aside className="space-y-5 xl:sticky xl:top-6">
            <section className={`${card} p-5`}><h3 className="font-bold">{t('partnerOps.money')}</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#64716D]">{t('partnerOps.total')}</dt><dd className="font-semibold">{money(selected.money.totalPriceVnd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#64716D]">{t('partnerOps.received')}</dt><dd className="font-semibold text-emerald-800">{money(selected.money.receivedVnd)}</dd></div>{selected.money.pendingReviewVnd > 0 && <div className="flex justify-between gap-4 text-amber-900"><dt>{t('partnerOps.pendingReviewLabel')}</dt><dd className="font-semibold">{money(selected.money.pendingReviewVnd)}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-[#64716D]">{t('partnerOps.refunded')}</dt><dd className="font-semibold">{money(selected.money.refundedVnd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#64716D]">{t('partnerOps.balanceDue')}</dt><dd className="text-right">{date(selected.money.balanceDueAt, true)}</dd></div></dl></section>
            {cancelAllowed && <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><h3 className="font-bold text-rose-950">{t('partnerOps.cancelConfirmTitle')}</h3><p className="mt-2 text-sm leading-5 text-rose-900">{t('partnerOps.cancelImpact')}</p><button type="button" onClick={() => { showDialog({ kind: 'cancel' }); setReason(''); }} className="mt-4 min-h-10 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100">{t('partnerOps.cancel')}</button></section>}
            <div className={`${card} flex items-start gap-3 p-4 text-sm text-[#52605D]`}><Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4E43]"/>{t('partnerOps.payoutUnavailable')}</div>
          </aside>
        </div>
      </>}

      {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2526]/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) closeDialog(); }}><form role="dialog" aria-modal="true" aria-labelledby="partner-action-title" onSubmit={submitDialog} onKeyDown={handleDialogKeyDown} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl md:p-6"><div className="flex items-start justify-between gap-4"><h2 id="partner-action-title" className="text-xl font-bold">{dialog.kind === 'cancel' ? t('partnerOps.cancelConfirmTitle') : dialog.kind === 'undoCheckIn' ? t('partnerOps.undoCheckIn') : dialog.kind === 'cancelDeparture' ? t('partnerOps.cancelDepartureTitle') : t('partnerOps.completeDepartureTitle')}</h2><button type="button" autoFocus aria-label={t('partnerOps.close')} onClick={closeDialog} disabled={busy} className="rounded p-1 text-[#64716D] hover:bg-[#F1F5F2]"><X aria-hidden="true" className="h-5 w-5"/></button></div>{['cancel', 'cancelDeparture'].includes(dialog.kind) && <p className="mt-3 text-sm leading-5 text-[#52605D]">{dialog.kind === 'cancel' ? t('partnerOps.cancelImpact') : t('partnerOps.cancelDepartureImpact')}</p>}{dialog.kind === 'completeDeparture' && <p className="mt-3 text-sm leading-5 text-[#52605D]">{t('partnerOps.completeDepartureImpact')}</p>}{dialog.kind !== 'completeDeparture' && <label className="mt-4 grid gap-2 text-sm font-semibold">{dialog.kind === 'cancel' ? t('partnerOps.cancelReason') : dialog.kind === 'cancelDeparture' ? t('partnerOps.departureCancelReason') : t('partnerOps.undoReason')}<textarea required minLength={3} value={reason} onChange={e => setReason(e.target.value)} rows={3} className={`${field} py-2`} /></label>}<div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={closeDialog} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold">{t('partnerOps.close')}</button><button type="submit" disabled={busy || (dialog.kind !== 'completeDeparture' && reason.trim().length < 3)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${['cancel', 'cancelDeparture'].includes(dialog.kind) ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#1F4E43] hover:bg-[#173C34]'}`}>{busy ? t('partnerOps.saving') : dialog.kind === 'cancel' ? t('partnerOps.confirmCancel') : dialog.kind === 'cancelDeparture' ? t('partnerOps.confirmDepartureCancel') : dialog.kind === 'completeDeparture' ? t('partnerOps.completeDeparture') : t('partnerOps.confirmUndo')}</button></div></form></div>}
      {editSchedule && <ScheduleEditDialog key={editSchedule.id} schedule={editSchedule} busy={busy} error={error} onClose={closeScheduleEditor} onSave={request => void saveSchedule(request)} />}
    </div>
  </main>;
};

export default PartnerBookingManagementPage;
