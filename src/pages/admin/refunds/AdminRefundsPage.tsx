import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  BadgeCheck,
  Banknote,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import { paymentsApi } from '../../../features/payments/api/payments.api';
import type {
  RefundRequestDetail,
  RefundRequestSummary,
  RefundRuleTier,
  RefundStatus,
} from '../../../features/payments/types/payment.types';
import type { ApiError } from '../../../types/api.types';
import { formatDateTime, formatVND } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

type Tab = 'requests' | 'policy';

const STATUS_LABEL: Record<RefundStatus, string> = {
  requested: 'Chờ duyệt',
  approved: 'Đã duyệt',
  processing: 'Đang chuyển khoản',
  completed: 'Đã hoàn',
  failed: 'Chưa chuyển được',
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

const localDateTimeValue = (value: Date) => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const starterTiers: RefundRuleTier[] = [
  { minimumHoursBeforeDeparture: 168, refundPercent: 100 },
  { minimumHoursBeforeDeparture: 72, refundPercent: 50 },
  { minimumHoursBeforeDeparture: 0, refundPercent: 0 },
];

export const AdminRefundsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<RefundRequestSummary[]>([]);
  const [selected, setSelected] = useState<RefundRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);
  const [confirmApproval, setConfirmApproval] = useState(false);
  const [verifiedDestination, setVerifiedDestination] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'all'>('all');
  const [rules, setRules] = useState<RefundRuleTier[]>(starterTiers);
  const [effectiveFrom, setEffectiveFrom] = useState(() => localDateTimeValue(new Date(Date.now() + 24 * 60 * 60_000)));
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [currentEffectiveFrom, setCurrentEffectiveFrom] = useState<string | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setRequests(await paymentsApi.getRefundRequests());
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Không thể tải danh sách yêu cầu hoàn tiền.');
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const response = await paymentsApi.getRefundRules();
      if (response) {
        setRules(response.rules);
        setCurrentVersion(response.versionId);
        setCurrentEffectiveFrom(response.effectiveFrom);
      } else {
        setCurrentVersion(null);
        setCurrentEffectiveFrom(null);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setRulesError(apiError.message || 'Không thể tải chính sách hoàn tiền.');
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => { void loadRequests(); }, []);
  useEffect(() => { if (tab === 'policy') void loadRules(); }, [tab]);

  const visibleRequests = useMemo(
    () => requests.filter((request) => statusFilter === 'all' || request.status === statusFilter),
    [requests, statusFilter]
  );

  const openRequest = async (request: RefundRequestSummary) => {
    setSelected(null);
    setDetailLoading(true);
    setConfirmApproval(false);
    setVerifiedDestination(false);
    setRejectNote('');
    try {
      setSelected(await paymentsApi.getRefundRequest(request.id));
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Không thể tải chi tiết yêu cầu.');
    } finally {
      setDetailLoading(false);
    }
  };

  const approve = async () => {
    if (!selected || !verifiedDestination) return;
    setSavingDecision(true);
    try {
      await paymentsApi.approveRefund(selected.id);
      toast.success('Đã duyệt yêu cầu và gửi lệnh chuyển khoản.');
      setSelected(null);
      setConfirmApproval(false);
      await loadRequests();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === 'PAYOUT_PROVIDER_UNAVAILABLE') {
        toast.error('Chưa thể chuyển tiền tự động. Yêu cầu vẫn đang chờ duyệt.');
      } else {
        toast.error(apiError.message || 'Không thể duyệt yêu cầu hoàn tiền.');
      }
    } finally {
      setSavingDecision(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    setSavingDecision(true);
    try {
      await paymentsApi.rejectRefund(selected.id, rejectNote.trim());
      toast.success('Đã từ chối yêu cầu hoàn tiền.');
      setSelected(null);
      await loadRequests();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Không thể từ chối yêu cầu hoàn tiền.');
    } finally {
      setSavingDecision(false);
    }
  };

  const changeTier = (index: number, key: keyof RefundRuleTier, value: string) => {
    setRules((current) => current.map((tier, i) => i === index
      ? { ...tier, [key]: value === '' ? 0 : Number(value) }
      : tier));
  };

  const saveRules = async (event: React.FormEvent) => {
    event.preventDefault();
    const thresholds = rules.map((tier) => tier.minimumHoursBeforeDeparture);
    if (!rules.some((tier) => tier.minimumHoursBeforeDeparture === 0)) {
      setRulesError('Cần có một mốc 0 giờ làm quy tắc dự phòng.');
      return;
    }
    if (new Set(thresholds).size !== thresholds.length) {
      setRulesError('Các mốc thời gian phải khác nhau.');
      return;
    }
    if (rules.some((tier) => tier.minimumHoursBeforeDeparture < 0 || tier.refundPercent < 0 || tier.refundPercent > 100)) {
      setRulesError('Số giờ phải từ 0 trở lên, tỷ lệ hoàn trong khoảng 0–100%.');
      return;
    }
    setSavingRules(true);
    setRulesError(null);
    try {
      const saved = await paymentsApi.saveRefundRules({
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        rules: [...rules].sort((a, b) => b.minimumHoursBeforeDeparture - a.minimumHoursBeforeDeparture),
      });
      setCurrentVersion(saved.versionId);
      setCurrentEffectiveFrom(saved.effectiveFrom);
      toast.success('Đã lưu quy định hoàn tiền.');
    } catch (error) {
      const apiError = error as ApiError;
      setRulesError(apiError.message || 'Không thể lưu chính sách.');
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans">
      <div className="space-y-2">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
          <span>Quản trị WeTrek</span><ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-900">Hoàn tiền</span>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-[#1C2526] sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F4E43] text-white"><ArrowDownLeft className="h-5 w-5" /></span>
              Quản lý hoàn tiền
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">Xử lý yêu cầu hoàn tiền khi khách hủy tour và điều chỉnh quy định hoàn tiền.</p>
          </div>
          {tab === 'requests' && <button type="button" onClick={() => void loadRequests()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"><RefreshCw className="h-4 w-4" />Làm mới</button>}
        </div>
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        {([['requests', 'Yêu cầu hoàn'], ['policy', 'Chính sách hoàn']] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? 'border-[#1F4E43] text-[#1F4E43]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>{label}</button>
        ))}
      </div>

      {tab === 'requests' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
              <div><h2 className="font-bold text-stone-900">Danh sách yêu cầu</h2><p className="mt-1 text-xs text-stone-500">{requests.length} yêu cầu</p></div>
              <select aria-label="Lọc trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RefundStatus | 'all')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs">
                <option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {loading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-[#1F4E43]" /></div> : visibleRequests.length === 0 ? (
              <div className="p-12 text-center"><Banknote className="mx-auto h-9 w-9 text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-700">Chưa có yêu cầu hoàn tiền</p><p className="mt-1 text-xs text-stone-500">Yêu cầu sẽ xuất hiện sau khi khách hủy lượt đặt và gửi thông tin nhận tiền.</p></div>
            ) : (
              <div className="divide-y divide-stone-100">
                {visibleRequests.map((request) => (
                  <button key={request.id} type="button" onClick={() => void openRequest(request)} className={`flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-[#F7F8F4] sm:flex-row sm:items-center sm:justify-between ${selected?.id === request.id ? 'bg-[#F1F7F3]' : ''}`}>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-stone-800">#{request.id}</span><span className="text-xs text-stone-500">Lượt đặt #{request.bookingId}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[request.status]}`}>{STATUS_LABEL[request.status]}</span></div><p className="mt-2 text-xs text-stone-500">Gửi {formatDateTime(request.createdAt)} · Tài khoản ····{request.recipientAccountLast4 || '—'}</p></div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="text-sm text-stone-900">{formatVND(request.approvedAmountVnd ?? request.requestedAmountVnd)}</strong><ChevronRight className="h-4 w-4 text-stone-400" /></div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E6E1D8] bg-white shadow-xs">
            {!selected && !detailLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><ShieldCheck className="h-9 w-9 text-stone-300" /><h2 className="mt-3 text-sm font-bold text-stone-800">Chọn một yêu cầu</h2><p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">Thông tin tài khoản chỉ hiển thị cho nhân viên có quyền duyệt hoàn tiền.</p></div>
            ) : detailLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1F4E43]" /></div> : selected && (
              <div>
              <div className="flex items-start justify-between border-b border-stone-200 p-5"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-500">Yêu cầu #{selected.id}</p><h2 className="mt-1 text-lg font-bold text-stone-900">Lượt đặt #{selected.bookingId}</h2></div><button type="button" aria-label="Đóng chi tiết" onClick={() => setSelected(null)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"><X className="h-4 w-4" /></button></div>
                <div className="space-y-5 p-5">
                  <div className="flex items-center justify-between"><span className="text-xs text-stone-500">Trạng thái</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span></div>
                  <div className="rounded-xl bg-[#F7F8F4] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Số tiền đề nghị hoàn</p><p className="mt-1 text-2xl font-extrabold text-[#1F4E43]">{formatVND(selected.approvedAmountVnd ?? selected.requestedAmountVnd)}</p><p className="mt-1 text-xs text-stone-500">Lượt đặt #{selected.bookingId}</p></div>
                  <div className="space-y-2 text-xs"><p className="font-bold text-stone-800">Thông tin nhận tiền</p><div className="rounded-xl border border-stone-200 p-3"><p><span className="text-stone-500">Mã ngân hàng:</span> <strong className="font-mono">{selected.bankBin || 'Đã xóa'}</strong></p><p className="mt-1"><span className="text-stone-500">Tên chủ tài khoản:</span> <strong>{selected.accountHolderName || 'Đã xóa'}</strong></p><p className="mt-1"><span className="text-stone-500">Số tài khoản:</span> <strong className="font-mono">{selected.accountNumber || 'Đã xóa'}</strong></p><p className="mt-2 inline-flex items-center gap-1 text-amber-800"><AlertCircle className="h-3.5 w-3.5" />Cần kiểm tra thông tin này trước khi duyệt</p></div></div>
                  <div className="space-y-1 text-xs"><p className="font-bold text-stone-800">Lý do khách hủy</p><p className="rounded-xl bg-stone-50 p-3 leading-relaxed text-stone-600">{selected.reason}</p></div>
                  {selected.status === 'requested' && !confirmApproval && (
                    <div className="space-y-3 border-t border-stone-200 pt-4"><label className="flex items-start gap-2 text-xs leading-relaxed text-stone-600"><input type="checkbox" checked={verifiedDestination} onChange={(e) => setVerifiedDestination(e.target.checked)} className="mt-0.5 accent-[#1F4E43]" />Tôi đã kiểm tra tên chủ tài khoản, ngân hàng và số tài khoản nhận.</label><button type="button" disabled={!verifiedDestination} onClick={() => setConfirmApproval(true)} className="w-full rounded-xl bg-[#1F4E43] px-4 py-3 text-xs font-bold text-white hover:bg-[#173B32] disabled:cursor-not-allowed disabled:opacity-40">Duyệt yêu cầu hoàn tiền</button><div className="flex gap-2"><input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} maxLength={1000} placeholder="Lý do từ chối (không bắt buộc)" className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-xs" /><button type="button" disabled={savingDecision} onClick={() => void reject()} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">Từ chối</button></div></div>
                  )}
                  {selected.status === 'requested' && confirmApproval && (
                    <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-950">Xác nhận chuyển khoản</p><p className="text-xs leading-relaxed text-amber-900">Yêu cầu này sẽ chuyển <strong>{formatVND(selected.requestedAmountVnd)}</strong> đến tài khoản bên trên. Đây có thể là giao dịch thật.</p><div className="flex gap-2"><button type="button" onClick={() => setConfirmApproval(false)} className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900">Quay lại</button><button type="button" disabled={savingDecision} onClick={() => void approve()} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{savingDecision && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Xác nhận duyệt</button></div></div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={saveRules} className="space-y-5 rounded-2xl border border-[#E6E1D8] bg-white p-5 shadow-xs sm:p-6">
            <div><h2 className="text-lg font-bold text-stone-900">Các mốc hoàn tiền</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">Chọn thời gian còn lại trước ngày khởi hành và tỷ lệ hoàn tương ứng. Ví dụ: 168 giờ là trước ít nhất 7 ngày. Mốc 0 giờ áp dụng khi còn ít thời gian hơn các mốc khác. Các tỷ lệ điền sẵn chỉ để tham khảo.</p></div>
            {rulesLoading ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : <>
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_1fr_44px] gap-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:grid"><span>Còn lại trước ngày đi (giờ)</span><span>Tỷ lệ hoàn</span><span /></div>
                {rules.map((tier, index) => (
                  <div key={index} className="grid grid-cols-2 items-center gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[1fr_1fr_44px] sm:border-0 sm:p-0">
                    <label className="text-[10px] font-bold uppercase text-stone-500 sm:hidden">Số giờ còn lại</label><input aria-label={`Số giờ mốc ${index + 1}`} type="number" min="0" step="1" value={tier.minimumHoursBeforeDeparture} onChange={(e) => changeTier(index, 'minimumHoursBeforeDeparture', e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm" />
                    <label className="text-[10px] font-bold uppercase text-stone-500 sm:hidden">Tỷ lệ hoàn (%)</label><div className="relative"><input aria-label={`Tỷ lệ hoàn mốc ${index + 1}`} type="number" min="0" max="100" step="0.01" value={tier.refundPercent} onChange={(e) => changeTier(index, 'refundPercent', e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2.5 pr-8 text-sm" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">%</span></div>
                    <button type="button" title="Xóa mốc" disabled={tier.minimumHoursBeforeDeparture === 0} onClick={() => setRules((current) => current.filter((_, i) => i !== index))} className="col-span-2 justify-self-end rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700 disabled:invisible sm:col-span-1"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setRules((current) => [...current, { minimumHoursBeforeDeparture: 24, refundPercent: 0 }])} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"><Plus className="h-3.5 w-3.5" />Thêm mốc</button>
              <div className="max-w-sm"><label htmlFor="refund-effective-from" className="mb-1.5 block text-xs font-bold text-stone-800">Bắt đầu áp dụng từ</label><input id="refund-effective-from" type="datetime-local" required value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm" /><p className="mt-1 text-[11px] text-stone-500">Chọn thời điểm trong tương lai. Khách đặt sau thời điểm này sẽ áp dụng quy định mới.</p></div>
              {rulesError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{rulesError}</p>}
              <div className="flex justify-end border-t border-stone-200 pt-4"><button type="submit" disabled={savingRules || rulesLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#1F4E43] px-5 py-3 text-xs font-bold text-white hover:bg-[#173B32] disabled:opacity-60">{savingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Lưu quy định</button></div>
            </>}
          </form>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#B7D2C8] bg-[#F1F7F3] p-5"><div className="flex items-center gap-2 text-[#1F4E43]"><BadgeCheck className="h-5 w-5" /><h3 className="text-sm font-bold">Quy định hiện tại</h3></div>{currentVersion ? <><p className="mt-4 text-xl font-bold text-stone-900">Lần cập nhật {currentVersion}</p><p className="mt-1 text-xs text-stone-600">Từ {currentEffectiveFrom ? formatDateTime(currentEffectiveFrom) : '—'}</p></> : <p className="mt-3 text-xs leading-relaxed text-stone-600">Chưa có quy định hoàn tiền. Hãy lưu quy định trước khi nhận yêu cầu hoàn từ khách.</p>}</div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-900"><Clock3 className="h-4 w-4" /><h3 className="text-xs font-bold">Thay đổi quy định</h3></div><p className="mt-2 text-xs leading-relaxed text-amber-900">Quy định mới chỉ áp dụng cho lượt đặt sau thời điểm bắt đầu. Các lượt đặt trước đó tiếp tục theo quy định đã áp dụng khi khách đặt.</p></div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex items-center gap-2 text-stone-800"><Check className="h-4 w-4 text-[#1F4E43]" /><h3 className="text-xs font-bold">Cách tính tiền hoàn</h3></div><p className="mt-2 text-xs leading-relaxed text-stone-600">Tỷ lệ được tính trên số tiền khách đã trả còn lại sau những khoản đã hoàn hoặc đang xử lý. Nhân viên duyệt theo số tiền hiển thị.</p></div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminRefundsPage;
