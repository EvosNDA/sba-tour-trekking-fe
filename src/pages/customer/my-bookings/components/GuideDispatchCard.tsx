import React from 'react';
import { Booking } from '../../../../types/expedition';
import { Phone, MessageSquare } from 'lucide-react';

interface GuideDispatchCardProps {
  booking: Booking;
  onOpenAIRanger: () => void;
}

export const GuideDispatchCard: React.FC<GuideDispatchCardProps> = ({
  booking,
  onOpenAIRanger,
}) => {
  return (
    <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
        <h4 className="font-editorial text-base font-bold text-[#1C2526]">
          Your Tour Guide &amp; Help
        </h4>
        <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ONLINE
        </span>
      </div>

      <div className="bg-[#FAF8F5] p-3 rounded border border-[#E6E1D8] text-xs">
        <strong className="block text-sm text-[#1C2526]">{booking.tourGuide}</strong>
        <span className="text-[11px] text-[#64748B] block">Lead Mountain Guide • Sapa Base</span>
        <span className="text-[10px] font-mono text-[#78716C] block mt-1">
          VHF Call: {booking.tourGuidePhone}
        </span>
      </div>

      <div className="space-y-2">
        <a
          href={`tel:${booking.tourGuidePhone}`}
          className="w-full bg-[#1F4E43] hover:bg-[#15372F] text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Tour Guide Now</span>
        </a>

        <button
          onClick={onOpenAIRanger}
          className="w-full bg-white hover:bg-[#F7F4EE] text-[#1C2526] border border-[#E6E1D8] py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#C2410C]" />
          <span>Chat with AI Help</span>
        </button>
      </div>

      <div className="pt-2 border-t border-[#E6E1D8] text-[10px] font-mono text-[#78716C] flex items-center justify-between">
        <span>24/7 MOUNTAIN EMERGENCY RESCUE</span>
        <span className="font-bold text-[#C2410C]">+84 24 3942 9999</span>
      </div>
    </div>
  );
};
