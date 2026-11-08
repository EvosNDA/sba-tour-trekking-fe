import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Users,
  CreditCard,
  Hash,
  X,
} from 'lucide-react';
import type { BookingSummaryResponse } from '../types/booking.types';
import { formatDateTime, formatVND } from '../../../lib/utils';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

// ============================================================================
// 1. HoldCountdownTimer: Real-time countdown for holdExpiresAt
// ============================================================================
export interface HoldCountdownTimerProps {
  expiresAt: string | null | undefined;
  onExpired?: () => void;
  className?: string;
  showSecondsOnly?: boolean;
}

export const HoldCountdownTimer: React.FC<HoldCountdownTimerProps> = ({
  expiresAt,
  onExpired,
  className = '',
}) => {
  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    setSecondsLeft(calculateRemaining());
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, calculateRemaining, onExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 180 && secondsLeft > 0;
  const isExpired = secondsLeft <= 0;

  if (isExpired) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>Hết hạn giữ chỗ</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
        isUrgent
          ? 'text-amber-900 bg-amber-50 border-amber-300 animate-pulse'
          : 'text-emerald-900 bg-emerald-50 border-emerald-200'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-700' : 'text-emerald-700'}`} />
      <span>
        Còn {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </span>
  );
};

// ============================================================================
// 2. ActiveHoldCard: Single hold details display
// ============================================================================
export interface ActiveHoldCardProps {
  hold: BookingSummaryResponse;
  isSelected?: boolean;
  onSelect?: () => void;
  showSelectAction?: boolean;
  showProceedAction?: boolean;
}

