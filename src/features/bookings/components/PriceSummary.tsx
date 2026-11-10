import React from 'react';
import { BookingPriceResponse } from '../types/booking.types';
import { formatVND } from '../../../lib/utils';
import { ShieldCheck, Percent, Users, Backpack } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export interface PriceSummaryProps {
  participantCount: number;
  basePriceVnd: number;
  depositPercent: number;
  equipmentFeeVnd?: number;
  serverPrice?: BookingPriceResponse | null;
  className?: string;
  compact?: boolean;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  participantCount,
  basePriceVnd,
  depositPercent,
  equipmentFeeVnd = 0,
  serverPrice,
  className = '',
  compact = false,
}) => {
  // Always prefer server-calculated BookingPriceResponse when available
  const count = serverPrice ? serverPrice.participantCount : participantCount;
  const unitBase = serverPrice ? serverPrice.basePriceVnd : basePriceVnd;
  const tourBaseVnd = unitBase * count;
  const equipmentFee = serverPrice ? serverPrice.equipmentFeeVnd : equipmentFeeVnd;
  const totalVnd = serverPrice ? serverPrice.totalPriceVnd : tourBaseVnd + equipmentFee;
  const depPercent = serverPrice ? Number(serverPrice.depositPercent) : depositPercent;
  const depositVnd = serverPrice
    ? serverPrice.depositAmountVnd
    : Math.ceil((totalVnd * depPercent) / 100);
  const paidVnd = serverPrice ? serverPrice.paidAmountVnd : 0;
  const refundedVnd = serverPrice ? serverPrice.refundedAmountVnd : 0;
  const remainingVnd = serverPrice ? serverPrice.remainingAmountVnd : Math.max(totalVnd - paidVnd, 0);

  if (compact) {
    return (
      <section aria-label="Chi phí dự kiến" aria-live="polite" className="rounded-2xl border border-[#D6CEBE] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm text-[#5C645E]">Tổng dự kiến · {count} hành khách</p><p className="mt-1 text-2xl font-bold tabular-nums text-[#1F4E43]">{formatVND(totalVnd)}</p></div>
          <div className="text-sm text-[#5C645E]"><p>Đặt cọc {depPercent}%</p><p className="mt-1 font-semibold tabular-nums text-[#C2410C]">{formatVND(depositVnd)}</p></div>
        </div>
        <p className="mt-3 border-t border-[#E6E1D8] pt-3 text-sm leading-6 text-[#5C645E]">Giá gồm tour và {formatVND(equipmentFee)} phí thuê thiết bị đã chọn. Kiểm tra toàn bộ chi phí ở bước xác nhận.</p>
      </section>
    );
  }

  return (
    <div
      className={`bg-white border border-[#E6E1D8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D8]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] block">
            BẢNG KÊ CHI PHÍ HÀNH TRÌNH
          </span>
          <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
            Tổng kết giá & Tiền cọc
          </h3>
        </div>
        {serverPrice?.paymentState && (
          <StatusBadge paymentState={serverPrice.paymentState} size="sm" />
        )}
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm text-[#2D3748]">
        <div className="flex items-center justify-between">
          <span className="text-[#64748B] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#1F4E43]" />
            Giá tour cơ bản ({count} khách × {formatVND(unitBase)})
          </span>
          <strong className="font-mono-numbers text-[#1C2526]">
            {formatVND(tourBaseVnd)}
          </strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#64748B] flex items-center gap-1.5">
            <Backpack className="w-4 h-4 text-[#78716C]" />
            {equipmentFee > 0 ? 'Phụ phí thiết bị thuê' : 'Phụ phí thiết bị (Tự chuẩn bị)'}
          </span>
          <span className="font-mono-numbers text-[#1F4E43] font-semibold">
            {formatVND(equipmentFee)}
          </span>
        </div>

        <div className="pt-2.5 border-t border-[#E6E1D8] flex items-center justify-between text-base">
          <span className="font-bold text-[#1C2526]">Tổng giá trị đặt chỗ</span>
          <strong className="font-editorial text-xl font-bold text-[#1C2526] font-mono-numbers">
            {formatVND(totalVnd)}
          </strong>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-3.5 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#C2410C] flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              Tiền cọc xác nhận chỗ ({depPercent}%)
            </span>
            <strong className="font-mono-numbers text-base font-bold text-[#C2410C]">
              {formatVND(depositVnd)}
            </strong>
          </div>

          {serverPrice && (
            <>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E1D8]/70">
                  <span className="text-[#64748B]">Đã thanh toán</span>
                <strong className="font-mono-numbers text-[#1F4E43]">
                  {formatVND(paidVnd)}
                </strong>
              </div>
              {refundedVnd > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Đã hoàn tiền</span>
                  <strong className="font-mono-numbers text-purple-700">
                    {formatVND(refundedVnd)}
                  </strong>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#1C2526]">Số dư còn lại cần thanh toán</span>
                <strong className="font-mono-numbers text-[#C2410C]">
                  {formatVND(remainingVnd)}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 pt-2 text-[11px] text-[#64748B] leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
        <span>
          Đặt chỗ được giữ trong <strong>15 phút</strong> ở trạng thái chờ thanh toán. Ngay khi hệ thống nhận đủ tiền cọc qua cổng thanh toán trực tuyến, đặt chỗ sẽ chuyển sang trạng thái <strong>Đã xác nhận</strong>.
        </span>
      </div>
    </div>
  );
};
