import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useLocations, useTours } from '../../../features/tours/hooks/useTours';
import { formatVND } from '../../../lib/utils';
import { useI18n } from '../../../i18n/I18nProvider';

export interface TourListPageProps { onViewTour?: (id: string) => void; }
export const TourListPage: React.FC<TourListPageProps> = ({ onViewTour = () => {} }) => {
  const { t, language } = useI18n();
  const [query, setQuery] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [equipmentPackageId, setEquipmentPackageId] = useState('');
  const [sort, setSort] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'departure_asc'>('recommended');
  const [page, setPage] = useState(0);
  const locations = useLocations();
  const { data, loading, error } = useTours({
    query: query.trim() || undefined, destinationId: destinationId ? Number(destinationId) : undefined,
    difficulty: difficulty || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined,
    dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    equipmentPackageId: equipmentPackageId ? Number(equipmentPackageId) : undefined,
    sort,
    page, size: 12,
  });
  const resetPage = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0); };
  return <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
    <header><h1 className="font-editorial text-3xl font-bold">{t('tour.listTitle')}</h1><p className="text-sm text-stone-500 mt-1">{t('tour.listDescription')}</p></header>
    <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border" onSubmit={e=>{e.preventDefault(); setPage(0);}}>
      <label className="text-xs">{t('tour.filterSearch')}<input value={query} onChange={e=>resetPage(setQuery)(e.target.value)} placeholder={t('home.searchPlaceholder')} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
      <label className="text-xs">{t('home.location')}<select value={destinationId} onChange={e=>resetPage(setDestinationId)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"><option value="">{t('home.allLocations')}</option>{locations.data.map(l=><option key={l.id} value={l.id}>{l.name}{l.provinceName ? `, ${l.provinceName}` : ''}</option>)}</select></label>
      <label className="text-xs">{t('home.difficulty')}<select value={difficulty} onChange={e=>resetPage(setDifficulty)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"><option value="">{t('tour.all')}</option>{['easy','moderate','hard','expert'].map(x=><option key={x} value={x}>{t(`tour.${x}`)}</option>)}</select></label>
      <label className="text-xs">{t('tour.minPrice')}<input type="number" min="0" value={minPrice} onChange={e=>resetPage(setMinPrice)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
      <label className="text-xs">{t('tour.maxPrice')}<input type="number" min="0" value={maxPrice} onChange={e=>resetPage(setMaxPrice)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
      <label className="text-xs">{t('tour.dateFrom')}<input type="date" value={dateFrom} onChange={e=>resetPage(setDateFrom)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
      <label className="text-xs">{t('tour.dateTo')}<input type="date" value={dateTo} min={dateFrom || undefined} onChange={e=>resetPage(setDateTo)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"/></label>
      <label className="text-xs">{t('tour.minRating')}<select value={minRating} onChange={e=>resetPage(setMinRating)(e.target.value)} className="block w-full mt-1 p-2 border rounded text-sm"><option value="">{t('tour.anyRating')}</option>{[3,3.5,4,4.5,5].map(value=><option key={value} value={value}>{value}+ / 5</option>)}</select></label>
      <label className="text-xs">{t('tour.packageId')}<input type="number" min="1" value={equipmentPackageId} onChange={e=>resetPage(setEquipmentPackageId)(e.target.value)} placeholder={t('tour.packageId')} className="block w-full mt-1 p-2 border rounded text-sm"/><span className="text-[11px] text-stone-500">{t('tour.packageIdHint')}</span></label>
      <label className="text-xs">{t('tour.sort')}<select value={sort} onChange={e=>{setSort(e.target.value as typeof sort);setPage(0);}} className="block w-full mt-1 p-2 border rounded text-sm"><option value="recommended">{t('tour.recommended')}</option><option value="price_asc">{t('tour.priceLow')}</option><option value="price_desc">{t('tour.priceHigh')}</option><option value="rating_desc">{t('tour.ratingHigh')}</option><option value="departure_asc">{t('tour.departureSoon')}</option></select></label>
      <button className="justify-self-start px-4 py-2 bg-[#1F4E43] text-white rounded text-sm"><Search className="inline w-4 h-4 mr-1"/>{t('tour.apply')}</button>
    </form>
    {locations.loading && <p role="status">{t('home.loadingLocations')}</p>}{locations.error && <p role="alert" className="text-amber-800">{t('tour.locationFilterError')}</p>}
    {loading && <p role="status">{t('tour.loading')}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
    {!loading && !error && !data?.items.length && <p>{t('tour.noMatch')}</p>}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{data?.items.map(tour=><article key={tour.id} className="bg-white rounded-xl border overflow-hidden flex flex-col">
      {tour.coverImageUrl && <img src={tour.coverImageUrl} alt="" className="w-full h-48 object-cover" loading="lazy"/>}
      <div className="p-4 flex-1"><h2 className="font-bold text-lg">{tour.title}</h2><p className="text-sm text-stone-600 mt-2">{tour.destinations.map(d=>d.name).join(', ') || t('tour.locationUnknown')}</p><p className="text-sm mt-2">{tour.difficulty ? t(`tour.${tour.difficulty}`) : t('tour.difficultyUnknown')}{tour.durationDays ? ` · ${t('tour.days', {count:tour.durationDays})}` : ''}</p><p className="font-semibold text-orange-800 mt-3">{tour.startingPriceVnd == null ? t('tour.priceUnavailable') : t('tour.from', {price:formatVND(tour.startingPriceVnd,language)})}</p></div>
      <button className="m-4 mt-0 border rounded-lg px-4 py-2" onClick={()=>onViewTour(String(tour.id))}>{t('tour.details')}</button>
    </article>)}</div>
    {data && data.totalPages > 1 && <nav aria-label="Tour result pages" className="flex justify-center items-center gap-4"><button disabled={page <= 0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="border rounded px-3 py-1 disabled:opacity-40">Previous</button><span className="text-sm">Page {data.page + 1} of {data.totalPages}</span><button disabled={page + 1 >= data.totalPages} onClick={()=>setPage(p=>p+1)} className="border rounded px-3 py-1 disabled:opacity-40">Next</button></nav>}
  </main>;
};
export default TourListPage;
