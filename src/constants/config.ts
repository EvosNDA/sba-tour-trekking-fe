export const APP_CONFIG = {
  APP_NAME: 'WeTrek - SummitTrails',
  TAGLINE: 'Mountain Expeditions & Verified Local Guides',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  VND_EXCHANGE_RATE: 24700,
  DEFAULT_PAGE_SIZE: 12,
  MAX_UPLOAD_SIZE_MB: 10,
  SUPPORT_PHONE: '+84 (0) 214 3871 289',
  EMERGENCY_VHF_FREQ: '147.425 MHz',
  NATIONAL_PARK_TRAM_TON: 'Tram Ton Pass Gate (1,900m MSL)',
} as const;
