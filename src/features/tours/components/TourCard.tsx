import { useState } from 'react';
import { ArrowUpRight, Clock3, Mountain } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { TourSummaryResponse } from '../types/tour-contract.types';

interface TourCardProps {
  tour: TourSummaryResponse;
  onViewDetails: (tour: TourSummaryResponse) => void;
}

export function TourCard({ tour, onViewDetails }: TourCardProps) {
  const { t } = useI18n();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <article className="trip-card">
    <button type="button" className="trip-card-link" onClick={() => onViewDetails(tour)} aria-label={`${t('trip.view')}: ${tour.title}`}>
      <div className="trip-card-photo">
        {tour.coverImageUrl && failedUrl !== tour.coverImageUrl
          ? <img src={tour.coverImageUrl} alt="" loading="lazy" onError={() => setFailedUrl(tour.coverImageUrl)} />
          : <div className="trip-photo-empty"><Mountain aria-hidden="true" /><span>{t('trip.coverMissing')}</span></div>}
        {tour.difficulty && <span className="trip-difficulty">{t(`tour.${tour.difficulty.toLowerCase()}`)}</span>}
      </div>
      <div className="trip-card-body">
        <p className="trip-card-duration"><Clock3 size={15} aria-hidden="true" />{tour.durationDays == null ? t('trip.unspecified') : tour.durationDays === 1 ? t('trip.dayOne') : t('trip.days', { count: tour.durationDays })}</p>
        <h2>{tour.title}</h2>
        <span className="trip-card-action">{t('trip.view')}<ArrowUpRight size={19} aria-hidden="true" /></span>
      </div>
    </button>
  </article>;
}
