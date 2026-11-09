import React from 'react';

export interface AdminPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, description, eyebrow, actions }: AdminPageHeaderProps) {
  return <header className="flex flex-col justify-between gap-5 border-b border-[#E6E1D8] pb-6 sm:flex-row sm:items-end">
    <div className="min-w-0">
      {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#1F4E43]">{eyebrow}</div>}
      <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
      {description && <div className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6B7068]">{description}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
  </header>;
}
