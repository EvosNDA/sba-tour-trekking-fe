import React from 'react';
import { ScreenId } from '../../types/expedition';
import { Search, User, ShieldCheck, ArrowLeft, Mountain, BookOpen } from 'lucide-react';

interface Props {
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

export const Header: React.FC<Props> = ({
  currentScreen = 'marketplace',
  onNavigate = () => {},
  onSearch,
  searchTerm = '',
}) => {
  // 1. REGISTRATION SCREEN HEADER
  if (currentScreen === 'registration') {
    return (
      <header className="bg-white border-b border-[#E6E1D8] px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-[#1C2526]">
                <Mountain className="w-5 h-5 text-[#C2410C]" />
                <span className="font-editorial text-xl font-semibold">SummitTrails</span>
              </div>
              <span className="text-[10px] tracking-widest text-[#78716C] font-mono border-l border-stone-300 pl-2 uppercase hidden sm:inline">
                TrekMarket
              </span>
            </button>

            <button
              onClick={() => onNavigate('marketplace')}
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="bg-[#B9EADB]/40 text-[#1F4E43] font-semibold px-2.5 py-1 rounded">
                Registration
              </span>
              <span className="text-[#64748B]">Verification</span>
              <span className="text-[#64748B]">Safety Charter</span>
            </div>

            <div className="flex items-center gap-2 bg-[#B9EADB]/30 text-[#1F4E43] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#B9EADB]">
              <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
              <span className="tracking-wide">ALPINE SAFETY GUARANTEE</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#9B2F00] text-white flex items-center justify-center text-xs font-medium">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 2. E-TICKET & PAY BALANCE HEADER (WeTrek Expeditions)
  if (currentScreen === 'eticket' || currentScreen === 'paybalance') {
    return (
      <header className="bg-white border-b border-[#E6E1D8] px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded bg-[#C2410C] text-white flex items-center justify-center font-bold text-sm">
                W
              </div>
              <div>
                <span className="font-editorial text-lg font-bold tracking-tight text-[#1C2526]">
                  WeTrek
                </span>
                <span className="block text-[9px] tracking-wider text-[#78716C] uppercase font-mono leading-none">
                  Expeditions
                </span>
              </div>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              Expeditions
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              Trekking & Trails
            </button>
            <button
              onClick={() => onNavigate('eticket')}
              className="bg-[#B9EADB]/50 text-[#1F4E43] font-semibold px-3 py-1 rounded cursor-pointer"
            >
              My Bookings
            </button>
            <button
              onClick={() => onNavigate('review')}
              className="text-[#64748B] hover:text-[#1C2526] transition-colors cursor-pointer"
            >
              Support
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('registration')}
              className="w-8 h-8 rounded-full bg-[#C2410C] text-white flex items-center justify-center text-xs font-semibold cursor-pointer"
              title="Eleanor Vance (Climber Profile)"
            >
              EV
            </button>
          </div>
        </div>
      </header>
    );
  }

  // 3. REVIEW SCREEN HEADER (Wayfarer)
  if (currentScreen === 'review') {
    return (
      <header className="bg-white border-b border-[#E6E1D8] px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-1.5 cursor-pointer text-left"
            >
              <Mountain className="w-5 h-5 text-[#C2410C]" />
              <span className="font-editorial text-lg font-bold tracking-tight text-[#1C2526]">
                WAYFARER
              </span>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] cursor-pointer"
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] cursor-pointer"
            >
              Expeditions
            </button>
            <button
              onClick={() => onNavigate('eticket')}
              className="text-[#C2410C] font-semibold border-b-2 border-[#C2410C] pb-0.5 cursor-pointer"
            >
              My Bookings
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] cursor-pointer"
            >
              Saved
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-[#64748B] hover:text-[#1C2526] cursor-pointer"
            >
              Support
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs text-[#64748B] border border-[#E6E1D8] px-2 py-1 rounded">
              <BookOpen className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>FIELD LOG</span>
            </div>
            <span className="text-xs font-mono font-medium text-[#1C2526] border border-[#E6E1D8] px-2 py-1 rounded">
              EN
            </span>
            <button
              onClick={() => onNavigate('registration')}
              className="w-8 h-8 rounded-full bg-[#C2410C] text-white flex items-center justify-center text-xs font-semibold cursor-pointer"
              title="Eleanor Vance"
            >
              EV
            </button>
          </div>
        </div>
      </header>
    );
  }

  // 4. MAIN MARKETPLACE HEADER (WeTrek)
  return (
    <header className="bg-white border-b border-[#E6E1D8] px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-2 cursor-pointer text-left"
          >
            <span className="font-editorial text-2xl font-bold tracking-tight text-[#1C2526]">
              WeTrek
            </span>
          </button>
          <span className="text-[10px] tracking-wider text-[#78716C] uppercase font-mono hidden xl:inline">
            TOURS FROM MANY LOCAL COMPANIES
          </span>
        </div>

        {/* Nav Links Zone */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#2D3748]">
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-[#C2410C] font-semibold border-b-2 border-[#C2410C] pb-0.5 cursor-pointer"
          >
            Marketplace
          </button>
          <button
            onClick={() => onNavigate('marketplace')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            Find Tours
          </button>
          <button
            onClick={() => onNavigate('marketplace')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            Trusted Guides
          </button>
          <button
            onClick={() => onNavigate('marketplace')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            Compare Prices
          </button>
          <button
            onClick={() => onNavigate('marketplace')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            Places to Go
          </button>
          <button
            onClick={() => onNavigate('eticket')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            Help & FAQ
          </button>
        </nav>

        {/* Right Search & Action Zone */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              placeholder="Search places, tours, guide"
              className="w-48 xl:w-56 pl-8 pr-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C]"
            />
          </div>

          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-semibold text-[#1F4E43] hover:text-[#C2410C] transition-colors cursor-pointer whitespace-nowrap px-2"
          >
            Sign In
          </button>

          <button
            onClick={() => onNavigate('partner_company_info')}
            className="text-xs font-medium text-[#1C2526] hover:text-[#C2410C] transition-colors cursor-pointer whitespace-nowrap px-2 hidden sm:inline-block"
          >
            Join as a Tour Guide
          </button>

          <button
            onClick={() => onNavigate('login')}
            className="w-8 h-8 rounded-full bg-[#1F4E43] text-white flex items-center justify-center text-xs font-medium cursor-pointer"
            title="Climber Account Sign In"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
