import React, { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import type { ActivityResponse } from '../../types/tour.types';

export interface ItineraryDay { dayNumber: number; title: string; meals: string | null; overnight: string | null; activities: ActivityResponse[] }
interface Props { days: ItineraryDay[]; isLoading?: boolean; error?: string | null; onRetry?: () => void }
export function TourItinerary({ days, isLoading, error, onRetry }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (isLoading) return <div className="rounded-3xl border bg-white p-8">Đang tải lịch trình...</div>;
  if (error) return <div role="alert" className="rounded-3xl border bg-white p-8"><p>Không thể tải lịch trình: {error}</p><button type="button" onClick={onRetry} className="mt-3 text-emerald-800 underline">Thử lại</button></div>;
  if (!days.length) return <div className="rounded-3xl border bg-white p-8 text-center text-stone-600">Chưa có lịch trình chi tiết.</div>;
  return <section className="rounded-3xl border border-[#E6E1D8] bg-white p-6 sm:p-8"><h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><CalendarDays className="text-[#C2410C]"/>Lịch trình chi tiết</h2><div className="space-y-4">{days.map((day, index) => {
    const open = expanded === day.dayNumber || (expanded === null && index === 0);
    return <article key={day.dayNumber} className="overflow-hidden rounded-2xl border border-[#E6E1D8]"><button type="button" aria-expanded={open} onClick={() => setExpanded(open ? -1 : day.dayNumber)} className={`flex w-full items-center justify-between gap-4 p-4 text-left ${open ? 'bg-[#1F4E43] text-white' : 'bg-[#F7F4EE] text-[#1C2526]'}`}><span className="font-semibold"><span className="mr-4 inline-block text-sm">NGÀY {day.dayNumber}</span>{day.title}</span>{open ? <ChevronUp/> : <ChevronDown/>}</button>{open && <div className="space-y-4 p-5">{day.activities.map((a, i) => <div key={a.id ?? i} className="border-l-2 border-[#E6E1D8] pl-4 text-sm leading-relaxed"><p><strong>{a.startTime?.slice(0,5)} {a.title}</strong></p>{a.description && <p className="mt-1 whitespace-pre-line text-stone-600">{a.description}</p>}</div>)}{day.meals && <p className="text-sm"><strong>Bữa ăn:</strong> {day.meals}</p>}{day.overnight && <p className="text-sm"><strong>Nghỉ đêm:</strong> {day.overnight}</p>}</div>}</article>;
  })}</div></section>;
}
