import { apiClient } from '../../../lib/axios';
import {
  CreatePaymentLinkRequest,
  PaymentLinkResponse,
  PaymentTransaction,
  PaymentMethod,
  RefundApproveRequest,
  RefundDetailResponse,
  RefundManualTransferRequest,
  RefundResponse,
  RefundStatus,
} from '../types/payment.types';
import type { SpringPage } from '../../../types/api.types';

const REFUNDS = '/api/v1/admin/refunds';

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

  listRefunds: async (
    params: { status?: RefundStatus; page?: number; size?: number } = {},
    signal?: AbortSignal
  ): Promise<SpringPage<RefundResponse>> =>
    apiClient.get<SpringPage<RefundResponse>>(REFUNDS, {
      params: { status: params.status, page: params.page ?? 0, size: params.size ?? 20 },
      signal,
    }),

  getRefund: async (refundId: number, signal?: AbortSignal): Promise<RefundDetailResponse> =>
    apiClient.get<RefundDetailResponse>(`${REFUNDS}/${refundId}`, { signal }),

  approveRefund: async (refundId: number, payload: RefundApproveRequest = {}): Promise<RefundResponse> =>
    apiClient.post<RefundResponse>(`${REFUNDS}/${refundId}/approve`, payload),

  rejectRefund: async (refundId: number, note: string): Promise<RefundResponse> =>
    apiClient.post<RefundResponse>(`${REFUNDS}/${refundId}/reject`, { note }),

  recordManualTransfer: async (refundId: number, payload: RefundManualTransferRequest): Promise<RefundResponse> =>
    apiClient.post<RefundResponse>(`${REFUNDS}/${refundId}/manual-transfer`, payload),

  startPayOsPayout: async (refundId: number): Promise<RefundResponse> =>
    apiClient.post<RefundResponse>(`${REFUNDS}/${refundId}/payos-payout`, {}),

  syncPayOsPayout: async (refundId: number): Promise<RefundResponse> =>
    apiClient.post<RefundResponse>(`${REFUNDS}/${refundId}/payos-sync`, {}),

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
