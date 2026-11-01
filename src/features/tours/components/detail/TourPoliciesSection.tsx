import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/axios';
type Term={versionId:number;title:string;content:string};
export function TourPoliciesSection({tourId}:{tourId:number}) {
  const [terms,setTerms]=useState<Term[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true;setLoading(true);apiClient.get<Term[]>(`/api/v1/tours/${tourId}/terms`).then(data=>{if(active)setTerms(data);}).catch(()=>{if(active)setError('Không tải được điều khoản.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[tourId]);
  return <section className="space-y-4 rounded-3xl border border-[#E6E1D8] bg-white p-6 sm:p-8"><h2 className="text-2xl font-bold">Điều khoản & lưu ý</h2>{loading ? <p>Đang tải...</p> : error ? <p role="alert">{error}</p> : terms.length ? terms.map(t=><details key={t.versionId} className="border-b border-stone-200 py-3"><summary className="cursor-pointer font-semibold">{t.title}</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-700">{t.content}</p></details>) : <p className="text-stone-500">Chưa có điều khoản được cập nhật.</p>}</section>;
}
