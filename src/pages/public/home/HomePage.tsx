import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useLocations, useTours } from '../../../features/tours/hooks/useTours';
import { formatVND } from '../../../lib/utils';
import { ScreenId } from '../../../types/expedition';
import TourListPage from '../tour-list/TourListPage';
import TourDetailPage from '../tour-detail/TourDetailPage';
import { useI18n } from '../../../i18n/I18nProvider';

export interface HomePageProps {
  onNavigate?: (screen: ScreenId) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, searchTerm = '', onSearch }) => {
  const { t, language } = useI18n();
  const [destinationId, setDestinationId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const locations = useLocations();
  const tours = useTours({ query: searchTerm.trim() || undefined, destinationId: destinationId ? Number(destinationId) : undefined, difficulty: difficulty || undefined, page: 0, size: 6 });
  if (selectedTourId) return <TourDetailPage tourId={selectedTourId} onBack={() => setSelectedTourId(null)} onNavigate={onNavigate} />;
  if (showAll) return <TourListPage onViewTour={setSelectedTourId} />;
  return <main className="min-h-screen bg-[#FDFBF7] text-[#1C2526]">
    <section className="px-4 md:px-8 py-16 border-b bg-gradient-to-b from-[#F2FBFC] to-[#FDFBF7]">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-[#1F4E43]">{t('home.eyebrow')}</p>
        <h1 className="font-editorial text-4xl md:text-6xl font-bold mt-3">{t('home.title')}</h1>
        <p className="text-stone-600 mt-4">{t('home.description')}</p>
        <form className="mt-8 bg-white border rounded-xl shadow-sm p-3 grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 text-left" onSubmit={e => { e.preventDefault(); }}>
          <label className="text-xs text-stone-600">{t('home.search')}<input value={searchTerm} onChange={e=>onSearch?.(e.target.value)} placeholder={t('home.searchPlaceholder')} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
          <label className="text-xs text-stone-600">{t('home.location')}<select value={destinationId} onChange={e=>setDestinationId(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"><option value="">{t('home.allLocations')}</option>{locations.data.map(l=><option key={l.id} value={l.id}>{l.name}{l.provinceName ? `, ${l.provinceName}` : ''}</option>)}</select></label>
          <label className="text-xs text-stone-600">{t('home.difficulty')}<select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"><option value="">{t('home.anyDifficulty')}</option>{['easy','moderate','hard','expert'].map(d=><option key={d} value={d}>{t(`tour.${d}`)}</option>)}</select></label>
          <button type="submit" className="self-end px-5 py-2.5 rounded bg-[#1F4E43] text-white text-sm"><Search className="inline w-4 h-4 mr-1"/>{t('home.submit')}</button>
        </form>
        {locations.loading && <p className="text-xs text-stone-500 mt-2" role="status">{t('home.loadingLocations')}</p>}
        {locations.error && <p className="text-xs text-amber-800 mt-2" role="alert">{t('home.locationError')}</p>}
      </div>
    </section>
    <section id="tour-list" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-end justify-between mb-5"><div><p className="text-xs uppercase text-stone-500">{t('home.available')}</p><h2 className="text-2xl font-bold">{t('home.tours')}</h2></div><button onClick={() => setShowAll(true)} className="text-sm underline">{t('home.browseAll')}</button></div>
      {tours.loading && <p role="status">{t('home.loadingTours')}</p>}{tours.error && <p role="alert" className="text-red-700">{tours.error}</p>}
      {!tours.loading && !tours.error && !tours.data?.items.length && <p className="text-stone-600">{t('home.noTours')}</p>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{tours.data?.items.map(tour=><article key={tour.id} className="bg-white border rounded-xl overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg focus-within:-translate-y-1 focus-within:border-orange-200 focus-within:shadow-lg motion-reduce:transition-none">{tour.coverImageUrl && <img src={tour.coverImageUrl} alt="" className="h-48 w-full object-cover" loading="lazy"/>}<div className="p-4"><h3 className="font-semibold text-lg">{tour.title}</h3><p className="text-sm text-stone-600 mt-1">{tour.destinations.map(d=>d.name).join(', ') || t('tour.locationUnknown')}</p><p className="text-sm mt-2">{tour.difficulty ? t(`tour.${tour.difficulty}`) : t('tour.difficultyUnknown')}{tour.durationDays ? ` · ${t('tour.days', { count: tour.durationDays })}` : ''}{tour.ratingAverage != null && tour.reviewCount != null ? ` · ${tour.ratingAverage.toFixed(1)} (${tour.reviewCount})` : ''}</p><p className="font-semibold text-orange-800 mt-3">{tour.startingPriceVnd == null ? t('tour.priceUnavailable') : t('tour.from', { price: formatVND(tour.startingPriceVnd, language) })}</p><button className="mt-3 text-sm underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] rounded-sm" onClick={()=>setSelectedTourId(String(tour.id))}>{t('home.viewDetails')}</button></div></article>)}</div>
    </section>
  </main>;
};
export default HomePage;
