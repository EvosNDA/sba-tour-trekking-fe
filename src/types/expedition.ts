export type ScreenId =
  | 'marketplace'
  | 'login'
  | 'registration'
  | 'account_profile'
  | 'eticket'
  | 'paybalance'
  | 'review'
  | 'partner_company_info'
  | 'partner_activate'
  | 'partner_activation_help'
  | 'partner_application_submitted'
  | 'partner_application_status'
  | 'partner_certificates'
  | 'partner_bank_payouts'
  | 'partner_final_review'
  | 'ops_moderation'
  | 'staff_escalations'
  | 'platform_analytics'
  | 'booking_payment_result';

export interface TourCompany {
  id: string;
  name: string;
  license: string;
  rating: number;
  reviewCount: number;
  activeRoutes: number;
  onTimeRate: number;
  badges: string[];
  guideRatio: string;
  aboutPrice: string;
  description: string;
}

export interface DiscountVoucher {
  id: string;
  title: string;
  discountText: string;
  description: string;
  code: string;
  tagColor: string;
}

export interface Destination {
  id: string;
  name: string;
  location: string;
  elevation: string;
  tourCount: number;
  fromPrice: number;
  image: string;
}

export interface Tour {
  id: string;
  title: string;
  operatorName: string;
  operatorLicense?: string;
  rating: number;
  reviewCount: number;
  difficulty: 'Medium - Good Fitness' | 'Hard - Multi-Day Trek' | 'Easy - For Beginners' | 'Easy - Nature & Forest';
  durationDays: number;
  durationNights: number;
  distanceKm: number;
  elevationGainM: number;
  climbRange?: string;
  guidesRatio: string;
  priceOwnGearUSD: number;
  priceRentGearUSD: number;
  image: string;
  destinationId?: string;
  isSafePay: boolean;
}

export interface Traveler {
  id: string;
  name: string;
  role: 'TRIP LEADER' | 'MEMBER';
  passport: string;
  gearTag: string;
  gearChoice: string;
  checkInStatus: 'Checked In' | 'Waiting at Gate';
  checkInTime?: string;
}

export interface Booking {
  id: string; // e.g. '#TRK-98421-FANSIPAN'
  nationalParkPass: string;
  tourTitle: string;
  subtitle: string;
  tripLevel: 'EASY' | 'MODERATE' | 'HARD';
  peakElevation: string;
  mainTraveler: string;
  partySize: number;
  meetingPlace: string;
  meetingElevation: string;
  meetingTime: string;
  tourGuide: string;
  tourGuideCert: string;
  tourGuidePhone: string;
  vhfEmergencyRadio: string;
  gearChoiceDescription: string;
  qrCodeToken: string;
  activePassCode: string;
  totalPriceVND: number;
  paidDepositVND: number;
  depositDate: string;
  depositRef: string;
  remainingVND: number;
  parkFeeVND: number;
  hasExtraPorter: boolean;
  porterFeeVND: number;
  paymentStatus: 'DEPOSIT_PAID' | 'FULLY_SETTLED';
  travelers: Traveler[];
}

export interface ExpeditionReview {
  id: string;
  expeditionTitle: string;
  expeditionBadge: string;
  completedDate: string;
  operatorName: string;
  leadGuideName: string;
  rewardPoints: number;
  ratings: {
    overall: number;
    guideCrew: number;
    scenery: number;
  };
  selectedTags: string[];
  photos: {
    id: string;
    name: string;
    size: string;
    url: string;
  }[];
  narrative: string;
  endorsement: 'Enthusiastically' | 'Neutral' | 'Not Advised';
  travelerDynamic: 'Solo' | 'Couple' | 'Family' | 'Friends';
  isSubmitted: boolean;
}
