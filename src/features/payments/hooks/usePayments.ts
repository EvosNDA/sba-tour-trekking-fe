import { useState } from 'react';
import { PaymentMethod, PaymentTransaction } from '../types/payment.types';
import { paymentsApi } from '../api/payments.api';

export function usePayments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);

  const processPayment = async (bookingId: string, amountVND: number, method: PaymentMethod) => {
    setIsProcessing(true);
    try {
      const result = await paymentsApi.createTransaction(bookingId, amountVND, method);
      setTransaction(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    transaction,
    processPayment,
  };
}
