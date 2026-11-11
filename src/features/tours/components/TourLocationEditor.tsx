import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, Loader2, MapPin, Plus, Search, X } from 'lucide-react';
import { toursApi, type LocationOption } from '../api/tours.api';

const inputClass = 'w-full rounded-lg border border-[#cbd4cc] bg-white px-3.5 py-2.5 text-sm text-[#18352b] placeholder:text-[#7b8980] outline-none transition focus:border-[#176a50] focus:ring-2 focus:ring-[#176a50]/15';

export function TourLocationEditor({ tourId, onUpdated }: { tourId: number; onUpdated: () => void }) {
  const [catalog, setCatalog] = useState<LocationOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [allLocations, tourLocations] = await Promise.all([
        toursApi.listLocations(),
        toursApi.getTourLocations(tourId),
      ]);
      setCatalog(allLocations);
      setSelectedIds(tourLocations.map((location) => location.id));
    } catch (loadError) {
      setError((loadError as Error).message || 'Không tải được danh mục địa điểm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [tourId]);

  const selected = selectedIds.map((id) => catalog.find((location) => location.id === id))
    .filter((location): location is LocationOption => Boolean(location));
  const options = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi');
    return catalog.filter((location) => !selectedIds.includes(location.id)
      && (!needle || `${location.name} ${location.provinceName || ''}`.toLocaleLowerCase('vi').includes(needle)));
  }, [catalog, query, selectedIds]);

  const addLocation = (id: number) => {
    setSelectedIds((current) => [...current, id]);
    setQuery('');
    setMessage('');
  };

  const moveLocation = (index: number, offset: -1 | 1) => {
    setSelectedIds((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const createLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const location = await toursApi.createLocation({ name: name.trim(), provinceName: provinceName.trim() || undefined });
      setCatalog((current) => [...current, location].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
      setSelectedIds((current) => [...current, location.id]);
      setName('');
      setProvinceName('');
      setShowCreate(false);
      setMessage(`Đã thêm ${location.name} vào danh mục và hành trình.`);
    } catch (createError) {
      setError((createError as Error).message || 'Không tạo được địa điểm.');
    } finally {
      setCreating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await toursApi.saveTourLocations(tourId, selectedIds);
      setMessage('Đã lưu thứ tự các điểm đến cho tour.');
      onUpdated();
    } catch (saveError) {
      setError((saveError as Error).message || 'Không lưu được địa điểm.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-5">
    <div>
      <h2 className="flex items-center gap-2 text-2xl font-bold text-[#153a2b]"><MapPin className="h-6 w-6 text-[#176a50]" />Địa điểm & hành trình</h2>
      <p className="mt-1 text-sm text-[#66766c]">Chọn địa điểm trong danh mục, sau đó sắp xếp theo thứ tự đi qua.</p>
    </div>

    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}<button type="button" onClick={() => void load()} className="ml-auto shrink-0 font-semibold underline">Thử lại</button></div>}
    {message && <p role="status" className="rounded-lg bg-[#eef6ef] px-3 py-2 text-sm text-[#315d3b]">{message}</p>}

    <div className="flex flex-wrap items-end gap-3">
      <label htmlFor="tour-location-picker" className="min-w-[240px] flex-1 text-sm font-semibold text-[#31473a]">Tìm địa điểm trong danh mục
        <span className="relative mt-1.5 block"><Search className="absolute left-3 top-3 h-4 w-4 text-[#708076]" /><input id="tour-location-picker" value={query} onChange={(event) => setQuery(event.target.value)} disabled={loading || saving} placeholder={loading ? 'Đang tải danh mục…' : 'Tên địa điểm hoặc tỉnh/thành'} className={`${inputClass} pl-9`} /></span>
      </label>
      <button type="button" onClick={() => setShowCreate((open) => !open)} className="inline-flex items-center gap-2 rounded-lg border border-[#176a50] px-4 py-2.5 text-sm font-semibold text-[#176a50] hover:bg-[#f0f6f1]"><Plus className="h-4 w-4" />Tạo địa điểm</button>
    </div>

    {showCreate && <form onSubmit={createLocation} className="grid gap-3 rounded-xl border border-[#d5ddd3] bg-[#fbfcfa] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-sm font-semibold text-[#31473a]">Tên địa điểm *<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: Sa Pa" className={`${inputClass} mt-1.5`} /></label>
      <label className="text-sm font-semibold text-[#31473a]">Tỉnh / thành phố<input maxLength={150} value={provinceName} onChange={(event) => setProvinceName(event.target.value)} placeholder="VD: Lào Cai" className={`${inputClass} mt-1.5`} /></label>
      <button type="submit" disabled={creating || !name.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#176a50] px-4 text-sm font-bold text-white hover:bg-[#10583f] disabled:opacity-60">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Thêm vào danh mục</button>
    </form>}

    {query && options.length > 0 && <div className="max-h-52 overflow-y-auto rounded-lg border border-[#d5ddd3] bg-white">{options.slice(0, 8).map((location) => <button type="button" key={location.id} onClick={() => addLocation(location.id)} className="flex w-full items-center justify-between border-b border-[#edf0ec] px-3.5 py-2.5 text-left text-sm last:border-0 hover:bg-[#f0f6f1]"><span className="font-semibold text-[#2d4035]">{location.name}</span><span className="text-xs text-[#738176]">{location.provinceName || 'Chưa ghi tỉnh/thành'}</span></button>)}</div>}

    <div className="space-y-2">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#35493c]">Các điểm theo thứ tự di chuyển</h3><span className="text-xs text-[#748278]">{selected.length} điểm</span></div>
      {loading ? <div role="status" className="py-8 text-center text-sm text-[#6b7b70]">Đang tải địa điểm…</div> : selected.length ? <ol className="space-y-2">{selected.map((location, index) => <li key={location.id} className="flex items-center gap-3 rounded-lg border border-[#d7dfd6] bg-white px-3 py-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e4f2e6] text-sm font-bold text-[#285e3d]">{index + 1}</span><MapPin className="h-4 w-4 shrink-0 text-[#176a50]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#2d4035]">{location.name}</span><span className="block text-xs text-[#77857b]">{location.provinceName || 'Chưa ghi tỉnh/thành'}</span></span><button type="button" aria-label={`Chuyển ${location.name} lên`} disabled={index === 0} onClick={() => moveLocation(index, -1)} className="rounded-md border border-[#dce3dc] p-2 text-[#53695b] hover:bg-[#f0f6f1] disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label={`Chuyển ${location.name} xuống`} disabled={index === selected.length - 1} onClick={() => moveLocation(index, 1)} className="rounded-md border border-[#dce3dc] p-2 text-[#53695b] hover:bg-[#f0f6f1] disabled:opacity-35"><ArrowDown className="h-4 w-4" /></button><button type="button" aria-label={`Bỏ ${location.name} khỏi hành trình`} onClick={() => setSelectedIds((current) => current.filter((id) => id !== location.id))} className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"><X className="h-4 w-4" /></button></li>)}</ol> : <div className="rounded-xl border border-dashed border-[#cbd7cc] bg-[#fafcf9] px-4 py-8 text-center"><MapPin className="mx-auto h-6 w-6 text-[#7b8980]" /><p className="mt-2 text-sm font-semibold text-[#405549]">Chưa có điểm đến cho tour này</p><p className="mt-1 text-sm text-[#77857b]">Chọn địa điểm có sẵn, hoặc tạo địa điểm danh mục rồi thêm vào hành trình.</p>{query && options.length === 0 && <p className="mt-2 text-xs text-[#77857b]">Không có kết quả phù hợp.</p>}</div>}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8e1] pt-4"><p className="flex items-center gap-2 text-sm text-[#607267]"><Check className="h-4 w-4 text-[#23804b]" />Thứ tự lưu trực tiếp vào liên kết địa điểm của tour.</p><button type="button" disabled={saving || loading} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-[#176a50] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#10583f] disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Lưu địa điểm & tiếp tục</button></div>
  </div>;
}
