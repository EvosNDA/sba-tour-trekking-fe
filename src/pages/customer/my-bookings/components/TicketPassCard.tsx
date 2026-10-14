import React from 'react';
import { Mountain, ShieldCheck, QrCode, Check, Radio } from 'lucide-react';
import { Booking } from '../../../../types/expedition';

interface TicketPassCardProps {
  booking: Booking;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({ booking }) => {
  return (
    <div className="bg-white border border-[#E6E1D8] rounded-xl overflow-hidden shadow-sm relative">
      {/* Header Image Strip */}
      <div className="relative h-44 bg-gradient-to-r from-stone-900 to-stone-700 text-white p-5 flex flex-col justify-between overflow-hidden">
        <img
          src="/src/assets/images/fansipan_cloud_ridge_1792001300725.jpg"
          alt="Fansipan"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative z-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded font-mono uppercase tracking-wider text-[11px]">
            <Mountain className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>MOUNTAIN TRIP TICKET</span>
          </div>
          <span className="bg-white/20 backdrop-blur-xs text-[11px] font-mono px-2.5 py-1 rounded">
            Official Park Pass
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#C2410C] text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              TRIP LEVEL: {booking.tripLevel}
            </span>
            <span className="bg-white/20 backdrop-blur-xs text-[10px] font-mono px-2 py-0.5 rounded">
              Peak Elevation: {booking.peakElevation}
            </span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {booking.tourTitle}
          </h2>
          <span className="text-xs text-stone-200">{booking.subtitle}</span>
        </div>
      </div>

      {/* Ticket Specs Row */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#E6E1D8] text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#78716C] block">MAIN TRAVELER</span>
          <strong className="text-sm text-[#1C2526] block mt-0.5">{booking.mainTraveler}</strong>
          <span className="text-[11px] text-[#64748B]">Party Size: {booking.partySize} Trekkers</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[#78716C] block">MEETING PLACE</span>
          <strong className="text-sm text-[#1C2526] block mt-0.5">{booking.meetingPlace}</strong>
          <span className="text-[11px] text-[#64748B] font-mono">{booking.meetingElevation}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[#78716C] block">YOUR TOUR GUIDE</span>
          <strong className="text-sm text-[#1C2526] flex items-center gap-1 mt-0.5">
            <span>{booking.tourGuide}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#1F4E43]" />
          </strong>
          <span className="text-[11px] text-[#64748B]">{booking.tourGuideCert}</span>
        </div>
      </div>

      {/* Gear Choice */}
      <div className="px-6 py-3.5 bg-[#FAF8F5] border-b border-[#E6E1D8] text-xs text-[#2D3748]">
        <span className="text-[10px] uppercase font-mono text-[#78716C] block mb-0.5">
          YOUR GEAR CHOICE
        </span>
        <div className="flex items-start gap-2">
          <span className="text-amber-700 font-bold">⚠</span>
          <p className="text-[11px] leading-relaxed">
            {booking.gearChoiceDescription}
          </p>
        </div>
      </div>

      {/* Perforated Notches & Tear Line */}
      <div className="relative py-3 flex items-center justify-between px-2">
        <div className="w-4 h-4 rounded-full bg-[#FDFBF7] -ml-4 border border-[#E6E1D8]"></div>
        <div className="flex-1 border-b-2 border-dashed border-[#D6CEBE] mx-2"></div>
        <div className="w-4 h-4 rounded-full bg-[#FDFBF7] -mr-4 border border-[#E6E1D8]"></div>
      </div>

      {/* QR Code Validation Box */}
      <div className="p-6 bg-white flex flex-col sm:flex-row items-center gap-6">
        <div className="p-2.5 bg-white border border-[#E6E1D8] rounded-lg shadow-2xs shrink-0 text-center">
          <div className="w-32 h-32 bg-stone-900 rounded p-2 flex flex-col justify-between text-white relative">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
              <div className="w-8 h-8 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-[#C2410C] flex items-center justify-center text-white text-[10px] font-bold">
                W
              </div>
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
              <div className="w-6 h-6 grid grid-cols-2 gap-1 p-0.5">
                <div className="bg-white"></div><div className="bg-white"></div>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#1C2526] block mt-1.5">
            {booking.qrCodeToken}
          </span>
        </div>

        <div className="flex-1 space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C2526]">
            <QrCode className="w-4 h-4 text-[#C2410C]" />
            <span>Scan at Park Gate</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Show this QR code to the park ranger and your tour guide at the Tram Ton gate to check in and get your GPS tracker.
          </p>

          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono px-2.5 py-1 rounded">
            <Check className="w-3.5 h-3.5" />
            <span>Active Code: {booking.activePassCode}</span>
          </div>

          <span className="text-[11px] text-[#78716C] block">
            ● Ticket saved on your phone. Works without internet.
          </span>
        </div>
      </div>

      {/* Ticket Footer */}
      <div className="px-6 py-2.5 bg-[#F7F4EE] border-t border-[#E6E1D8] flex items-center justify-between text-[11px] font-mono text-[#78716C]">
        <span>Official Vietnam Mountain Registry</span>
        <span className="flex items-center gap-1 text-[#1F4E43]">
          <Radio className="w-3 h-3" /> Emergency Radio: {booking.vhfEmergencyRadio}
        </span>
      </div>
    </div>
  );
};
