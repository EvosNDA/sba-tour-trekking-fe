export type DashboardBasis = 'BOOKING_DATE' | 'DEPARTURE_DATE';
export type DashboardTrendDirection = 'UP' | 'DOWN' | 'FLAT' | 'NEW';
export type ScheduleFillLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'FULL';
export type DashboardGranularity = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
export type SummaryPeriod =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type ScheduleFillStatus = 'OPEN' | 'ALL';

export interface Volume {
  bookingCount: number;
  passengerCount: number;
  previousPeriod?: PeriodComparison;
  samePeriodLastYear?: PeriodComparison;
}

// 1. Trend
export interface BookingTrendParams {
  granularity: DashboardGranularity;
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd, exclusive
  basis?: DashboardBasis;
  tourId?: number;
}

export interface BookingTrendPoint {
  periodKey: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  bookingCount: number;
  passengerCount: number;
  cancelledCount: number;
}

export interface BookingTrendResponse {
  granularity: DashboardGranularity;
  basis: DashboardBasis;
  from: string;
  to: string;
  tourId: number | null;
  points: BookingTrendPoint[];
}

// 2. Compare
export interface BookingCompareParams {
  granularity: DashboardGranularity;
  baseYear: number;
  compareYear: number;
  months?: string; // e.g. "10,11"
  basis?: DashboardBasis;
  tourId?: number;
}

export interface BookingCompareRow {
  period: string; // "01".."12" | "Q1".."Q4" | "W01".."W53" | "YEAR"
  baseValue: Volume;
  compareValue: Volume;
  delta: Volume;
  changePercent: number | null;
  trend: DashboardTrendDirection;
  partial: boolean;
  future: boolean;
}

export interface BookingCompareSummary {
  baseValue: Volume;
  compareValue: Volume;
  delta: Volume;
  changePercent: number | null;
  trend: DashboardTrendDirection;
}

export interface BookingCompareResponse {
  granularity: DashboardGranularity;
  basis: DashboardBasis;
  baseYear: number;
  compareYear: number;
  months: number[];
  tourId: number | null;
  rows: BookingCompareRow[];
  summary: BookingCompareSummary | null;
}

// 3. Summary
export interface PeriodComparison {
  bookingCount: number;
  passengerCount: number;
  changePercent: number | null;
  trend: DashboardTrendDirection;
}

export interface RateComparison {
  value: number | null;
  changePercent: number | null;
  trend: DashboardTrendDirection;
}

export interface CountMetric {
  bookingCount: number;
  passengerCount: number;
  previousPeriod: PeriodComparison;
  samePeriodLastYear: PeriodComparison;
}

export interface RateMetric {
  value: number | null;
  previousPeriod: RateComparison;
  samePeriodLastYear: RateComparison;
}

// Hỗ trợ cả trường hợp backend trả về Volume object { bookingCount, passengerCount }
// hoặc primitive number
export type SummaryVolumeMetric = Volume | number;

export interface DashboardSummaryResponse {
  period: SummaryPeriod;
  basis: DashboardBasis;
  periodStart: string;
  periodEnd: string;
  partial: boolean;
  future: boolean;
  totalBookings: SummaryVolumeMetric;
  confirmed: SummaryVolumeMetric;
  pendingPayment: SummaryVolumeMetric;
  cancelled: SummaryVolumeMetric;
  expired: SummaryVolumeMetric;
  completed: SummaryVolumeMetric;
  passengerCount: CountMetric;
  cancellationRate: RateMetric;
}

export interface DashboardSummaryParams {
  period: SummaryPeriod;
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd, exclusive
  basis?: DashboardBasis;
}

// 4. Top Tours
export interface TopTourItem {
  tourId: number;
  tourName: string;
  bookingCount: number;
  passengerCount: number;
  share: number | null; // Double, e.g. 0.25 (25%)
}

export interface TopToursResponse {
  basis: DashboardBasis;
  from: string;
  to: string;
  tours: TopTourItem[];
}

export interface TopToursParams {
  from?: string;
  to?: string;
  limit?: number;
  basis?: DashboardBasis;
}

// 5. Schedules Fill-rate
export interface ScheduleFillRateItem {
  scheduleId: number;
  tourName: string;
  departureDate: string; // yyyy-MM-dd
  capacity: number;
  bookedPassengers: number;
  heldPassengers: number;
  fillRate: number | null;
  level: ScheduleFillLevel;
}

export interface ScheduleFillRateSummary {
  scheduleCount: number;
  capacity: number;
  bookedPassengers: number;
  heldPassengers: number;
  averageFillRate: number | null;
}

export interface ScheduleFillRateResponse {
  from: string;
  to: string;
  tourId: number | null;
  status: ScheduleFillStatus;
  schedules: ScheduleFillRateItem[];
  summary: ScheduleFillRateSummary;
}

export interface ScheduleFillRateParams {
  from?: string;
  to?: string;
  tourId?: number;
  status?: ScheduleFillStatus;
}
