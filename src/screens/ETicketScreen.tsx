import React, { useState } from 'react';
import { Booking, ScreenId, Traveler } from '../types/expedition';
import {
  Download,
  Copy,
  Check,
  Radio,
  Clock,
  Phone,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
  Sparkles,
  Mountain,
} from 'lucide-react';

interface Props {
  booking: Booking;
  onUpdateBooking: (updated: Booking) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenAIRanger: () => void;
}

export const ETicketScreen: React.FC<Props> = ({
  booking,
  onUpdateBooking,
  onNavigate,
  onOpenAIRanger,
}) => {
  const [copiedBooking, setCopiedBooking] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyBooking = () => {
    navigator.clipboard.writeText(booking.id);
    setCopiedBooking(true);
    setTimeout(() => setCopiedBooking(false), 2000);
  };

  const handleToggleCheckIn = (travelerId: string) => {
    const updatedTravelers = booking.travelers.map((t) => {
      if (t.id === travelerId) {
        const isCheckedIn = t.checkInStatus === 'Checked In';
        return {
          ...t,
          checkInStatus: (isCheckedIn ? 'Waiting at Gate' : 'Checked In') as Traveler['checkInStatus'],
          checkInTime: isCheckedIn ? undefined : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return t;
    });

    onUpdateBooking({
      ...booking,
      travelers: updatedTravelers,
    });
  };

  const handleDownloadTicket = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const checkedInCount = booking.travelers.filter((t) => t.checkInStatus === 'Checked In').length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <button onClick={() => onNavigate('marketplace')} className="hover:text-[#1C2526] cursor-pointer">Home</button>
            <span>&gt;</span>
            <button onClick={() => onNavigate('marketplace')} className="hover:text-[#1C2526] cursor-pointer">My Bookings</button>
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
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1F4E43] hover:bg-[#15372F] rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Ticket Saved to Wallet!' : 'Download Ticket / Save to Phone'}</span>
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

        {/* Main Grid: Ticket + Left Details (8 cols) and Right Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLUMNS */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. MOUNTAIN TRIP TICKET CARD */}
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
                  {/* Dynamic Scalable Vector QR representation */}
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

            {/* 2. TRAVELER LIST & GATE CHECK-IN TABLE */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
                    Traveler List &amp; Gate Check-in
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Each traveler can check in separately when arriving at Tram Ton Station.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#1F4E43] bg-[#B9EADB]/40 px-2.5 py-1 rounded border border-[#B9EADB]">
                  {checkedInCount} of {booking.travelers.length} Checked In
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E1D8] text-[10px] font-mono text-[#78716C] uppercase bg-[#FAF8F5]">
                      <th className="py-2.5 px-3">TRAVELER</th>
                      <th className="py-2.5 px-3">ID / PASSPORT</th>
                      <th className="py-2.5 px-3">GEAR</th>
                      <th className="py-2.5 px-3">CHECK-IN STATUS</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D8]">
                    {booking.travelers.map((t) => {
                      const isChecked = t.checkInStatus === 'Checked In';
                      return (
                        <tr key={t.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#C2410C] text-white flex items-center justify-center font-bold text-[10px]">
                                {t.name.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <span className="font-bold text-[#1C2526] block">{t.name}</span>
                                {t.role === 'TRIP LEADER' && (
                                  <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                    TRIP LEADER
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-[#64748B]">
                            {t.passport}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] block">{t.gearTag}</span>
                            <span className="text-[10px] text-[#78716C]">{t.gearChoice}</span>
                          </td>

                          <td className="py-3 px-3">
                            {isChecked ? (
                              <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Checked In ({t.checkInTime || '06:14 AM'})</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Waiting at Gate</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleCheckIn(t.id)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-[#F7F4EE] hover:bg-[#EFECE4] text-[#1C2526] border border-[#E6E1D8]'
                                  : 'bg-[#1F4E43] hover:bg-[#15372F] text-white'
                              }`}
                            >
                              {isChecked ? 'View Pass' : 'Check Status'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-2.5 bg-[#F7F4EE] rounded border border-[#E6E1D8] text-[11px] text-[#78716C] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                <span>
                  Park rangers let group members enter one by one. Time will be recorded at the mountain top (2,800m point).
                </span>
              </div>
            </div>

            {/* 3. TRAIL HEIGHT & CAMP STOPS (Elevation Profile SVG) */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
                    Trail Height &amp; Camp Stops
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Walk Up: 1,900m Tram Ton Gate to 3,143m Fansipan Peak
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#1F4E43] bg-[#B9EADB]/30 border border-[#B9EADB] px-2.5 py-1 rounded">
                  Climb Height: +1,480m
                </span>
              </div>

              {/* Interactive Elevation Profile SVG */}
              <div className="relative pt-4 pb-2">
                <svg viewBox="0 0 600 160" className="w-full h-40 overflow-visible">
                  <defs>
                    <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F4E43" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1F4E43" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide lines */}
                  <line x1="40" y1="30" x2="560" y2="30" stroke="#E6E1D8" strokeDasharray="3 3" />
                  <line x1="40" y1="75" x2="560" y2="75" stroke="#E6E1D8" strokeDasharray="3 3" />
                  <line x1="40" y1="120" x2="560" y2="120" stroke="#E6E1D8" strokeDasharray="3 3" />

                  {/* Filled terrain polygon */}
                  <polygon
                    points="50,135 180,105 350,80 520,30 520,150 50,150"
                    fill="url(#elevationGrad)"
                  />

                  {/* Main elevation path */}
                  <polyline
                    points="50,135 180,105 350,80 520,30"
                    fill="none"
                    stroke="#1F4E43"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Waypoint 1: Tram Ton (1,900m) */}
                  <circle cx="50" cy="135" r="5" fill="#C2410C" />
                  <text x="50" y="155" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
                    Tram Ton (1,900m)
                  </text>

                  {/* Waypoint 2: Camp I (2,200m) */}
                  <circle cx="180" cy="105" r="4" fill="#1F4E43" />
                  <text x="180" y="125" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
                    Camp I (2,200m)
                  </text>

                  {/* Waypoint 3: Camp II Bivouac (2,800m) */}
                  <circle cx="350" cy="80" r="4" fill="#1F4E43" />
                  <text x="350" y="100" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
                    Camp II Bivouac (2,800m)
                  </text>

                  {/* Waypoint 4: Fansipan Peak (3,143m) */}
                  <circle cx="520" cy="30" r="6" fill="#C2410C" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="520" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C2410C" fontFamily="sans-serif">
                    Fansipan Peak (3,143m)
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. DEPARTURE COUNTDOWN */}
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
                <span>{booking.meetingTime}</span>
              </div>
            </div>

            {/* 2. PAYMENT DETAILS CARD */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
                <h4 className="font-editorial text-lg font-bold text-[#1C2526]">
                  Payment Details
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {booking.paymentStatus === 'FULLY_SETTLED' ? 'Paid In Full' : 'Deposit Paid'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Price (2 Travelers)</span>
                  <strong className="text-[#1C2526] font-mono-numbers">
                    {booking.totalPriceVND.toLocaleString()} VND
                  </strong>
                </div>

                <div className="flex justify-between items-start text-emerald-800">
                  <div>
                    <span className="flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3 text-emerald-600" /> Paid Deposit ({booking.depositDate})
                    </span>
                    <span className="text-[10px] text-[#78716C] font-mono block pl-4">
                      Ref: {booking.depositRef}
                    </span>
                  </div>
                  <span className="font-mono-numbers font-semibold">
                    -{booking.paidDepositVND.toLocaleString()} VND
                  </span>
                </div>

                {booking.hasExtraPorter && (
                  <div className="flex justify-between text-xs text-[#C2410C]">
                    <span>1x Extra Personal Porter Add-on</span>
                    <span className="font-mono-numbers font-semibold">
                      +{booking.porterFeeVND.toLocaleString()} VND
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E6E1D8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#78716C] uppercase">REMAINING TO PAY:</span>
                  <span className="text-[10px] text-[#78716C]">
                    About ${Math.round((booking.paymentStatus === 'FULLY_SETTLED' ? 0 : booking.remainingVND) / 24700)} USD
                  </span>
                </div>
                <div className="font-editorial text-2xl font-bold text-[#C2410C] font-mono-numbers">
                  {booking.paymentStatus === 'FULLY_SETTLED'
                    ? '0 VND (Fully Settled)'
                    : `${(booking.remainingVND + (booking.hasExtraPorter ? booking.porterFeeVND : 0)).toLocaleString()} VND`}
                </div>
              </div>

              {booking.paymentStatus !== 'FULLY_SETTLED' ? (
                <>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-950 flex items-start gap-1.5 leading-tight">
                    <span className="text-orange-600 font-bold">!</span>
                    <span>Please pay before Nov 10, 2024 (in 2 days) to keep your tent spot and mountain porters.</span>
                  </div>

                  <button
                    onClick={() => onNavigate('paybalance')}
                    className="w-full bg-[#C2410C] hover:bg-[#9B2F00] text-white py-2.5 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Pay Remaining Money Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-center text-xs text-emerald-800 font-semibold">
                  Payment Completed &amp; Escrow Locked
                </div>
              )}

              <button
                onClick={() => onNavigate('paybalance')}
                className="w-full text-center text-[11px] text-[#64748B] hover:text-[#1C2526] hover:underline cursor-pointer pt-1"
              >
                View Cancel &amp; Refund Rules
              </button>
            </div>

            {/* 3. REFUND GUARANTEE CARD */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C2526]">
                  <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
                  <span>Refund Guarantee</span>
                </div>
                <span className="text-[10px] font-mono text-[#1F4E43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Safe Guarantee
                </span>
              </div>

              <div className="text-xs text-[#2D3748] space-y-2">
                <div className="flex items-start gap-1.5 text-emerald-800 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Cancel 7+ Days Before Trip: Get 100% of your deposit back (minus small park admin fee).</span>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded border border-[#E6E1D8] space-y-1 font-mono text-[11px]">
                  <span className="text-[10px] font-mono uppercase text-[#78716C] block">
                    CALCULATED REFUND PREVIEW
                  </span>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Deposit Paid:</span>
                    <span>1,080,000 VND</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Park Fee (Cannot Refund):</span>
                    <span>-50,000 VND</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#E6E1D8] flex justify-between font-bold text-[#1F4E43] text-xs">
                    <span>Money You Get Back:</span>
                    <span>1,030,000 VND</span>
                  </div>
                  <span className="text-[9px] text-[#78716C] text-right block">(95.4% refund)</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('paybalance')}
                className="w-full bg-[#FAF8F5] hover:bg-[#F0ECE2] text-[#64748B] hover:text-[#1C2526] text-xs py-2 rounded border border-[#E6E1D8] transition-colors cursor-pointer"
              >
                Cancel Trip / Ask for Refund
              </button>
            </div>

            {/* 4. TOUR GUIDE & DISPATCH HELP CARD */}
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

                {/* Gemini AI Dispatch Chat trigger */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
