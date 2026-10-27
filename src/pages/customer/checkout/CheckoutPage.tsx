import React, { useState } from 'react';
import { Booking, ScreenId } from '../../../types/expedition';
import { INITIAL_BOOKING } from '../../../data/mockData';
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  QrCode,
  CreditCard,
  Building,
  Smartphone,
  Lock,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatVND } from '../../../lib/utils';

export interface CheckoutPageProps {
  booking?: Booking;
  onUpdateBooking?: (updated: Booking) => void;
  onNavigate?: (screen: ScreenId) => void;
  onOpenAIRanger?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  booking = INITIAL_BOOKING,
  onUpdateBooking = () => {},
  onNavigate = () => {},
  onOpenAIRanger = () => {},
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'vietqr' | 'card' | 'bank' | 'wallet'>('vietqr');
  const [hasPorter, setHasPorter] = useState(booking.hasExtraPorter);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);

  const porterCost = 400000;
  const currentRemaining = booking.remainingVND + (hasPorter ? porterCost : 0);
  const usdEquivalent = Math.round(currentRemaining / 24700);

  const handleTogglePorter = () => {
    const updated = !hasPorter;
    setHasPorter(updated);
    onUpdateBooking({
      ...booking,
      hasExtraPorter: updated,
    });
  };

  // There is no payment backend in this service. Executing a payment here would
  // only pretend to settle the balance, so the action is marked unavailable.
  const handleExecutePayment = () => {
    setPaymentUnavailable(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <button
              onClick={() => onNavigate('eticket')}
              className="flex items-center gap-1.5 text-[#1C2526] hover:text-[#C2410C] font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Digital E-Ticket ({booking.id.split('-')[1] ? `#TRK-${booking.id.split('-')[1]}` : '#TRK-98421'})</span>
            </button>
            <span>/</span>
            <span className="font-mono text-[#78716C] uppercase">SETTLEMENT LEDGER</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#B9EADB]/50 text-[#1F4E43] text-xs font-semibold px-2.5 py-1 rounded">
              <Check className="w-3.5 h-3.5 text-[#1F4E43]" />
              <span>30% DEPOSIT PAID VERIFIED</span>
            </div>
            <span className="text-xs font-mono text-[#78716C] bg-white border border-[#E6E1D8] px-2.5 py-1 rounded">
              STEP 2 OF 2: FINAL BALANCE
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold block mb-1">
            EXPEDITION OUTFITTING LEDGER • SAPA PEAK CO.
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526]">
            Pay Remaining Balance
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Pay the rest of your trip fee before departure to confirm your camping tent, equipment, and personal mountain porter.
          </p>
        </div>

        {/* Payment Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 Columns: Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E6E1D8]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C2410C] text-white flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </span>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                      Choose How to Pay
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      All methods are verified instantly and backed by safe escrow.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  0% Extra Gateway Fee
                </span>
              </div>

              {/* 4 Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('vietqr')}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    selectedMethod === 'vietqr'
                      ? 'border-[#C2410C] bg-[#FAF8F5] ring-1 ring-[#C2410C]'
                      : 'border-[#E6E1D8] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <QrCode className="w-4 h-4 text-[#C2410C]" />
                    <span className="text-[9px] font-mono bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">
                      FASTEST
                    </span>
                  </div>
                  <strong className="block text-xs text-[#1C2526]">VietQR / NAPAS</strong>
                  <span className="text-[10px] text-[#78716C] leading-tight block">Instant app scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    selectedMethod === 'card'
                      ? 'border-[#C2410C] bg-[#FAF8F5] ring-1 ring-[#C2410C]'
                      : 'border-[#E6E1D8] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CreditCard className="w-4 h-4 text-[#1F4E43]" />
                    <span className="text-[9px] font-mono text-[#78716C]">USD / VND</span>
                  </div>
                  <strong className="block text-xs text-[#1C2526]">Bank Card</strong>
                  <span className="text-[10px] text-[#78716C] leading-tight block">Visa, Mastercard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('bank')}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    selectedMethod === 'bank'
                      ? 'border-[#C2410C] bg-[#FAF8F5] ring-1 ring-[#C2410C]'
                      : 'border-[#E6E1D8] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Building className="w-4 h-4 text-[#2D3748]" />
                    <span className="text-[9px] font-mono text-[#78716C]">Direct</span>
                  </div>
                  <strong className="block text-xs text-[#1C2526]">Bank Transfer</strong>
                  <span className="text-[10px] text-[#78716C] leading-tight block">VCB, Techcom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('wallet')}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    selectedMethod === 'wallet'
                      ? 'border-[#C2410C] bg-[#FAF8F5] ring-1 ring-[#C2410C]'
                      : 'border-[#E6E1D8] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Smartphone className="w-4 h-4 text-[#D97706]" />
                    <span className="text-[9px] font-mono text-[#78716C]">1-Tap</span>
                  </div>
                  <strong className="block text-xs text-[#1C2526]">Wallets</strong>
                  <span className="text-[10px] text-[#78716C] leading-tight block">Apple Pay, MoMo</span>
                </button>
              </div>

              {/* VietQR Dynamic Presentation */}
              {selectedMethod === 'vietqr' ? (
                <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Box */}
                  <div className="bg-white border border-[#E6E1D8] rounded-lg p-4 text-center shrink-0 shadow-2xs">
                    <div className="w-36 h-36 bg-stone-900 rounded p-2.5 flex flex-col justify-between text-white relative mx-auto">
                      <div className="flex justify-between">
                        <div className="w-9 h-9 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
                        <div className="w-9 h-9 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#C2410C] flex items-center justify-center text-white text-[11px] font-bold">
                          ✓
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="w-9 h-9 border-2 border-white p-1"><div className="w-full h-full bg-white"></div></div>
                        <div className="w-7 h-7 grid grid-cols-2 gap-1 p-0.5">
                          <div className="bg-white"></div><div className="bg-white"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#1C2526] block mt-2">
                      VIETQR • NAPAS 247
                    </span>
                    <span className="font-editorial text-sm font-bold text-[#C2410C] block font-mono-numbers">
                      {formatVND(currentRemaining)}
                    </span>
                    <span className="text-[9px] text-[#78716C] block">
                      Scans with 40+ Vietnam banking apps
                    </span>
                  </div>

                  {/* Clearing Steps */}
                  <div className="flex-1 space-y-3 text-xs text-[#2D3748]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1F4E43] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> INSTANT CLEARING STEPS
                    </span>

                    <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-[#64748B] leading-relaxed">
                      <li>Open your bank app (Vietcombank, MB, Techcombank, VPBank, etc.).</li>
                      <li>Scan the dynamic QR code on the left.</li>
                      <li>Verify account name: <strong className="text-[#1C2526]">WETREK SAPA ESCROW</strong>.</li>
                      <li>The transfer note <span className="font-mono font-bold text-[#C2410C]">TRK-98421</span> is pre-filled automatically.</li>
                    </ol>

                    <div className="p-2 bg-white rounded border border-[#E6E1D8] text-[11px] text-[#78716C] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-[#1F4E43] animate-spin" />
                      <span>System checks receipt every 3 seconds. Average clearing time: 4.2 seconds.</span>
                    </div>

                    {paymentUnavailable ? (
                      <div role="alert" className="p-2.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-950 flex items-start gap-1.5 leading-tight">
                        <span className="text-orange-600 font-bold">!</span>
                        <span>Online payment is not available in this frontend. Please settle the remaining balance with your tour operator or at the park gate.</span>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleExecutePayment}
                      disabled={paymentUnavailable}
                      className="w-full bg-[#C2410C] text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{paymentUnavailable ? 'Pay balance — unavailable in frontend' : 'Simulate Bank App Scan &amp; Pay'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg text-center space-y-3">
                  <CreditCard className="w-8 h-8 text-[#1F4E43] mx-auto" />
                  <h4 className="font-editorial text-base font-bold text-[#1C2526]">
                    Pay with {selectedMethod === 'card' ? 'Credit Card' : selectedMethod === 'bank' ? 'Direct Bank Transfer' : 'Digital Wallet'}
                  </h4>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Secure 256-bit payment gateway integration. Your card credentials are encrypted under PCI-DSS Level 1.
                  </p>
                  {paymentUnavailable ? (
                    <div role="alert" className="p-3 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-950 flex items-start gap-1.5 leading-tight">
                      <span className="text-orange-600 font-bold">!</span>
                      <span>Online payment is not available in this frontend. Please settle the remaining balance with your tour operator or at the park gate.</span>
                    </div>
                  ) : null}
                  <button
                    onClick={handleExecutePayment}
                    disabled={paymentUnavailable}
                    className="bg-[#C2410C] text-white text-xs font-semibold px-6 py-2.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentUnavailable ? 'Pay balance — unavailable in frontend' : `Pay ${formatVND(currentRemaining)}`}
                  </button>
                </div>
              )}
            </div>

            {/* Optional Services */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E6E1D8]">
                <span className="w-5 h-5 rounded-full bg-[#C2410C] text-white flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                    Optional Trail Services
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Recommended for high-altitude comfort on Fansipan Ridge.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs text-[#1C2526]">1x Extra Personal Porter</strong>
                    <span className="text-[10px] font-mono bg-[#B9EADB]/50 text-[#1F4E43] px-2 py-0.2 rounded font-semibold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed max-w-md">
                    Carries your personal backpack up to 15kg for the full 3 days so you can hike light and photograph comfortably.
                  </p>
                  <span className="font-mono text-xs font-bold text-[#C2410C] block pt-1">
                    +{formatVND(porterCost)} (~$16 USD) for entire trek
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePorter}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative shrink-0 cursor-pointer ${
                    hasPorter ? 'bg-[#1F4E43]' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      hasPorter ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E6E1D8]">
                <span className="w-5 h-5 rounded-full bg-[#C2410C] text-white flex items-center justify-center text-xs font-bold font-mono">
                  3
                </span>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                    Ticket &amp; Permitting Contact
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Your updated QR Gate Passes will be sent here immediately.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                <div className="bg-[#FAF8F5] p-2.5 rounded border border-[#E6E1D8]">
                  <span className="text-[10px] font-mono uppercase text-[#78716C] block">PRIMARY TRAVELER</span>
                  <strong className="text-xs text-[#1C2526] block mt-0.5">{booking.mainTraveler}</strong>
                </div>

                <div className="bg-[#FAF8F5] p-2.5 rounded border border-[#E6E1D8]">
                  <span className="text-[10px] font-mono uppercase text-[#78716C] block">EMAIL DELIVERY</span>
                  <span className="text-xs text-[#1C2526] block mt-0.5 truncate">eleanor.vance@gmail.com</span>
                </div>

                <div className="bg-[#FAF8F5] p-2.5 rounded border border-[#E6E1D8]">
                  <span className="text-[10px] font-mono uppercase text-[#78716C] block">WHATSAPP / MOBILE</span>
                  <span className="text-xs text-[#1C2526] block mt-0.5 font-mono">+1 (555) 382-9910</span>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendConfirmation}
                  onChange={(e) => setSendConfirmation(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
                />
                <span className="text-[#64748B] leading-tight">
                  Send updated digital gate ticket, invoice, and mountain camp voucher to my email &amp; WhatsApp immediately.
                </span>
              </label>
            </div>
          </div>

          {/* Right 5 Columns: Order Statement & Guarantees */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#C2410C] font-semibold uppercase block">
                  PAYMENT WINDOW
                </span>
                <span className="font-editorial text-lg font-bold text-[#1C2526]">
                  02 days : 16 hours left
                </span>
                <span className="text-[11px] text-[#78716C] block mt-0.5">
                  Due Nov 10, 2024 at 18:00 ICT. Paying locks your permit &amp; guide.
                </span>
              </div>
              <Clock className="w-6 h-6 text-[#C2410C] shrink-0" />
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
                <span className="text-[10px] font-mono uppercase text-[#78716C]">
                  BOOKING STATEMENT
                </span>
                <span className="font-mono text-xs font-bold text-[#1C2526]">
                  {booking.id.split('-')[1] ? `#TRK-${booking.id.split('-')[1]}` : '#TRK-98421'}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-[#FAF8F5] p-2.5 rounded border border-[#E6E1D8]">
                <img
                  src="/src/assets/images/fansipan_cloud_ridge_1792001300725.jpg"
                  alt="Fansipan"
                  className="w-14 h-14 rounded object-cover shrink-0"
                />
                <div className="text-xs">
                  <span className="text-[10px] font-mono text-[#78716C] uppercase block">
                    FANSIPAN CLOUD RIDGE
                  </span>
                  <strong className="text-xs text-[#1C2526] block">
                    Muong Hoa Valley 3D2N
                  </strong>
                  <span className="text-[11px] text-[#64748B]">
                    2 Hikers · Nov 12 - 14, 2024
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Expedition Price</span>
                  <strong className="font-mono-numbers text-[#1C2526]">
                    {formatVND(booking.totalPriceVND)}
                  </strong>
                </div>

                <div className="flex justify-between text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Deposit Paid ({booking.depositDate})
                  </span>
                  <span className="font-mono-numbers">
                    -{formatVND(booking.paidDepositVND)}
                  </span>
                </div>

                <div className="flex justify-between text-[#64748B]">
                  <span>National Park Fee &amp; Permit</span>
                  <span className="text-[#1F4E43] font-medium">Included</span>
                </div>

                {hasPorter && (
                  <div className="flex justify-between text-[#C2410C] font-medium pt-1 border-t border-[#E6E1D8]/60">
                    <span>1x Extra Personal Porter</span>
                    <span className="font-mono-numbers">+{formatVND(porterCost)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E6E1D8]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono text-[#78716C] uppercase">
                    REMAINING BALANCE
                  </span>
                  <span className="font-mono text-[#78716C] text-[11px]">
                    ≈ ${usdEquivalent} USD
                  </span>
                </div>
                <div className="font-editorial text-3xl font-bold text-[#C2410C] font-mono-numbers">
                  {formatVND(currentRemaining)}
                </div>
              </div>

              <button
                onClick={() => onNavigate('eticket')}
                className="w-full bg-[#1F4E43] hover:bg-[#15372F] text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to E-Ticket</span>
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => onNavigate('eticket')}
                  className="text-xs text-[#64748B] hover:text-[#1C2526] hover:underline cursor-pointer"
                >
                  Cancel &amp; Return to Ticket
                </button>
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E6E1D8] p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#78716C] uppercase block">Need help paying?</span>
                <span className="text-xs font-bold text-[#1C2526]">Sapa Basecamp Dispatcher</span>
              </div>
              <button
                onClick={onOpenAIRanger}
                className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
