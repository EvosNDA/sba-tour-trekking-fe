import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = { id?: string; value: string; onChange: (value: string) => void; disabled?: boolean; label?: string };
export const displayLocalDateTime = (value: string) => value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)} ${value.slice(11, 16)}` : '';
const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function LargeDateTimePicker({ id, value, onChange, disabled, label = 'khởi hành' }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const d = value ? new Date(value) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  const firstDay = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedDay = value.slice(0, 10);
  const selectedTime = value.slice(11, 16) || '08:00';
  const chooseDay = (day: number) => onChange(`${dateKey(new Date(month.getFullYear(), month.getMonth(), day))}T${selectedTime}`);
  return <div className="relative" ref={root}>
    <button id={id} type="button" disabled={disabled} aria-expanded={open} aria-haspopup="dialog" onClick={() => { if (!open && value) { const d = new Date(value); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); } setOpen(v => !v); }} className="mt-1.5 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-left text-base font-normal text-stone-800 focus:border-[#1F4E43] disabled:opacity-50"><span>{value ? displayLocalDateTime(value) : `Chọn ngày và giờ ${label}`}</span><CalendarDays className="h-5 w-5 shrink-0 text-[#1F4E43]" /></button>
    {open && <div role="dialog" aria-label={`Chọn ngày giờ ${label}`} className="absolute left-0 top-full z-[60] mt-2 w-[min(24rem,calc(100vw-3rem))] rounded-2xl border border-stone-200 bg-white p-4 font-normal shadow-xl sm:p-5">
      <div className="flex items-center justify-between"><button type="button" aria-label="Tháng trước" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-stone-100"><ChevronLeft className="h-5 w-5" /></button><strong className="text-base capitalize">{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Tháng sau" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-stone-100"><ChevronRight className="h-5 w-5" /></button></div>
      <div className="mt-3 grid grid-cols-7 text-center text-sm text-stone-500">{['T2','T3','T4','T5','T6','T7','CN'].map(d => <span key={d} className="py-2">{d}</span>)}{Array.from({ length: firstDay }, (_, i) => <span key={`empty-${i}`} />)}{Array.from({ length: count }, (_, i) => { const day = i + 1; const selected = dateKey(new Date(month.getFullYear(), month.getMonth(), day)) === selectedDay; return <button type="button" key={day} aria-label={`Ngày ${day} tháng ${month.getMonth() + 1} năm ${month.getFullYear()}`} aria-pressed={selected} onClick={() => chooseDay(day)} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-base ${selected ? 'bg-[#1F4E43] font-bold text-white' : 'text-stone-800 hover:bg-emerald-50'}`}>{day}</button>; })}</div>
      <div className="mt-4 border-t pt-4"><p className="text-sm font-semibold text-stone-700">Giờ {label}</p><div className="mt-2 flex items-center gap-2"><label className="sr-only" htmlFor={`${id || 'date-time'}-hour`}>Giờ</label><select id={`${id || 'date-time'}-hour`} value={selectedTime.slice(0, 2)} disabled={!selectedDay} onChange={e => onChange(`${selectedDay}T${e.target.value}:${selectedTime.slice(3, 5)}`)} className="min-h-11 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base">{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={pad(hour)}>{pad(hour)} giờ</option>)}</select><span className="text-lg font-semibold">:</span><label className="sr-only" htmlFor={`${id || 'date-time'}-minute`}>Phút</label><select id={`${id || 'date-time'}-minute`} value={selectedTime.slice(3, 5)} disabled={!selectedDay} onChange={e => onChange(`${selectedDay}T${selectedTime.slice(0, 2)}:${e.target.value}`)} className="min-h-11 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base">{Array.from({ length: 60 }, (_, minute) => <option key={minute} value={pad(minute)}>{pad(minute)} phút</option>)}</select></div>{!selectedDay && <p className="mt-2 text-sm text-stone-500">Chọn ngày trước khi chọn giờ.</p>}</div>
      <button type="button" onClick={() => setOpen(false)} className="mt-4 w-full rounded-xl bg-[#1F4E43] px-4 py-3 text-base font-semibold text-white">Xong</button>
    </div>}
  </div>;
}
