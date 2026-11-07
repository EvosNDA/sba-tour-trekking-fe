import { Volume, SummaryVolumeMetric } from '../types/dashboard.types';

/**
 * Trích xuất bookingCount an toàn dù backend trả về Volume { bookingCount, passengerCount } hay number
 */
export function getBookingCount(metric: SummaryVolumeMetric | null | undefined): number {
  if (metric === null || metric === undefined) return 0;
  if (typeof metric === 'number') return metric;
  if (typeof metric === 'object' && typeof metric.bookingCount === 'number') {
    return metric.bookingCount;
  }
  return 0;
}

/**
 * Trích xuất passengerCount an toàn từ Volume hoặc number
 */
export function getPassengerCount(metric: SummaryVolumeMetric | null | undefined): number {
  if (metric === null || metric === undefined) return 0;
  if (typeof metric === 'number') return metric;
  if (typeof metric === 'object' && typeof metric.passengerCount === 'number') {
    return metric.passengerCount;
  }
  return 0;
}

/**
 * Định dạng số theo chuẩn vi-VN (VD: 1.250.000).
 * Nhận cả number, Volume object hoặc null/undefined.
 */
export function formatNumberVi(value: SummaryVolumeMetric | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  let num: number;
  if (typeof value === 'object') {
    num = typeof value.bookingCount === 'number' ? value.bookingCount : 0;
  } else {
    num = value;
  }

  if (Number.isNaN(num)) {
    return '—';
  }
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Định dạng phần trăm theo chuẩn vi-VN, mặc định 1 chữ số thập phân.
 * isRatio = true nếu số truyền vào ở dạng 0..1 (VD 0.254 -> 25,4%)
 */
export function formatPercentVi(
  value: number | null | undefined,
  options?: { isRatio?: boolean; showPlus?: boolean }
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const pct = options?.isRatio ? value * 100 : value;
  const formatted = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(pct);

  if (options?.showPlus && pct > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

/**
 * Định dạng ngày giờ ISO hoặc yyyy-MM-dd sang dd/MM/yyyy theo giờ VN
 */
export function formatDateVi(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    // Nếu chỉ là yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    // Chuỗi datetime ISO có offset
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Tính ngày kết thúc exclusive (cộng thêm 1 ngày khi người dùng chọn ngày kết thúc inclusive)
 */
export function addOneDay(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
