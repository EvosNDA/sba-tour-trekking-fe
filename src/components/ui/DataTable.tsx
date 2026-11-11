import React from 'react';
import { cn } from '../../lib/utils';

export function DataTable({ children, className, tableClassName }: { children: React.ReactNode; className?: string; tableClassName?: string }) {
  return <div className={cn('min-w-0 overflow-x-auto rounded-xl border border-[#E0E6EE] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}>
    <table className={cn('w-full text-left text-sm [&_th]:bg-[#F7F9FC] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[13px] [&_th]:font-semibold [&_th]:text-[#39465A] [&_td]:px-5 [&_td]:py-4 [&_tbody_tr]:border-t [&_tbody_tr]:border-[#E7EBF1] [&_tbody_tr:hover]:bg-[#FAFCFE]', tableClassName)}>{children}</table>
  </div>;
}
