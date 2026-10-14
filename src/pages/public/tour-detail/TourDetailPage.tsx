import React from 'react';
import { Tour, ScreenId } from '../../../types/expedition';
import { EXPLORE_TOURS } from '../../../data/mockData';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatUSD } from '../../../lib/utils';
import { ArrowLeft, Mountain, Clock, Users, ShieldCheck, MapPin } from 'lucide-react';
import { TourItinerary } from './components/TourItinerary';

export interface TourDetailPageProps {
  tourId?: string;
  onBookTour?: (tour: Tour) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const TourDetailPage: React.FC<TourDetailPageProps> = ({
  tourId,
  onBookTour = () => {},
  onNavigate = () => {},
}) => {
  const tour = EXPLORE_TOURS.find((t) => t.id === tourId) || EXPLORE_TOURS[0];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <button
        onClick={() => onNavigate('marketplace')}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to expeditions</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-sm">
            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="warning">{tour.difficulty}</Badge>
              {tour.isSafePay && (
                <Badge variant="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  SafePay Escrow
                </Badge>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
              {tour.operatorName} • Verified Mountain Crew
            </span>
            <h1 className="font-editorial text-3xl md:text-4xl font-bold text-[#1C2526] mt-1">
              {tour.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-stone-200 text-center">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Duration</span>
              <span className="text-sm font-bold text-stone-800">{tour.durationDays}D / {tour.durationNights}N</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Distance</span>
              <span className="text-sm font-bold text-stone-800">{tour.distanceKm} km</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Elevation</span>
              <span className="text-sm font-bold text-stone-800">+{tour.elevationGainM}m</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Guide Ratio</span>
              <span className="text-sm font-bold text-stone-800">{tour.guidesRatio}</span>
            </div>
          </div>

          <TourItinerary />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-6 space-y-5">
            <div>
              <span className="text-xs text-stone-400 uppercase font-mono">Total Tour Price</span>
              <div className="text-3xl font-bold text-[#C2410C]">
                {formatUSD(tour.priceRentGearUSD)}
                <span className="text-xs font-normal text-stone-500 ml-1">/ climber</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <span>With Own Gear</span>
                <span className="font-semibold">{formatUSD(tour.priceOwnGearUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>With Rental Gear</span>
                <span className="font-semibold">{formatUSD(tour.priceRentGearUSD)}</span>
              </div>
              <div className="flex justify-between text-[#1F4E43] font-medium">
                <span>National Park Pass</span>
                <span>Included</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => onBookTour(tour)}
            >
              Reserve Expedition
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetailPage;
