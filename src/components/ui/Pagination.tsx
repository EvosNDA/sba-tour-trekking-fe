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
  return <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E6E1D8] px-4 py-4 sm:px-5">
    <p className="text-sm text-[#6B7068]" aria-live="polite">
      {totalElements !== undefined && pageSize ? `${totalElements === 0 ? 0 : page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} / ${totalElements}` : `Trang ${Math.min(page, lastPage) + 1} / ${Math.max(1, totalPages)}`}
    </p>
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" aria-label="Trang trước" disabled={page <= 0} onClick={() => onPageChange(page - 1)} leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}>Trước</Button>
      <span className="px-2 text-sm tabular-nums" aria-current="page">{page + 1}</span>
      <Button type="button" variant="outline" aria-label="Trang sau" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}>Sau</Button>
    </div>
  </nav>;
}
