import React, { useState } from 'react';
import { EXPLORE_TOURS } from '../../../data/mockData';
import { Tour, ScreenId } from '../../../types/expedition';
import { TourCard } from '../../../features/tours/components/TourCard';
import { Search } from 'lucide-react';

export interface TourListPageProps {
  onBookTour?: (tour: Tour) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const TourListPage: React.FC<TourListPageProps> = ({
  onBookTour = () => {},
  onNavigate = () => {},
}) => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('ALL');

  const filtered = EXPLORE_TOURS.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.operatorName.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'ALL' || t.difficulty.includes(difficulty);
    return matchSearch && matchDiff;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-bold text-[#1C2526]">
          All Trekking & Climbing Expeditions
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Explore curated routes across Fansipan, Bach Moc Luong Tu, and Ta Xua
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by peak, trail name or guide team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C2410C]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Easy', 'Medium', 'Hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                difficulty === d
                  ? 'bg-[#C2410C] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {d === 'ALL' ? 'All Difficulties' : d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tour) => (
          <TourCard
            key={tour.id}
            tour={tour}
            onBook={onBookTour}
            onViewDetails={() => onNavigate('marketplace')}
          />
        ))}
      </div>
    </div>
  );
};

export default TourListPage;
