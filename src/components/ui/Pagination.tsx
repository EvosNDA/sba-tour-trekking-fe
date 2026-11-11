import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, pageSize, onPageChange }: PaginationProps) {
  const lastPage = Math.max(0, totalPages - 1);
  return <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E1D8] px-3 py-2 sm:px-4">
    <p className="text-xs text-[#6B7068]" aria-live="polite">
      {totalElements !== undefined && pageSize ? `${totalElements === 0 ? 0 : page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements}` : `Trang ${Math.min(page, lastPage) + 1} / ${Math.max(1, totalPages)}`}
    </p>
    <div className="flex items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" className="!min-h-8 !px-2.5 !py-1 !text-xs" aria-label="Trang trước" disabled={page <= 0} onClick={() => onPageChange(page - 1)} leftIcon={<ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />}>Trước</Button>
      <span className="px-1.5 text-xs tabular-nums" aria-current="page">{page + 1}</span>
      <Button type="button" variant="outline" size="sm" className="!min-h-8 !px-2.5 !py-1 !text-xs" aria-label="Trang sau" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} rightIcon={<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}>Sau</Button>
    </div>
  </nav>;
}
