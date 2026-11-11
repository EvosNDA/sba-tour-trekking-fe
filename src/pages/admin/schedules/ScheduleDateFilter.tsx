import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMondayOfWeek, getSundayOfWeek, toDateInputString } from '../../../lib/utils';

export type DateRangeMode = 'day' | 'week' | 'month';

interface ScheduleDateFilterProps {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
}

interface CalendarDay {
  dateStr: string;
  dayNumber: number;
  inMonth: boolean;
}

interface CalendarWeek {
  monday: string;
  sunday: string;
  days: CalendarDay[];
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
const MONTH_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

function parseDateStr(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInputString(d);
}

function diffDays(startStr: string, endStr: string): number {
  const s = parseDateStr(startStr).getTime();
  const e = parseDateStr(endStr).getTime();
  return Math.round((e - s) / 86400000);
}

function formatFullVi(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return y && m && d ? `${d}/${m}/${y}` : dateStr;
}

function formatShortVi(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return m && d ? `${d}/${m}` : dateStr;
}

function getMonthRange(year: number, monthIndex: number): [string, string] {
  return [
    toDateInputString(new Date(year, monthIndex, 1)),
    toDateInputString(new Date(year, monthIndex + 1, 0)),
  ];
}

function getWeekRange(date: Date): [string, string] {
  return [
    toDateInputString(getMondayOfWeek(date)),
    toDateInputString(getSundayOfWeek(date)),
  ];
}

function isFullWeekRange(startDate: string, endDate: string): boolean {
  const start = parseDateStr(startDate);
  const end = parseDateStr(endDate);
  return diffDays(startDate, endDate) === 6 && start.getDay() === 1 && end.getDay() === 0;
}

function isFullMonthRange(startDate: string, endDate: string): boolean {
  const start = parseDateStr(startDate);
  const end = parseDateStr(endDate);
  const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  return (
    start.getDate() === 1 &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    end.getDate() === lastDayOfMonth
  );
}

function detectMode(startDate: string, endDate: string): DateRangeMode {
  if (startDate === endDate) return 'day';
  if (isFullWeekRange(startDate, endDate)) return 'week';
  return 'month';
}

export function formatDateRangeLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Chọn thời gian';
  const start = parseDateStr(startDate);
  const end = parseDateStr(endDate);

  if (startDate === endDate) {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(start);
  }

  if (isFullWeekRange(startDate, endDate)) {
    if (start.getFullYear() === end.getFullYear()) {
      return `Tuần ${formatShortVi(startDate)} – ${formatFullVi(endDate)}`;
    }
    return `Tuần ${formatFullVi(startDate)} – ${formatFullVi(endDate)}`;
  }

  if (isFullMonthRange(startDate, endDate)) {
    return `Tháng ${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${formatShortVi(startDate)} – ${formatFullVi(endDate)}`;
  }
  return `${formatFullVi(startDate)} – ${formatFullVi(endDate)}`;
}

