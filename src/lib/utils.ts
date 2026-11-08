export function cn(...classes: any[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatTimeOnly(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format Date object to ISO-8601 with explicit timezone offset (e.g. 2026-10-29T08:00:00+07:00).
 */
export function formatOffsetDateTime(date: Date): string {
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetMins = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

/**
 * Format Date object to YYYY-MM-DDTHH:mm string for <input type="datetime-local" />
 */
export function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if a caption or text string is a raw file name, file path, URL, or technical artifact name.
 * Used to avoid showing ugly technical file names (e.g. "FitPet_LogoCrop.jpg", "image.png") on UI banners.
 */
export function isFileNameOrPath(text: string | null | undefined): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Ends with file extension
  if (/\.(jpe?g|png|webp|gif|svg|bmp|ico|tiff?|mp4|mov|avi|wmv|pdf|gpx|json|txt|docx?|xlsx?|zip|rar)$/i.test(trimmed)) {
    return true;
  }

  // File paths or URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('\\') ||
    trimmed.startsWith('blob:') ||
    /^[a-zA-Z]:[\\/]/.test(trimmed)
  ) {
    return true;
  }

  // Camera / screenshot prefixes
  if (/^(IMG_|PXL_|DSC_|PHOTO-|Screenshot_|Screen_|file_|upload_|media_)/i.test(trimmed)) {
    return true;
  }

  return false;
}


/**
 * Format Date object to YYYY-MM-DD string for <input type="date" />
 */
export function toDateInputString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Automatically calculate endsAt datetime-local string by adding durationDays to startsAt.
 * Example: startsAt on 10th with durationDays = 2 returns endsAt on 12th.
 */
export function calculateEndsAt(startsAtStr: string, durationDays: number): string {
  if (!startsAtStr || !durationDays || durationDays <= 0) return '';
  const date = new Date(startsAtStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + Number(durationDays));
  return toDatetimeLocalString(date);
}

/**
 * Get the Monday 00:00:00 of the week for a given date.
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get Sunday 23:59:59 of the week for a given date.
 */
export function getSundayOfWeek(d: Date = new Date()): Date {
  const monday = getMondayOfWeek(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get the next Monday 00:00:00 (exclusive boundary for week schedules).
 */
export function getNextMondayOfWeek(d: Date = new Date()): Date {
  const monday = getMondayOfWeek(d);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Default balance deadline: noon on the day before departure, in the user's local timezone. */
export function defaultBalanceDueAt(startsAt: string): string {
  if (!startsAt) return '';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() - 1);
  date.setHours(12, 0, 0, 0);
  return toDatetimeLocalString(date);
}
