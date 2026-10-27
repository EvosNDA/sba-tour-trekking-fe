import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CircleCheck, Clock3, TriangleAlert } from 'lucide-react';
import { BookingPaymentLink, BookingPaymentPurpose, BookingPaymentStatus, customerBookingsApi } from '../../../features/tours/api/customerBookings.api';
import { formatVND } from '../../../lib/utils';
import { useI18n } from '../../../i18n/I18nProvider';

interface Props { onNavigate: (screen: import('../../../types/expedition').ScreenId) => void; }

export default function CustomerPaymentResultPage({ onNavigate }: Props) {
  const { t, language } = useI18n();
  const params = new URLSearchParams(window.location.search);
  const bookingId = Number(params.get('bookingId'));
  const returnHint = params.get('paymentReturn');
  const [status, setStatus] = useState<BookingPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentLink, setPaymentLink] = useState<BookingPaymentLink | null>(null);
  const money = (value: number) => formatVND(value, language);

  const refresh = useCallback(async () => {
    if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
      setError(t('paymentResult.missingBooking'));
      setLoading(false);
      return;
    }
    try {
      setStatus(await customerBookingsApi.paymentStatus(bookingId));
      setError('');
    } catch {
      setError(t('paymentResult.lookupError'));
    } finally { setLoading(false); }
  }, [bookingId, t]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 5000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [refresh]);

  const continuePayment = async () => {
    if (!status) return;
    const purpose: BookingPaymentPurpose = status.bookingStatus === 'confirmed' ? 'balance' : 'deposit';
    setPaymentBusy(true); setError(''); setPaymentLink(null);
    try {
      const link = await customerBookingsApi.createPaymentLink(bookingId, purpose);
      if (!link.enabled || !link.checkoutUrl || link.status === 'failed') { setError(t('paymentResult.paymentUnavailable')); return; }
      setPaymentLink(link);
    } catch { setError(t('paymentResult.paymentUnavailable')); }
    finally { setPaymentBusy(false); }
  };

  const confirmed = status?.bookingStatus === 'confirmed' || status?.bookingStatus === 'completed';
  const expired = status?.bookingStatus === 'expired' || status?.bookingStatus === 'cancelled';
  const canPay = status && ['pending_payment', 'confirmed'].includes(status.bookingStatus) && status.amountDueVnd > 0 && status.paymentEnabled;
  return <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
    <button type="button" onClick={() => onNavigate('marketplace')} className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#52605D] hover:bg-white"><ArrowLeft aria-hidden="true" className="h-4 w-4"/>{t('paymentResult.backToTours')}</button>
    <section className="rounded-3xl border border-[#E2E7E4] bg-white p-6 shadow-sm md:p-9">
      {loading ? <p role="status" className="flex items-center gap-3 text-sm text-[#52605D]"><Clock3 aria-hidden="true" className="h-5 w-5"/>{t('paymentResult.checking')}</p> : error && !status ? <div role="alert"><h1 className="text-2xl font-bold">{t('paymentResult.title')}</h1><p className="mt-3 text-sm text-rose-800">{error}</p></div> : status ? <>
        <div className="flex items-start gap-4">
          {confirmed ? <CircleCheck aria-hidden="true" className="mt-1 h-8 w-8 shrink-0 text-emerald-700"/> : expired ? <TriangleAlert aria-hidden="true" className="mt-1 h-8 w-8 shrink-0 text-amber-700"/> : <Clock3 aria-hidden="true" className="mt-1 h-8 w-8 shrink-0 text-amber-700"/>}
          <div><h1 className="text-2xl font-bold">{confirmed ? t('paymentResult.confirmedTitle') : expired ? t('paymentResult.expiredTitle') : t('paymentResult.pendingTitle')}</h1><p className="mt-2 text-sm leading-6 text-[#52605D]">{confirmed ? t('paymentResult.confirmedDescription') : expired ? t('paymentResult.expiredDescription') : returnHint === 'cancelled' ? t('paymentResult.cancelledDescription') : t('paymentResult.pendingDescription')}</p></div>
        </div>
        <dl className="mt-7 grid gap-4 rounded-2xl bg-[#F7F8F6] p-4 sm:grid-cols-3"><div><dt className="text-xs text-[#64716D]">{t('paymentResult.total')}</dt><dd className="mt-1 font-semibold">{money(status.totalPriceVnd)}</dd></div><div><dt className="text-xs text-[#64716D]">{t('paymentResult.received')}</dt><dd className="mt-1 font-semibold text-emerald-800">{money(status.receivedVnd)}</dd></div><div><dt className="text-xs text-[#64716D]">{t('paymentResult.due')}</dt><dd className="mt-1 font-semibold">{money(status.amountDueVnd)}</dd></div></dl>
        {status.pendingReviewVnd ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{t('paymentResult.pendingReview', { amount: money(status.pendingReviewVnd) })}</p> : null}
        {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        {paymentLink?.checkoutUrl && <a href={paymentLink.checkoutUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#1F4E43] px-5 text-sm font-semibold text-white hover:bg-[#173C34]">{t('paymentResult.continuePayment')}</a>}
        {canPay && !paymentLink && <button type="button" disabled={paymentBusy} onClick={() => void continuePayment()} className="mt-5 min-h-11 rounded-lg border border-[#1F4E43] px-5 text-sm font-semibold text-[#1F4E43] disabled:opacity-50">{paymentBusy ? t('paymentResult.preparing') : t('paymentResult.tryPayment')}</button>}
      </> : null}
      <p className="mt-6 border-t border-[#E8ECE9] pt-4 text-xs leading-5 text-[#64716D]">{t('paymentResult.verificationNote')}</p>
    </section>
  </main>;
}
