export type PaymentProvider = 'PAYOS';

export type PaymentPurpose = 'DEPOSIT' | 'BALANCE' | 'FULL';

export interface CreatePaymentLinkRequest {
  provider: PaymentProvider;
  purpose: PaymentPurpose;
}

export interface PaymentLinkResponse {
  attemptId: number;
  provider: PaymentProvider;
  checkoutUrl: string;
  merchantReference: string;
  amountVnd: number;
  status: string;
  expiresAt: string;
}

// Legacy compatibility types
export type PaymentMethod = 'VIETQR' | 'CREDIT_CARD' | 'WEATHER_ESCROW' | 'BANK_TRANSFER';

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amountVND: number;
  method: PaymentMethod;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  referenceCode: string;
  createdAt: string;
}

export type RefundStatus = 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected';

/** GET /admin/refunds item and customer refund view. The account number is always masked. */
export interface RefundResponse {
  id: number;
  bookingId: number;
  status: RefundStatus;
  paidAmountVnd: number;
  /** Null when the booking's cancellation policy has no refund tiers (full balance requested). */
  refundPercent: number | null;
  hoursBeforeDeparture: number | null;
  requestedAmountVnd: number;
  approvedAmountVnd: number | null;
  bankName: string | null;
  accountNumberMasked: string | null;
  /** payos | bank_transfer | vnpay, set once a payout starts. */
  payoutChannel: string | null;
  /** Provider state, e.g. PROCESSING, SUCCEEDED, FAILED, NOT_FOUND. */
  payoutState: string | null;
  decisionNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Finance-only detail. Destination fields are null once the refund is closed and wiped. */
export interface RefundDetailResponse {
  refund: RefundResponse;
  bookingCode: string;
  reason: string;
  bankBin: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  payoutReferenceId: string | null;
  payoutId: string | null;
  transactionReference: string | null;
  evidenceUrl: string | null;
  payosPayoutAvailable: boolean;
  /** True when the destination was taken from the paying account and cannot be changed. */
  recipientFromPayment: boolean;
}

/** What the customer gets back if they cancel now. */
export interface RefundPreviewResponse {
  bookingId: number;
  paidAmountVnd: number;
  alreadyRefundedVnd: number;
  hoursBeforeDeparture: number;
  refundPercent: number | null;
  estimatedRefundVnd: number;
  policyTiersConfigured: boolean;
  /** The customer must enter a bank account (no single paying account is known). */
  refundAccountRequired: boolean;
  /** Money goes back to the paying account; no account may be entered. */
  refundAccountLocked: boolean;
  lockedBankName: string | null;
  lockedAccountMasked: string | null;
}

export interface RefundAccountRequest {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface RefundApproveRequest {
  /** Defaults to the policy amount; may only be lowered. */
  approvedAmountVnd?: number;
  note?: string;
}

export interface RefundManualTransferRequest {
  transactionReference: string;
  evidenceUrl?: string;
  note?: string;
}
