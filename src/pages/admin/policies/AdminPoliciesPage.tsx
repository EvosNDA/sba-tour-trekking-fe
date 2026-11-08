import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, ArrowLeft, FileText, X } from 'lucide-react';
import { apiClient } from '../../../lib/axios';

type Policy = { id: number; code: string; title: string; kind: string; active: boolean };
type Version = { id: number; versionNumber: number; content: string; effectiveFrom: string; revokedAt: string | null; revocationReason: string | null };
type Action = { type: 'status' | 'revoke' | 'delete'; policy: Policy; version?: Version };
const field = 'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-700/20';
const button = 'rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50';
const messageOf = (error: unknown) => {
  const e = error as {code?: string; message?: string};
  const messages: Record<string, string> = {
    POLICY_CODE_EXISTS: 'Mã điều khoản đã tồn tại. Chọn mã khác hoặc để hệ thống tự tạo.',
    POLICY_EFFECTIVE_FROM_OUT_OF_ORDER: 'Đã có phiên bản với thời điểm áp dụng muộn hơn. Hãy hủy bản đã lên lịch trước khi tạo bản thay thế áp dụng sớm hơn.',
    POLICY_NOT_PUBLISHABLE: 'Điều khoản đã ngừng áp dụng. Hãy kích hoạt lại trước khi thêm phiên bản.',
  };
  return messages[e.code || ''] || e.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.';
};
const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN');
export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
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
  const [immediate, setImmediate] = useState(true);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const load = async () => { const data = await apiClient.get<Policy[]>('/api/v1/admin/policies'); setPolicies(data); };
  useEffect(() => { load().catch(e => setError(messageOf(e))).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!selected) { setVersions([]); return; }
    let alive = true; setVersionLoading(true);
    apiClient.get<Version[]>(`/api/v1/admin/policies/${selected.id}/versions`).then(data => { if (alive) setVersions(data); }).catch(e => { if (alive) setError(messageOf(e)); }).finally(() => { if (alive) setVersionLoading(false); });
    return () => { alive = false; };
  }, [selected?.id]);
  const refreshVersions = async (id: number) => setVersions(await apiClient.get<Version[]>(`/api/v1/admin/policies/${id}/versions`));
  const rows = useMemo(() => policies.filter(p => (filter === 'all' || p.active === (filter === 'active')) && `${p.title} ${p.code}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))), [policies, query, filter]);
  const openEditor = (type: 'create' | 'version') => { setEditor(type); setTitle(''); setCode(''); setContent(''); setFileName(''); setEffective(''); setImmediate(true); setError(''); setMessage(''); };
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
  return <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Điều khoản & lưu ý</h1><p className="mt-2 text-base text-stone-600">Quản lý nội dung và thời gian áp dụng cho tour.</p></div><button className={button + ' bg-emerald-900 text-white'} onClick={() => openEditor('create')}><Plus className="mr-2 inline h-4 w-4"/>Tạo điều khoản</button></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{message}</p>}
    {!selected ? <section className="rounded-2xl border border-stone-200 bg-white p-6"><div className="mb-5 flex flex-wrap gap-3"><label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3.5 h-5 w-5 text-stone-400"/><input aria-label="Tìm điều khoản" placeholder="Tìm tên hoặc mã điều khoản" className={field + ' pl-11'} value={query} onChange={e => {setQuery(e.target.value);setPage(0);}}/></label><select aria-label="Trạng thái điều khoản" className={field + ' sm:w-56'} value={filter} onChange={e => {setFilter(e.target.value);setPage(0);}}><option value="all">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã ngừng áp dụng</option></select></div>
      {loading ? <p>Đang tải điều khoản...</p> : <><div className="overflow-x-auto"><table className="w-full text-left text-base"><thead className="border-b text-sm text-stone-500"><tr><th className="p-3">Điều khoản</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.slice(page * 10, page * 10 + 10).map(p => <tr key={p.id} className="border-b border-stone-100"><td className="p-3"><strong>{p.title}</strong><p className="mt-1 text-sm text-stone-500">{p.code}</p></td><td className="p-3"><span className={p.active ? 'text-emerald-800' : 'text-stone-500'}>{p.active ? 'Đang hoạt động' : 'Đã ngừng áp dụng'}</span></td><td className="space-x-2 whitespace-nowrap p-3"><button className={button} onClick={() => {setSelected(p);setError('');setMessage('');}}>Xem / Cập nhật</button><button className={button} onClick={() => {setAction({type:'status', policy:p});setReason('');}}>{p.active ? 'Ngừng áp dụng' : 'Kích hoạt lại'}</button><button className={button + ' text-rose-700'} onClick={() => {setAction({type:'delete', policy:p});setReason('');setError('');}}>Xóa</button></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="py-10 text-center text-stone-500">Không tìm thấy điều khoản.</p>}<div className="mt-5 flex items-center justify-between"><span className="text-sm text-stone-500">{rows.length} điều khoản</span><div className="space-x-2"><button className={button} disabled={page === 0} onClick={() => setPage(p => p-1)}>Trước</button><span>{page+1} / {Math.max(1, Math.ceil(rows.length/10))}</span><button className={button} disabled={(page+1)*10 >= rows.length} onClick={() => setPage(p => p+1)}>Sau</button></div></div></>}
    </section> : <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6"><button className="text-sm font-semibold text-emerald-900" onClick={() => {setSelected(null);setMessage('');}}><ArrowLeft className="mr-2 inline h-4 w-4"/>Danh sách điều khoản</button><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">{selected.title}</h2><p className="mt-1 text-sm text-stone-500">{selected.code} · {selected.active ? 'Đang hoạt động' : 'Đã ngừng áp dụng'}</p></div><div className="space-x-2"><button className={button} disabled={!selected.active} onClick={() => openEditor('version')}>Thêm phiên bản</button><button className={button} onClick={() => {setAction({type:'status',policy:selected});setReason('');}}>{selected.active ? 'Ngừng áp dụng ngay' : 'Kích hoạt lại'}</button><button className={button + ' text-rose-700'} onClick={() => {setAction({type:'delete',policy:selected});setReason('');setError('');}}>Xóa</button></div></div>
      {versionLoading ? <p>Đang tải phiên bản...</p> : versions.length === 0 ? <p>Chưa có phiên bản nội dung.</p> : versions.map(v => <article key={v.id} className="rounded-xl border border-stone-200 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold"><FileText className="mr-2 inline h-5 w-5"/>Phiên bản {v.versionNumber}</h3><span className="rounded-full bg-stone-100 px-3 py-1 text-sm">{v.revokedAt ? 'Đã hủy' : !selected.active ? 'Đã ngừng áp dụng' : new Date(v.effectiveFrom).getTime() > Date.now() ? 'Chờ hiệu lực' : current?.id === v.id ? 'Đang hiệu lực' : 'Phiên bản cũ'}</span></div><p className="mt-2 text-sm text-stone-500">Có hiệu lực từ {formatDate(v.effectiveFrom)}</p><p className="my-4 whitespace-pre-wrap text-base leading-relaxed">{v.content}</p>{v.revokedAt ? <p className="text-sm text-rose-700">Hủy lúc {formatDate(v.revokedAt)}: {v.revocationReason}</p> : <button className={button + ' text-rose-800'} onClick={() => {setAction({type:'revoke',policy:selected,version:v});setReason('');}}>Hủy phiên bản ngay</button>}</article>)}
    </section>}
    {(editor || action) && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-5"><div role="dialog" aria-modal="true" aria-labelledby="policy-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between"><h2 id="policy-dialog-title" className="text-2xl font-semibold">{action ? action.type === 'delete' ? 'Xóa điều khoản' : action.type === 'revoke' ? 'Hủy phiên bản' : action.policy.active ? 'Ngừng áp dụng điều khoản' : 'Kích hoạt lại điều khoản' : editor === 'create' ? 'Tạo điều khoản' : 'Thêm phiên bản: ' + selected?.title}</h2><button aria-label="Đóng" disabled={busy} onClick={() => {setEditor(null);setAction(null);}}><X/></button></div>{error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {action ? <form onSubmit={applyAction} className="space-y-4">{action.type === 'delete' ? <p>Xóa “{action.policy.title}” khỏi danh sách, ngừng áp dụng và ẩn khỏi các tour liên quan ngay. Nếu tour đang dùng chính sách hủy này, khách sẽ không thể tạo booking mới cho đến khi chọn chính sách khác. Booking đã tạo vẫn giữ điều khoản cũ.</p> : <><p>Thay đổi có hiệu lực ngay đối với booking mới. Điều khoản của booking đã tạo được giữ nguyên.</p><label className="block">Lý do<textarea autoFocus className={field} required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label></>}<button className={button + ' bg-rose-800 text-white'} disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận'}</button></form> : <form onSubmit={save} className="space-y-4">{editor === 'create' && <><label className="block">Loại điều khoản<select className={field} value={kind} onChange={e => setKind(e.target.value)}><option value="general">Lưu ý chung</option><option value="payment">Thanh toán / phụ thu</option><option value="cancellation">Đổi / hủy</option></select></label><label className="block">Tên điều khoản<input autoFocus className={field} required maxLength={250} value={title} onChange={e => setTitle(e.target.value)}/></label>{policies.some(p => p.title.trim().toLowerCase() === title.trim().toLowerCase()) && <p className="text-sm text-amber-800">Đã có điều khoản cùng tên. Kiểm tra danh sách trước khi tạo thêm.</p>}<label className="block">Mã tham chiếu (không bắt buộc)<input className={field} maxLength={80} placeholder="Để trống để tự tạo mã" value={code} onChange={e => setCode(e.target.value)}/></label></>}<label className="block">Tải file Word hoặc PDF<input type="file" accept=".pdf,.doc,.docx" disabled={busy || extracting} onChange={extractFile} className={field}/></label><p className="text-sm text-stone-600">{extracting ? 'Đang đọc nội dung...' : fileName ? `Đã đọc: ${fileName}. Kiểm tra nội dung trước khi lưu.` : 'Chọn file tối đa 5 MB; nội dung sẽ được đưa vào ô bên dưới.'}</p><label className="block">Nội dung<textarea className={field} required rows={6} maxLength={100000} value={content} onChange={e => setContent(e.target.value)}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={immediate} onChange={e => setImmediate(e.target.checked)}/>Áp dụng ngay</label>{!immediate && <label className="block">Có hiệu lực từ<input className={field} required type="datetime-local" value={effective} onChange={e => setEffective(e.target.value)}/></label>}<div className="flex justify-end gap-3"><button type="button" disabled={busy} className={button} onClick={() => setEditor(null)}>Hủy</button><button className={button + ' bg-emerald-900 text-white'} disabled={busy || extracting}>{busy ? 'Đang lưu...' : 'Lưu điều khoản'}</button></div></form>}
    </div></div>}
  </div>;
}
