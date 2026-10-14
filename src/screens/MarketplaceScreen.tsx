import React, { useState } from 'react';
import { TourCompany, DiscountVoucher, Destination, Tour, ScreenId } from '../types/expedition';
import {
  Compass,
  Star,
  ShieldCheck,
  Calendar,
  Search,
  Check,
  Copy,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Backpack,
  ChevronDown,
  Sparkles,
  MapPin,
  ExternalLink,
  Radio,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';

interface Props {
  companies: TourCompany[];
  vouchers: DiscountVoucher[];
  destinations: Destination[];
  tours: Tour[];
  onBookTour: (tour: Tour) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const MarketplaceScreen: React.FC<Props> = ({
  companies,
  vouchers,
  destinations,
  tours,
  onBookTour,
  onNavigate,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('safety');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredTours = tours.filter((t) => {
    if (selectedDestination !== 'all' && t.destinationId !== selectedDestination) return false;
    if (selectedCompany !== 'all' && !t.operatorName.toLowerCase().includes(selectedCompany.toLowerCase())) return false;
    if (selectedDifficulty !== 'all') {
      if (selectedDifficulty === 'hard' && !t.difficulty.toLowerCase().includes('hard')) return false;
      if (selectedDifficulty === 'medium' && !t.difficulty.toLowerCase().includes('medium')) return false;
      if (selectedDifficulty === 'easy' && !t.difficulty.toLowerCase().includes('easy')) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526]">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 md:px-8 border-b border-[#E6E1D8] bg-radial from-[#F2FBFC] via-[#FDFBF7] to-[#FDFBF7]">
        <div className="max-w-5xl mx-auto text-center">
          {/* Subtle Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E6E1D8] rounded-full text-[11px] font-mono text-[#1F4E43] mb-6 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F4E43]"></span>
            <span className="font-semibold tracking-wider uppercase">TRUSTED MOUNTAIN MARKETPLACE</span>
            <span className="text-stone-300">|</span>
            <span className="text-[#C2410C]">100% Safe Payments</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1C2526] leading-tight max-w-4xl mx-auto tracking-tight mb-4">
            Find and Book Mountain Trips with <br className="hidden sm:inline" />
            <span className="text-[#C2410C] italic font-normal">180+ Verified</span> Local Guides
          </h1>

          <p className="text-sm md:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed mb-8">
            One easy website. Compare prices, safety checks, gear options, and real reviews from other travelers. Your money is 100% safe.
          </p>

          {/* Expedition Search Console */}
          <div className="bg-white border border-[#E6E1D8] rounded-xl shadow-lg p-3 max-w-4xl mx-auto mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-left">
              {/* Where To */}
              <div className="p-2.5 rounded-lg hover:bg-[#F7F4EE] transition-colors">
                <label className="block text-[10px] font-mono tracking-wider uppercase text-[#78716C] mb-1">
                  <MapPin className="w-3 h-3 inline mr-1 text-[#C2410C]" /> WHERE TO?
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1C2526] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Mountain Trips</option>
                  <option value="sapa-fansipan">Sapa & Fansipan Ridge</option>
                  <option value="bach-moc">Ky Quan San (Bach Moc)</option>
                  <option value="ta-xua">Ta Xua Cloud Sea Ridge</option>
                  <option value="ta-nang">Ta Nang - Phan Dung</option>
                  <option value="pu-luong">Pu Luong Nature Reserve</option>
                  <option value="bidoup">Langbiang & Bidoup Peaks</option>
                </select>
              </div>

              {/* Tour Company */}
              <div className="p-2.5 rounded-lg hover:bg-[#F7F4EE] transition-colors border-t sm:border-t-0 sm:border-l border-[#E6E1D8]">
                <label className="block text-[10px] font-mono tracking-wider uppercase text-[#78716C] mb-1">
                  <ShieldCheck className="w-3 h-3 inline mr-1 text-[#1F4E43]" /> TOUR COMPANY
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1C2526] focus:outline-none cursor-pointer"
                >
                  <option value="all">All 180+ Local Guides</option>
                  <option value="wayfarer">Wayfarer Alpine Guild</option>
                  <option value="highland">Highland Nomads Outfitter</option>
                  <option value="indochina">Indochina Summiters Guild</option>
                  <option value="pu luong">Pu Luong Forest Wardens</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="p-2.5 rounded-lg hover:bg-[#F7F4EE] transition-colors border-t lg:border-t-0 lg:border-l border-[#E6E1D8]">
                <label className="block text-[10px] font-mono tracking-wider uppercase text-[#78716C] mb-1">
                  <TrendingUp className="w-3 h-3 inline mr-1 text-[#D97706]" /> DIFFICULTY
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1C2526] focus:outline-none cursor-pointer"
                >
                  <option value="all">Any Difficulty</option>
                  <option value="easy">Easy (Nature / Forest)</option>
                  <option value="medium">Medium (Good Fitness)</option>
                  <option value="hard">Hard (Multi-Day Trek)</option>
                </select>
              </div>

              {/* Dates & Action */}
              <div className="flex items-center gap-2 p-1 border-t sm:border-t-0 sm:border-l border-[#E6E1D8]">
                <div className="flex-1 p-1.5">
                  <label className="block text-[10px] font-mono tracking-wider uppercase text-[#78716C] mb-1">
                    <Calendar className="w-3 h-3 inline mr-1 text-[#64748B]" /> DATES
                  </label>
                  <span className="text-xs font-semibold text-[#1C2526] block">
                    Nov - Jan 2025
                  </span>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('explore-tours');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#1F4E43] hover:bg-[#15372F] text-white px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Trips</span>
                </button>
              </div>
            </div>
          </div>

          {/* Popular Search Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748B] mb-10">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#78716C]">
              Popular Trips:
            </span>
            <button
              onClick={() => setSelectedDestination('bach-moc')}
              className="bg-white border border-[#E6E1D8] hover:border-[#C2410C] px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            >
              Bach Moc Cloud Walk <span className="text-amber-600 font-semibold">4.9★</span>
            </button>
            <button
              onClick={() => setSelectedDestination('sapa-fansipan')}
              className="bg-white border border-[#E6E1D8] hover:border-[#C2410C] px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            >
              Fansipan Peak Hike <span className="text-amber-600 font-semibold">4.8★</span>
            </button>
            <button
              onClick={() => setSelectedDestination('ta-nang')}
              className="bg-white border border-[#E6E1D8] hover:border-[#C2410C] px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            >
              Ta Nang Hill Trail <span className="text-[#1F4E43] font-medium text-[11px]">Safe Booking</span>
            </button>
            <button
              onClick={() => setSelectedDestination('pu-luong')}
              className="bg-white border border-[#E6E1D8] hover:border-[#C2410C] px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
            >
              Pu Luong Valley Walk
            </button>
          </div>

          {/* Four Metric Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="bg-white border border-[#E6E1D8] rounded-lg p-3 text-left flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#1C2526] font-mono-numbers">180+</span>
                <span className="text-[11px] text-[#64748B] leading-tight">180+ Verified Local Tour Guides</span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-lg p-3 text-left flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#1C2526] font-mono-numbers">12,400+</span>
                <span className="text-[11px] text-[#64748B] leading-tight">12,400+ Real Traveler Reviews</span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-lg p-3 text-left flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded bg-orange-100 text-[#C2410C] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#1C2526] font-mono-numbers">100%</span>
                <span className="text-[11px] text-[#64748B] leading-tight">100% Safe Payments (Escrow)</span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-lg p-3 text-left flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded bg-stone-100 text-[#2D3748] flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#1C2526] font-mono-numbers">0% Markup</span>
                <span className="text-[11px] text-[#64748B] leading-tight">No Extra Fees (Same Price)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP TOUR COMPANIES & LOCAL GUIDES */}
      <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#1F4E43] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider font-semibold">TRUSTED LOCAL GUIDES</span>
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#1C2526]">
              Top Tour Companies & Local Guides
            </h2>
            <p className="text-xs text-[#64748B]">
              Choose licensed local guides with top ratings and certified first-aid training.
            </p>
          </div>
          <button
            onClick={() => onNavigate('registration')}
            className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>See All 180+ Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {companies.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#E6E1D8] rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded bg-[#F7F4EE] border border-[#E6E1D8] flex items-center justify-center text-[#1F4E43]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#1C2526]">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{c.rating}</span>
                      <span className="text-[#78716C] font-normal">({c.reviewCount})</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#78716C] block">{c.license}</span>
                  </div>
                </div>

                <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-1">
                  {c.name}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-[#F7F4EE] rounded text-xs mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#78716C] block">ACTIVE TOURS</span>
                    <strong className="text-xs text-[#1C2526] font-mono-numbers">{c.activeRoutes} routes</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#78716C] block">ON-TIME STARTS</span>
                    <strong className="text-xs text-[#1C2526] font-mono-numbers">{c.onTimeRate}%</strong>
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-1 mb-4">
                  {c.badges.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#1F4E43]">
                      <Check className="w-3 h-3 text-[#1F4E43] shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6E1D8] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#78716C] block">About</span>
                  <span className="text-xs font-bold text-[#1C2526]">{c.aboutPrice}</span>
                </div>
                <button
                  onClick={() => {
                    const matched = tours.find((t) => t.operatorName.includes(c.name.split(' ')[0]));
                    if (matched) onBookTour(matched);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F7F4EE] hover:bg-[#EFECE4] text-[#1C2526] border border-[#E6E1D8] rounded transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SPECIAL DISCOUNTS & GIFT VOUCHERS */}
      <section className="py-10 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2410C]" />
            <h2 className="font-editorial text-xl font-bold text-[#1C2526]">
              Special Discounts & Gift Vouchers
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#C2410C] uppercase tracking-wider font-semibold">
            Valid This Season
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-[#E6E1D8] rounded-lg p-4 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                <div className="absolute transform rotate-45 bg-[#C2410C]/10 text-[#C2410C] font-mono text-[9px] py-0.5 right-[-35px] top-[18px] w-[120px] text-center font-bold">
                  PROMO
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider block mb-1">
                  {v.title}
                </span>
                <div className="font-editorial text-2xl font-bold text-[#C2410C] mb-1">
                  {v.discountText}
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  {v.description}
                </p>
              </div>

              <div className="flex items-center justify-between bg-[#F7F4EE] border border-[#E6E1D8] rounded p-1.5">
                <span className="font-mono text-xs font-bold text-[#1C2526] px-2">
                  {v.code}
                </span>
                <button
                  onClick={() => handleCopyCode(v.code)}
                  className="bg-white hover:bg-stone-100 text-[#1C2526] text-[11px] font-semibold px-2.5 py-1 rounded border border-[#E6E1D8] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode === v.code ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#78716C]" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. POPULAR MOUNTAIN DESTINATIONS */}
      <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] block mb-1">
              EXPLORE REGIONS
            </span>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#1C2526]">
              Popular Mountain Destinations
            </h2>
            <p className="text-xs text-[#64748B]">
              Choose a place to see all tours and compare guide prices.
            </p>
          </div>
          <span className="text-xs font-mono text-[#78716C] bg-white border border-[#E6E1D8] px-2.5 py-1 rounded">
            6 Active Places
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDestination(d.id)}
              className="group bg-white border border-[#E6E1D8] rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-stone-200">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {d.elevation}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1C2526] group-hover:text-[#C2410C] transition-colors">
                    {d.name}
                  </h3>
                  <span className="text-xs text-[#64748B] block mt-0.5">
                    {d.location}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E6E1D8] flex items-center justify-between text-xs">
                  <span className="text-[#64748B] flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-[#1F4E43]" /> {d.tourCount} Tour Companies
                  </span>
                  <span className="font-bold text-[#C2410C]">
                    From ${d.fromPrice} -&gt;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. EXPLORE TOURS FROM VERIFIED GUIDES */}
      <section id="explore-tours" className="py-12 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#C2410C] mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider font-semibold">COMPARE GUIDES</span>
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#1C2526]">
              Explore Tours from Verified Guides
            </h2>
            <p className="text-xs text-[#64748B]">
              See what gear is included, group sizes, guide ratios, and clear prices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#78716C] font-mono">SORT BY:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#E6E1D8] text-xs font-semibold text-[#1C2526] px-3 py-1.5 rounded focus:outline-none cursor-pointer"
            >
              <option value="safety">Highest Guide Safety Score</option>
              <option value="price-low">Price: Low to High</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E6E1D8] rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-44 bg-stone-200">
                  <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {t.difficulty}
                  </div>
                  {t.isSafePay && (
                    <div className="absolute top-2.5 right-2.5 bg-[#1F4E43] text-white text-[10px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 100% SAFE PAY
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {/* Operator & Rating */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-[#2D3748] truncate max-w-[170px]">
                      {t.operatorName}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#1C2526]">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{t.rating}</span>
                      <span className="text-[#78716C] font-normal font-mono">({t.reviewCount})</span>
                    </div>
                  </div>

                  <h3 className="font-editorial text-lg font-bold text-[#1C2526] mb-1.5 leading-snug">
                    {t.title}
                  </h3>

                  <button
                    onClick={() => setSelectedDestination(t.destinationId || 'all')}
                    className="text-[11px] text-[#C2410C] hover:underline flex items-center gap-1 mb-4 cursor-pointer"
                  >
                    <span>Compare other operators running this route</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Topographical specs table */}
                  <div className="border-t border-[#E6E1D8] pt-3 space-y-1.5 text-xs text-[#2D3748] mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Time & Distance:</span>
                      <strong className="font-mono-numbers">
                        {t.durationDays} Days / {t.durationNights} Night · {t.distanceKm} km
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Climb Up:</span>
                      <strong className="font-mono-numbers">+{t.elevationGainM}m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C]">Guides to Travelers:</span>
                      <span className="font-medium">{t.guidesRatio}</span>
                    </div>
                  </div>

                  {/* Gear Pricing Split */}
                  <div className="bg-[#F7F4EE] rounded p-2.5 space-y-1 text-xs mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] flex items-center gap-1">
                        <Backpack className="w-3 h-3" /> Bring Your Own Gear:
                      </span>
                      <strong className="text-[#1C2526] font-mono-numbers">${t.priceOwnGearUSD}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#1F4E43]" /> Rent All Gear From Us:
                      </span>
                      <strong className="text-[#C2410C] font-mono-numbers">${t.priceRentGearUSD}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book CTA */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => onBookTour(t)}
                  className="w-full bg-[#C2410C] hover:bg-[#9B2F00] text-white py-2.5 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Book This Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. WHY BOOK WITH US INSTEAD OF BOOKING ALONE? */}
      <section className="py-14 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider block mb-1">
            THE MARKETPLACE GUARANTEE
          </span>
          <h2 className="font-editorial text-3xl font-bold text-[#1C2526] mb-2">
            Why Book With Us Instead of Booking Alone?
          </h2>
          <p className="text-xs text-[#64748B]">
            We help you compare local guides easily, keep your payments safe until your trek, and give you 24/7 emergency help.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="bg-white border border-[#E6E1D8] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1C2526] mb-2">
                Compare Different Guides in One Place
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                See what gear each guide provides, check group sizes, and see real ratings from past hikers all in one place.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#1F4E43] font-semibold mt-4 block">
              100% Honest Reviews
            </span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-orange-100 text-[#C2410C] flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1C2526] mb-2">
                100% Safe Payments
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                We hold your money safely in a bank escrow. We pay the guide only after your trip starts safely and as promised.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#C2410C] font-semibold mt-4 block">
              Paid After Trip Starts
            </span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1C2526] mb-2">
                Strict Safety Checks
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                We inspect first-aid gear, guide licenses, and make sure porters are treated kindly with fair weight limits.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#1F4E43] font-semibold mt-4 block">
              High Safety Standards
            </span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-stone-100 text-[#2D3748] flex items-center justify-center mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-base font-bold text-[#1C2526] mb-2">
                All Tickets & Help in One Place
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Download your tickets directly to your phone, use maps without internet, and call our friendly 24/7 team anytime.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#78716C] font-semibold mt-4 block">
              Works Without Internet
            </span>
          </div>
        </div>
      </section>

      {/* 7. SAFETY PROMISE */}
      <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto border-b border-[#E6E1D8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#C2410C] uppercase tracking-wider block mb-1">
              SAFETY PROMISE
            </span>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#1C2526]">
              Our Safety Promise for Every Mountain
            </h2>
            <p className="text-xs text-[#64748B]">
              Every local guide on our website must pass strict safety tests and follow our safety rules.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#B9EADB]/40 text-[#1F4E43] text-xs font-semibold px-3 py-1.5 rounded border border-[#B9EADB]">
            <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
            <span>100% Safe History · Over 18,200+ Happy Hikers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E6E1D8] rounded-lg p-4">
            <Radio className="w-4 h-4 text-[#C2410C] mb-2" />
            <h4 className="font-editorial text-sm font-bold text-[#1C2526] mb-1">
              24/7 Satellite Emergency Help
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed mb-3">
              Every guide carries a live satellite SOS device that sends location updates every 15 minutes to our rescue team.
            </p>
            <span className="text-[10px] font-mono text-[#1F4E43] font-semibold">● Always Connected</span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-4">
            <ShieldCheck className="w-4 h-4 text-[#C2410C] mb-2" />
            <h4 className="font-editorial text-sm font-bold text-[#1C2526] mb-1">
              100% Money-Back if Bad Weather Closes Trails
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed mb-3">
              If storms or bad weather close the mountain trails, you get all your money back quickly with no extra fee.
            </p>
            <span className="text-[10px] font-mono text-[#C2410C] font-semibold">● No Hidden Fees</span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-4">
            <HeartHandshake className="w-4 h-4 text-[#C2410C] mb-2" />
            <h4 className="font-editorial text-sm font-bold text-[#1C2526] mb-1">
              Trained Local Guides & Fair Pay for Porters
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed mb-3">
              All guides have official state licenses. Helpers and porters carry light bags up to 18kg with warm boots and health support.
            </p>
            <span className="text-[10px] font-mono text-[#1F4E43] font-semibold">● Fair Worker Care</span>
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-lg p-4">
            <Sparkles className="w-4 h-4 text-[#C2410C] mb-2" />
            <h4 className="font-editorial text-sm font-bold text-[#1C2526] mb-1">
              Clean Mountains (All trash is brought back down)
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed mb-3">
              Take only memories, leave only footprints. Guides help clean plastic from the mountains to keep nature green and clean.
            </p>
            <span className="text-[10px] font-mono text-[#1F4E43] font-semibold">● Protect Nature</span>
          </div>
        </div>
      </section>

      {/* 8. PARTNER BANNER */}
      <section className="py-12 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="bg-[#1F4E43] rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="max-w-xl">
            <span className="text-[10px] font-mono text-[#B9EADB] uppercase tracking-wider block mb-1">
              WORK WITH US
            </span>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold mb-2">
              Are You a Local Tour Guide or Company?
            </h2>
            <p className="text-xs md:text-sm text-stone-200 leading-relaxed mb-6">
              Get more travelers for your trips easily without paying expensive marketing costs. Receive fast and safe payments, and manage your trips on one platform.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/20 text-xs">
              <div>
                <strong className="block text-base font-bold font-mono">85,000+</strong>
                <span className="text-[11px] text-stone-300">Travelers Each Year</span>
              </div>
              <div>
                <strong className="block text-base font-bold font-mono">Fast Pay</strong>
                <span className="text-[11px] text-stone-300">Safe Bank Payouts</span>
              </div>
              <div>
                <strong className="block text-base font-bold font-mono">Free Tools</strong>
                <span className="text-[11px] text-stone-300">Easy Trip Calendar</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('registration')}
              className="bg-white hover:bg-stone-100 text-[#1F4E43] font-semibold px-6 py-2.5 rounded text-xs transition-colors text-center cursor-pointer shadow-sm"
            >
              Join as a Tour Partner
            </button>
            <button
              onClick={() => onNavigate('registration')}
              className="border border-white/40 hover:bg-white/10 text-white font-semibold px-6 py-2.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Partner Log In</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
