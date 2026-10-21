import React, { useEffect, useState } from 'react';
import { toursApi } from '../api/tours.api';
import { TourReviewQueueItem } from '../types/tour.types';

const errorMessage = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Moderation request failed.';

/** Render only inside an authorized admin surface; the backend remains the authority for role and transition checks. */
export const TourModerationQueue: React.FC = () => {
  const [items, setItems] = useState<TourReviewQueueItem[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = async () => {
    setLoading(true); setError(null);
    try { setItems((await toursApi.getModerationQueue()).items); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const act = async (item: TourReviewQueueItem, action: 'approve' | 'reject') => {
    const reason = reasons[item.id]?.trim() || '';
    if (action === 'reject' && !reason) { setError('A rejection reason is required.'); return; }
    setBusyId(item.id); setError(null); setNotice(null);
    try {
      await toursApi.moderateTour(item.id, action, reason);
      setNotice(`Server accepted ${action} for “${item.title}”.`);
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusyId(null); }
  };
  return <section className="space-y-4">
    <header><h2 className="text-2xl font-bold">Tour moderation queue</h2><p className="text-sm text-stone-600">Review submitted tours. The server validates each decision and updates the tour status.</p></header>
    {error && <p role="alert" className="p-3 rounded bg-red-50 text-red-800">{error}</p>}{notice && <p role="status" className="p-3 rounded bg-green-50 text-green-800">{notice}</p>}
    {loading ? <p role="status">Loading review queue…</p> : !items.length && !error ? <p>No tours are awaiting review.</p> : items.map(item=><article key={item.id} className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex justify-between gap-4"><div><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-stone-500">Submitted {new Date(item.submittedAt).toLocaleString()} · {item.mediaCount} media · {item.itineraryDays} itinerary days</p></div><span className="text-xs text-stone-500">Company #{item.companyId}</span></div>
      <label className="block text-sm">Rejection reason<textarea value={reasons[item.id] || ''} onChange={e=>setReasons(prev=>({...prev,[item.id]:e.target.value}))} maxLength={1000} className="block w-full border rounded p-2 mt-1"/></label>
      <div className="flex gap-2"><button disabled={busyId !== null} onClick={()=>void act(item,'approve')} className="rounded bg-emerald-800 text-white px-3 py-2 disabled:opacity-50">Approve</button><button disabled={busyId !== null || !reasons[item.id]?.trim()} onClick={()=>void act(item,'reject')} className="rounded border border-red-700 text-red-800 px-3 py-2 disabled:opacity-50">Reject</button></div>
    </article>)}
  </section>;
};

export default TourModerationQueue;
