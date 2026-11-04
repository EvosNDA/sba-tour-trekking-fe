export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    TOURS: '/tours',
    TOUR_DETAIL: (id: string | number = ':tourId') => `/tours/${id}`,
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  BOOKING: {
    NEW: '/booking/new',
    DETAIL: (bookingId: string | number = ':bookingId') => `/booking/${bookingId}`,
    PAYMENT_RESULT: '/payment/result',
    PAYMENT_CANCEL: '/payment/cancel',
  },
  ACCOUNT: {
    BOOKINGS: '/account/bookings',
  },
  CUSTOMER: {
    PROFILE: '/customer/profile',
    MY_BOOKINGS: '/account/bookings',
    CHECKOUT: '/booking/new',
    REVIEW: '/customer/review',
  },
  PARTNER: {
    DASHBOARD: '/partner/dashboard',
    TOUR_MANAGEMENT: '/partner/tours',
    BOOKING_MANAGEMENT: '/partner/bookings',
    COMPANY_INFO: '/partner/company-info',
    CERTIFICATES: '/partner/certificates',
    PAYOUTS: '/partner/payouts',
  },
  ADMIN: {
    TOURS: '/admin/tours',
    SCHEDULES: '/admin/schedules',
    EQUIPMENT: '/admin/equipment',
    POLICIES: '/admin/policies',
    REFUNDS: '/admin/refunds',
    TOUR_NEW: '/admin/tours/new',
    TOUR_DETAIL: (tourId: string | number = ':tourId') => `/admin/tours/${tourId}`,
    TOUR_EDIT: (tourId: string | number = ':tourId') => `/admin/tours/${tourId}/edit`,
    DASHBOARD: '/admin/dashboard',
    USER_MANAGEMENT: '/admin/users',
    PARTNER_MANAGEMENT: '/admin/partners',
    OPS_MODERATION: '/admin/moderation',
    STAFF_ESCALATIONS: '/admin/escalations',
  },
} as const;

export type AppRoute = typeof ROUTES;
