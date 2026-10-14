import { PaymentTransaction, PaymentMethod } from '../types/payment.types';

export const paymentsApi = {
  createTransaction: async (bookingId: string, amountVND: number, method: PaymentMethod): Promise<PaymentTransaction> => {
    return {
      id: 'tx_' + Date.now(),
      bookingId,
      amountVND,
      method,
      status: 'CONFIRMED',
      referenceCode: 'WT-PAY-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
    };
  },
};
