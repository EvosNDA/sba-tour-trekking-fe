import { apiClient } from '../../../lib/axios';
import {
  CreatePaymentLinkRequest,
  PaymentLinkResponse,
  PaymentTransaction,
  PaymentMethod,
} from '../types/payment.types';

export const paymentsApi = {
  createPaymentLink: async (
    bookingId: number | string,
    payload: CreatePaymentLinkRequest,
    signal?: AbortSignal
  ): Promise<PaymentLinkResponse> => {
    return apiClient.post<PaymentLinkResponse>(
      `/api/v1/bookings/${bookingId}/payments`,
      payload,
      { signal }
    );
  },

  // Legacy helper kept for compatibility
  createTransaction: async (
    bookingId: string,
    amountVND: number,
    method: PaymentMethod
  ): Promise<PaymentTransaction> => {
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