function buildCalendarWeeks(year: number, monthIndex: number): CalendarWeek[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const gridStart = getMondayOfWeek(firstOfMonth);
  const gridEnd = getSundayOfWeek(lastOfMonth);

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(gridStart);

  while (cursor.getTime() <= gridEnd.getTime()) {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      days.push({
        dateStr: toDateInputString(cursor),
        dayNumber: cursor.getDate(),
        inMonth: cursor.getMonth() === monthIndex,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({
      monday: days[0].dateStr,
      sunday: days[6].dateStr,
      days,
    });
  }

  return weeks;
}

export const ScheduleDateFilter: React.FC<ScheduleDateFilterProps> = ({
  startDate,
  endDate,
  onRangeChange,
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DateRangeMode>(() => detectMode(startDate, endDate));
  const [viewDate, setViewDate] = useState<Date>(() => parseDateStr(startDate));
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => toDateInputString(new Date()), []);
  const nowDate = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setMode(detectMode(startDate, endDate));
        setViewDate(parseDateStr(startDate));
      }
      return next;
    });
  };

  const applyRange = (nextStart: string, nextEnd: string) => {
    onRangeChange(nextStart, nextEnd);
    setOpen(false);
  };

  const handleStep = (delta: -1 | 1) => {
    if (startDate === endDate) {
      const next = addDays(startDate, delta);
      onRangeChange(next, next);
      return;
    }
    if (isFullWeekRange(startDate, endDate)) {
      onRangeChange(addDays(startDate, delta * 7), addDays(endDate, delta * 7));
      return;
    }
    if (isFullMonthRange(startDate, endDate)) {
      const start = parseDateStr(startDate);
      const [nextStart, nextEnd] = getMonthRange(start.getFullYear(), start.getMonth() + delta);
      onRangeChange(nextStart, nextEnd);
      return;
    }
    const span = diffDays(startDate, endDate) + 1;
    onRangeChange(addDays(startDate, delta * span), addDays(endDate, delta * span));
  };

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const activeStartObj = useMemo(() => parseDateStr(startDate), [startDate]);
  const isSingleDayActive = startDate === endDate;
  const isWeekActive = isFullWeekRange(startDate, endDate);
  const isMonthActive = isFullMonthRange(startDate, endDate);

  const handleQuickCurrent = () => {
    const today = new Date();
    if (mode === 'day') {
      const str = toDateInputString(today);
      applyRange(str, str);
      return;
    }
    if (mode === 'week') {
      const [mon, sun] = getWeekRange(today);
      applyRange(mon, sun);
      return;
    }
    const [first, last] = getMonthRange(today.getFullYear(), today.getMonth());
    applyRange(first, last);
  };

  const quickButtonLabel =
    mode === 'day' ? 'Hôm nay' : mode === 'week' ? 'Tuần này' : 'Tháng này';

  const footerSelectionText =
    mode === 'day'
      ? isSingleDayActive
        ? `Ngày: ${formatFullVi(startDate)}`
        : 'Chọn ngày trên lịch'
      : mode === 'week'
      ? isWeekActive
        ? `Tuần: ${formatShortVi(startDate)} – ${formatFullVi(endDate)}`
        : 'Chọn tuần trên lịch'
      : isMonthActive
      ? `Tháng ${String(activeStartObj.getMonth() + 1).padStart(2, '0')}/${activeStartObj.getFullYear()}`
      : 'Chọn tháng cần xem';

  return (
    <div ref={containerRef} className="relative inline-flex max-w-full items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleStep(-1)}
        aria-label="Khoảng thời gian trước"
        title="Khoảng thời gian trước"
        className="inline-flex h-11 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:border-[#0B7058] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7058]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Chọn ngày, tuần hoặc tháng"
        aria-expanded={open}
        onClick={handleToggleOpen}
        className="inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 text-left text-sm font-semibold text-slate-800 transition-colors hover:border-[#0B7058] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7058] sm:min-w-[235px]"
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#0B7058]" />
        <span className="truncate">{formatDateRangeLabel(startDate, endDate)}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <button
        type="button"
        onClick={() => handleStep(1)}
        aria-label="Khoảng thời gian sau"
        title="Khoảng thời gian sau"
        className="inline-flex h-11 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:border-[#0B7058] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7058]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          {/* Mode Switcher */}
          <div
            className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="Kiểu lọc thời gian"
          >
            {(
              [
                ['day', 'Ngày'],
                ['week', 'Tuần'],
                ['month', 'Tháng'],
              ] as const
            ).map(([tabMode, label]) => (
              <button
                key={tabMode}
                type="button"
                role="tab"
                aria-selected={mode === tabMode}
                onClick={() => setMode(tabMode)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === tabMode
                    ? 'bg-[#0B7058] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Calendar / Month Header */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  mode === 'month'
                    ? new Date(viewYear - 1, viewMonth, 1)
                    : new Date(viewYear, viewMonth - 1, 1)
                )
              }
              aria-label={mode === 'month' ? 'Năm trước' : 'Tháng trước'}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-bold text-slate-900">
              {mode === 'month'
                ? `Năm ${viewYear}`
                : `Tháng ${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`}
            </span>

            <button
              type="button"
              onClick={() =>
                setViewDate(
                  mode === 'month'
                    ? new Date(viewYear + 1, viewMonth, 1)
                    : new Date(viewYear, viewMonth + 1, 1)
                )
              }
              aria-label={mode === 'month' ? 'Năm sau' : 'Tháng sau'}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day / Week Grid */}
          {mode !== 'month' ? (
            <div className="mt-3 space-y-1">
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="py-1">
                    {label}
                  </span>
                ))}
              </div>

              <div className="space-y-1">
                {calendarWeeks.map((week) => {
                  const isRowSelected =
                    mode === 'week' &&
                    isWeekActive &&
                    week.monday === startDate &&
                    week.sunday === endDate;

                  if (mode === 'week') {
                    return (
                      <button
                        key={week.monday}
                        type="button"
                        onClick={() => applyRange(week.monday, week.sunday)}
                        aria-label={`Chọn tuần ${formatShortVi(week.monday)} đến ${formatFullVi(
                          week.sunday
                        )}`}
                        className={`grid w-full cursor-pointer grid-cols-7 rounded-lg py-0.5 text-center text-sm transition-colors ${
                          isRowSelected
                            ? 'bg-[#D8EFE8] font-semibold text-[#075541]'
                            : 'hover:bg-[#E3F5F1]'
                        }`}
                      >
                        {week.days.map((day, idx) => {
                          const isEndpoint = isRowSelected && (idx === 0 || idx === 6);
                          const isToday = day.dateStr === todayStr;
                          return (
                            <span
                              key={day.dateStr}
                              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg tabular-nums ${
                                isEndpoint
                                  ? 'bg-[#0B7058] font-bold text-white'
                                  : isRowSelected && !day.inMonth
                                  ? 'text-[#075541]/70'
                                  : !day.inMonth
                                  ? 'text-slate-400'
                                  : isToday
                                  ? 'font-bold text-[#0B7058] ring-1 ring-[#0B7058]/50'
                                  : 'text-slate-800'
                              }`}
                            >
                              {day.dayNumber}
                            </span>
                          );
                        })}
                      </button>
                    );
                  }

                  return (
                    <div key={week.monday} className="grid grid-cols-7 text-center text-sm">
                      {week.days.map((day) => {
                        const isSelected = isSingleDayActive && day.dateStr === startDate;
                        const isToday = day.dateStr === todayStr;
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => applyRange(day.dateStr, day.dateStr)}
                            aria-label={`Chọn ngày ${formatFullVi(day.dateStr)}`}
                            className={`mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg tabular-nums transition-colors ${
                              isSelected
                                ? 'bg-[#0B7058] font-bold text-white shadow-2xs'
                                : isToday
                                ? 'font-bold text-[#0B7058] ring-1 ring-[#0B7058]/50 hover:bg-[#E3F5F1]'
                                : day.inMonth
                                ? 'text-slate-800 hover:bg-[#E3F5F1]'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {day.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Month Grid */
            <div className="mt-3 grid grid-cols-3 gap-2">
              {MONTH_NUMBERS.map((monthIndex) => {
                const isSelected =
                  isMonthActive &&
                  activeStartObj.getFullYear() === viewYear &&
                  activeStartObj.getMonth() === monthIndex;
                const isCurrentMonth =
                  nowDate.getFullYear() === viewYear && nowDate.getMonth() === monthIndex;
                return (
                  <button
                    key={monthIndex}
                    type="button"
                    onClick={() => {
                      const [first, last] = getMonthRange(viewYear, monthIndex);
                      applyRange(first, last);
                    }}
                    className={`cursor-pointer rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#0B7058] text-white shadow-2xs'
                        : isCurrentMonth
                        ? 'border border-[#0B7058]/50 text-[#0B7058] hover:bg-[#E3F5F1]'
                        : 'border border-slate-200 text-slate-700 hover:border-[#0B7058]/40 hover:bg-[#F3F6FA]'
                    }`}
                  >
                    Tháng {monthIndex + 1}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer: Formatted selection & Quick jump */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="truncate text-xs font-medium text-slate-600">
              {footerSelectionText}
            </span>
            <button
              type="button"
              onClick={handleQuickCurrent}
              className="shrink-0 cursor-pointer rounded-lg bg-[#E3F5F1] px-2.5 py-1.5 text-xs font-semibold text-[#0B7058] transition-colors hover:bg-[#CBECE4]"
            >
              {quickButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
