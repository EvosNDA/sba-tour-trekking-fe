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

export interface RefundRequestSummary {
  id: number;
  bookingId: number;
  requestedAmountVnd: number;
  approvedAmountVnd: number | null;
  status: RefundStatus;
  recipientAccountLast4: string | null;
  recipientVerification: 'verified' | 'manual_review';
  createdAt: string;
  payoutReferenceId: string | null;
}

export interface RefundRequestDetail extends RefundRequestSummary {
  reason: string;
  bankBin: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  payoutId: string | null;
  payoutTransactionReference: string | null;
}

export interface RefundRuleTier {
  minimumHoursBeforeDeparture: number;
  refundPercent: number;
}

export interface RefundRules {
  versionId: number;
  effectiveFrom: string;
  rules: RefundRuleTier[];
}

export interface SaveRefundRulesRequest {
  effectiveFrom: string;
  rules: RefundRuleTier[];
}
