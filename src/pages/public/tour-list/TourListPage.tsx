import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { tourReadApi } from '../../../features/tours/api/tourRead.api';
import { useTourResource } from '../../../features/tours/hooks/useTourData';
import { TourCard } from '../../../features/tours/components/TourCard';
import { TourPagination, TourState } from '../../../features/tours/components/TourState';
import type { TourSearchParams, TourDifficulty } from '../../../features/tours/types/tour-contract.types';
import trailPhoto from '../../../assets/images/ta_xua_ridge_walk_1792001302386.jpg';
import '../../../features/tours/tour-flow.css';

export interface TourListPageProps {
  onViewTour?: (id: string) => void;
  searchTerm?: string;
  onSearch?: (query: string) => void;
  onSignIn?: () => void;
}

export function TourListPage({ onViewTour = () => {}, searchTerm = '', onSearch, onSignIn }: TourListPageProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState(searchTerm);
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState('');
  const [filter, setFilter] = useState<TourSearchParams>({ query: searchTerm, page: 0, size: 12 });
  useEffect(() => {
    setQuery(searchTerm);
    setFilter(value => ({ ...value, query: searchTerm.trim() || undefined, page: 0 }));
  }, [searchTerm]);
  const catalog = useTourResource(JSON.stringify(filter), signal => tourReadApi.list(filter, signal));
  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setFilter({ query: query.trim() || undefined, difficulty: (difficulty || undefined) as TourDifficulty | undefined,
      durationDays: duration ? Number(duration) : undefined, page: 0, size: 12 });
    onSearch?.(query.trim());
  };
  const resetFilters = () => {
    setQuery(''); setDifficulty(''); setDuration(''); setFilter({ page: 0, size: 12 }); onSearch?.('');
  };
  return <main className="tour-flow">
    <section className="trip-browse-intro"><div><h1>{t('trip.title')}</h1><p>{t('trip.intro')}</p></div><img src={trailPhoto} alt={t('trip.heroAlt')} /></section>
    <div className="trip-container">
      <form className="trip-search" onSubmit={applyFilters}>
        <label className="trip-search-name"><span>{t('trip.search')}</span><div><Search size={19} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('trip.searchPlaceholder')} maxLength={250} /></div></label>
        <label><span>{t('trip.difficulty')}</span><select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="">{t('trip.anyDifficulty')}</option>{['EASY', 'MODERATE', 'HARD', 'EXPERT'].map(value => <option key={value} value={value}>{t(`tour.${value.toLowerCase()}`)}</option>)}</select></label>
        <label><span>{t('trip.duration')}</span><input type="number" min={1} step={1} value={duration} onChange={event => setDuration(event.target.value)} placeholder={t('trip.anyDuration')} /></label>
        <button className="trip-button" type="submit"><Search size={18} aria-hidden="true" />{t('trip.find')}</button>
      </form>
      <div className="trip-results-heading"><p aria-live="polite">{catalog.data ? t('trip.results', { count: catalog.data.totalElements }) : t('tour.listTitle')}</p><button className="trip-text-button" onClick={resetFilters}><SlidersHorizontal size={15} aria-hidden="true" />{t('trip.reset')}</button></div>
      {catalog.loading || catalog.errorCode ? <TourState {...catalog} onSignIn={onSignIn} />
        : catalog.data?.content.length ? <><div className="trip-card-grid">{catalog.data.content.map(tour => <TourCard key={tour.id} tour={tour} onViewDetails={item => onViewTour(String(item.id))} />)}</div>
          <TourPagination page={catalog.data.number} totalPages={catalog.data.totalPages} onChange={page => setFilter(value => ({ ...value, page }))} /></>
          : <div className="trip-state"><Search size={30} aria-hidden="true" /><h2>{t('trip.noResults')}</h2><p>{t('trip.noResultsHelp')}</p><button className="trip-button trip-button-secondary" onClick={resetFilters}>{t('trip.reset')}</button></div>}
    </div>
  </main>;
}
export default TourListPage;
