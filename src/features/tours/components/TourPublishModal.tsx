import { Modal } from '../../../components/ui/Modal';
import React, { useEffect, useState } from 'react';
import { toursApi } from '../api/tours.api';
import { apiClient } from '../../../lib/axios';
import type { TourDetailResponse } from '../types/tour.types';
import type { ApiError } from '../../../types/api.types';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';

type Option = { id: number; title: string; versionNumber: number };
export function TourPublishModal({ tourId, onClose, onPublished }: { tourId: number; onClose: () => void; onPublished: (tour: TourDetailResponse) => void }) {
  const [tour, setTour] = useState<TourDetailResponse | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [choice, setChoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([toursApi.getTourDetail(tourId), apiClient.get<Option[]>('/api/v1/admin/policies/cancellation/available')])
      .then(([data, policies]) => { if (!active) return; setTour(data); setOptions(policies); setChoice(data.cancellationPolicyVersionId ? String(data.cancellationPolicyVersionId) : ''); })
      .catch((e: ApiError) => { if (active) setError(e.message || 'Không tải được thông tin tour và chính sách.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tourId]);
  const publish = async () => {
    if (!tour || !choice) return;
    setSaving(true); setError('');
    try {
      const result = await toursApi.updateTour(tour.id, {
        title: tour.title, description: tour.description ?? '', difficulty: tour.difficulty,
        durationDays: tour.durationDays, requiredExperience: tour.requiredExperience ?? '',
        includedServices: tour.includedServices ?? '', excludedServices: tour.excludedServices ?? '',
        routeFileUrl: tour.routeFileUrl ?? '', status: 'PUBLISHED', cancellationPolicyVersionId: Number(choice),
      });
      onPublished(result);
    } catch (e) { setError((e as ApiError).message || 'Không thể xuất bản tour.'); }
    finally { setSaving(false); }
  };
  return <Modal isOpen onClose={onClose} preventClose={saving} title={<>Xuất bản tour</>} maxWidth="lg">
      <p className="mt-2 text-sm text-stone-600">{tour ? `Chọn chính sách hủy để xuất bản ${tour.title}.` : 'Đang tải thông tin tour...'}</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <label htmlFor="publish-policy" className="mt-4 block text-sm font-semibold">Chính sách hủy</label>
      <select id="publish-policy" autoFocus value={choice} disabled={loading || saving} onChange={e => setChoice(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm">
        <option value="">{loading ? 'Đang tải...' : 'Chọn chính sách hủy'}</option>
        {options.map(p => <option key={p.id} value={p.id}>{p.title} — phiên bản {p.versionNumber}</option>)}
      </select>
      {!loading && !error && options.length === 0 && <p className="mt-3 text-sm text-stone-600">Chưa có chính sách hủy đang có hiệu lực. <button type="button" onClick={() => navigateTo(ROUTES.ADMIN.POLICIES)} className="text-emerald-800 underline">Tạo chính sách</button></p>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-stone-300 px-4 py-2 text-sm">Hủy</button><button type="button" disabled={loading || saving || !options.some(p => String(p.id) === choice)} onClick={publish} className="rounded-xl bg-[#1F4E43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang xuất bản...' : 'Xác nhận xuất bản'}</button></div>
  </Modal>;
}
