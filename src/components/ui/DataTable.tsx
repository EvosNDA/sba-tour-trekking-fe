import React from 'react';
import { cn } from '../../lib/utils';

export function DataTable({ children, className, tableClassName }: { children: React.ReactNode; className?: string; tableClassName?: string }) {
  return <div className={cn('min-w-0 overflow-x-auto rounded-xl border border-[#E6E1D8] bg-white', className)}>
    <table className={cn('w-full text-left text-sm [&_th]:bg-[#F7F4EE] [&_th]:px-5 [&_th]:py-3.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[#6B7068] [&_td]:px-5 [&_td]:py-4 [&_tbody_tr]:border-t [&_tbody_tr]:border-[#E6E1D8]', tableClassName)}>{children}</table>
  </div>;
}
