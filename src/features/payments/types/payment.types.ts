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
