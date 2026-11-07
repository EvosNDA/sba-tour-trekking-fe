import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';

type Statistics = {
  scheduleCount: number;
  equipment: { equipmentId: number; name: string; quantity: number }[];
};

export function TourStatistics({ tourId, scheduleTotal }: { tourId: number; scheduleTotal: number }) {
  const [data, setData] = useState<Statistics | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await apiClient.get<Statistics>(`/api/v1/tours/${tourId}/statistics`));
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => { void load(); }, [load, scheduleTotal]);

  return (
    <section className="rounded-2xl border border-[#E6E1D8] bg-white p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#1C2526]">Thống kê tour</h2>
        <button type="button" onClick={load} disabled={loading} className="text-sm font-semibold text-[#1F4E43] underline disabled:opacity-50">Làm mới</button>
      </div>
      {loading ? <p className="text-sm text-stone-500">Đang tải thống kê...</p> : error ? (
        <p role="alert" className="text-sm text-red-700">Không thể tải thống kê. Vui lòng thử lại.</p>
      ) : data && <>
        <div className="rounded-xl bg-[#FDFBF7] border border-[#E6E1D8] p-4">
          <p className="text-sm text-stone-600">Tổng số lịch khởi hành</p>
          <strong className="text-2xl text-[#1F4E43]">{data.scheduleCount}</strong>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-stone-800">Thiết bị đã được đặt</h3>
          <p className="text-xs text-stone-500 mt-1">Tổng số lượng trên các đơn đã xác nhận, gồm cả thiết bị đã trả; không bao gồm đơn đã hủy hoặc giữ chỗ.</p>
          {data.equipment.length === 0 ? <p className="text-sm text-stone-500 mt-3">Chưa có thiết bị được đặt.</p> : (
            <ul className="mt-3 divide-y divide-stone-100">
              {data.equipment.map(item => <li key={item.equipmentId} className="flex justify-between gap-4 py-2 text-sm"><span>{item.name}</span><strong>{item.quantity}</strong></li>)}
            </ul>
          )}
        </div>
      </>}
    </section>
  );
}
