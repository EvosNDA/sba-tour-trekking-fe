import { Modal } from '../../../components/ui/Modal';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Paperclip, MoreHorizontal, Info } from 'lucide-react';
import { apiClient } from '../../../lib/axios';

type Policy = { id: number; code: string; title: string; kind: string; active: boolean; updatedAt?: string };
type Version = { id: number; versionNumber: number; content: string; effectiveFrom: string; revokedAt: string | null; revocationReason: string | null };
type Action = { type: 'status' | 'revoke' | 'delete'; policy: Policy; version?: Version };
const field = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-700/20';
const button = 'rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50';
const messageOf = (error: unknown) => {
  const e = error as {code?: string; message?: string};
  const messages: Record<string, string> = {
    POLICY_CODE_EXISTS: 'Mã điều khoản đã tồn tại. Chọn mã khác hoặc để hệ thống tự tạo.',
    POLICY_EFFECTIVE_FROM_OUT_OF_ORDER: 'Đã có phiên bản với thời điểm áp dụng muộn hơn. Hãy hủy bản đã lên lịch trước khi tạo bản thay thế áp dụng sớm hơn.',
    POLICY_NOT_PUBLISHABLE: 'Điều khoản đã ngừng áp dụng. Hãy kích hoạt lại trước khi thêm phiên bản.',
  };
  return messages[e.code || ''] || e.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.';
};
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
function PolicyEditorFields({content,setContent,immediate,setImmediate,effective,setEffective,fileName,extracting,extractFile,busy,selected,button,field,setAction,setReason}: any) {
  return <><label className="block text-sm font-medium">Nội dung *<textarea className={field + ' mt-1 min-h-48'} required rows={8} maxLength={100000} value={content} onChange={e => setContent(e.target.value)}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={immediate} onChange={e => setImmediate(e.target.checked)}/>Áp dụng ngay</label>{!immediate && <label className="block text-sm font-medium">Có hiệu lực từ<input className={field + ' mt-1'} required type="datetime-local" value={effective} onChange={e => setEffective(e.target.value)}/></label>}<label className="block text-sm font-medium">Tệp đính kèm (tùy chọn)<span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3"><Paperclip size={17}/><input className="min-h-0 border-0 p-0" type="file" accept=".pdf,.doc,.docx" disabled={busy || extracting} onChange={extractFile}/></span></label><p className="text-xs text-slate-500">{extracting ? 'Đang đọc nội dung…' : fileName ? `Đã đọc ${fileName}. Kiểm tra nội dung trước khi lưu.` : 'Word/PDF tối đa 5 MB. Nội dung file sẽ được đưa vào vùng soạn thảo.'}</p><div className="flex flex-wrap gap-3 pt-2"><button type="submit" disabled={busy || extracting || (selected && !selected.active)} className={button + ' bg-[#0B7058] text-white'}>{busy ? 'Đang lưu…' : selected ? 'Lưu phiên bản' : 'Tạo điều khoản'}</button>{selected && <button type="button" disabled={busy} className={button + ' border-[#0B7058] text-[#0B7058]'} onClick={() => {setAction({type:'status',policy:selected});setReason('');}}>{selected.active ? 'Ngừng áp dụng' : 'Kích hoạt lại'}</button>}</div></>;
}
export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<'create' | 'version' | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('general');
  const [code, setCode] = useState('');
  const [content, setContent] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [effective, setEffective] = useState('');
  const [immediate, setImmediate] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const load = async () => { const data = await apiClient.get<Policy[]>('/api/v1/admin/policies'); setPolicies(data); setSelected(s => s ?? data[0] ?? null); };
  useEffect(() => { load().catch(e => setError(messageOf(e))).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!selected) { setVersions([]); return; }
    let alive = true; setVersionLoading(true);
    apiClient.get<Version[]>(`/api/v1/admin/policies/${selected.id}/versions`).then(data => { if (alive) { setVersions(data); if (editor !== 'create') setContent(data.find(v => !v.revokedAt)?.content ?? data[0]?.content ?? ''); } }).catch(e => { if (alive) setError(messageOf(e)); }).finally(() => { if (alive) setVersionLoading(false); });
    return () => { alive = false; };
  }, [selected?.id]);
  const refreshVersions = async (id: number) => setVersions(await apiClient.get<Version[]>(`/api/v1/admin/policies/${id}/versions`));
  const rows = useMemo(() => policies, [policies]);
  const openEditor = (type: 'create' | 'version') => { setEditor(type); setTitle(''); setCode(''); setContent(''); setFileName(''); setEffective(''); setImmediate(false); setError(''); setMessage(''); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const version = { content: content.trim(), effectiveFrom: immediate ? new Date().toISOString() : new Date(effective).toISOString() };
      if (!version.content) throw new Error('Vui lòng nhập nội dung điều khoản.');
      if (editor === 'create') {
        if (!title.trim()) throw new Error('Vui lòng nhập tên điều khoản.');
        const policy = await apiClient.post<Policy>('/api/v1/admin/policies/with-version', { policy: { title: title.trim(), code: code.trim() || `DK-${crypto.randomUUID().slice(0, 12)}`, kind }, version });
        await load(); setSelected(policy); await refreshVersions(policy.id);
      } else if (selected) {
        await apiClient.post(`/api/v1/admin/policies/${selected.id}/versions`, version); await refreshVersions(selected.id);
      }
      setEditor(null); setMessage('Đã lưu điều khoản và nội dung phiên bản.');
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  };
  const extractFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File không được vượt quá 5 MB.'); return; }
    setExtracting(true); setError('');
    try {
      const form = new FormData(); form.append('file', file);
      const result = await apiClient.post<{content: string}>('/api/v1/admin/policies/extract-document', form);
      setContent(result.content); setFileName(file.name);
    } catch (e) { setError(messageOf(e)); } finally { setExtracting(false); }
  };
  const applyAction = async (e: React.FormEvent) => {
    e.preventDefault(); if (!action || (action.type !== 'delete' && !reason.trim())) return; setBusy(true); setError(''); setMessage('');
    try {
      if (action.type === 'delete') {
        await apiClient.delete(`/api/v1/admin/policies/${action.policy.id}`);
        setSelected(null); await load();
      } else if (action.type === 'status') {
        const policy = await apiClient.patch<Policy>(`/api/v1/admin/policies/${action.policy.id}/status`, {active: !action.policy.active, reason: reason.trim()});
        setSelected(p => p?.id === policy.id ? policy : p); await load();
      } else {
        await apiClient.post(`/api/v1/admin/policies/${action.policy.id}/versions/${action.version!.id}/revoke`, {reason: reason.trim()});
        await refreshVersions(action.policy.id);
      }
      setAction(null); setMessage(action.type === 'delete' ? 'Đã xóa điều khoản.' : 'Đã cập nhật trạng thái. Booking đã tạo vẫn giữ điều khoản lúc đặt.');
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  };
  const latestEffective = versions.find(v => new Date(v.effectiveFrom).getTime() <= Date.now() && !(v.revokedAt && new Date(v.revokedAt).getTime() < new Date(v.effectiveFrom).getTime()));
  const current = latestEffective?.revokedAt ? undefined : latestEffective;
  return <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-7 lg:px-8">
    <div className="flex flex-wrap items-start justify-between gap-3"><AdminPageHeader title="Điều khoản & lưu ý" description="Quản lý nội dung chính sách, phiên bản và thời gian áp dụng." /><span className="rounded-full bg-[#DCEFEB] px-4 py-2 text-sm font-semibold text-[#17453D]">Dữ liệu minh họa</span></div>
    <div><button className={button + ' bg-[#0B7058] text-white hover:bg-[#075743]'} onClick={() => openEditor('create')}><Plus className="mr-2 inline h-4 w-4"/>Tạo điều khoản</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{message}</p>}
    <div className="grid min-w-0 items-stretch gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="flex min-w-0 flex-col gap-5">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 lg:min-h-[650px]">
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#EEF1F4] text-slate-700"><tr><th className="p-3">Điều khoản</th><th className="p-3">Loại</th><th className="p-3">Phiên bản</th><th className="p-3">Trạng thái</th><th className="p-3">Cập nhật lúc</th><th className="p-3"><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải điều khoản…</td></tr> : rows.map(p => <tr key={p.id} onClick={() => {setSelected(p);setEditor(null);setError('');setMessage('');}} className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-emerald-50/70 ${selected?.id === p.id ? 'bg-[#E7F4F0]' : ''}`}><td className="p-3 font-semibold">{p.title}</td><td className="p-3 text-slate-600">{p.kind === 'cancellation' ? 'Đổi / hủy' : p.kind === 'payment' ? 'Thanh toán / phụ thu' : 'Lưu ý chung'}</td><td className="p-3">{p.id === selected?.id ? `v${versions[0]?.versionNumber ?? '—'}` : '—'}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.active ? 'bg-[#D5F0DD] text-[#176239]' : 'bg-rose-100 text-rose-800'}`}>{p.active ? 'Đang áp dụng' : 'Ngừng áp dụng'}</span></td><td className="p-3 text-slate-500">{formatDate(p.updatedAt)}</td><td className="p-3"><button type="button" aria-label={`Tùy chọn ${p.title}`} className="rounded-md p-1.5 hover:bg-slate-200" onClick={e => {e.stopPropagation();setAction({type:'status',policy:p});setReason('');}}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>
        {!loading && rows.length === 0 && <p className="py-10 text-center text-slate-500">Chưa có điều khoản.</p>}
      </section>
      <div className="flex items-center gap-3 rounded-xl bg-[#E6F2EF] px-4 py-3 text-sm text-slate-900"><Info className="h-5 w-5 shrink-0 text-[#08745B]"/><span><strong>Điều khoản</strong> là bản ghi chính sách; phiên bản là nội dung có hiệu lực theo thời điểm.</span></div>
      </div>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {editor === 'create' ? <form onSubmit={save} className="space-y-4"><h2 className="text-xl font-bold">Tạo điều khoản</h2><label className="block text-sm font-medium">Tiêu đề điều khoản *<input className={field + ' mt-1'} required maxLength={250} value={title} onChange={e => setTitle(e.target.value)}/></label><label className="block text-sm font-medium">Loại *<select className={field + ' mt-1'} value={kind} onChange={e => setKind(e.target.value)}><option value="general">Lưu ý chung</option><option value="payment">Thanh toán / phụ thu</option><option value="cancellation">Đổi / hủy</option></select></label><label className="block text-sm font-medium">Mã tham chiếu<input className={field + ' mt-1'} maxLength={80} placeholder="Để trống để tự tạo mã" value={code} onChange={e => setCode(e.target.value)}/></label><PolicyEditorFields {...{content,setContent,immediate,setImmediate,effective,setEffective,fileName,extracting,extractFile,busy,selected:null,button,field,setAction,setReason}} /></form> : selected ? <form onSubmit={save} className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Chi tiết phiên bản</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selected.active ? 'bg-[#D5F0DD] text-[#176239]' : 'bg-rose-100 text-rose-800'}`}>{selected.active ? 'Đang áp dụng' : 'Ngừng áp dụng'}</span></div><label className="block text-sm font-medium">Tiêu đề điều khoản *<input className={field + ' mt-1'} value={selected.title} readOnly/></label><label className="block text-sm font-medium">Loại *<select className={field + ' mt-1'} value={selected.kind} disabled><option value="general">Lưu ý chung</option><option value="payment">Thanh toán / phụ thu</option><option value="cancellation">Đổi / hủy</option></select></label><label className="block text-sm font-medium">Phiên bản *<input className={field + ' mt-1'} value={`v${versions[0]?.versionNumber ?? '—'}`} readOnly/></label>{versionLoading ? <p className="text-sm text-slate-500">Đang tải nội dung phiên bản…</p> : <PolicyEditorFields {...{content,setContent,immediate,setImmediate,effective,setEffective,fileName,extracting,extractFile,busy,selected,button,field,setAction,setReason}} />}</form> : <div className="flex min-h-80 flex-col items-center justify-center text-center"><FileText className="mb-3 text-emerald-800" size={32}/><h2 className="text-lg font-semibold">Chọn điều khoản</h2><p className="mt-1 text-sm text-slate-500">Chọn một dòng bên trái để xem và cập nhật phiên bản.</p></div>}
      </section>
    </div>
    {action && <Modal isOpen={Boolean(action)} preventClose={busy} onClose={() => setAction(null)} maxWidth="2xl" title={action.type === 'delete' ? 'Xóa điều khoản' : action.type === 'revoke' ? 'Hủy phiên bản' : action.policy.active ? 'Ngừng áp dụng điều khoản' : 'Kích hoạt lại điều khoản'}>{error && <p role="alert" className="mb-4 text-red-700">{error}</p>}<form onSubmit={applyAction} className="space-y-4">{action.type === 'delete' ? <p>Xóa “{action.policy.title}” khỏi danh sách và ẩn khỏi các tour liên quan. Booking đã tạo vẫn giữ điều khoản cũ.</p> : <><p>Thay đổi có hiệu lực đối với booking mới. Điều khoản của booking đã tạo được giữ nguyên.</p><label className="block">Lý do<textarea autoFocus className={field} required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label></>}<div className="flex justify-end gap-3"><button type="button" className={button} onClick={() => setAction(null)}>Đóng</button><button className={button + ' bg-rose-800 text-white'} disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận'}</button></div></form></Modal>}
  </div>;
}
