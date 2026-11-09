import React from 'react';
import { cn } from '../../lib/utils';

export function FilterToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex min-w-0 flex-wrap items-end gap-4 rounded-xl border border-[#E6E1D8] bg-white p-4 sm:p-5 [&>form]:w-full [&>form]:min-w-0', className)}>{children}</div>;
}
