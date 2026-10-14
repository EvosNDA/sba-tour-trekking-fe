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
