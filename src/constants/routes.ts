export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    TOURS: '/tours',
    TOUR_DETAIL: (id: string | number = ':tourId') => `/tours/${id}`,
    POLICY: (slug: string) => `/chinh-sach/${slug}`,
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    ACTIVATE_ACCOUNT: '/activate-account',
  },
  BOOKING: {
    NEW: '/booking/new',
    DETAIL: (bookingId: string | number = ':bookingId') => `/booking/${bookingId}`,
    PAYMENT_RESULT: '/payment/result',
    PAYMENT_CANCEL: '/payment/cancel',
  },
  ACCOUNT: {
    BOOKINGS: '/account/bookings',
    PROFILE: '/customer/profile',
  },
  CUSTOMER: {
    PROFILE: '/customer/profile',
    MY_BOOKINGS: '/account/bookings',
    CHECKOUT: '/booking/new',
    REVIEW: '/customer/review',
  },
  GUIDE: {
    DASHBOARD: '/guide',
    SCHEDULES: '/guide/schedules',
    SCHEDULE_DETAIL: (scheduleId: string | number = ':scheduleId') => `/guide/schedules/${scheduleId}`,
  },
  ADMIN: {
    TOURS: '/admin/tours',
    SCHEDULES: '/admin/schedules',
    SCHEDULE_OVERVIEW: '/admin/schedules/overview',
    SCHEDULE_OVERVIEW_TOUR: (tourId: string | number = ':tourId') => `/admin/schedules/overview/${tourId}`,
    SCHEDULE_DETAIL: (scheduleId: string | number = ':scheduleId') => `/admin/schedules/${scheduleId}`,
    EQUIPMENT: '/admin/equipment',
    POLICIES: '/admin/policies',
    REFUNDS: '/admin/refunds',
    TOUR_NEW: '/admin/tours/new',
    TOUR_DETAIL: (tourId: string | number = ':tourId') => `/admin/tours/${tourId}`,
    TOUR_EDIT: (tourId: string | number = ':tourId') => `/admin/tours/${tourId}/edit`,
    DASHBOARD: '/admin/dashboard',
    USER_MANAGEMENT: '/admin/users',
    REVIEWS: '/admin/reviews',
    BOOKINGS: '/admin/bookings',
    OPS_MODERATION: '/admin/moderation',
    STAFF_ESCALATIONS: '/admin/escalations',
  },
} as const;

export type AppRoute = typeof ROUTES;
