import React from 'react';
import { BookingPassengerRequest } from '../types/booking.types';
import { User, Phone, Mail, Plus, Trash2, UserCheck, AlertCircle } from 'lucide-react';

export interface PassengerFormProps {
  passengers: BookingPassengerRequest[];
  maxSeats?: number;
  onChange: (passengers: BookingPassengerRequest[]) => void;
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}

export function validatePassengers(
  passengers: BookingPassengerRequest[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!passengers || passengers.length < 1 || passengers.length > 100) {
    errors.passengers = 'Số lượng hành khách phải từ 1 đến 100 người.';
    return errors;
  }

  let bookingCustomerCount = 0;
  passengers.forEach((p, idx) => {
    if (p.bookingCustomer) bookingCustomerCount += 1;
    if (!p.fullName || !p.fullName.trim()) {
      errors[`passengers[${idx}].fullName`] = 'Vui lòng nhập họ và tên hành khách.';
    }
    if (!p.phone || !p.phone.trim()) {
      errors[`passengers[${idx}].phone`] = 'Vui lòng nhập số điện thoại liên hệ.';
    }
    if (!p.email || !p.email.trim()) {
      errors[`passengers[${idx}].email`] = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) {
      errors[`passengers[${idx}].email`] = 'Địa chỉ email không đúng định dạng.';
    }
  });

  if (bookingCustomerCount > 1) {
    errors.bookingCustomer = 'Tối đa 1 hành khách được đánh dấu là người đặt chỗ đại diện.';
  }

  return errors;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  maxSeats = 100,
  onChange,
  fieldErrors = {},
  disabled = false,
}) => {
  const effectiveMax = Math.min(Math.max(maxSeats, 1), 100);

  const handleFieldChange = (
    index: number,
    field: keyof BookingPassengerRequest,
    value: string | boolean
  ) => {
    const updated = passengers.map((p, idx) => {
      if (field === 'bookingCustomer' && value === true) {
        // At most 1 passenger can be marked as bookingCustomer
        return {
          ...p,
          bookingCustomer: idx === index,
        };
      }
      if (idx === index) {
        return {
          ...p,
          [field]: value,
        };
      }
      return p;
    });
    onChange(updated);
  };

  const handleAddPassenger = () => {
    if (passengers.length >= effectiveMax) return;
    onChange([
      ...passengers,
      {
        fullName: '',
        phone: '',
        email: '',
        bookingCustomer: false,
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    const removed = passengers[index];
    const remaining = passengers.filter((_, idx) => idx !== index);
    // If the removed passenger was bookingCustomer, mark the first passenger if none are marked
    if (removed?.bookingCustomer && remaining.length > 0 && !remaining.some((p) => p.bookingCustomer)) {
      remaining[0] = { ...remaining[0], bookingCustomer: true };
    }
    onChange(remaining);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E1D8]">
        <div>
          <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
            Danh sách thành viên đoàn ({passengers.length} người)
          </h3>
          <p className="text-xs text-[#64748B]">
            Nhập thông tin từng người tham gia để đăng ký bảo hiểm và giấy phép kiểm lâm. Tối đa 1 người được đánh dấu là Người đặt chỗ đại diện.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled || passengers.length >= effectiveMax}
          onClick={handleAddPassenger}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1F4E43] hover:bg-[#15372F] text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hành khách ({passengers.length}/{effectiveMax})</span>
        </button>
      </div>

      <div className="space-y-4">
        {passengers.map((passenger, idx) => {
          const nameErr =
            fieldErrors[`passengers[${idx}].fullName`] || fieldErrors[`passenger_${idx}_fullName`];
          const phoneErr =
            fieldErrors[`passengers[${idx}].phone`] || fieldErrors[`passenger_${idx}_phone`];
          const emailErr =
            fieldErrors[`passengers[${idx}].email`] || fieldErrors[`passenger_${idx}_email`];

          return (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                passenger.bookingCustomer
                  ? 'bg-[#FAF8F5] border-[#C2410C]/50 shadow-2xs'
                  : 'bg-white border-[#E6E1D8]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1C2526] text-white font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#1C2526] uppercase tracking-wider">
                    Hành khách #{idx + 1}
                  </span>
                  {passenger.bookingCustomer && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#B9EADB]/50 text-[#1F4E43] px-2.5 py-0.5 rounded-full border border-[#88D4BC]">
                      <UserCheck className="w-3 h-3" /> Người đặt đại diện
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-xs text-[#2D3748] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={Boolean(passenger.bookingCustomer)}
                      onChange={(e) => handleFieldChange(idx, 'bookingCustomer', e.target.checked)}
                      className="w-4 h-4 rounded accent-[#C2410C] cursor-pointer"
                    />
                    <span className="font-medium">Là người đặt chỗ chính</span>
                  </label>

                  {passengers.length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemovePassenger(idx)}
                      className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 font-medium cursor-pointer"
                      aria-label={`Xóa hành khách ${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor={`passenger-name-${idx}`}
                    className="block text-xs font-semibold text-[#1C2526] mb-1"
                  >
                    Họ và tên đầy đủ <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={`passenger-name-${idx}`}
                      type="text"
                      required
                      maxLength={200}
                      disabled={disabled}
                      value={passenger.fullName}
                      onChange={(e) => handleFieldChange(idx, 'fullName', e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                        nameErr ? 'border-red-500' : 'border-[#D6CEBE] focus:border-[#C2410C]'
                      }`}
                    />
                  </div>
                  {nameErr && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {nameErr}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`passenger-phone-${idx}`}
                    className="block text-xs font-semibold text-[#1C2526] mb-1"
                  >
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={`passenger-phone-${idx}`}
                      type="tel"
                      maxLength={30}
                      disabled={disabled}
                      value={passenger.phone || ''}
                      onChange={(e) => handleFieldChange(idx, 'phone', e.target.value)}
                      placeholder="VD: 0901 234 567"
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                        phoneErr ? 'border-red-500' : 'border-[#D6CEBE] focus:border-[#C2410C]'
                      }`}
                    />
                  </div>
                  {phoneErr && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {phoneErr}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`passenger-email-${idx}`}
                    className="block text-xs font-semibold text-[#1C2526] mb-1"
                  >
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={`passenger-email-${idx}`}
                      type="email"
                      maxLength={254}
                      disabled={disabled}
                      value={passenger.email || ''}
                      onChange={(e) => handleFieldChange(idx, 'email', e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-xl text-[#1C2526] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 ${
                        emailErr ? 'border-red-500' : 'border-[#D6CEBE] focus:border-[#C2410C]'
                      }`}
                    />
                  </div>
                  {emailErr && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {emailErr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
