import React from 'react';
import { Clock } from 'lucide-react';

interface DepartureCountdownCardProps {
  meetingTime: string;
}

export const DepartureCountdownCard: React.FC<DepartureCountdownCardProps> = ({ meetingTime }) => {
  return (
    <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm">
      <span className="text-[10px] font-mono text-[#C2410C] font-semibold uppercase tracking-wider block mb-1">
        DEPARTURE COUNTDOWN: 04D 16H 39M
      </span>
      <span className="text-[10px] font-mono text-[#78716C] uppercase block">
        T-MINUS
      </span>
      <div className="font-editorial text-3xl font-bold text-[#1C2526] my-1 font-mono-numbers">
        04d 16h 39m
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[#2D3748] pt-1">
        <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
        <span>{meetingTime}</span>
      </div>
    </div>
  );
};
