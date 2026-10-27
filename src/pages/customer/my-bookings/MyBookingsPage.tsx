import { useEffect, useState } from 'react';
import type { ScreenId } from '../../../types/expedition';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { formatVND } from '../../../lib/utils';
import { BookingDetails } from '../../../features/bookings/components/BookingDetails';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import '../../../features/tours/tour-flow.css';
import '../../../features/bookings/booking.css';

const selectedBooking = () => {
  const id = Number(new URLSearchParams(window.location.search).get('bookingId'));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export function MyBookingsPage({ onNavigate }: { onNavigate?: (screen: ScreenId) => void }) {
  const { t, language } = useI18n();
  const { user } = useAuthStore();
  const [bookingId, setBookingId] = useState<number | null>(selectedBooking);
  const [page, setPage] = useState(0);
  const { data, error, loading, refresh } = useBookings(page);
  useEffect(() => {
    const update = () => setBookingId(selectedBooking());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const select = (id: number | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('bookingId', String(id)); else url.searchParams.delete('bookingId');
    window.history.pushState(null, '', url);
    setBookingId(id); window.scrollTo({ top: 0 });
  };
  const date = (value: string) => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  return <main className="tour-flow booking-page"><div className="trip-container">
    <header className="booking-heading"><div><h1>{t('bookingFlow.myBookings')}</h1><p>{t('bookingFlow.listHelp')}</p></div>
      <button className="trip-button trip-button-secondary" onClick={() => onNavigate?.('marketplace')}>{t('bookingFlow.browse')}</button></header>
    {bookingId ? <><div className="booking-actions"><button className="trip-text-button" onClick={() => select(null)}>{t('bookingFlow.backToList')}</button></div>
      <BookingDetails key={`${user?.id}:${bookingId}`} bookingId={bookingId} onChanged={refresh} /></> : <>
      <button className="trip-text-button" disabled={loading} onClick={refresh}>{t('bookingFlow.refresh')}</button>
      {loading && <p role="status">{t('bookingFlow.loading')}</p>}
      {error && <p className="trip-alert" role="alert">{t(error)}</p>}
      {data && !loading && <>
        <p className="trip-help">{t('bookingFlow.results', { count: data.totalElements })}</p>
        {!data.content.length && <p className="trip-state">{t('bookingFlow.empty')}</p>}
        <div className="booking-list">{data.content.map(booking => <button key={booking.id} className="booking-list-item" onClick={() => select(booking.id)}>
          <div><span className="booking-code">{booking.bookingCode}</span><h2>{booking.tourTitle}</h2><p>{date(booking.startsAt)}</p><p>{t('bookingFlow.people', { count: booking.participantCount })}</p></div>
          <div><span className={`booking-status booking-status-${booking.status.toLowerCase()}`}>{t(`bookingFlow.status.${booking.status}`)}</span><p><strong>{formatVND(booking.totalPriceVnd, language)}</strong></p><span>{t('bookingFlow.view')}</span></div>
        </button>)}</div>
        {data.totalPages > 1 && <nav className="booking-pagination" aria-label={t('bookingFlow.pages')}>
          <button className="trip-button trip-button-secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('bookingFlow.previous')}</button>
          <span>{t('bookingFlow.page', { current: page + 1, total: data.totalPages })}</span>
          <button className="trip-button trip-button-secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t('bookingFlow.next')}</button>
        </nav>}
      </>}
    </>}
  </div></main>;
}
export default MyBookingsPage;
