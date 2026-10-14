import React from 'react';
import { Booking, ScreenId } from '../../../../types/expedition';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatVND } from '../../../../lib/utils';

interface BookingPaymentDetailsCardProps {
  booking: Booking;
  onNavigate: (screen: ScreenId) => void;
}

export const BookingPaymentDetailsCard: React.FC<BookingPaymentDetailsCardProps> = ({
  booking,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Payment Details */}
      <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
          <h4 className="font-editorial text-lg font-bold text-[#1C2526]">
            Payment Details
          </h4>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            {booking.paymentStatus === 'FULLY_SETTLED' ? 'Paid In Full' : 'Deposit Paid'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Total Price (2 Travelers)</span>
            <strong className="text-[#1C2526] font-mono-numbers">
              {formatVND(booking.totalPriceVND)}
            </strong>
          </div>

          <div className="flex justify-between items-start text-emerald-800">
            <div>
              <span className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-emerald-600" /> Paid Deposit ({booking.depositDate})
              </span>
              <span className="text-[10px] text-[#78716C] font-mono block pl-4">
                Ref: {booking.depositRef}
              </span>
            </div>
            <span className="font-mono-numbers font-semibold">
              -{formatVND(booking.paidDepositVND)}
            </span>
          </div>

          {booking.hasExtraPorter && (
            <div className="flex justify-between text-xs text-[#C2410C]">
              <span>1x Extra Personal Porter Add-on</span>
              <span className="font-mono-numbers font-semibold">
                +{formatVND(booking.porterFeeVND)}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#E6E1D8]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-[#78716C] uppercase">REMAINING TO PAY:</span>
            <span className="text-[10px] text-[#78716C]">
              About ${Math.round((booking.paymentStatus === 'FULLY_SETTLED' ? 0 : booking.remainingVND) / 24700)} USD
            </span>
          </div>
          <div className="font-editorial text-2xl font-bold text-[#C2410C] font-mono-numbers">
            {booking.paymentStatus === 'FULLY_SETTLED'
              ? '0 VND (Fully Settled)'
              : formatVND(booking.remainingVND + (booking.hasExtraPorter ? booking.porterFeeVND : 0))}
          </div>
        </div>

        {booking.paymentStatus !== 'FULLY_SETTLED' ? (
          <>
            <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-950 flex items-start gap-1.5 leading-tight">
              <span className="text-orange-600 font-bold">!</span>
              <span>Please pay before Nov 10, 2024 (in 2 days) to keep your tent spot and mountain porters.</span>
            </div>

            <button
              onClick={() => onNavigate('paybalance')}
              className="w-full bg-[#C2410C] hover:bg-[#9B2F00] text-white py-2.5 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Pay Remaining Money Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-center text-xs text-emerald-800 font-semibold">
            Payment Completed &amp; Escrow Locked
          </div>
        )}

        <button
          onClick={() => onNavigate('paybalance')}
          className="w-full text-center text-[11px] text-[#64748B] hover:text-[#1C2526] hover:underline cursor-pointer pt-1"
        >
          View Cancel &amp; Refund Rules
        </button>
      </div>

      {/* Refund Guarantee */}
      <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C2526]">
            <ShieldCheck className="w-4 h-4 text-[#1F4E43]" />
            <span>Refund Guarantee</span>
          </div>
          <span className="text-[10px] font-mono text-[#1F4E43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Safe Guarantee
          </span>
        </div>

        <div className="text-xs text-[#2D3748] space-y-2">
          <div className="flex items-start gap-1.5 text-emerald-800 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Cancel 7+ Days Before Trip: Get 100% of your deposit back (minus small park admin fee).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
