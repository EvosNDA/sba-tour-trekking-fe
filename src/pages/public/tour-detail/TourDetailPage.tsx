import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTour, useTourReviews } from '../../../features/tours/hooks/useTours';
import { formatVND } from '../../../lib/utils';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { BookingPaymentLink, BookingPaymentPurpose, BookingPaymentStatus, customerBookingsApi, CreatedBooking } from '../../../features/tours/api/customerBookings.api';

export interface TourDetailPageProps { tourId?: string; onBack?: () => void; onNavigate?: (screen: import('../../../types/expedition').ScreenId) => void; }

export const TourDetailPage: React.FC<TourDetailPageProps> = ({ tourId, onBack = () => {}, onNavigate }) => {
  const { t, language } = useI18n();
  const { user } = useAuthStore();
  const { data, loading, error } = useTour(tourId);
  const [reviewPage, setReviewPage] = useState(0);
  const [bookingSchedule, setBookingSchedule] = useState<number | null>(null);
  const [participants, setParticipants] = useState([{ fullName: '', email: '', phone: '' }]);
  const [includesEquipment, setIncludesEquipment] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<BookingPaymentStatus | null>(null);
  const [paymentLink, setPaymentLink] = useState<BookingPaymentLink | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const bookingKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const bookingOpenerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('wetrek:active-booking');
      if (saved) setCreatedBooking(JSON.parse(saved) as CreatedBooking);
    } catch { sessionStorage.removeItem('wetrek:active-booking'); }
  }, []);
  const reviews = useTourReviews(data?.summary.id, reviewPage);
  useEffect(() => {
    if (!createdBooking) return;
    let active = true;
    const refreshStatus = async () => {
      try { const result = await customerBookingsApi.paymentStatus(createdBooking.id); if (active) setPaymentStatus(result); }
      catch { /* Keep the last verified status visible if a refresh is temporarily unavailable. */ }
    };
    void refreshStatus();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshStatus(); }, 5000);
    window.addEventListener('focus', refreshStatus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refreshStatus); };
  }, [createdBooking]);
  if (loading) return <p className="max-w-6xl mx-auto p-8" role="status">{t('tour.loading')}</p>;
  if (error || !data) return <div className="max-w-6xl mx-auto p-8"><button onClick={onBack} className="mb-4"><ArrowLeft className="inline w-4 h-4"/> {t('tour.back')}</button><p role="alert">{error || t('tour.unavailable')}</p></div>;

  const { summary } = data;
  const money = (value: number) => formatVND(value, language);
  const date = (value: string) => new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  const fieldClass = 'mt-1 block w-full rounded-lg border border-[#CAD4CF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1F4E43] focus:ring-2 focus:ring-[#1F4E43]/15';
  const beginBooking = (scheduleId: number) => {
    bookingOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setBookingSchedule(scheduleId); setParticipants([{ fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '' }]); setBookingError('');
  };
  const closeBooking = () => { setBookingSchedule(null); window.requestAnimationFrame(() => bookingOpenerRef.current?.focus()); };
  const handleBookingDialogKeyDown: React.KeyboardEventHandler<HTMLFormElement> = event => {
    if (event.key === 'Escape' && !bookingBusy) { event.preventDefault(); closeBooking(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const createBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (bookingSchedule === null) return;
    setBookingBusy(true); setBookingError(''); setCreatedBooking(null);
    try {
      const request = { scheduleId: bookingSchedule, participantCount: participants.length, includesEquipment, participants: participants.map(({ fullName, email, phone }) => ({ fullName: fullName.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined })) };
      const fingerprint = JSON.stringify(request);
      if (bookingKeyRef.current?.fingerprint !== fingerprint) bookingKeyRef.current = { fingerprint, key: window.crypto.randomUUID() };
      const result = await customerBookingsApi.create(request, bookingKeyRef.current.key);
      bookingKeyRef.current = null;
      sessionStorage.setItem('wetrek:active-booking', JSON.stringify(result));
      setPaymentStatus(null); setPaymentLink(null); setPaymentError(''); setCreatedBooking(result); closeBooking();
    } catch (e) { setBookingError(e && typeof e === 'object' && 'message' in e ? String(e.message) : t('booking.createError')); }
    finally { setBookingBusy(false); }
  };
  const startPayment = async (purpose: BookingPaymentPurpose) => {
    if (!createdBooking) return;
    setPaymentBusy(true); setPaymentError(''); setPaymentLink(null);
    try {
      const link = await customerBookingsApi.createPaymentLink(createdBooking.id, purpose);
      if (!link.enabled || !link.checkoutUrl) { setPaymentError(t('booking.paymentUnavailable')); return; }
      if (link.status === 'failed') { setPaymentError(t('booking.paymentUnavailable')); return; }
      setPaymentLink(link);
    } catch { setPaymentError(t('booking.paymentUnavailable')); }
    finally { setPaymentBusy(false); }
  };
  const difficulty = summary.difficulty ? t(`tour.${summary.difficulty}`) : t('tour.difficultyUnknown');
  return <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
    <button onClick={onBack} className="text-sm text-stone-600"><ArrowLeft className="inline w-4 h-4"/> {t('tour.back')}</button>
    {summary.coverImageUrl && <img src={summary.coverImageUrl} alt="" className="w-full max-h-[28rem] object-cover rounded-2xl"/>}
    <div><p className="text-xs uppercase text-stone-500">{data.company.name}</p><h1 className="text-3xl font-bold">{summary.title}</h1><p className="text-stone-600 mt-2">{summary.destinations.map(d=>d.name).join(', ')}</p></div>
    <p>{data.description || t('tour.noDescription')}</p>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="bg-white border rounded-xl p-5"><h2 className="font-bold">{t('tour.information')}</h2><p>{difficulty}{summary.durationDays ? ` · ${t('tour.days', {count: summary.durationDays})}` : ''}</p><p>{summary.startingPriceVnd == null ? t('tour.priceUnavailable') : t('tour.from', {price: money(summary.startingPriceVnd)})}</p><p>{data.averageTourRating == null ? t('tour.noRatings') : `${data.averageTourRating.toFixed(1)} / 5`} · {data.reviewCount}</p></section>
      <section className="bg-white border rounded-xl p-5"><h2 className="font-bold">{t('tour.schedules')}</h2>{createdBooking && <div role="status" className="my-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><h3 className="font-bold">{t('booking.holdCreated')}</h3><p className="mt-1">{t('booking.holdCode', { code: createdBooking.bookingCode })}</p><p className="mt-1">{t('booking.holdUntil', { date: new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdBooking.holdExpiresAt)) })}</p><p className="mt-1">{t('booking.total', { amount: money(paymentStatus?.totalPriceVnd ?? createdBooking.totalPriceVnd) })}</p><p className="mt-1">{t('booking.depositDue', { amount: money(createdBooking.depositDueVnd) })}</p><p className="mt-1">{t('booking.balanceDue', { date: new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdBooking.balanceDueAt)) })}</p>{paymentStatus?.bookingStatus === 'confirmed' && <p className="mt-2 font-semibold text-emerald-800">{t('booking.paymentConfirmed', { amount: money(paymentStatus.receivedVnd) })}</p>}{paymentStatus?.pendingReviewVnd ? <p className="mt-2 rounded bg-amber-100 p-2 text-amber-950">{t('paymentResult.pendingReview', { amount: money(paymentStatus.pendingReviewVnd) })}</p> : null}{['expired', 'cancelled'].includes(paymentStatus?.bookingStatus || '') && <p className="mt-2 text-amber-900">{t('paymentResult.expiredDescription')}</p>}{paymentStatus && paymentStatus.bookingStatus !== 'confirmed' && <p className="mt-2">{t('booking.amountDue', { amount: money(paymentStatus.amountDueVnd) })}</p>}{paymentError && <p role="alert" className="mt-2 rounded bg-amber-100 p-2">{paymentError}</p>}{paymentLink?.checkoutUrl && <a href={paymentLink.checkoutUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#1F4E43] px-4 font-semibold text-white">{t('booking.continuePayment')}</a>}{paymentStatus?.paymentEnabled && !paymentLink && paymentStatus.bookingStatus === 'pending_payment' && paymentStatus.amountDueVnd > 0 && <button type="button" disabled={paymentBusy} onClick={() => void startPayment(paymentStatus?.bookingStatus === 'confirmed' ? 'balance' : 'deposit')} className="mt-3 min-h-10 rounded-lg border border-[#1F4E43] px-4 font-semibold text-[#1F4E43] disabled:opacity-50">{paymentBusy ? t('booking.paymentLoading') : t('booking.payDeposit')}</button>}{paymentStatus?.paymentEnabled && !paymentLink && paymentStatus.bookingStatus === 'confirmed' && paymentStatus.amountDueVnd > 0 && <button type="button" disabled={paymentBusy} onClick={() => void startPayment('balance')} className="mt-3 min-h-10 rounded-lg border border-[#1F4E43] px-4 font-semibold text-[#1F4E43] disabled:opacity-50">{paymentBusy ? t('booking.paymentLoading') : t('booking.payBalance')}</button>}{paymentStatus && !paymentStatus.paymentEnabled && <p className="mt-2 text-xs text-stone-600">{t('booking.paymentUnavailable')}</p>}</div>}{data.schedules.length ? data.schedules.map(s=><div key={s.id} className="border-b py-3 last:border-0"><p className="font-semibold">{date(s.startsAt)} – {date(s.endsAt)}</p><p className="mt-1 text-sm">{t('tour.availableSpots', {count: s.availableSpots})} · {t('tour.basePrice')}: {money(s.basePriceVnd)}</p>{s.equipmentFeeVnd > 0 && <p className="text-sm">{t('tour.equipmentFee')}: {money(s.equipmentFeeVnd)}</p>}<p className="text-sm">{t('tour.deposit')}: {s.depositPercent}%</p>{s.guides.length > 0 && <p className="text-sm">{s.guides.join(', ')}</p>}{user?.role === 'customer' ? <button type="button" disabled={!s.availableSpots} onClick={() => beginBooking(s.id)} className="mt-3 min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50">{t('booking.reserve')}</button> : user ? <p className="mt-3 text-sm text-stone-600">{t('booking.customerOnly')}</p> : <button type="button" onClick={() => onNavigate?.('login')} className="mt-3 min-h-10 rounded-lg border border-[#1F4E43] px-4 text-sm font-semibold text-[#1F4E43]">{t('booking.signInToReserve')}</button>}</div>) : <p>{t('tour.noDepartures')}</p>}</section>
    </div>
    {bookingSchedule !== null && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1C2526]/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !bookingBusy) closeBooking(); }}><form role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" onSubmit={createBooking} onKeyDown={handleBookingDialogKeyDown} className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl md:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="booking-dialog-title" className="text-xl font-bold">{t('booking.reserve')}</h2><p className="mt-1 text-sm text-[#64716D]">{t('booking.holdExplanation')}</p></div><button type="button" aria-label={t('booking.close')} onClick={closeBooking} className="rounded px-2 py-1 text-lg">×</button></div>{bookingError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{bookingError}</p>}<div className="mt-4 space-y-4">{participants.map((person, index) => <fieldset key={index} className="grid gap-3 rounded-xl border border-[#E2E7E4] p-4 sm:grid-cols-3"><legend className="px-1 text-sm font-semibold">{t('booking.traveler', { number: index + 1 })}</legend><label className="text-xs font-semibold">{t('booking.fullName')}<input autoFocus={index === 0} required value={person.fullName} onChange={e => setParticipants(rows => rows.map((row, i) => i === index ? { ...row, fullName: e.target.value } : row))} className={fieldClass}/></label><label className="text-xs font-semibold">{t('booking.email')}<input type="email" value={person.email} onChange={e => setParticipants(rows => rows.map((row, i) => i === index ? { ...row, email: e.target.value } : row))} className={fieldClass}/></label><label className="text-xs font-semibold">{t('booking.phone')}<input type="tel" value={person.phone} onChange={e => setParticipants(rows => rows.map((row, i) => i === index ? { ...row, phone: e.target.value } : row))} className={fieldClass}/></label></fieldset>)}<div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={participants.length >= Math.min(20, data.schedules.find(s => s.id === bookingSchedule)?.availableSpots ?? 20)} onClick={() => setParticipants(rows => [...rows, { fullName: '', email: '', phone: '' }])} className="min-h-10 rounded-lg border border-[#CAD4CF] px-3 text-sm font-semibold disabled:opacity-40">{t('booking.addTraveler')}</button>{participants.length > 1 && <button type="button" onClick={() => setParticipants(rows => rows.slice(0, -1))} className="text-sm text-[#52605D] underline">{t('booking.removeLastTraveler')}</button>}</div>{data.equipment && <label className="flex items-start gap-3 rounded-lg bg-[#F7F8F6] p-3 text-sm"><input type="checkbox" checked={includesEquipment} onChange={e => setIncludesEquipment(e.target.checked)} className="mt-1 accent-[#1F4E43]"/><span>{t('booking.includeEquipment', { title: data.equipment.title })}<span className="block text-xs text-[#64716D]">{t('booking.equipmentFeeNotice')}</span></span></label>}</div><div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{t('booking.holdExplanation')} {t('booking.paymentUnavailable')}</div><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={bookingBusy} onClick={closeBooking} className="min-h-10 rounded-lg border border-[#CAD4CF] px-4 text-sm font-semibold">{t('booking.close')}</button><button type="submit" disabled={bookingBusy || participants.length === 0} className="min-h-10 rounded-lg bg-[#1F4E43] px-4 text-sm font-semibold text-white disabled:opacity-50">{bookingBusy ? t('booking.saving') : t('booking.createHold')}</button></div></form></div>}
    {data.includedServices && <section><h2 className="font-bold">{t('tour.included')}</h2><p>{data.includedServices}</p></section>}
    {data.excludedServices && <section><h2 className="font-bold">{t('tour.excluded')}</h2><p>{data.excludedServices}</p></section>}
    {data.requiredExperience && <section><h2 className="font-bold">{t('tour.experience')}</h2><p>{data.requiredExperience}</p></section>}
    {(data.cancellationPolicy || data.cancellationRefundRules?.length > 0) && <section><h2 className="font-bold">{t('tour.cancellation')}</h2>{data.cancellationRefundRules?.length > 0 && <><p className="mt-2 text-sm text-[#52605D]">{t('tour.partnerCancellationFull')}</p><ul className="mt-2 space-y-1 text-sm">{[...data.cancellationRefundRules].sort((a,b) => b.daysBeforeDeparture-a.daysBeforeDeparture).map(rule=><li key={rule.daysBeforeDeparture}>{t('tour.refundRule', {days: rule.daysBeforeDeparture, percent: rule.refundPercent})}</li>)}</ul></>}{data.cancellationPolicy && <div className="mt-4 border-t border-[#E2E7E4] pt-3"><h3 className="font-semibold">{data.cancellationPolicy.title} · {t('tour.version', {version: data.cancellationPolicy.version})}</h3><p className="mt-1 text-sm">{data.cancellationPolicy.content}</p></div>}</section>}
    {!!data.packingList?.length && <section><h2 className="font-bold">{t('tour.packing')}</h2><ul className="list-disc pl-5">{data.packingList.map((item,i)=><li key={`${i}-${item.name}`}>{item.name}{item.required ? ` · ${t('tour.required')}` : ''}{item.note ? ` · ${item.note}` : ''}</li>)}</ul></section>}
    {data.routeFileUrl && <section><h2 className="font-bold">{t('tour.route')}</h2><p>{t('tour.routeNote')}</p></section>}
    {data.equipment && <section><h2 className="font-bold">{t('tour.equipment')}</h2><p><strong>{data.equipment.title}</strong>: {data.equipment.includedItems}{data.equipment.sharedItems ? ` · ${t('tour.shared')}: ${data.equipment.sharedItems}` : ''}{data.equipment.personalItemsToBring ? ` · ${t('tour.bring')}: ${data.equipment.personalItemsToBring}` : ''}</p></section>}
    {!!data.gallery.length && <section><h2 className="font-bold mb-3">{t('tour.gallery')}</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{data.gallery.map(i=><figure key={i.id}><img src={i.url} alt={i.caption || ''} className="w-full h-40 object-cover rounded-lg"/>{i.caption && <figcaption className="text-sm">{i.caption}</figcaption>}</figure>)}</div></section>}
    {!!data.itinerary.length && <section><h2 className="font-bold mb-3">{t('tour.itinerary')}</h2>{data.itinerary.map(i=><article key={i.dayNumber} className="border-l-2 pl-4 mb-4"><h3 className="font-semibold">{t('tour.day', {day:i.dayNumber})}: {i.title}</h3>{i.startTime && <p className="text-sm">{i.startTime}</p>}{i.description && <p>{i.description}</p>}</article>)}</section>}
    <section><h2 className="font-bold mb-3">{t('tour.reviews')}</h2>{reviews.data && <p className="text-sm text-stone-600 mb-2">{t('tour.averageRating')}: {reviews.data.averageTourRating == null ? t('tour.noRatings') : `${reviews.data.averageTourRating.toFixed(1)} / 5`} · {reviews.data.totalItems}</p>}{reviews.loading && <p role="status">{t('tour.loading')}</p>}{reviews.error && <p role="alert">{reviews.error}</p>}{!reviews.loading && !reviews.error && !reviews.data?.items.length && <p>{t('tour.noReviews')}</p>}{reviews.data?.items.map(review=><article key={review.id} className="border-b py-3"><p className="font-semibold">{review.tourRating} / 5 · {review.companyRating} / 5</p>{review.content && <p>{review.content}</p>}{review.imageUrls.map((url,index)=><img key={`${review.id}-${index}`} src={url} alt="" className="inline-block h-20 w-20 object-cover rounded mr-2 mt-2"/>)}<time className="block text-xs text-stone-500">{date(review.createdAt)}</time>{review.companyReply && <p className="mt-2 text-sm"><strong>{t('tour.companyReply')}:</strong> {review.companyReply}</p>}</article>)}{reviews.data && reviews.data.totalPages > 1 && <nav className="flex justify-center gap-3 mt-4"><button disabled={reviewPage===0} onClick={()=>setReviewPage(p=>Math.max(0,p-1))} className="border rounded px-3 py-1 disabled:opacity-40">{t('tour.previous')}</button><span className="text-sm self-center">{t('tour.page', {current:reviews.data.page+1,total:reviews.data.totalPages})}</span><button disabled={reviewPage+1>=reviews.data.totalPages} onClick={()=>setReviewPage(p=>p+1)} className="border rounded px-3 py-1 disabled:opacity-40">{t('tour.next')}</button></nav>}</section>
  </div>;
};

export default TourDetailPage;