export const ActiveHoldCard: React.FC<ActiveHoldCardProps> = ({
  hold,
  isSelected,
  onSelect,
  showSelectAction = false,
  showProceedAction = true,
}) => {
  const remainingDue = Math.max(hold.totalPriceVnd - (hold.paidAmountVnd || 0), 0);

  const handleProceed = () => {
    navigateTo(ROUTES.BOOKING.DETAIL(hold.id));
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 sm:p-5 transition-all text-left ${
        isSelected
          ? 'border-[#1F4E43] bg-emerald-50/40 ring-2 ring-[#1F4E43]/20 shadow-sm'
          : 'border-[#E6E1D8] bg-white hover:border-[#D6CEBE]'
      } ${showSelectAction ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E6E1D8]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#1C2526] bg-[#F7F4EE] border border-[#E6E1D8] px-2 py-0.5 rounded-md">
              <Hash className="w-3.5 h-3.5 text-[#C2410C]" />
              {hold.bookingCode}
            </span>
            <span className="text-[11px] font-mono text-[#78716C]">
              Tạo: {formatDateTime(hold.createdAt)}
            </span>
          </div>

          <h4 className="font-editorial text-lg font-bold text-[#1C2526] leading-snug">
            {hold.tourTitle || `Tour #${hold.tourId}`}
          </h4>
        </div>

        <div className="shrink-0">
          <HoldCountdownTimer expiresAt={hold.holdExpiresAt} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 text-xs text-[#2D3748]">
        <div className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6E1D8]/60">
          <Calendar className="w-4 h-4 text-[#1F4E43] shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-[#78716C] block uppercase font-mono">Khởi hành</span>
            <span className="font-semibold text-[#1C2526]">{formatDateTime(hold.startsAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6E1D8]/60">
          <Users className="w-4 h-4 text-[#1F4E43] shrink-0" />
          <div>
            <span className="text-[10px] text-[#78716C] block uppercase font-mono">Số khách</span>
            <span className="font-semibold text-[#1C2526]">{hold.participantCount} người</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6E1D8]/60">
          <CreditCard className="w-4 h-4 text-[#C2410C] shrink-0" />
          <div>
            <span className="text-[10px] text-[#78716C] block uppercase font-mono">Cần thanh toán</span>
            <strong className="font-mono-numbers text-sm text-[#C2410C] font-bold">
              {formatVND(remainingDue)}
            </strong>
          </div>
        </div>
      </div>

      <div className={`pt-2 flex items-center gap-3 ${showProceedAction ? 'justify-between' : ''}`}>
        <p className="text-[11px] text-[#78716C]">
          Chỗ được giữ trong 15 phút kể từ lúc khởi tạo đơn.
        </p>
        {showProceedAction && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleProceed();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <span>Tiếp tục thanh toán</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. ActiveHoldModal: Popup dialog when user tries to book but already has hold
// ============================================================================
export interface ActiveHoldModalProps {
  isOpen: boolean;
  activeHolds: BookingSummaryResponse[];
  onClose?: () => void;
  onRecheck?: () => Promise<void>;
  title?: string;
  subtitle?: string;
}

export const ActiveHoldModal: React.FC<ActiveHoldModalProps> = ({
  isOpen,
  activeHolds,
  onClose,
  onRecheck,
  title = 'Bạn đang có đơn đặt chỗ giữ chỗ chờ thanh toán',
  subtitle,
}) => {
  const [isRechecking, setIsRechecking] = useState(false);
  const [selectedHoldId, setSelectedHoldId] = useState<number | null>(
    activeHolds.length > 0 ? activeHolds[0].id : null
  );

  useEffect(() => {
    if (activeHolds.length > 0) {
      setSelectedHoldId(activeHolds[0].id);
    }
  }, [activeHolds]);

  if (!isOpen || activeHolds.length === 0) return null;

  const handleRecheck = async () => {
    if (!onRecheck) return;
    setIsRechecking(true);
    try {
      await onRecheck();
    } finally {
      setIsRechecking(false);
    }
  };

  const selectedHold = activeHolds.find((h) => h.id === selectedHoldId) || activeHolds[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-hold-title"
        className="w-full max-w-2xl bg-[#FDFBF7] rounded-3xl border border-[#E6E1D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-[#E6E1D8] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-[#C2410C]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-bold block">
                CHÍNH SÁCH GIỮ CHỖ WETREK
              </span>
              <h2
                id="active-hold-title"
                className="font-editorial text-xl sm:text-2xl font-bold text-[#1C2526] leading-tight"
              >
                {title}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            {subtitle || (
              <>
                Hệ thống WeTrek quy định mỗi khách hàng chỉ giữ chỗ cho <strong>một đơn đặt chỗ</strong> trong thời gian 15 phút chờ thanh toán nhằm đảm bảo cơ hội cho các trekker khác.
                {activeHolds.length > 1
                  ? ' Bạn hiện có các đơn giữ chỗ sau, vui lòng chọn đơn để tiếp tục:'
                  : ' Vui lòng hoàn tất thanh toán hoặc hủy đơn hiện tại trước khi tạo đơn mới.'}
              </>
            )}
          </p>

          {/* List of holds */}
          <div className="space-y-3">
            {activeHolds.map((hold) => (
              <ActiveHoldCard
                key={hold.id}
                hold={hold}
                isSelected={hold.id === selectedHoldId}
                onSelect={() => setSelectedHoldId(hold.id)}
                showSelectAction={activeHolds.length > 1}
                showProceedAction={false}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-[#E6E1D8] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onRecheck && (
              <button
                type="button"
                onClick={handleRecheck}
                disabled={isRechecking}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                <span>{isRechecking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
              className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 hover:underline px-2 py-1 cursor-pointer"
            >
              <span>Xem đơn của tôi</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
            {selectedHold && (
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.BOOKING.DETAIL(selectedHold.id))}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#163830] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <span>Tiếp tục thanh toán #{selectedHold.bookingCode}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. ActiveHoldView: Full-page view when user directly opens /booking/new with active holds
// ============================================================================
export interface ActiveHoldViewProps {
  activeHolds: BookingSummaryResponse[];
  onRecheck?: () => Promise<void>;
}

export const ActiveHoldView: React.FC<ActiveHoldViewProps> = ({
  activeHolds,
  onRecheck,
}) => {
  const [isRechecking, setIsRechecking] = useState(false);

  const handleRecheck = async () => {
    if (!onRecheck) return;
    setIsRechecking(true);
    try {
      await onRecheck();
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#E6E1D8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4 pb-5 border-b border-[#E6E1D8]">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-[#C2410C] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-bold block">
              CHÍNH SÁCH GIỮ CHỖ CHỜ THANH TOÁN
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
              Bạn đang có đơn đặt chỗ giữ chỗ
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
              Hệ thống WeTrek quy định mỗi tài khoản chỉ được giữ chỗ cho <strong>một đơn đặt chỗ</strong> trong thời gian 15 phút. Bạn không thể tạo thêm đơn đặt chỗ mới trong khi đang có đơn giữ chỗ chờ thanh toán còn hiệu lực.
            </p>
          </div>
        </div>

        {/* Active Holds List */}
        <div className="space-y-3.5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center justify-between">
            <span>Danh sách đơn đang giữ chỗ ({activeHolds.length})</span>
            {onRecheck && (
              <button
                type="button"
                onClick={handleRecheck}
                disabled={isRechecking}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F4E43] hover:underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRechecking ? 'animate-spin' : ''}`} />
                <span>{isRechecking ? 'Đang làm mới...' : 'Làm mới'}</span>
              </button>
            )}
          </h2>

          <div className="space-y-3">
            {activeHolds.map((hold) => (
              <ActiveHoldCard key={hold.id} hold={hold} />
            ))}
          </div>
        </div>

        {/* Advice / policy note */}
        <div className="rounded-2xl bg-[#FAF8F5] border border-[#E6E1D8] p-4 text-xs text-stone-600 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-[#1C2526]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bạn muốn đặt tour hoặc ngày khác?</span>
          </div>
          <p>
            Vui lòng nhấn <strong>&quot;Tiếp tục thanh toán&quot;</strong> để hoàn tất đơn đang giữ, hoặc chọn <strong>&quot;Hủy đặt chỗ&quot;</strong> trong trang chi tiết đơn hiện tại để giải phóng chỗ trước khi bắt đầu tạo đơn mới. Khi hết thời hạn giữ chỗ 15 phút, hệ thống sẽ tự động giải phóng chỗ.
          </p>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E6E1D8]">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
          >
            Khám phá danh sách tour
          </button>

          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E6E1D8] text-[#1C2526] font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
          >
            Quản lý đặt chỗ của tôi
          </button>
        </div>
      </div>
    </div>
  );
};
