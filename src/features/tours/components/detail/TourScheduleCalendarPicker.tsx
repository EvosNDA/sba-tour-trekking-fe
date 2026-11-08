import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ScheduleSummaryResponse } from '../../types/tour.types';
import { formatDate } from '../../../../lib/utils';

interface TourScheduleCalendarPickerProps {
  schedules: ScheduleSummaryResponse[];
  selectedScheduleId: number | null;
  onSelectSchedule: (scheduleId: number) => void;
  isLoading?: boolean;
}

// Convert any date input to "YYYY-MM-DD" in Vietnam Timezone (Asia/Ho_Chi_Minh)
function getDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d); // "YYYY-MM-DD"
}

export const TourScheduleCalendarPicker: React.FC<TourScheduleCalendarPickerProps> = ({
  schedules,
  selectedScheduleId,
  onSelectSchedule,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group schedules by Vietnam date string "YYYY-MM-DD"
  const schedulesByDateKey = useMemo(() => {
    const map: Record<string, ScheduleSummaryResponse[]> = {};
    for (const s of schedules) {
      const key = getDateKey(s.startsAt);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    }
    return map;
  }, [schedules]);

  // Find the selected schedule object
  const selectedSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId) || null;
  }, [schedules, selectedScheduleId]);

  // Find earliest departure schedule in DB (sorted chronologically)
  const earliestSchedule = useMemo(() => {
    if (!schedules || schedules.length === 0) return null;
    const sorted = [...schedules].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    return sorted[0];
  }, [schedules]);

  // Current viewed month & year in calendar
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedSchedule) return new Date(selectedSchedule.startsAt);
    if (earliestSchedule) return new Date(earliestSchedule.startsAt);
    return new Date();
  });

  // Keep viewDate aligned when selectedSchedule changes externally
  useEffect(() => {
    if (selectedSchedule) {
      setViewDate(new Date(selectedSchedule.startsAt));
    } else if (earliestSchedule) {
      setViewDate(new Date(earliestSchedule.startsAt));
    }
  }, [selectedSchedule, earliestSchedule]);

  // Close calendar popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Calendar calculations (Week starts on Monday: H B T N S B C)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleSelectDate = (dateKey: string) => {
    const daySchedules = schedulesByDateKey[dateKey];
    if (daySchedules && daySchedules.length > 0) {
      onSelectSchedule(daySchedules[0].id);
      setIsOpen(false);
    }
  };

  // Earliest date text for red note
  const earliestDateText = earliestSchedule
    ? formatDate(earliestSchedule.startsAt)
    : null;

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="text-xs sm:text-sm font-bold text-[#1C2526] flex items-center gap-1">
        <span>Ngày khởi hành</span>
        <span className="text-red-500">*</span>
      </label>

      {/* Input / Picker Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className={`w-full py-3.5 px-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer bg-white ${
          isOpen
            ? 'border-[#C5A880] ring-2 ring-[#C5A880]/30 shadow-sm'
            : 'border-[#C5A880] hover:border-[#B39369] shadow-2xs'
        }`}
        aria-expanded={isOpen}
      >
        <span
          className={`text-sm ${
            selectedSchedule ? 'font-semibold text-[#1C2526]' : 'text-[#64748B]'
          }`}
        >
          {selectedSchedule
            ? `${formatDate(selectedSchedule.startsAt)}`
            : 'Chọn ngày khởi hành'}
        </span>

        <CalendarIcon className="w-5 h-5 text-[#C5A880] shrink-0" />
      </button>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[350px] z-50 mt-2 bg-white rounded-3xl p-5 shadow-2xl border border-[#E6E1D8] space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Note Banner */}
          <div className="text-xs italic text-red-500 font-medium leading-relaxed">
            {earliestDateText ? (
              <>Tour cần đặt trước tối thiểu 48 giờ. Ngày khởi hành sớm nhất là {earliestDateText}.</>
            ) : (
              <>Hiện chưa có lịch khởi hành sắp tới cho tour này trong hệ thống.</>
            )}
          </div>

          {/* Month Header & Controls */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="font-bold text-base text-[#1C2526]">
              Tháng {viewMonth + 1} {viewYear}
            </h4>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                aria-label="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                aria-label="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (H B T N S B C) */}
          <div className="grid grid-cols-7 text-center text-xs font-bold py-1">
            <span className="text-[#64748B]">H</span>
            <span className="text-[#64748B]">B</span>
            <span className="text-[#64748B]">T</span>
            <span className="text-[#64748B]">N</span>
            <span className="text-[#64748B]">S</span>
            <span className="text-red-500">B</span>
            <span className="text-red-500">C</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center text-sm">
            {/* Empty slots before the 1st day of the month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-9 h-9 mx-auto" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;

              const daySchedules = schedulesByDateKey[dateKey];
              const hasSchedule = daySchedules && daySchedules.length > 0;
              const isSelected =
                selectedSchedule && getDateKey(selectedSchedule.startsAt) === dateKey;

              if (hasSchedule) {
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleSelectDate(dateKey)}
                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-semibold transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-[#C5A880] text-[#1C2526] font-bold bg-amber-50/50 shadow-xs scale-105'
                        : 'text-[#1C2526] hover:bg-amber-50/40 hover:border hover:border-[#C5A880]/60'
                    }`}
                  >
                    <span>{day}</span>
                    {/* Small dot indicating departure */}
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C2410C]" />
                  </button>
                );
              }

              // Days WITHOUT any schedule in DB: Faded/disabled as requested ("mờ trắng không chọn được")
              return (
                <div
                  key={dateKey}
                  className="w-9 h-9 mx-auto flex items-center justify-center text-sm text-[#E2E8F0] font-normal cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
