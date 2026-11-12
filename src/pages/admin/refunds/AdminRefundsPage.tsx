import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { paymentsApi } from '../../../features/payments/api/payments.api';
import type { RefundDetailResponse, RefundResponse, RefundStatus } from '../../../features/payments/types/payment.types';
import type { ApiError } from '../../../types/api.types';
import { formatDateTime, formatVND } from '../../../lib/utils';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<RefundStatus, string> = {
  requested: 'Chờ duyệt',
  approved: 'Đã duyệt, chờ chi',
  processing: 'Đang chi qua PayOS',
  completed: 'Đã hoàn',
  failed: 'Chi thất bại',
  rejected: 'Đã từ chối',
};

const STATUS_STYLE: Record<RefundStatus, string> = {
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-sky-50 text-sky-800 border-sky-200',
  processing: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
  rejected: 'bg-stone-100 text-stone-600 border-stone-200',
};

const CHANNEL_LABEL: Record<string, string> = {
  payos: 'PayOS',
  bank_transfer: 'Chuyển khoản tay',
  vnpay: 'VNPay',
};

const ERROR_MESSAGES: Record<string, string> = {
  REFUND_AMOUNT_INVALID: 'Số tiền duyệt phải lớn hơn 0 và không vượt quá số tiền theo chính sách.',
  REFUND_EXCEEDS_PAID: 'Số tiền duyệt vượt quá số tiền khách thực trả (sau các khoản đã hoàn).',
  REFUND_TRANSACTION_DUPLICATE: 'Mã giao dịch này đã được ghi nhận cho một khoản hoàn khác.',
  REFUND_SYNC_NOT_ALLOWED: 'Chỉ đồng bộ được yêu cầu đang chi qua PayOS.',
  REFUND_STATUS_INVALID: 'Trạng thái lọc không hợp lệ.',
  PAYOUT_PROVIDER_UNAVAILABLE: 'PayOS chi hộ chưa được cấu hình trên máy chủ. Hãy chuyển khoản tay rồi ghi nhận.',
};

const errorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError | undefined;
  return (apiError?.code && ERROR_MESSAGES[apiError.code]) || apiError?.message || fallback;
};

const fieldClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15';

function StatusBadge({ status }: { status: RefundStatus }) {
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status] ?? STATUS_STYLE.rejected}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <span className="shrink-0 text-stone-500">{label}</span>
      <span className="min-w-0 text-right font-medium text-stone-900 [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

