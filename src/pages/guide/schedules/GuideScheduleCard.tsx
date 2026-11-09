import React from 'react';
import { ArrowRight, Calendar, Users } from 'lucide-react';
import { evaluateCheckInTimeWindow, evaluateCheckOutTimeWindow, formatVietnamDateTime } from '../../../features/tours/api/attendance.api';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
import type { BatchRoundStatus } from '../../../features/tours/types/attendance.types';

interface GuideScheduleCardProps {
  schedule: {
    scheduleId: number; tourTitle: string; startsAt: string; endsAt: string;
    isLead: boolean; passengerCount: number; capacity: number;
    checkInRoundStatus: BatchRoundStatus; checkOutRoundStatus: BatchRoundStatus;
    checkInProcessedCount: number; checkOutProcessedCount: number;
    checkInSubmittedAt: string | null; checkOutSubmittedAt: string | null;
  };
  stageBadge: React.ReactNode;
  checkInLabel: string;
  checkOutLabel: string;
  nowMs: number;
}

export function GuideScheduleCard({ schedule, stageBadge, checkInLabel, checkOutLabel, nowMs }: GuideScheduleCardProps) {
  const checkInDone = schedule.checkInRoundStatus === 'CONFIRMED';
  const processed = checkInDone ? schedule.checkOutProcessedCount : schedule.checkInProcessedCount;
  const progress = schedule.passengerCount > 0 ? Math.min(100, Math.round(processed / schedule.passengerCount * 100)) : 0;
  const checkInWindow = evaluateCheckInTimeWindow(schedule.startsAt, nowMs);
  const checkOutWindow = evaluateCheckOutTimeWindow(schedule.endsAt, nowMs);
  const href = ROUTES.GUIDE.SCHEDULE_DETAIL(schedule.scheduleId);
  const navigateToTrip = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigateTo(href);
    }
  };
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-[#E6E1D8] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-[#6B7068]">Chuyến #{schedule.scheduleId} · {schedule.isLead ? 'Trưởng đoàn' : 'Phụ trách'}</p>
        {stageBadge}
      </div>
      <h2 className="mt-3 break-words text-xl font-semibold leading-snug tracking-tight text-[#1C2526]">
        <a href={href} onClick={navigateToTrip} className="rounded hover:text-[#1F4E43] hover:underline">{schedule.tourTitle}</a>
      </h2>
      <dl className="my-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5"><Calendar aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4E43]" /><div><dt className="text-xs text-[#6B7068]">Khởi hành · Giờ Việt Nam</dt><dd className="mt-0.5 font-medium">{formatVietnamDateTime(schedule.startsAt)}</dd></div></div>
        <div className="flex items-start gap-2.5"><Calendar aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7068]" /><div><dt className="text-xs text-[#6B7068]">Kết thúc</dt><dd className="mt-0.5 font-medium">{formatVietnamDateTime(schedule.endsAt)}</dd></div></div>
      </dl>
      <div className="mt-auto border-t border-[#E6E1D8] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-[#6B7068]"><Users aria-hidden="true" className="h-4 w-4" />{schedule.passengerCount}/{schedule.capacity} khách</span>
          <span className="font-medium text-[#1F4E43]">{checkInDone ? 'Check-out' : 'Check-in'}: {processed}/{schedule.passengerCount}</span>
        </div>
        <progress aria-label={`Tiến độ ${checkInDone ? 'check-out' : 'check-in'} chuyến ${schedule.scheduleId}`} value={progress} max={100} className="mt-3 h-2 w-full overflow-hidden rounded-full accent-[#1F4E43]" />
        <details className="mt-3 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 font-medium text-[#1F4E43]">Chi tiết xử lý đoàn</summary>
          <dl className="space-y-3 rounded-lg bg-[#F7F4EE] p-3">
            <div><dt className="font-medium">Check-in · {checkInLabel}</dt><dd className="mt-1 text-[#6B7068]">{schedule.checkInSubmittedAt && checkInDone ? `Đã gửi ${formatVietnamDateTime(schedule.checkInSubmittedAt)}` : checkInWindow.allowed ? 'Đã mở thao tác' : `Mở ${formatVietnamDateTime(checkInWindow.unlockAtIso)}`}</dd></div>
            <div><dt className="font-medium">Check-out · {checkOutLabel}</dt><dd className="mt-1 text-[#6B7068]">{schedule.checkOutSubmittedAt && schedule.checkOutRoundStatus === 'CONFIRMED' ? `Đã gửi ${formatVietnamDateTime(schedule.checkOutSubmittedAt)}` : checkOutWindow.allowed ? 'Đã đến khung giờ check-out' : `Mở ${formatVietnamDateTime(schedule.endsAt)}`}</dd></div>
          </dl>
        </details>
        <a href={href} onClick={navigateToTrip} aria-label={`Mở chuyến ${schedule.tourTitle}, lịch ${schedule.scheduleId}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F4E43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15372F]">Mở chuyến<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
      </div>
    </article>
  );
}
