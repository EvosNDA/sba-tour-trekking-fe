import React from 'react';
import { ScreenId } from '../types/expedition';
import { Compass, UserCheck, Ticket, CreditCard, Award, RotateCcw, LogIn } from 'lucide-react';

interface Props {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  onResetData: () => void;
  bookingStatus: 'DEPOSIT_PAID' | 'FULLY_SETTLED';
  reviewSubmitted: boolean;
}

export const NavigationSwitcher: React.FC<Props> = ({
  currentScreen,
  onSelectScreen,
  onResetData,
  bookingStatus,
  reviewSubmitted,
}) => {
  const screens: { id: ScreenId; label: string; sub: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'marketplace',
      label: '1. Marketplace',
      sub: 'WeTrek Discovery',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'login',
      label: '2. Login',
      sub: 'Climber Portal',
      icon: <LogIn className="w-4 h-4" />,
    },
    {
      id: 'registration',
      label: '3. Registration',
      sub: 'SummitTrails Climber ID',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'eticket',
      label: '4. Digital E-Ticket',
      sub: 'Mountain Gate Check-in',
      icon: <Ticket className="w-4 h-4" />,
      badge: bookingStatus === 'FULLY_SETTLED' ? 'Settled' : 'Deposit Paid',
    },
    {
      id: 'paybalance',
      label: '5. Pay Balance',
      sub: 'VietQR / Settlement Ledger',
      icon: <CreditCard className="w-4 h-4" />,
      badge: bookingStatus === 'FULLY_SETTLED' ? 'Paid In Full' : 'Pending',
    },
    {
      id: 'review',
      label: '6. Tour Review',
      sub: 'Wayfarer Logbook',
      icon: <Award className="w-4 h-4" />,
      badge: reviewSubmitted ? '+250 pts' : undefined,
    },
    {
      id: 'partner_company_info',
      label: '7. Partner: Step 1',
      sub: 'Company Info',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'partner_certificates',
      label: '8. Partner: Step 2',
      sub: 'Certificates & Safety',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'partner_bank_payouts',
      label: '9. Partner: Step 3',
      sub: 'Bank Payouts',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'partner_final_review',
      label: '10. Partner: Step 4',
      sub: 'Review & Sign',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'ops_moderation',
      label: '11. Ops: Tour Review',
      sub: 'Staff Moderation Desk',
      icon: <Compass className="w-4 h-4" />,
      badge: '7 Pending',
    },
    {
      id: 'staff_escalations',
      label: '12. Ops: Live Chat',
      sub: 'Customer Escalations Desk',
      icon: <Ticket className="w-4 h-4" />,
      badge: '3 Waiting',
    },
    {
      id: 'platform_analytics',
      label: '13. Ops: Statistics',
      sub: 'Platform Performance',
      icon: <Award className="w-4 h-4" />,
      badge: 'Live',
    },
  ];

  return (
    <aside aria-label="Reference Screen Switcher" className="sticky top-0 z-50 bg-[#1C2526] text-white border-b border-[#2D3748] px-3 py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider text-[#A0D0C2] uppercase font-semibold">
            Expedition Screens
          </span>
          <span className="text-stone-500 text-xs hidden sm:inline">|</span>
          <span className="text-xs text-stone-300 hidden md:inline">
            Direct navigation to 5 reference layouts
          </span>
        </div>

        <nav aria-label="Expedition View Switcher" className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {screens.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScreen(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#C2410C] text-white font-medium shadow-sm ring-1 ring-white/20'
                    : 'text-stone-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {s.icon}
                <span className="font-medium">{s.label}</span>
                {s.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : s.badge === 'Settled' || s.badge === 'Paid In Full' || s.badge === '+250 pts'
                        ? 'bg-[#1F4E43] text-emerald-200'
                        : 'bg-stone-700 text-stone-300'
                    }`}
                  >
                    {s.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={onResetData}
            title="Reset booking state to default"
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1.5 rounded hover:bg-white/5 ml-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset State</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};
