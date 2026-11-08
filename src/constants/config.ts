export const APP_CONFIG = {
  APP_NAME: 'WeTrek - SummitTrails',
  TAGLINE: 'Hành trình khám phá thiên nhiên & Trekking chuyên nghiệp',
  API_BASE_URL: (
  import.meta.env.VITE_API_BASE_URL ||(import.meta.env.PROD ? '/' : 'http://localhost:8080')).replace(/\/+$/, ''),
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  VND_EXCHANGE_RATE: 24700,
  DEFAULT_PAGE_SIZE: 20,
  MAX_UPLOAD_SIZE_MB: 5,
  SUPPORT_PHONE: '+84 (0) 214 3871 289',
  SUPPORT_EMAIL: 'hotro@wetrek.vn',
  EMERGENCY_VHF_FREQ: '147.425 MHz',
  NATIONAL_PARK_TRAM_TON: 'Trạm Tôn - Hoàng Liên Sơn (1,900m MSL)',
} as const;
