import React from 'react';
import { ScreenId } from '../../types/expedition';
import { Search, User, ShieldCheck, Mountain, BookOpen, LogOut } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { LanguageToggle } from '../LanguageToggle';
import { useAuthStore } from '../../stores/auth.store';
import { homeScreenForRole } from '../../app/screenAccess';
import { authApi } from '../../features/auth/api/auth.api';

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
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      logout();
      setIsAccountMenuOpen(false);
      onNavigate('marketplace');
      setIsLoggingOut(false);
    }
  };
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

          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <LanguageToggle />
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="bg-[#B9EADB]/40 text-[#1F4E43] font-semibold px-2.5 py-1 rounded">
                {t('auth.registration')}
              </span>
              <span className="text-[#64748B]">{t('auth.verification')}</span>
              <span className="text-[#64748B]">{t('auth.safetyCharter')}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#B9EADB]/30 text-[#1F4E43] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#B9EADB]">
              <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
              <span className="tracking-wide">{t('auth.safetyGuarantee')}</span>
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
            {t('header.tagline')}
          </span>
        </div>

        {/* Nav Links Zone */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#2D3748]">
          <button onClick={() => onNavigate('marketplace')} className="text-[#C2410C] font-semibold border-b-2 border-[#C2410C] pb-0.5 cursor-pointer">
            {t('header.marketplace')}
          </button>
          <button onClick={() => document.getElementById('tour-list')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#1C2526] transition-colors cursor-pointer">
            {t('header.findTours')}
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
              placeholder={t('header.searchPlaceholder')}
              className="w-48 xl:w-56 pl-8 pr-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] placeholder-[#78716C] focus:outline-none focus:border-[#C2410C]"
            />
          </div>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
                className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-semibold text-[#1F4E43] hover:bg-[#F7F4EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {t('header.myAccount')}
              </button>
              {isAccountMenuOpen && (
                <div id="account-menu" role="region" aria-label={t('header.myAccount')} className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-[#E6E1D8] bg-white p-4 shadow-lg">
                  <p className="font-semibold text-sm text-[#1C2526]">{user.name}</p>
                  <p className="mt-1 break-all text-xs text-[#64748B]">{user.email}</p>
                  <p className="mt-2 text-[11px] text-[#78716C]">{t(`account.role.${user.role}`)}</p>
                  <button type="button" onClick={() => { onNavigate('account_profile'); setIsAccountMenuOpen(false); }}
                    className="mt-3 w-full rounded border border-[#1F4E43] px-3 py-2 text-left text-xs font-semibold text-[#1F4E43] hover:bg-[#F0F7F4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]">
                    {t('account.editProfile')}
                  </button>
                  {['admin', 'staff', 'guide'].includes(user.role) && (
                    <button
                      type="button"
                      onClick={() => { onNavigate(homeScreenForRole(user.role)); setIsAccountMenuOpen(false); }}
                      className="mt-3 w-full rounded border border-[#1F4E43] px-3 py-2 text-left text-xs font-semibold text-[#1F4E43] hover:bg-[#F0F7F4]"
                    >
                      {t('roleArea.openWorkspace')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="mt-3 w-full rounded bg-[#F7F4EE] px-3 py-2 text-left text-xs font-semibold text-[#1C2526] hover:bg-[#EFECE4] disabled:opacity-50"
                  >
                    <LogOut className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    {isLoggingOut ? t('header.loggingOut') : t('auth.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-[#1F4E43] hover:text-[#C2410C] transition-colors cursor-pointer whitespace-nowrap px-2"
              >
                {t('header.signIn')}
              </button>
              <button
                onClick={() => onNavigate('registration')}
                className="text-xs font-medium text-[#1C2526] hover:text-[#C2410C] transition-colors cursor-pointer whitespace-nowrap px-2 hidden sm:inline-block"
              >
                {t('auth.createAccount')}
              </button>
            </>
          )}

        </div>
      </div>
    </header>
  );
};