export const AdminRefundsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<RefundResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RefundDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [verified, setVerified] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [confirmPayOs, setConfirmPayOs] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const result = await paymentsApi.listRefunds({ status: statusFilter || undefined, page, size: PAGE_SIZE });
      setRows(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalElements(result.totalElements ?? 0);
    } catch (error) {
      setRows([]);
      setListError(errorMessage(error, 'Không thể tải danh sách yêu cầu hoàn tiền.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const resetForms = (refund?: RefundResponse) => {
    setActionError(null);
    setApproveAmount(refund ? String(refund.requestedAmountVnd) : '');
    setApproveNote('');
    setVerified(false);
    setRejectNote('');
    setTransferRef('');
    setEvidenceUrl('');
    setTransferNote('');
    setConfirmPayOs(false);
  };

  const loadDetail = useCallback(async (refundId: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const result = await paymentsApi.getRefund(refundId);
      setDetail(result);
      resetForms(result.refund);
    } catch (error) {
      setDetail(null);
      setDetailError(errorMessage(error, 'Không thể tải chi tiết yêu cầu.'));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openRefund = (refundId: number) => {
    setSelectedId(refundId);
    setDetail(null);
    void loadDetail(refundId);
  };

  /** Runs a workflow action, then reloads the detail and the list so both show the new state. */
  const run = async (action: () => Promise<RefundResponse>, success: string, fallback: string) => {
    if (!detail) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await action();
      toast.success(success);
      await Promise.all([loadDetail(result.id), loadList()]);
    } catch (error) {
      setActionError(errorMessage(error, fallback));
    } finally {
      setBusy(false);
    }
  };

  const refund = detail?.refund;

  const approve = (event: React.FormEvent) => {
    event.preventDefault();
    if (!refund) return;
    const amount = Number(approveAmount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > refund.requestedAmountVnd) {
      setActionError(`Số tiền duyệt phải từ 1 đến ${formatVND(refund.requestedAmountVnd)}.`);
      return;
    }
    if (!verified) {
      setActionError('Xác nhận đã kiểm tra tài khoản nhận trước khi duyệt.');
      return;
    }
    void run(
      () => paymentsApi.approveRefund(refund.id, { approvedAmountVnd: amount, note: approveNote.trim() || undefined }),
      'Đã duyệt yêu cầu hoàn tiền.',
      'Không thể duyệt yêu cầu.'
    );
  };

  const reject = () => {
    if (!refund) return;
    if (!rejectNote.trim()) {
      setActionError('Nhập lý do từ chối để gửi cho khách.');
      return;
    }
    void run(() => paymentsApi.rejectRefund(refund.id, rejectNote.trim()), 'Đã từ chối yêu cầu hoàn tiền.', 'Không thể từ chối yêu cầu.');
  };

  const recordTransfer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!refund) return;
    if (!transferRef.trim()) {
      setActionError('Nhập mã giao dịch ngân hàng.');
      return;
    }
    if (evidenceUrl.trim() && !/^https?:\/\/\S+$/.test(evidenceUrl.trim())) {
      setActionError('Link biên lai phải bắt đầu bằng http:// hoặc https://.');
      return;
    }
    void run(
      () =>
        paymentsApi.recordManualTransfer(refund.id, {
          transactionReference: transferRef.trim(),
          evidenceUrl: evidenceUrl.trim() || undefined,
          note: transferNote.trim() || undefined,
        }),
      'Đã ghi nhận chuyển khoản hoàn tiền.',
      'Không thể ghi nhận chuyển khoản.'
    );
  };

  const startPayOs = () => {
    if (!refund) return;
    void run(() => paymentsApi.startPayOsPayout(refund.id), 'Đã gửi lệnh chi qua PayOS.', 'Không thể chi qua PayOS.');
  };

  const syncPayOs = () => {
    if (!refund) return;
    void run(() => paymentsApi.syncPayOsPayout(refund.id), 'Đã đồng bộ trạng thái PayOS.', 'Không thể đồng bộ PayOS.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-[#1C2526] sm:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F4E43] text-white">
              <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
            </span>
            Quản lý hoàn tiền
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">Duyệt yêu cầu hoàn khi khách huỷ tour, rồi chi tiền qua chuyển khoản tay hoặc PayOS.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadList()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Tỷ lệ hoàn theo thời điểm huỷ được đặt trong bậc hoàn tiền của chính sách huỷ.{' '}
          <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.POLICIES)} className="font-semibold underline underline-offset-2 hover:text-sky-700">
            Chỉnh ở trang Điều khoản
          </button>
          .
        </span>
      </p>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
            <div>
              <h2 className="font-bold text-stone-900">Yêu cầu hoàn tiền</h2>
              <p className="mt-0.5 text-xs text-stone-500">{totalElements} yêu cầu</p>
            </div>
            <select
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RefundStatus | '');
                setPage(0);
              }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
            >
              <option value="">Tất cả trạng thái</option>
              {(Object.keys(STATUS_LABEL) as RefundStatus[]).map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1F4E43]" aria-label="Đang tải" />
            </div>
          ) : listError ? (
            <div className="space-y-3 p-8 text-center">
              <p role="alert" className="text-sm text-rose-700">{listError}</p>
              <button type="button" onClick={() => void loadList()} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                Thử lại
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="mx-auto h-9 w-9 text-stone-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-stone-700">{statusFilter ? 'Không có yêu cầu ở trạng thái này' : 'Chưa có yêu cầu hoàn tiền'}</p>
              <p className="mt-1 text-xs text-stone-500">Yêu cầu được tạo tự động khi khách huỷ một booking đã thanh toán.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => openRefund(row.id)}
                    aria-current={selectedId === row.id}
                    className={`flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-[#F7F8F4] ${selectedId === row.id ? 'bg-[#F1F7F3]' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-800">#{row.id}</span>
                        <span className="text-xs text-stone-500">Booking #{row.bookingId}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-stone-500">
                        {formatDateTime(row.createdAt)}
                        {row.bankName || row.accountNumberMasked ? ` · ${row.bankName ?? ''} ${row.accountNumberMasked ?? ''}` : ''}
                        {row.refundPercent != null ? ` · ${row.refundPercent}%` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <strong className="text-sm tabular-nums text-stone-900">{formatVND(row.approvedAmountVnd ?? row.requestedAmountVnd)}</strong>
                      <ChevronRight className="h-4 w-4 text-stone-400" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-xs text-stone-600">
              <span>
                Trang {page + 1}/{totalPages}
              </span>
              <div className="flex gap-2">
                <button type="button" aria-label="Trang trước" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-stone-300 p-1.5 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Trang sau" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-stone-300 p-1.5 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E6E1D8] bg-white" aria-live="polite">
          {selectedId == null ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <ShieldCheck className="h-9 w-9 text-stone-300" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-bold text-stone-800">Chọn một yêu cầu</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">Số tài khoản đầy đủ chỉ hiện cho nhân viên có quyền duyệt hoàn tiền.</p>
            </div>
          ) : detailLoading && !detail ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#1F4E43]" aria-label="Đang tải" />
            </div>
          ) : detailError || !detail || !refund ? (
            <div className="space-y-3 p-8 text-center">
              <p role="alert" className="text-sm text-rose-700">{detailError ?? 'Không có dữ liệu.'}</p>
              <button type="button" onClick={() => void loadDetail(selectedId)} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                Thử lại
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone-500">Yêu cầu #{refund.id}</p>
                  <h2 className="mt-1 text-lg font-bold text-stone-900">Booking {detail.bookingCode}</h2>
                  <div className="mt-2">
                    <StatusBadge status={refund.status} />
                  </div>
                </div>
                <button type="button" aria-label="Đóng chi tiết" onClick={() => { setSelectedId(null); setDetail(null); }} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-xl bg-[#F7F8F4] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{refund.approvedAmountVnd != null ? 'Số tiền đã duyệt' : 'Số tiền theo chính sách'}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#1F4E43]">{formatVND(refund.approvedAmountVnd ?? refund.requestedAmountVnd)}</p>
                  <div className="mt-2 divide-y divide-stone-200/70">
                    <Row label="Khách đã trả">{formatVND(refund.paidAmountVnd)}</Row>
                    <Row label="Tỷ lệ hoàn">
                      {refund.refundPercent != null ? `${refund.refundPercent}%` : 'Chưa có bậc hoàn, xét theo chính sách'}
                      {refund.hoursBeforeDeparture != null ? ` · huỷ trước ${Math.max(0, refund.hoursBeforeDeparture)} giờ` : ''}
                    </Row>
                    {refund.approvedAmountVnd != null && refund.approvedAmountVnd !== refund.requestedAmountVnd && (
                      <Row label="Theo chính sách">{formatVND(refund.requestedAmountVnd)}</Row>
                    )}
                    <Row label="Gửi lúc">{formatDateTime(refund.createdAt)}</Row>
                    {refund.approvedAt && <Row label="Duyệt lúc">{formatDateTime(refund.approvedAt)}</Row>}
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-stone-800">Tài khoản nhận</h3>
                    {detail.recipientFromPayment && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Tài khoản đã khoá theo người thanh toán
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 px-3 py-1">
                    <Row label="Ngân hàng">{refund.bankName || '—'}{detail.bankBin ? ` (BIN ${detail.bankBin})` : ''}</Row>
                    <Row label="Số tài khoản"><span className="font-mono">{detail.accountNumber || refund.accountNumberMasked || '—'}</span></Row>
                    <Row label="Chủ tài khoản">{detail.accountHolderName || '—'}</Row>
                  </div>
                  {!detail.accountNumber && (refund.status === 'completed' || refund.status === 'rejected') && (
                    <p className="mt-1 text-[11px] text-stone-500">Thông tin tài khoản đầy đủ đã được xoá sau khi đóng yêu cầu.</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-bold text-stone-800">Lý do khách huỷ</h3>
                  <p className="rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-700">{detail.reason || '—'}</p>
                </div>

                {(refund.decisionNote || refund.payoutChannel || refund.payoutState || detail.transactionReference) && (
                  <div>
                    <h3 className="mb-1 text-xs font-bold text-stone-800">Xử lý</h3>
                    <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 px-3 py-1">
                      {refund.decisionNote && <Row label="Ghi chú">{refund.decisionNote}</Row>}
                      {refund.payoutChannel && <Row label="Kênh chi">{CHANNEL_LABEL[refund.payoutChannel] ?? refund.payoutChannel}</Row>}
                      {refund.payoutState && <Row label="Trạng thái PayOS">{refund.payoutState}</Row>}
                      {detail.payoutReferenceId && <Row label="Mã tham chiếu chi"><span className="font-mono">{detail.payoutReferenceId}</span></Row>}
                      {detail.transactionReference && <Row label="Mã giao dịch"><span className="font-mono">{detail.transactionReference}</span></Row>}
                      {detail.evidenceUrl && (
                        <Row label="Biên lai">
                          <a href={detail.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1F4E43] underline">
                            Mở <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </Row>
                      )}
                    </div>
                  </div>
                )}

                {actionError && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {actionError}
                  </p>
                )}

                {refund.status === 'requested' && (
                  <div className="space-y-4 border-t border-stone-200 pt-4">
                    <form onSubmit={approve} className="space-y-3" noValidate>
                      <h3 className="text-sm font-bold text-stone-900">Duyệt hoàn tiền</h3>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Số tiền duyệt (VND)</span>
                        <input type="number" inputMode="numeric" min={1} max={refund.requestedAmountVnd} step={1} value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} className={fieldClass} />
                        <span className="mt-1 block text-[11px] text-stone-500">Tối đa {formatVND(refund.requestedAmountVnd)} theo chính sách. Chỉ được giảm, không được tăng.</span>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Ghi chú (không bắt buộc)</span>
                        <input value={approveNote} maxLength={1000} onChange={(e) => setApproveNote(e.target.value)} className={fieldClass} />
                      </label>
                      <label className="flex items-start gap-2 text-xs leading-relaxed text-stone-700">
                        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5 accent-[#1F4E43]" />
                        Tôi đã kiểm tra ngân hàng, số tài khoản và tên chủ tài khoản.
                      </label>
                      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F4E43] px-4 py-3 text-sm font-bold text-white hover:bg-[#173B32] disabled:opacity-50">
                        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        Duyệt yêu cầu
                      </button>
                    </form>
                    <div className="space-y-2 rounded-xl border border-rose-200 p-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Lý do từ chối (gửi cho khách)</span>
                        <input value={rejectNote} maxLength={1000} onChange={(e) => setRejectNote(e.target.value)} className={fieldClass} />
                      </label>
                      <button type="button" disabled={busy} onClick={reject} className="w-full rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                        Từ chối yêu cầu
                      </button>
                    </div>
                  </div>
                )}

                {refund.status === 'approved' && (
                  <div className="space-y-4 border-t border-stone-200 pt-4">
                    <h3 className="text-sm font-bold text-stone-900">Chi tiền hoàn {formatVND(refund.approvedAmountVnd ?? refund.requestedAmountVnd)}</h3>
                    {refund.payoutState && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        Lần chi PayOS trước không thành công ({refund.payoutState}). Có thể thử lại hoặc chuyển khoản tay.
                      </p>
                    )}

                    {detail.payosPayoutAvailable ? (
                      confirmPayOs ? (
                        <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                          <p className="text-xs leading-relaxed text-amber-900">
                            PayOS sẽ chuyển <strong>{formatVND(refund.approvedAmountVnd ?? refund.requestedAmountVnd)}</strong> tới {refund.bankName} {detail.accountNumber || refund.accountNumberMasked}. Đây là giao dịch thật.
                          </p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setConfirmPayOs(false)} className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900">
                              Quay lại
                            </button>
                            <button type="button" disabled={busy} onClick={startPayOs} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                              Xác nhận chi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => setConfirmPayOs(true)} className="w-full rounded-xl bg-[#1F4E43] px-4 py-3 text-sm font-bold text-white hover:bg-[#173B32] disabled:opacity-50">
                          Chi qua PayOS
                        </button>
                      )
                    ) : (
                      <p className="text-[11px] text-stone-500">PayOS chi hộ chưa được cấu hình trên máy chủ, hãy chuyển khoản tay rồi ghi nhận bên dưới.</p>
                    )}

                    <form onSubmit={recordTransfer} className="space-y-3 rounded-xl border border-stone-200 p-3" noValidate>
                      <p className="text-xs font-bold text-stone-800">Ghi nhận chuyển khoản tay</p>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Mã giao dịch ngân hàng *</span>
                        <input value={transferRef} maxLength={200} onChange={(e) => setTransferRef(e.target.value)} className={`${fieldClass} font-mono`} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Link biên lai (không bắt buộc)</span>
                        <input type="url" value={evidenceUrl} maxLength={2000} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" className={fieldClass} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-stone-700">Ghi chú (không bắt buộc)</span>
                        <input value={transferNote} maxLength={1000} onChange={(e) => setTransferNote(e.target.value)} className={fieldClass} />
                      </label>
                      <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50">
                        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        Ghi nhận đã chuyển
                      </button>
                    </form>
                  </div>
                )}

                {refund.status === 'processing' && (
                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <p className="text-xs leading-relaxed text-stone-700">
                      Lệnh chi PayOS đang xử lý. Bấm đồng bộ để lấy kết quả mới nhất; nếu PayOS báo thất bại, yêu cầu quay về “Đã duyệt” để chi lại.
                    </p>
                    <button type="button" disabled={busy} onClick={syncPayOs} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F4E43] px-4 py-3 text-sm font-bold text-white hover:bg-[#173B32] disabled:opacity-50">
                      <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
                      Đồng bộ PayOS
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminRefundsPage;
