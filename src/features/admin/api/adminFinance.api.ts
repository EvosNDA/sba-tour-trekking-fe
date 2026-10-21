import { APP_CONFIG } from '../../../constants/config';
import { apiClient } from '../../../lib/axios';
import { ApiResponse } from '../../../types/api.types';

const apiBase = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
const apiPrefix = apiBase.endsWith('/api/v1') ? '' : apiBase.endsWith('/api') ? '/v1' : '/api/v1';
const path = (value: string) => `${apiPrefix}${value}`;
const unwrap = <T,>(response: ApiResponse<T> | T): T =>
  response && typeof response === 'object' && 'data' in response && 'status' in response && ['success', 'error'].includes(String((response as ApiResponse<T>).status))
    ? (response as ApiResponse<T>).data
    : response as T;

export interface AdminPage<T> { items: T[]; page: number; size: number; totalItems: number; totalPages: number; }
export interface PendingReviewPayment { id: number; bookingId: number; bookingCode: string; provider: string; transactionReference: string; amountVnd: number; receivedAt: string; attempt: { purpose: string; requestedAmountVnd: number } | null; }
export interface RefundRequest { id: number; bookingId: number; bookingCode: string; companyId: number; companyName: string; requestedAmountVnd: number; approvedAmountVnd: number | null; status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected'; reason: string; decisionNote: string | null; createdAt: string; refundedVnd: number; refunds: { id: number; amountVnd: number; channel: string; transactionReference: string; refundedAt: string; evidenceUrl: string }[]; }
export interface AdminStatement { id: number; companyId: number; companyName: string; periodStart: string; periodEnd: string; cutoffAt: string; status: 'draft' | 'approved' | 'paying' | 'paid'; payableVnd: number; transferredVnd: number; remainingVnd: number; note: string | null; items: { bookingId: number; bookingCode: string; kind: string; retainedRevenueVnd: number; platformFeeVnd: number; heldAmountVnd: number; payableVnd: number }[]; }
export interface EligibleFinanceCompany { id: number; name: string; eligibleBookingCount: number; }

export const adminFinanceApi = {
  pendingReview: async (pageNumber = 0, size = 20) => unwrap(await apiClient.get<AdminPage<PendingReviewPayment>>(path('/admin/payments/pending-review'), { params: { page: pageNumber, size } })),
  verifyPendingPayment: async (id: number, body: { evidenceUrl: string; reason: string }, key: string) => unwrap(await apiClient.post(path(`/admin/payments/${id}/verify`), body, { headers: { 'Idempotency-Key': key } })),
  refunds: async (params: { status?: string; page?: number; size?: number }) => unwrap(await apiClient.get<AdminPage<RefundRequest>>(path('/admin/refund-requests'), { params })),
  decideRefund: async (id: number, body: { decision: 'approve' | 'reject'; approvedAmountVnd?: number; note: string }, key: string) => unwrap(await apiClient.post(path(`/admin/refund-requests/${id}/decision`), body, { headers: { 'Idempotency-Key': key } })),
  recordRefund: async (id: number, body: { amountVnd: number; channel: 'payos' | 'vnpay' | 'bank_transfer'; transactionReference: string; refundedAt: string; evidenceUrl: string }, key: string) => unwrap(await apiClient.post(path(`/admin/refund-requests/${id}/record-refund`), body, { headers: { 'Idempotency-Key': key } })),
  eligibleCompanies: async (params: { periodStart: string; periodEnd: string; page?: number; size?: number }) => unwrap(await apiClient.get<AdminPage<EligibleFinanceCompany>>(path('/admin/finance/companies'), { params })),
  statements: async (params: { status?: string; companyId?: number; page?: number; size?: number }) => unwrap(await apiClient.get<AdminPage<AdminStatement>>(path('/admin/statements'), { params })),
  createStatement: async (body: { companyId: number; periodStart: string; periodEnd: string; note?: string }, key: string) => unwrap(await apiClient.post(path('/admin/statements'), body, { headers: { 'Idempotency-Key': key } })),
  approveStatement: async (id: number, body: { note?: string }, key: string) => unwrap(await apiClient.post(path(`/admin/statements/${id}/approve`), body, { headers: { 'Idempotency-Key': key } })),
  recordTransfer: async (id: number, body: { amountVnd: number; bankReference: string; transferredAt: string; evidenceUrl: string }, key: string) => unwrap(await apiClient.post(path(`/admin/statements/${id}/transfers`), body, { headers: { 'Idempotency-Key': key } })),
};

