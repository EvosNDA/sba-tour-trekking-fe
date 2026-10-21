import React, { useState } from 'react';
import { Booking, ScreenId, Traveler } from '../../../types/expedition';
import { INITIAL_BOOKING } from '../../../data/mockData';
import { Download, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { TicketPassCard } from './components/TicketPassCard';
import { TravelerCheckinList } from './components/TravelerCheckinList';
import { ElevationProfileCard } from './components/ElevationProfileCard';
import { DepartureCountdownCard } from './components/DepartureCountdownCard';
import { BookingPaymentDetailsCard } from './components/BookingPaymentDetailsCard';
import { GuideDispatchCard } from './components/GuideDispatchCard';

export interface MyBookingsPageProps {
  booking?: Booking;
  onUpdateBooking?: (updated: Booking) => void;
  onNavigate?: (screen: ScreenId) => void;
  onOpenAIRanger?: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  booking = INITIAL_BOOKING,
  onUpdateBooking = () => {},
  onNavigate = () => {},
  onOpenAIRanger = () => {},
}) => {
  const [copiedBooking, setCopiedBooking] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleCopyBooking = () => {
    navigator.clipboard.writeText(booking.id);
    setCopiedBooking(true);
    setTimeout(() => setCopiedBooking(false), 2000);
  };

  // Gate check-in is recorded by the ranger at Tram Ton Pass. This frontend has
  // no check-in backend, so toggling would only pretend to change server state.
  const handleToggleCheckIn = (travelerId: string) => {
    setCheckInNotice('Gate check-in is recorded by your ranger at Tram Ton Pass. It cannot be changed from this screen.');
    setTimeout(() => setCheckInNotice(null), 5000);
  };

  // Ticket file download is produced by the tour operator. This frontend has no
  // ticket-download backend, so the button only shows the pass already on screen.
  const handleDownloadTicket = () => {
    setDownloadNotice('Ticket download is handled by your operator. The QR pass above works offline and does not require a server download.');
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <button onClick={() => onNavigate('marketplace')} className="hover:text-[#1C2526] cursor-pointer">
              Home
            </button>
            <span>&gt;</span>
            <button onClick={() => onNavigate('marketplace')} className="hover:text-[#1C2526] cursor-pointer">
              My Bookings
            </button>
            <span>&gt;</span>
            <span className="font-mono text-[#1C2526] font-semibold">{booking.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-3 py-1.5 text-xs font-medium text-[#2D3748] bg-white border border-[#E6E1D8] rounded hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            >
              &larr; Back to Bookings
            </button>
            <button
              onClick={handleDownloadTicket}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1F4E43] hover:bg-[#9B2F00] rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadNotice || 'Download Ticket / Save to Phone'}</span>
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 bg-[#B9EADB]/50 text-[#1F4E43] text-xs font-semibold px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-[#1F4E43]"></span>
            <span>{booking.paymentStatus === 'FULLY_SETTLED' ? 'Fully Paid & Confirmed' : 'Paid Deposit (Part 1 Done)'}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-stone-100 text-[#2D3748] text-xs font-mono px-2.5 py-1 rounded border border-[#E6E1D8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1F4E43]" />
            <span>National Park Pass #{booking.nationalParkPass}</span>
          </div>
        </div>

        {checkInNotice && (
          <div role="status" className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-950 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>{checkInNotice}</span>
          </div>
        )}

        {/* Title & Booking Reference */}
        <div className="mb-8">
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526]">
            Trip Ticket &amp; Mountain Check-in
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
            <span className="text-[#78716C] uppercase font-mono">BOOKING NUMBER:</span>
            <div className="flex items-center gap-1.5 bg-white border border-[#E6E1D8] px-2.5 py-1 rounded font-mono font-bold text-[#1C2526]">
              <span>{booking.id}</span>
              <button
                onClick={handleCopyBooking}
                title="Copy Booking Number"
                className="text-[#78716C] hover:text-[#C2410C] cursor-pointer"
              >
                {copiedBooking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[#64748B]">/</span>
            <span className="text-[#64748B]">Hoang Lien Son National Biosphere</span>
          </div>
        </div>

        {/* Main Grid: Ticket Details + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <TicketPassCard booking={booking} />
            <TravelerCheckinList
              travelers={booking.travelers}
              onToggleCheckIn={handleToggleCheckIn}
            />
            <ElevationProfileCard />
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <DepartureCountdownCard meetingTime={booking.meetingTime} />
            <BookingPaymentDetailsCard booking={booking} onNavigate={onNavigate} />
            <GuideDispatchCard booking={booking} onOpenAIRanger={onOpenAIRanger} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
