import React from 'react';
import { Landmark } from 'lucide-react';

interface Props {
  idPrefix: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  bankBin: string;
  setBankBin: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  accountHolderName: string;
  setAccountHolderName: (value: string) => void;
}

export const RefundDestinationFields: React.FC<Props> = ({
  idPrefix, enabled, setEnabled, bankBin, setBankBin, accountNumber, setAccountNumber,
  accountHolderName, setAccountHolderName,
}) => (
  <section className="space-y-3 rounded-xl border border-[#B7D2C8] bg-[#F5F9F6] p-4">
    <label className="flex items-start gap-2 text-xs font-semibold text-stone-800">
      <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-0.5 accent-[#1F4E43]" />
      Gửi yêu cầu hoàn tiền cùng lúc hủy đặt chỗ
    </label>
    {enabled && <>
      <p className="text-[11px] leading-relaxed text-stone-600">Số tiền sẽ được tính theo chính sách đã lưu khi bạn đặt tour và số tiền đã thanh toán. Nhân viên xác minh tài khoản trước khi duyệt.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-bank-bin`} className="mb-1 block text-[11px] font-semibold text-stone-700">Mã ngân hàng</label>
          <input id={`${idPrefix}-bank-bin`} inputMode="numeric" pattern="[0-9]{6,20}" minLength={6} maxLength={20} required value={bankBin} onChange={(e) => setBankBin(e.target.value.replace(/\D/g, ''))} placeholder="Ví dụ: 970418" className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-xs focus:border-[#1F4E43] focus:outline-none" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-account-number`} className="mb-1 block text-[11px] font-semibold text-stone-700">Số tài khoản nhận</label>
          <input id={`${idPrefix}-account-number`} inputMode="numeric" pattern="[0-9]{5,30}" minLength={5} maxLength={30} required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản" className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-xs focus:border-[#1F4E43] focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-account-holder`} className="mb-1 block text-[11px] font-semibold text-stone-700">Tên chủ tài khoản</label>
          <input id={`${idPrefix}-account-holder`} autoComplete="name" maxLength={120} required value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value.toLocaleUpperCase('vi-VN'))} placeholder="Nhập chính xác tên trên tài khoản ngân hàng" className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-xs uppercase focus:border-[#1F4E43] focus:outline-none" />
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"><Landmark className="mt-0.5 h-4 w-4 shrink-0" />Nhân viên sẽ kiểm tra tên và số tài khoản trước khi duyệt. Thông tin này chỉ dùng để xử lý yêu cầu hoàn tiền.</div>
    </>}
  </section>
);
