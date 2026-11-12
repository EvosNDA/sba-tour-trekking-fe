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
  const controlClass = 'h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-800 outline-none focus:border-[#1F4E43] disabled:opacity-60';
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl border border-[#E6E1D8] bg-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <legend className="text-xs sm:text-sm font-bold text-stone-900">{name}</legend>
          <label htmlFor={`${id}-quantity`} className="block text-[11px] font-medium text-stone-500 mt-0.5">
            {quantityLabel}
          </label>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-[#FAF8F4] p-0.5">
          <button
            type="button"
            aria-label={`Giảm số lượng ${name}`}
            disabled={locked || quantity <= 0}
            onClick={() => onQuantityChange(quantity - 1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <input
            id={`${id}-quantity`}
            type="number"
            inputMode="numeric"
            min={0}
            max={maxQuantity}
            step={1}
            disabled={locked}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (event.target.value !== '' && Number.isFinite(value))
                onQuantityChange(Math.max(0, Math.min(maxQuantity, Math.trunc(value))));
            }}
            className="h-8 w-11 rounded-md border border-transparent bg-transparent text-center font-mono text-xs font-bold text-stone-900 tabular-nums focus:border-[#1F4E43] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            aria-label={`Tăng số lượng ${name}`}
            disabled={locked || quantity >= maxQuantity}
            onClick={() => onQuantityChange(quantity + 1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-2.5 border-t border-stone-100 pt-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor={`${id}-condition`} className="block text-[11px] font-semibold text-stone-600">
                Tình trạng thiết bị
              </label>
              <select
                id={`${id}-condition`}
                disabled={locked}
                value={condition}
                onChange={(event) => onConditionChange(event.target.value as HandoverEquipmentCondition)}
                className={controlClass}
              >
                <option value="GOOD">Tốt / Nguyên vẹn</option>
                <option value="NEEDS_INSPECTION">Cần kiểm tra</option>
                <option value="DAMAGED">Hư hỏng</option>
                <option value="MISSING">Thiếu / Chưa trả</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor={`${id}-note`} className="block text-[11px] font-semibold text-stone-600">
                Ghi chú tình trạng {needsNote ? <span className="text-rose-600">(bắt buộc)</span> : '(tùy chọn)'}
              </label>
              <input
                id={`${id}-note`}
                type="text"
                disabled={locked}
                value={note}
                required={needsNote}
                placeholder="Nhập ghi chú tình trạng..."
                aria-invalid={needsNote && !note.trim()}
                aria-describedby={needsNote && !note.trim() ? `${id}-error` : undefined}
                onChange={(event) => onNoteChange(event.target.value)}
                className={controlClass}
              />
            </div>
          </div>

          {needsNote && !note.trim() && (
            <p id={`${id}-error`} className="text-[11px] font-medium text-rose-700">
              Ghi rõ tình trạng để hoàn tất xác nhận.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {!locked && (
              <label className="relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 bg-[#FDFBF7] px-2.5 text-xs font-semibold text-[#1F4E43] transition-colors hover:border-[#1F4E43] hover:bg-emerald-50/40 focus-within:ring-2 focus-within:ring-[#1F4E43]/30">
                {uploading ? (
                  <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                <span>{uploading ? 'Đang xử lý ảnh…' : 'Thêm ảnh thiết bị'}</span>
                <input
                  aria-label={`Thêm ảnh ${name}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  disabled={uploading}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(event) => {
                    onUpload(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            )}

            {photos.length > 0 && (
              <ul aria-label={`Ảnh ${name}`} className="flex flex-wrap items-center gap-2">
                {photos.map((photo) => (
                  <li key={photo.id} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Xem ảnh ${photo.fileName || name}`}
                      onClick={() => onPreview(photo.url)}
                      className="h-9 w-9 overflow-hidden rounded-lg border border-[#D6CEBE] cursor-pointer"
                    >
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    {!locked && (
                      <button
                        type="button"
                        aria-label={`Xóa ảnh ${photo.fileName || name}`}
                        onClick={() => onRemove(photo.id)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </fieldset>
  );
}
