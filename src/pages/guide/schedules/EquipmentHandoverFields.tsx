import React, { useId } from 'react';
import { Camera, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import type { HandoverEquipmentCondition } from '../../../features/tours/types/attendance.types';

interface EquipmentHandoverFieldsProps {
  name: string;
  quantity: number;
  maxQuantity: number;
  quantityLabel: string;
  condition: HandoverEquipmentCondition;
  note: string;
  photos: Array<{ id: string; url: string; fileName: string }>;
  locked: boolean;
  uploading: boolean;
  showDetails?: boolean;
  noteRequired?: boolean;
  onQuantityChange: (value: number) => void;
  onConditionChange: (value: HandoverEquipmentCondition) => void;
  onNoteChange: (value: string) => void;
  onUpload: (files: FileList | null) => void;
  onPreview: (url: string) => void;
  onRemove: (id: string) => void;
}

/** The same operational fields are available in table rows and mobile cards. */
export function EquipmentHandoverFields({ name, quantity, maxQuantity, quantityLabel,
  condition, note, photos, locked, uploading, showDetails = true, noteRequired = false, onQuantityChange,
  onConditionChange, onNoteChange, onUpload, onPreview, onRemove }: EquipmentHandoverFieldsProps) {
  const id = useId();
  const needsNote = showDetails && noteRequired;
  const controlClass = 'min-h-11 w-full rounded-lg border border-[#D6CEBE] bg-white px-3 py-2 text-base sm:text-sm text-[#1C2526] disabled:opacity-60';
  return (
    <fieldset className="min-w-0 space-y-4 rounded-xl border border-[#E6E1D8] bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-[#1C2526]">{name}</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={`${id}-quantity`} className="text-sm text-[#6B7068]">{quantityLabel}</label>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={`Giảm số lượng ${name}`} disabled={locked || quantity <= 0}
            onClick={() => onQuantityChange(quantity - 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D6CEBE] bg-[#FDFBF7] disabled:opacity-40"><Minus aria-hidden="true" className="h-4 w-4" /></button>
          <input id={`${id}-quantity`} type="number" inputMode="numeric" min={0} max={maxQuantity} step={1} disabled={locked} value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (event.target.value !== '' && Number.isFinite(value)) onQuantityChange(Math.max(0, Math.min(maxQuantity, Math.trunc(value))));
            }}
            className="h-11 w-14 rounded-lg border border-[#D6CEBE] bg-white text-center text-base tabular-nums" />
          <button type="button" aria-label={`Tăng số lượng ${name}`} disabled={locked || quantity >= maxQuantity}
            onClick={() => onQuantityChange(quantity + 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D6CEBE] bg-[#FDFBF7] disabled:opacity-40"><Plus aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      {showDetails && <>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-condition`} className="block text-sm font-medium">Tình trạng thiết bị</label>
          <select id={`${id}-condition`} disabled={locked} value={condition} onChange={(event) => onConditionChange(event.target.value as HandoverEquipmentCondition)} className={controlClass}>
            <option value="GOOD">Tốt / Nguyên vẹn</option><option value="NEEDS_INSPECTION">Cần kiểm tra</option><option value="DAMAGED">Hư hỏng</option><option value="MISSING">Thiếu / Chưa trả</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-note`} className="block text-sm font-medium">Ghi chú tình trạng {needsNote ? '(bắt buộc)' : '(tùy chọn)'}</label>
          <textarea id={`${id}-note`} rows={2} disabled={locked} value={note} required={needsNote} aria-invalid={needsNote && !note.trim()} aria-describedby={needsNote && !note.trim() ? `${id}-error` : undefined}
            onChange={(event) => onNoteChange(event.target.value)} className={controlClass} />
          {needsNote && !note.trim() && <p id={`${id}-error`} className="text-sm text-rose-700">Ghi rõ tình trạng để hoàn tất xác nhận.</p>}
        </div>
        {!locked && <label className="relative inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#D6CEBE] bg-[#FDFBF7] px-3 py-2 text-sm font-medium text-[#1F4E43] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#C2410C]">
          {uploading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Camera aria-hidden="true" className="h-4 w-4" />}
          <span>{uploading ? 'Đang xử lý ảnh…' : 'Thêm ảnh thiết bị'}</span>
          <input aria-label={`Thêm ảnh ${name}`} type="file" accept="image/*" capture="environment" multiple disabled={uploading} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => { onUpload(event.target.files); event.target.value = ''; }} />
        </label>}
      </>}
      {photos.length > 0 && <ul aria-label={`Ảnh ${name}`} className="flex flex-wrap gap-3">
        {photos.map((photo) => <li key={photo.id} className="flex items-center gap-1">
          <button type="button" aria-label={`Xem ảnh ${photo.fileName || name}`} onClick={() => onPreview(photo.url)} className="h-14 w-14 overflow-hidden rounded-lg border border-[#D6CEBE]"><img src={photo.url} alt="" className="h-full w-full object-cover" /></button>
          {!locked && <button type="button" aria-label={`Xóa ảnh ${photo.fileName || name}`} onClick={() => onRemove(photo.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}
        </li>)}
      </ul>}
    </fieldset>
  );
}
