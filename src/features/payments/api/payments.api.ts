import { apiClient } from '../../../lib/axios';
import {
  CreatePaymentLinkRequest,
  PaymentLinkResponse,
  PaymentTransaction,
  PaymentMethod,
  RefundRequestSummary,
  RefundRequestDetail,
  RefundRules,
  SaveRefundRulesRequest,
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

  getRefundRequests: async (signal?: AbortSignal): Promise<RefundRequestSummary[]> =>
    apiClient.get<RefundRequestSummary[]>('/api/v1/admin/refunds', { signal }),

  getRefundRequest: async (refundId: number, signal?: AbortSignal): Promise<RefundRequestDetail> =>
    apiClient.get<RefundRequestDetail>(`/api/v1/admin/refunds/${refundId}`, { signal }),

  approveRefund: async (refundId: number): Promise<RefundRequestSummary> =>
    apiClient.post<RefundRequestSummary>(`/api/v1/admin/refunds/${refundId}/approve`, {}),

  rejectRefund: async (refundId: number, note: string): Promise<RefundRequestSummary> =>
    apiClient.post<RefundRequestSummary>(`/api/v1/admin/refunds/${refundId}/reject`, { note }),

  getRefundRules: async (signal?: AbortSignal): Promise<RefundRules | null> =>
    apiClient.get<RefundRules | null>('/api/v1/admin/refund-rules', { signal }),

  saveRefundRules: async (payload: SaveRefundRulesRequest): Promise<RefundRules> =>
    apiClient.post<RefundRules>('/api/v1/admin/refund-rules', payload),

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
