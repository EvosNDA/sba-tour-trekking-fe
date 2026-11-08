import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
import type { TourStatus } from '../types/tour.types';

type Term = { versionId: number; title: string; content: string; versionNumber: number; primaryCancellation: boolean };
type Option = { id: number; title: string; versionNumber: number; kind: string };
type Props = { tourId: number; cancellationId: number | null; status: TourStatus; onUpdated: () => void };

export function TourTermsEditor({ tourId, cancellationId, status, onUpdated }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [cancellation, setCancellation] = useState(cancellationId ? String(cancellationId) : '');
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [items, available] = await Promise.all([apiClient.get<Term[]>(`/api/v1/tours/${tourId}/terms`), apiClient.get<Option[]>('/api/v1/admin/policies/available')]);
      setTerms(items); setOptions(available); setSelected(items.filter(t => !t.primaryCancellation).map(t => t.versionId));
    } catch (e) { setError((e as Error).message || 'Không tải được điều khoản.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [tourId]);
  useEffect(() => { setCancellation(cancellationId ? String(cancellationId) : ''); }, [cancellationId]);
  const save = async () => {
    setBusy(true); setError('');
    try {
      await apiClient.put(`/api/v1/tours/${tourId}/terms`, { versionIds: selected, ...(cancellation && Number(cancellation) !== cancellationId ? { cancellationPolicyVersionId: Number(cancellation) } : {}), ...(!cancellation && cancellationId ? { removeCancellationPolicy: true } : {}) });
      setEdit(false); await load(); onUpdated();
    } catch (e) { setError((e as Error).message || 'Không lưu được điều khoản.'); }
    finally { setBusy(false); }
  };
  const removeTerm = async (term: Term) => {
    if (term.primaryCancellation && status === 'PUBLISHED') { setEdit(true); setError('Tour đã xuất bản cần có chính sách đổi/hủy. Hãy chọn chính sách khác để thay thế.'); return; }
    if (!window.confirm(`Gỡ “${term.title}” khỏi tour này?`)) return;
    setBusy(true); setError('');
    try {
      await apiClient.put(`/api/v1/tours/${tourId}/terms`, { versionIds: terms.filter(t => !t.primaryCancellation && t.versionId !== term.versionId).map(t => t.versionId), ...(term.primaryCancellation ? { removeCancellationPolicy: true } : {}) });
      await load(); onUpdated();
    } catch (e) { setError((e as Error).message || 'Không gỡ được điều khoản.'); }
    finally { setBusy(false); }
  };
  const primary = terms.find(t => t.primaryCancellation);
  const extras = terms.filter(t => !t.primaryCancellation);
  const cancellationOptions = options.filter(o => o.kind === 'cancellation');
  const unavailable = primary && !cancellationOptions.some(o => o.id === primary.versionId);
  return <section className="space-y-4 rounded-2xl border border-[#E6E1D8] bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Điều khoản & lưu ý</h2><p className="mt-1 text-sm text-stone-600">Chính sách đổi/hủy và các điều khoản áp dụng cho tour.</p></div>{!edit && !loading && !error && <button type="button" onClick={() => setEdit(true)} className="rounded-xl border border-[#1F4E43] px-4 py-2 text-sm font-semibold text-[#1F4E43]">Chọn điều khoản</button>}</div>
    {error && <p role="alert" className="text-sm text-red-700">{error} {!edit && <button type="button" onClick={load} className="underline">Thử lại</button>}</p>}
    {loading ? <p className="text-sm text-stone-500">Đang tải...</p> : edit ? <>
      <p className="text-sm text-stone-600">Chọn các điều khoản áp dụng cho tour.</p>
      {terms.filter(t => !options.some(o => o.id === t.versionId)).map(t => <label key={t.versionId} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={t.primaryCancellation ? cancellation === String(t.versionId) : selected.includes(t.versionId)} onChange={e => t.primaryCancellation ? setCancellation(e.target.checked ? String(t.versionId) : '') : setSelected(x => e.target.checked ? [...x, t.versionId] : x.filter(i => i !== t.versionId))} /><span>{t.title} — phiên bản {t.versionNumber} <span className="text-amber-800">(không còn hiệu lực)</span></span></label>)}
      {options.map(o => <label key={o.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={o.kind === 'cancellation' ? cancellation === String(o.id) : selected.includes(o.id)} onChange={e => { if (o.kind === 'cancellation') setCancellation(e.target.checked ? String(o.id) : ''); else setSelected(x => e.target.checked ? [...x, o.id] : x.filter(i => i !== o.id)); }} /><span>{o.title} — phiên bản {o.versionNumber}{o.kind === 'cancellation' && <span className="ml-2 text-stone-500">(đổi/hủy)</span>}</span></label>)}
      {options.length === 0 && terms.length === 0 && <p className="text-sm text-stone-500">Chưa có điều khoản đang có hiệu lực.</p>}
      <p className="text-sm text-stone-500">Chọn một chính sách đổi/hủy có hiệu lực để xuất bản tour và nhận đặt chỗ. Chọn chính sách đổi/hủy khác sẽ thay thế lựa chọn cũ.</p>
      {status === 'PUBLISHED' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Booking đã tạo giữ chính sách cũ. Booking mới trong cùng chuyến có thể dùng chính sách khác khi bạn thay đổi.</p>}
      <div className="flex gap-3"><button type="button" disabled={busy || (status === 'PUBLISHED' && !!cancellationId && !cancellation)} onClick={save} className="rounded-lg bg-emerald-900 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu điều khoản'}</button><button type="button" disabled={busy} onClick={() => { setEdit(false); setSelected(extras.map(t => t.versionId)); setCancellation(cancellationId ? String(cancellationId) : ''); setError(''); }}>Hủy</button></div>
    </> : <>{!primary && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Chưa chọn chính sách đổi/hủy.</p>}{terms.map(t => <div key={t.versionId} className="flex items-start gap-2 rounded-lg border p-3"><details className="min-w-0 flex-1"><summary className="cursor-pointer font-semibold">{t.title}{t.primaryCancellation && <span className="ml-2 text-xs font-normal text-stone-500">Chính sách đổi/hủy</span>}</summary><p className="mt-2 whitespace-pre-wrap text-sm">{t.content}</p>{t.primaryCancellation && unavailable && <p className="mt-2 text-sm text-amber-800">Phiên bản này không còn trong danh sách có hiệu lực.</p>}</details><button type="button" disabled={busy} onClick={() => removeTerm(t)} className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Gỡ</button></div>)}</>}
  </section>;
}
