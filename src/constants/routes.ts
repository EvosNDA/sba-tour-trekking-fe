export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    TOURS: '/tours',
    TOUR_DETAIL: (id: string = ':id') => `/tours/${id}`,
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
  CUSTOMER: {
    PROFILE: '/customer/profile',
    MY_BOOKINGS: '/customer/my-bookings',
    CHECKOUT: '/customer/checkout',
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
    DASHBOARD: '/admin/dashboard',
    USER_MANAGEMENT: '/admin/users',
    PARTNER_MANAGEMENT: '/admin/partners',
    OPS_MODERATION: '/admin/moderation',
    STAFF_ESCALATIONS: '/admin/escalations',
  },
} as const;

export type AppRoute = typeof ROUTES;
