import React, { useState, useEffect } from 'react';
import { ScreenId, Booking, ExpeditionReview, Tour } from './types/expedition';
import {
  TOUR_COMPANIES,
  DISCOUNT_VOUCHERS,
  POPULAR_DESTINATIONS,
  EXPLORE_TOURS,
  INITIAL_BOOKING,
  INITIAL_REVIEW,
} from './data/mockData';
import { NavigationSwitcher } from './components/NavigationSwitcher';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ClimberRegistrationScreen } from './screens/ClimberRegistrationScreen';
import { ETicketScreen } from './screens/ETicketScreen';
import { PayBalanceScreen } from './screens/PayBalanceScreen';
import { TourReviewScreen } from './screens/TourReviewScreen';
import { PartnerCertificatesScreen } from './screens/PartnerCertificatesScreen';
import { PartnerBankPayoutsScreen } from './screens/PartnerBankPayoutsScreen';
import { PartnerFinalReviewScreen } from './screens/PartnerFinalReviewScreen';
import { OpsModerationConsoleScreen } from './screens/OpsModerationConsoleScreen';
import { AIRangerModal } from './components/AIRangerModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAIRangerOpen, setIsAIRangerOpen] = useState(false);

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

  const handleResetData = () => {
    setBooking(INITIAL_BOOKING);
    setReview(INITIAL_REVIEW);
    try {
      localStorage.removeItem('wetrek_booking_v1');
      localStorage.removeItem('wetrek_review_v1');
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
  };

  const handleBookTour = (tour: Tour) => {
    // Dynamically update booking with selected tour
    const newTotalPrice = Math.round(tour.priceRentGearUSD * 2 * 24700);
    const newDeposit = Math.round(newTotalPrice * 0.3);
    const newRemaining = newTotalPrice - newDeposit;

    setBooking((prev) => ({
      ...prev,
      tourTitle: tour.title,
      subtitle: `${tour.durationDays} Days ${tour.durationNights} Nights Mountain Hike & Camping`,
      tripLevel: tour.difficulty.includes('Hard') ? 'HARD' : tour.difficulty.includes('Medium') ? 'MODERATE' : 'EASY',
      totalPriceVND: newTotalPrice,
      paidDepositVND: newDeposit,
      remainingVND: newRemaining,
      paymentStatus: 'DEPOSIT_PAID',
    }));

    setCurrentScreen('eticket');
  };

  const handleRegistrationSuccess = (userData: { name: string; email: string; phone: string }) => {
    setBooking((prev) => ({
      ...prev,
      mainTraveler: userData.name,
      travelers: prev.travelers.map((t, idx) =>
        idx === 0 ? { ...t, name: userData.name } : t
      ),
    }));
    setCurrentScreen('eticket');
  };

  const handleLoginSuccess = (userEmail: string) => {
    const derivedName = userEmail.includes('@')
      ? userEmail.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
      : 'Eleanor Vance';

    setBooking((prev) => ({
      ...prev,
      mainTraveler: derivedName,
      travelers: prev.travelers.map((t, idx) =>
        idx === 0 ? { ...t, name: derivedName } : t
      ),
    }));
    setCurrentScreen('eticket');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]">
      {/* 1. Global Navigation Switcher for instant access to all screens */}
      <NavigationSwitcher
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onResetData={handleResetData}
        bookingStatus={booking.paymentStatus}
        reviewSubmitted={review.isSubmitted}
      />

      {/* 2. Top Header (only on screens other than login & partner/ops screens which have their own dedicated headers) */}
      {!['login', 'partner_certificates', 'partner_bank_payouts', 'partner_final_review', 'ops_moderation'].includes(currentScreen) && (
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          searchTerm={searchTerm}
          onSearch={(term) => setSearchTerm(term)}
        />
      )}

      {/* 3. Screen Body */}
      <main className="flex-1">
        {currentScreen === 'marketplace' && (
          <MarketplaceScreen
            companies={TOUR_COMPANIES}
            vouchers={DISCOUNT_VOUCHERS}
            destinations={POPULAR_DESTINATIONS}
            tours={EXPLORE_TOURS}
            onBookTour={handleBookTour}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'registration' && (
          <ClimberRegistrationScreen
            onSuccess={handleRegistrationSuccess}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'eticket' && (
          <ETicketScreen
            booking={booking}
            onUpdateBooking={(updated) => setBooking(updated)}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenAIRanger={() => setIsAIRangerOpen(true)}
          />
        )}

        {currentScreen === 'paybalance' && (
          <PayBalanceScreen
            booking={booking}
            onUpdateBooking={(updated) => setBooking(updated)}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenAIRanger={() => setIsAIRangerOpen(true)}
          />
        )}

        {currentScreen === 'review' && (
          <TourReviewScreen
            review={review}
            onUpdateReview={(updated) => setReview(updated)}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'partner_certificates' && (
          <PartnerCertificatesScreen onNavigate={(screen) => setCurrentScreen(screen)} />
        )}

        {currentScreen === 'partner_bank_payouts' && (
          <PartnerBankPayoutsScreen onNavigate={(screen) => setCurrentScreen(screen)} />
        )}

        {currentScreen === 'partner_final_review' && (
          <PartnerFinalReviewScreen onNavigate={(screen) => setCurrentScreen(screen)} />
        )}

        {currentScreen === 'ops_moderation' && (
          <OpsModerationConsoleScreen onNavigate={(screen) => setCurrentScreen(screen)} />
        )}
      </main>

      {/* 4. Editorial Alpine Footer (on screens other than login & ops console which have their own footers) */}
      {!['login', 'ops_moderation'].includes(currentScreen) && <Footer />}

      {/* 5. Interactive Gemini AI Alpine Dispatch & Trail Ranger Assistant */}
      <AIRangerModal
        isOpen={isAIRangerOpen}
        onClose={() => setIsAIRangerOpen(false)}
        bookingRef={booking.id}
        tourName={booking.tourTitle}
      />
    </div>
  );
}
