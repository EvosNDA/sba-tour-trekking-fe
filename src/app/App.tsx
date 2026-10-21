import React, { useState, useEffect } from 'react';
import { ScreenId, Booking, ExpeditionReview } from '../types/expedition';
import { INITIAL_BOOKING, INITIAL_REVIEW } from '../data/mockData';
import { Providers } from './providers';
import { AppRouter } from './router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AIRangerModal } from '../components/AIRangerModal';
import { authStore, useAuthStore } from '../stores/auth.store';
import { canAccessScreen, homeScreenForRole } from './screenAccess';
import { authApi } from '../features/auth/api/auth.api';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { partnerApplicationsApi } from '../features/partners/api/partnerApplications.api';

function BackBar({ disabled, onBack }: { disabled: boolean; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="border-b border-[#E6E1D8] bg-[#FDFBF7] px-4 py-2 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={onBack} disabled={disabled}
          className="inline-flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-[#52605D] hover:bg-white hover:text-[#1C2526] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C2410C] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('navigation.back')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('navigation.back')}
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    const role = authStore.getState().user?.role ?? null;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('partnerActivation')) return 'partner_activate';
      if (params.has('paymentReturn') || window.location.pathname === '/booking/payment-result') return 'booking_payment_result';
      const savedScreen = localStorage.getItem('wetrek_current_screen') as ScreenId | null;
      if (savedScreen && canAccessScreen(role, savedScreen)) return savedScreen;
    } catch {
      // Continue with the default screen when storage is unavailable.
    }
    return role ? homeScreenForRole(role) : 'marketplace';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>(() => {
    try {
      const saved = sessionStorage.getItem('wetrek_screen_history');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      const validScreens: ScreenId[] = ['marketplace', 'login', 'registration', 'account_profile', 'eticket', 'paybalance', 'review', 'partner_company_info', 'partner_activate', 'partner_activation_help', 'partner_application_submitted', 'partner_application_status', 'partner_certificates', 'partner_bank_payouts', 'partner_final_review', 'ops_moderation', 'staff_escalations', 'platform_analytics', 'booking_payment_result', 'admin_finance'];
      return Array.isArray(parsed) ? parsed.filter((screen): screen is ScreenId => typeof screen === 'string' && validScreens.includes(screen as ScreenId)) : [];
    } catch {
      return [];
    }
  });
  const [isAIRangerOpen, setIsAIRangerOpen] = useState(false);
  const { user, isRestoring } = useAuthStore();
  const changeScreen = (screen: ScreenId) => {
    setCurrentScreen(screen);
    try {
      localStorage.setItem('wetrek_current_screen', screen);
    } catch {
      // Screen persistence is optional.
    }
  };
  const navigate = (screen: ScreenId) => {
    const role = authStore.getState().user?.role ?? null;
    const destination = canAccessScreen(role, screen) ? screen : 'marketplace';
    if (destination !== currentScreen) setScreenHistory((history) => [...history, currentScreen]);
    changeScreen(destination);
  };

  const goBack = () => {
    const role = authStore.getState().user?.role ?? null;
    const previous = [...screenHistory];
    while (previous.length) {
      const candidate = previous.pop()!;
      if (canAccessScreen(role, candidate)) {
        setScreenHistory(previous);
        changeScreen(candidate);
        return;
      }
    }
    setScreenHistory([]);
    const fallback = role ? homeScreenForRole(role) : 'marketplace';
    if (fallback !== currentScreen) changeScreen(fallback);
  };

  useEffect(() => {
    try {
      sessionStorage.setItem('wetrek_screen_history', JSON.stringify(screenHistory));
    } catch {
      // Back navigation history is best-effort.
    }
  }, [screenHistory]);

  useEffect(() => {
    if (!authStore.getState().isRestoring) return;
    void authApi.refresh()
      .then(async (session) => {
        authStore.login(session.user, session.token);
        try {
          const application = await partnerApplicationsApi.status();
          authStore.updateUser({ partnerApplicationStatus: application.status });
          if (application.status === 'pending' || application.status === 'rejected') changeScreen('partner_application_status');
        } catch {
          // Keep the refreshed session usable if the status endpoint is temporarily unavailable.
        }
      })
      .catch((error: unknown) => {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
        if (code === 'INVALID_SESSION' || code === 'UNAUTHORIZED') {
          authStore.logout();
          changeScreen('marketplace');
          return;
        }
        // Keep the stored identity during a temporary network or backend outage.
        authStore.setRestoring(false);
      });
  }, []);

  // Persistent Booking State
  const [booking, setBooking] = useState<Booking>(() => {
    try {
      const saved = localStorage.getItem('wetrek_booking_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved booking:', e);
    }
    return INITIAL_BOOKING;
  });

  // Persistent Review State
  const [review, setReview] = useState<ExpeditionReview>(() => {
    try {
      const saved = localStorage.getItem('wetrek_review_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved review:', e);
    }
    return INITIAL_REVIEW;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wetrek_booking_v1', JSON.stringify(booking));
    } catch (e) {
      console.warn('Failed to persist booking:', e);
    }
  }, [booking]);

  useEffect(() => {
    try {
      localStorage.setItem('wetrek_review_v1', JSON.stringify(review));
    } catch (e) {
      console.warn('Failed to persist review:', e);
    }
  }, [review]);

  const finishSignIn = async () => {
    setScreenHistory([]);
    try {
      const application = await partnerApplicationsApi.status();
      authStore.updateUser({ partnerApplicationStatus: application.status });
      if (application.status === 'pending' || application.status === 'rejected') {
        changeScreen('partner_application_status');
        return;
      }
      if (application.status === 'approved') {
        changeScreen(homeScreenForRole('partner'));
        return;
      }
    } catch {
      // A temporary status lookup failure should not block sign-in.
    }
    changeScreen('marketplace');
  };
  const handleRegistrationSuccess = () => finishSignIn();
  const handleLoginSuccess = () => finishSignIn();

  const hideHeaderScreens: ScreenId[] = [
    'login',
    'partner_activation_help',
    'partner_application_submitted',
    'partner_company_info',
    'partner_certificates',
    'partner_bank_payouts',
    'partner_final_review',
    'ops_moderation',
    'staff_escalations',
    'platform_analytics',
    'admin_finance',
  ];

  const hideFooterScreens: ScreenId[] = [
    'login',
    'partner_activation_help',
    'partner_application_submitted',
    'ops_moderation',
    'staff_escalations',
    'platform_analytics',
    'admin_finance',
  ];

  return (
    <Providers>
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]">
        {/* Top Header */}
        {!hideHeaderScreens.includes(currentScreen) && (
          <Header
            currentScreen={currentScreen}
            onNavigate={navigate}
            searchTerm={searchTerm}
            onSearch={(term) => setSearchTerm(term)}
          />
        )}

        <BackBar
          disabled={screenHistory.length === 0 && currentScreen === (user ? homeScreenForRole(user.role) : 'marketplace')}
          onBack={goBack}
        />

        {/* 3. Screen Body */}
        <main className="flex-1" aria-busy={isRestoring}>
          {isRestoring ? (
            <div className="mx-auto flex min-h-64 max-w-6xl items-center justify-center" aria-hidden="true">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E6E1D8] border-t-[#C2410C]" />
            </div>
          ) : <AppRouter
            currentScreen={canAccessScreen(user?.role ?? null, currentScreen) ? currentScreen : 'marketplace'}
            onNavigate={navigate}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            booking={booking}
            review={review}
            onUpdateBooking={setBooking}
            onUpdateReview={setReview}
            onLoginSuccess={handleLoginSuccess}
            onRegistrationSuccess={handleRegistrationSuccess}
            onOpenAIRanger={() => setIsAIRangerOpen(true)}
          />}
        </main>

        {/* 4. Editorial Alpine Footer */}
        {!hideFooterScreens.includes(currentScreen) && <Footer onNavigate={navigate} />}

        {/* 5. Interactive Gemini AI Alpine Dispatch & Trail Ranger Assistant */}
        <AIRangerModal
          isOpen={isAIRangerOpen}
          onClose={() => setIsAIRangerOpen(false)}
          bookingRef={booking.id}
          tourName={booking.tourTitle}
        />
      </div>
    </Providers>
  );
}

export default App;
