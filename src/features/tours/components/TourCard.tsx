import React from 'react';
import { Star, ShieldCheck, MapPin, Calendar, Mountain } from 'lucide-react';
import { Tour } from '../../../types/expedition';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatUSD } from '../../../lib/utils';

interface TourCardProps {
  tour: Tour;
  onViewDetails?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E6E1D8] overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 group">
      <div className="relative h-48 overflow-hidden bg-stone-200">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="warning" size="sm">
            {tour.difficulty}
          </Badge>
          {tour.isSafePay && (
            <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
              SafePay Escrow
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-stone-700">{tour.operatorName}</span>
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{tour.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({tour.reviewCount})</span>
            </div>
          </div>

          <h3 className="font-editorial text-base font-bold text-[#1C2526] line-clamp-2 mb-2 group-hover:text-[#C2410C] transition-colors">
            {tour.title}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-4 bg-[#FDFBF7] p-2 rounded-lg border border-stone-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{tour.durationDays}D / {tour.durationNights}N</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>+{tour.elevationGainM}m Gain</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-stone-400 block">From</span>
            <span className="text-base font-bold text-[#C2410C]">
              {formatUSD(tour.priceRentGearUSD)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button size="sm" variant="outline" onClick={() => onViewDetails(tour)}>
                Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
