import React, { useEffect, useState } from 'react';
import { toursApi } from '../api/tours.api';
import { calculateEndsAt, defaultBalanceDueAt, formatOffsetDateTime } from '../../../lib/utils';
import { LargeDateTimePicker, displayLocalDateTime } from './LargeDateTimePicker';
import type { ApiError } from '../../../types/api.types';

type Props = { tourId: number; title: string; durationDays: number; onClose: () => void; onCreated: (startsAt: string) => void };

export function CreateScheduleModal({ tourId, title, durationDays, onClose, onCreated }: Props) {
  const [startsAt, setStartsAt] = useState('');
  const [balanceDueAt, setBalanceDueAt] = useState('');
  const [dueEdited, setDueEdited] = useState(false);
  const [prefillState, setPrefillState] = useState<'loading' | 'found' | 'empty' | 'error'>('loading');
  const [capacity, setCapacity] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [equipmentFee, setEquipmentFee] = useState('0');
  const [deposit, setDeposit] = useState('30');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([toursApi.latestSchedule(tourId), toursApi.getScheduleDefaults(tourId)]).then(([latest, defaults]) => {
      if (!active) return;
      const source = latest || defaults;
      if (!source) { setPrefillState('empty'); return; }
      setCapacity(String(source.capacity)); setBasePrice(String(source.basePriceVnd));
      setEquipmentFee(String(source.equipmentFeeVnd)); setDeposit(String(source.depositPercent));
      setMeetingPoint(source.meetingPoint || ''); setPhone(source.contactPhone || '');
      setPrefillState('found');
    }).catch(() => { if (active) setPrefillState('error'); });
    return () => { active = false; };
  }, [tourId]);
  const endsAt = calculateEndsAt(startsAt, durationDays);
  const input = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-normal text-stone-800 focus:border-[#1F4E43] focus:outline-none';
  const label = 'block text-base font-semibold text-stone-700';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const start = new Date(startsAt), due = new Date(balanceDueAt);
    if (!startsAt || !endsAt || !balanceDueAt || Number.isNaN(start.getTime()) || Number.isNaN(due.getTime())) { setError('Vui lòng nhập ngày giờ hợp lệ.'); return; }
    if (start.getTime() <= Date.now()) { setError('Ngày khởi hành phải ở tương lai.'); return; }
    if (due > start) { setError('Hạn thanh toán phải trước hoặc bằng thời điểm khởi hành.'); return; }
    const seats = Number(capacity), price = Number(basePrice), fee = Number(equipmentFee), percent = Number(deposit);
    if (!capacity || !Number.isSafeInteger(seats) || seats < 1 || !basePrice || !Number.isSafeInteger(price) || price < 0 || price > 1e12 || equipmentFee === '' || !Number.isSafeInteger(fee) || fee < 0 || fee > 1e12 || !deposit || percent <= 0 || percent > 100 || !/^\d+(\.\d{1,2})?$/.test(deposit)) { setError('Vui lòng kiểm tra số chỗ, giá và tỷ lệ đặt cọc.'); return; }
    setSaving(true);
    try {
      await toursApi.createSchedule(tourId, { startsAt: formatOffsetDateTime(start), endsAt: formatOffsetDateTime(new Date(endsAt)), balanceDueAt: formatOffsetDateTime(due), capacity: seats, basePriceVnd: price, equipmentFeeVnd: fee, depositPercent: percent, meetingPoint: meetingPoint.trim(), contactPhone: phone.trim() });
      onCreated(startsAt);
    } catch (e) { setError((e as ApiError).message || 'Không thể tạo lịch khởi hành. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!saving) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="create-schedule-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-xl" onClick={e => e.stopPropagation()}>
      <h2 id="create-schedule-title" className="text-xl font-bold text-stone-900">Thêm lịch khởi hành</h2>
      <p className="mt-1 text-sm text-stone-600">{title} · {durationDays} ngày</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {prefillState === 'loading' && <p role="status" className="text-sm text-stone-600">Đang tải thông tin lịch gần nhất...</p>}
        {prefillState === 'found' && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Đã điền thông tin từ lịch gần nhất hoặc thông tin mặc định của tour. Bạn có thể thay đổi trước khi tạo.</p>}
        {prefillState === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Không tải được lịch gần nhất. Bạn vẫn có thể nhập thông tin thủ công.</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <fieldset disabled={prefillState === 'loading'} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
          <div className={label}>Ngày giờ khởi hành *<LargeDateTimePicker value={startsAt} onChange={value => { setStartsAt(value); if (!dueEdited) setBalanceDueAt(defaultBalanceDueAt(value)); }} /></div>
          <label className={label}>Ngày giờ kết thúc<input type="text" value={displayLocalDateTime(endsAt)} placeholder="dd/mm/yyyy hh:mm" readOnly className={`${input} bg-stone-50`} /></label>
          <label className={label}>Số chỗ *<input required type="number" min="1" step="1" value={capacity} onChange={e => setCapacity(e.target.value)} className={input} /></label>
          <label className={label}>Giá tour / khách (đ) *<input required type="number" min="0" max="1000000000000" step="1" value={basePrice} onChange={e => setBasePrice(e.target.value)} className={input} /></label>
          <label className={label}>Phụ phí thiết bị (đ)<input required type="number" min="0" max="1000000000000" step="1" value={equipmentFee} onChange={e => setEquipmentFee(e.target.value)} className={input} /></label>
          <label className={label}>Tiền cọc (%) *<input required type="number" min="0.01" max="100" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} className={input} /></label>
          <div className={label}>Hạn thanh toán phần còn lại *<LargeDateTimePicker id="schedule-due" label="thanh toán" value={balanceDueAt} onChange={value => { setDueEdited(true); setBalanceDueAt(value); }} /></div>
          <label className={label}>Điểm tập trung<input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} className={input} /></label>
          <label className={label}>Số điện thoại liên hệ<input type="tel" maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} className={input} /></label>
        </fieldset>
        <p className="text-sm text-stone-500">Lịch mới có số chỗ và lượt đặt riêng. Lịch cũ không thay đổi.</p>
        <div className="flex justify-end gap-3 border-t border-stone-200 pt-4"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-stone-300 px-4 py-2 text-sm">Hủy</button><button type="submit" disabled={saving || prefillState === 'loading'} className="rounded-xl bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang tạo...' : 'Tạo lịch khởi hành'}</button></div>
      </form>
    </section>
  </div>;
}
