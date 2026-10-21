import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTour, useTourReviews } from '../../../features/tours/hooks/useTours';
import { formatVND } from '../../../lib/utils';
import { useI18n } from '../../../i18n/I18nProvider';

export interface TourDetailPageProps { tourId?: string; onBack?: () => void; }

export const TourDetailPage: React.FC<TourDetailPageProps> = ({ tourId, onBack = () => {} }) => {
  const { t, language } = useI18n();
  const { data, loading, error } = useTour(tourId);
  const [reviewPage, setReviewPage] = useState(0);
  const reviews = useTourReviews(data?.summary.id, reviewPage);
  if (loading) return <p className="max-w-6xl mx-auto p-8" role="status">{t('tour.loading')}</p>;
  if (error || !data) return <div className="max-w-6xl mx-auto p-8"><button onClick={onBack} className="mb-4"><ArrowLeft className="inline w-4 h-4"/> {t('tour.back')}</button><p role="alert">{error || t('tour.unavailable')}</p></div>;

  const { summary } = data;
  const money = (value: number) => formatVND(value, language);
  const date = (value: string) => new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  const difficulty = summary.difficulty ? t(`tour.${summary.difficulty}`) : t('tour.difficultyUnknown');
  return <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
    <button onClick={onBack} className="text-sm text-stone-600"><ArrowLeft className="inline w-4 h-4"/> {t('tour.back')}</button>
    {summary.coverImageUrl && <img src={summary.coverImageUrl} alt="" className="w-full max-h-[28rem] object-cover rounded-2xl"/>}
    <div><p className="text-xs uppercase text-stone-500">{data.company.name}</p><h1 className="text-3xl font-bold">{summary.title}</h1><p className="text-stone-600 mt-2">{summary.destinations.map(d=>d.name).join(', ')}</p></div>
    <p>{data.description || t('tour.noDescription')}</p>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="bg-white border rounded-xl p-5"><h2 className="font-bold">{t('tour.information')}</h2><p>{difficulty}{summary.durationDays ? ` · ${t('tour.days', {count: summary.durationDays})}` : ''}</p><p>{summary.startingPriceVnd == null ? t('tour.priceUnavailable') : t('tour.from', {price: money(summary.startingPriceVnd)})}</p><p>{data.averageTourRating == null ? t('tour.noRatings') : `${data.averageTourRating.toFixed(1)} / 5`} · {data.reviewCount}</p></section>
      <section className="bg-white border rounded-xl p-5"><h2 className="font-bold">{t('tour.schedules')}</h2>{data.schedules.length ? data.schedules.map(s=><div key={s.id} className="py-2 border-b last:border-0"><p>{date(s.startsAt)} – {date(s.endsAt)}</p><p>{t('tour.availableSpots', {count: s.availableSpots})} · {t('tour.basePrice')}: {money(s.basePriceVnd)}</p>{s.equipmentFeeVnd > 0 && <p className="text-sm">{t('tour.equipmentFee')}: {money(s.equipmentFeeVnd)}</p>}<p className="text-sm">{t('tour.deposit')}: {s.depositPercent}%</p>{s.guides.length > 0 && <p className="text-sm">{s.guides.join(', ')}</p>}</div>) : <p>{t('tour.noDepartures')}</p>}<p className="text-xs text-stone-500 mt-3">{t('tour.bookingUnavailable')}</p></section>
    </div>
    {data.includedServices && <section><h2 className="font-bold">{t('tour.included')}</h2><p>{data.includedServices}</p></section>}
    {data.excludedServices && <section><h2 className="font-bold">{t('tour.excluded')}</h2><p>{data.excludedServices}</p></section>}
    {data.requiredExperience && <section><h2 className="font-bold">{t('tour.experience')}</h2><p>{data.requiredExperience}</p></section>}
    {data.cancellationPolicy && <section><h2 className="font-bold">{t('tour.cancellation')}</h2><h3 className="font-semibold">{data.cancellationPolicy.title} · {t('tour.version', {version: data.cancellationPolicy.version})}</h3><p>{data.cancellationPolicy.content}</p></section>}
    {!!data.packingList?.length && <section><h2 className="font-bold">{t('tour.packing')}</h2><ul className="list-disc pl-5">{data.packingList.map((item,i)=><li key={`${i}-${item.name}`}>{item.name}{item.required ? ` · ${t('tour.required')}` : ''}{item.note ? ` · ${item.note}` : ''}</li>)}</ul></section>}
    {data.routeFileUrl && <section><h2 className="font-bold">{t('tour.route')}</h2><p>{t('tour.routeNote')}</p></section>}
    {data.equipment && <section><h2 className="font-bold">{t('tour.equipment')}</h2><p><strong>{data.equipment.title}</strong>: {data.equipment.includedItems}{data.equipment.sharedItems ? ` · ${t('tour.shared')}: ${data.equipment.sharedItems}` : ''}{data.equipment.personalItemsToBring ? ` · ${t('tour.bring')}: ${data.equipment.personalItemsToBring}` : ''}</p></section>}
    {!!data.gallery.length && <section><h2 className="font-bold mb-3">{t('tour.gallery')}</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{data.gallery.map(i=><figure key={i.id}><img src={i.url} alt={i.caption || ''} className="w-full h-40 object-cover rounded-lg"/>{i.caption && <figcaption className="text-sm">{i.caption}</figcaption>}</figure>)}</div></section>}
    {!!data.itinerary.length && <section><h2 className="font-bold mb-3">{t('tour.itinerary')}</h2>{data.itinerary.map(i=><article key={i.dayNumber} className="border-l-2 pl-4 mb-4"><h3 className="font-semibold">{t('tour.day', {day:i.dayNumber})}: {i.title}</h3>{i.startTime && <p className="text-sm">{i.startTime}</p>}{i.description && <p>{i.description}</p>}</article>)}</section>}
    <section><h2 className="font-bold mb-3">{t('tour.reviews')}</h2>{reviews.data && <p className="text-sm text-stone-600 mb-2">{t('tour.averageRating')}: {reviews.data.averageTourRating == null ? t('tour.noRatings') : `${reviews.data.averageTourRating.toFixed(1)} / 5`} · {reviews.data.totalItems}</p>}{reviews.loading && <p role="status">{t('tour.loading')}</p>}{reviews.error && <p role="alert">{reviews.error}</p>}{!reviews.loading && !reviews.error && !reviews.data?.items.length && <p>{t('tour.noReviews')}</p>}{reviews.data?.items.map(review=><article key={review.id} className="border-b py-3"><p className="font-semibold">{review.tourRating} / 5 · {review.companyRating} / 5</p>{review.content && <p>{review.content}</p>}{review.imageUrls.map((url,index)=><img key={`${review.id}-${index}`} src={url} alt="" className="inline-block h-20 w-20 object-cover rounded mr-2 mt-2"/>)}<time className="block text-xs text-stone-500">{date(review.createdAt)}</time>{review.companyReply && <p className="mt-2 text-sm"><strong>{t('tour.companyReply')}:</strong> {review.companyReply}</p>}</article>)}{reviews.data && reviews.data.totalPages > 1 && <nav className="flex justify-center gap-3 mt-4"><button disabled={reviewPage===0} onClick={()=>setReviewPage(p=>Math.max(0,p-1))} className="border rounded px-3 py-1 disabled:opacity-40">{t('tour.previous')}</button><span className="text-sm self-center">{t('tour.page', {current:reviews.data.page+1,total:reviews.data.totalPages})}</span><button disabled={reviewPage+1>=reviews.data.totalPages} onClick={()=>setReviewPage(p=>p+1)} className="border rounded px-3 py-1 disabled:opacity-40">{t('tour.next')}</button></nav>}</section>
  </div>;
};

export default TourDetailPage;
