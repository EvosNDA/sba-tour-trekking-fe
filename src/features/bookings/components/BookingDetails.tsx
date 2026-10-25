import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { formatVND } from '../../../lib/utils';
import { bookingErrorKey, bookingsApi } from '../api/bookings.api';
import type { BookingDetail } from '../types/booking.types';
import '../booking.css';

export function BookingDetails({ bookingId, initialBooking, onChanged }: {
  bookingId: number; initialBooking?: BookingDetail; onChanged?: () => void;
}) {
  const { t, language } = useI18n();
  const [booking, setBooking] = useState<BookingDetail | null>(initialBooking ?? null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const submitting = useRef(false);
  const expiryChecked = useRef<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await bookingsApi.get(bookingId, signal);
      if (!signal?.aborted) { setBooking(result); setError(null); }
    } catch (cause) { if (!signal?.aborted) setError(bookingErrorKey(cause)); }
  }, [bookingId]);

  useEffect(() => {
    if (initialBooking) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, initialBooking]);
  const pending = booking?.status === 'PENDING_PAYMENT';
  const remaining = booking ? Math.max(0, Math.ceil((Date.parse(booking.holdExpiresAt) - now) / 1000)) : 0;
  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    const poll = window.setInterval(() => void load(controller.signal), 30_000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { controller.abort(); window.clearInterval(poll); window.clearInterval(tick); };
  }, [pending, load]);
  useEffect(() => {
    if (pending && remaining === 0 && booking && expiryChecked.current !== booking.holdExpiresAt) {
      expiryChecked.current = booking.holdExpiresAt;
      void load();
    }
  }, [pending, remaining, booking, load]);

  const cancel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || !reason.trim()) return;
    submitting.current = true; setCancelling(true); setError(null);
    try {
      setBooking(await bookingsApi.cancel(bookingId, reason.trim()));
      setConfirmCancel(false); setReason(''); onChanged?.();
    } catch (cause) { setError(bookingErrorKey(cause)); }
    finally { submitting.current = false; setCancelling(false); }
  };
  const money = (value: number) => formatVND(value, language);
  const date = (value: string) => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));

  return <article className="booking-detail">
    {error && <div className="trip-alert" role="alert"><p>{t(error)}</p><button type="button" className="trip-text-button" onClick={() => void load()}>{t('bookingFlow.refresh')}</button></div>}
    {!booking ? !error && <p role="status">{t('bookingFlow.loading')}</p> : <>
      <header className="booking-heading"><div><p className="booking-code">{booking.bookingCode}</p><h2>{booking.tourTitle}</h2></div>
        <span className={`booking-status booking-status-${booking.status.toLowerCase()}`}>{t(`bookingFlow.status.${booking.status}`)}</span></header>
      {pending && <div className="trip-ready" role="status"><div><strong>{t('bookingFlow.holdUntil', { date: date(booking.holdExpiresAt) })}</strong>
        <p>{remaining > 0 ? t('bookingFlow.remaining', { time: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` }) : t('bookingFlow.awaitExpiry')}</p>
        <p>{t('bookingFlow.pendingHelp')}</p></div></div>}
      {booking.status === 'CONFIRMED' && <p className="trip-ready" role="status">{t('bookingFlow.confirmedHelp')}</p>}
      {booking.status === 'CANCELLED' && <p className="trip-help" role="status">{t('bookingFlow.cancelledHelp')}</p>}
      {booking.status === 'EXPIRED' && <p className="trip-help" role="status">{t('bookingFlow.expiredHelp')}</p>}
      <dl className="booking-facts">
        <div><dt>{t('bookingFlow.departure')}</dt><dd>{date(booking.startsAt)} — {date(booking.endsAt)}</dd></div>
        <div><dt>{t('bookingFlow.travelers')}</dt><dd>{booking.participantCount}</dd></div>
        <div><dt>{t('bookingFlow.tourPrice')}</dt><dd>{money(booking.basePriceVnd)} × {booking.participantCount}</dd></div>
        <div><dt>{t('bookingFlow.rentalTotal')}</dt><dd>{money(booking.rentalFeeVnd)}</dd></div>
        <div><dt>{t('bookingFlow.total')}</dt><dd><strong>{money(booking.totalPriceVnd)}</strong></dd></div>
        <div><dt>{t('bookingFlow.deposit', { percent: booking.depositPercent })}</dt><dd>{money(booking.depositDueVnd)}</dd></div>
        <div><dt>{t('bookingFlow.balanceDue')}</dt><dd>{date(booking.balanceDueAt)}</dd></div>
      </dl>
      <section className="trip-form-section"><h3>{t('bookingFlow.contact')}</h3><p>{booking.contact.fullName}</p><p>{booking.contact.email}</p>{booking.contact.phone && <p>{booking.contact.phone}</p>}</section>
      <section className="trip-form-section"><h3>{t('bookingFlow.travelers')}</h3><ol className="booking-travelers">{booking.travelers.map(person => <li key={person.id}><strong>{person.fullName}</strong>{person.email && <span>{person.email}</span>}{person.phone && <span>{person.phone}</span>}</li>)}</ol></section>
      <section className="trip-form-section"><h3>{t('bookingFlow.rental')}</h3>
        {booking.rental.mode === 'NONE' ? <p>{t('bookingFlow.noRental')}</p> : booking.rental.mode === 'PACKAGE'
          ? <p>{booking.rental.title} × {booking.rental.quantity} · {money(booking.rental.unitPriceVnd ?? 0)} / {t('bookingFlow.packageUnit')}</p>
          : <ul className="booking-travelers">{booking.rental.items?.map(item => <li key={item.itemId}><strong>{item.name} × {item.quantity}</strong><span>{money(item.unitPriceVnd)} / {t('bookingFlow.itemUnit')} · {money(item.totalVnd)}</span></li>)}</ul>}
      </section>
      {booking.cancellationReason && <p>{t('bookingFlow.cancellationReason')}: {booking.cancellationReason}</p>}
      {pending && remaining > 0 && <section className="booking-cancel">
        {confirmCancel ? <form onSubmit={cancel}><h3>{t('bookingFlow.cancelTitle')}</h3><p className="trip-help">{t('bookingFlow.cancelWarning')}</p>
          <label>{t('bookingFlow.cancellationReason')}<textarea required maxLength={1000} value={reason} disabled={cancelling} onChange={event => setReason(event.target.value)} /></label>
          <div className="booking-actions"><button type="button" className="trip-button trip-button-secondary" disabled={cancelling} onClick={() => setConfirmCancel(false)}>{t('bookingFlow.keep')}</button>
            <button className="trip-button booking-danger" disabled={cancelling || !reason.trim()}>{t(cancelling ? 'bookingFlow.cancelling' : 'bookingFlow.confirmCancel')}</button></div>
        </form> : <button className="trip-text-button" onClick={() => setConfirmCancel(true)}>{t('bookingFlow.cancel')}</button>}
      </section>}
    </>}
  </article>;
}
