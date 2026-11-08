import { useState } from 'react';
import { paymentsApi } from '../api/payments.api';
import type { PaymentPurpose, PaymentLinkResponse } from '../types/payment.types';
import type { ApiError } from '../../../types/api.types';

export function usePayments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const createPayOSPayment = async (bookingId: number, purpose: PaymentPurpose) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await paymentsApi.createPaymentLink(bookingId, {
        provider: 'PAYOS',
        purpose,
      });
      setPaymentLink(result);
      return result;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    paymentLink,
    error,
    createPayOSPayment,
  };
}
