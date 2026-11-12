import React from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  PackageCheck,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  evaluateCheckInTimeWindow,
  evaluateCheckOutTimeWindow,
  formatVietnamDateTime,
} from '../../../features/tours/api/attendance.api';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import type { BatchRoundStatus } from '../../../features/tours/types/attendance.types';

export interface GuideScheduleCardProps {
  schedule: {
    scheduleId: number;
    tourTitle: string;
    startsAt: string;
    endsAt: string;
    isLead: boolean;
    passengerCount: number;
    capacity: number;
    heldSeats?: number;
    checkInRoundStatus: BatchRoundStatus;
    checkOutRoundStatus: BatchRoundStatus;
    checkInProcessedCount: number;
    checkOutProcessedCount: number;
    checkInSubmittedAt: string | null;
    checkOutSubmittedAt: string | null;
  };
  stageBadge: React.ReactNode;
  checkInLabel: string;
  checkOutLabel: string;
  nowMs: number;
}

const STAGE_PILL_STYLE: Record<BatchRoundStatus, string> = {
  NOT_STARTED: 'border-stone-200 bg-stone-100 text-stone-600',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function GuideScheduleCard({
  schedule,
  stageBadge,
  checkInLabel,
  checkOutLabel,
  nowMs,
}: GuideScheduleCardProps) {
  const checkInDone = schedule.checkInRoundStatus === 'CONFIRMED';
  const checkOutDone = schedule.checkOutRoundStatus === 'CONFIRMED';

  const checkInPct =
    schedule.passengerCount > 0
      ? Math.min(100, Math.round((schedule.checkInProcessedCount / schedule.passengerCount) * 100))
      : 0;
  const checkOutPct =
    schedule.passengerCount > 0
      ? Math.min(100, Math.round((schedule.checkOutProcessedCount / schedule.passengerCount) * 100))
      : 0;

  const activeProcessed = checkInDone
    ? schedule.checkOutProcessedCount
    : schedule.checkInProcessedCount;
  const overallPct =
    schedule.passengerCount > 0
      ? Math.min(100, Math.round((activeProcessed / schedule.passengerCount) * 100))
      : 0;

  const checkInWindow = evaluateCheckInTimeWindow(schedule.startsAt, nowMs);
  const checkOutWindow = evaluateCheckOutTimeWindow(schedule.endsAt, nowMs);

  const href = ROUTES.GUIDE.SCHEDULE_DETAIL(schedule.scheduleId);
  const navigateToTrip = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      navigateTo(href);
    }
  };

  const checkInWindowHint =
    schedule.checkInSubmittedAt && checkInDone
      ? `Đã xác nhận ${formatVietnamDateTime(schedule.checkInSubmittedAt)}`
      : checkInWindow.allowed
      ? 'Đang mở cổng Check-in'
      : nowMs > new Date(schedule.startsAt).getTime()
      ? 'Đã qua khung giờ mở'
      : `Mở lúc ${formatVietnamDateTime(checkInWindow.unlockAtIso)}`;

  const checkOutWindowHint =
    schedule.checkOutSubmittedAt && checkOutDone
      ? `Đã xác nhận ${formatVietnamDateTime(schedule.checkOutSubmittedAt)}`
      : checkOutWindow.allowed
      ? 'Đang mở cổng Check-out'
      : `Mở lúc ${formatVietnamDateTime(schedule.endsAt)}`;

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-[#E6E1D8] bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-[#1F4E43]/40 hover:shadow-md">
      {/* Top Meta Row: Schedule ID, Role Badge & Stage Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-700">
            Chuyến #{schedule.scheduleId}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
              schedule.isLead
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-stone-200 bg-stone-50 text-stone-600'
            )}
          >
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span>{schedule.isLead ? 'Guide Trưởng đoàn' : 'Guide Phụ trách'}</span>
          </span>
        </div>

        {stageBadge}
      </div>

      {/* Tour Title */}
      <h2 className="mt-2.5 break-words font-editorial text-xl sm:text-2xl font-bold leading-snug tracking-tight text-[#1C2526]">
        <a
          href={href}
          onClick={navigateToTrip}
          className="rounded transition-colors group-hover:text-[#1F4E43] hover:underline"
        >
          {schedule.tourTitle}
        </a>
      </h2>

      {/* Compact 2-Column Time & Schedule Strip */}
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-[#E6E1D8]/80 bg-[#F7F4EE]/70 p-3 text-xs">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1F4E43]/10 text-[#1F4E43]">
            <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-stone-500">Khởi hành (GMT+7)</dt>
            <dd className="mt-0.5 font-mono font-bold text-stone-900">
              {formatVietnamDateTime(schedule.startsAt)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:border-l sm:border-[#E6E1D8] sm:pl-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-200/70 text-stone-600">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-stone-500">Kết thúc (GMT+7)</dt>
            <dd className="mt-0.5 font-mono font-bold text-stone-900">
              {formatVietnamDateTime(schedule.endsAt)}
            </dd>
          </div>
        </div>
      </dl>

      {/* 2-Stage Operational Progress Cards (Check-in & Check-out always visible) */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Stage 1: Check-in & Giao đồ */}
        <div
          className={cn(
            'rounded-xl border p-3 space-y-2 transition-colors',
            checkInDone
              ? 'border-emerald-200/80 bg-emerald-50/30'
              : checkInWindow.allowed
              ? 'border-[#1F4E43]/30 bg-[#1F4E43]/[0.03]'
              : 'border-stone-200 bg-stone-50/60'
          )}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-800">
              <ClipboardCheck className="h-3.5 w-3.5 text-[#1F4E43] shrink-0" />
              <span>1. Check-in & Giao đồ</span>
            </span>
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                STAGE_PILL_STYLE[schedule.checkInRoundStatus]
              )}
            >
              {checkInLabel}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Điểm danh khách</span>
              <span className="font-mono font-bold text-stone-800">
                {schedule.checkInProcessedCount}/{schedule.passengerCount}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  checkInDone ? 'bg-emerald-600' : 'bg-[#1F4E43]'
                )}
                style={{ width: `${checkInPct}%` }}
              />
            </div>
          </div>

          <p
            className={cn(
              'text-[10px] leading-snug truncate',
              checkInDone
                ? 'text-emerald-700 font-medium'
                : checkInWindow.allowed
                ? 'text-[#1F4E43] font-semibold'
                : 'text-stone-500'
            )}
            title={checkInWindowHint}
          >
            {checkInWindowHint}
          </p>
        </div>

        {/* Stage 2: Check-out & Thu đồ */}
        <div
          className={cn(
            'rounded-xl border p-3 space-y-2 transition-colors',
            checkOutDone
              ? 'border-emerald-200/80 bg-emerald-50/30'
              : checkOutWindow.allowed && checkInDone
              ? 'border-[#1F4E43]/30 bg-[#1F4E43]/[0.03]'
              : 'border-stone-200 bg-stone-50/60'
          )}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-800">
              <PackageCheck className="h-3.5 w-3.5 text-[#1F4E43] shrink-0" />
              <span>2. Check-out & Thu đồ</span>
            </span>
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                STAGE_PILL_STYLE[schedule.checkOutRoundStatus]
              )}
            >
              {checkOutLabel}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Hoàn tất & thu đồ</span>
              <span className="font-mono font-bold text-stone-800">
                {schedule.checkOutProcessedCount}/{schedule.passengerCount}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  checkOutDone ? 'bg-emerald-600' : 'bg-[#1F4E43]'
                )}
                style={{ width: `${checkOutPct}%` }}
              />
            </div>
          </div>

          <p
            className={cn(
              'text-[10px] leading-snug truncate',
              checkOutDone
                ? 'text-emerald-700 font-medium'
                : checkOutWindow.allowed && checkInDone
                ? 'text-[#1F4E43] font-semibold'
                : 'text-stone-500'
            )}
            title={checkOutWindowHint}
          >
            {checkOutWindowHint}
          </p>
        </div>
      </div>

      {/* Footer: Passenger Capacity Summary + Primary Workspace CTA */}
      <div className="mt-4 pt-3.5 border-t border-[#E6E1D8] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1.5 font-semibold text-stone-800">
            <Users aria-hidden="true" className="h-3.5 w-3.5 text-[#1F4E43]" />
            <span>
              {schedule.passengerCount}/{schedule.capacity} khách
            </span>
          </span>
          <span className="text-stone-300">•</span>
          <span className="font-mono text-[11px] text-stone-500">
            {checkOutDone
              ? 'Đã hoàn tất 100%'
              : `${checkInDone ? 'Check-out' : 'Check-in'}: ${overallPct}%`}
          </span>
        </div>

        <a
          href={href}
          onClick={navigateToTrip}
          aria-label={`Mở chuyến ${schedule.tourTitle}, lịch ${schedule.scheduleId}`}
          className={cn(
            'h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0',
            checkOutDone
              ? 'border border-[#1F4E43]/30 bg-[#1F4E43]/5 text-[#1F4E43] hover:bg-[#1F4E43] hover:text-white'
              : 'bg-[#1F4E43] text-white hover:bg-[#15372F]'
          )}
        >
          {checkOutDone ? (
            <>
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Xem báo cáo chuyến</span>
            </>
          ) : (
            <>
              <span>Vào tác nghiệp đoàn</span>
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </>
          )}
        </a>
      </div>
    </article>
  );
}
