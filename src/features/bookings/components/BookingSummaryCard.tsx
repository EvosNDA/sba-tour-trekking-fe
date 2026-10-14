import React from 'react';
import { Booking } from '../../../types/expedition';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatVND } from '../../../lib/utils';
import { MapPin, Calendar, Users, QrCode } from 'lucide-react';

interface BookingSummaryCardProps {
  booking: Booking;
  onViewETicket?: () => void;
  onPayBalance?: () => void;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  booking,
  onViewETicket,
  onPayBalance,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
        <div>
          <span className="text-[10px] font-mono text-stone-400 block uppercase">
            Pass Reference #{booking.id}
          </span>
          <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
            {booking.tourTitle}
          </h3>
        </div>
        <Badge
          variant={booking.paymentStatus === 'FULLY_SETTLED' ? 'success' : 'warning'}
          size="md"
        >
          {booking.paymentStatus === 'FULLY_SETTLED' ? 'Fully Settled' : 'Deposit Confirmed'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-stone-600 mb-4">
        <div>
          <span className="text-[10px] text-stone-400 block uppercase">Meeting Gate</span>
          <span className="font-semibold text-stone-800">{booking.meetingPlace}</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block uppercase">Climber Party</span>
          <span className="font-semibold text-stone-800">{booking.partySize} Hikers</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block uppercase">Remaining Due</span>
          <span className="font-semibold text-[#C2410C] font-mono">
            {formatVND(booking.remainingVND)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onViewETicket && (
          <Button size="sm" variant="outline" leftIcon={<QrCode className="w-3.5 h-3.5" />} onClick={onViewETicket}>
            Digital Pass
          </Button>
        )}
        {booking.paymentStatus !== 'FULLY_SETTLED' && onPayBalance && (
          <Button size="sm" variant="primary" onClick={onPayBalance}>
            Settle Balance
          </Button>
        )}
      </div>
    </div>
  );
};
