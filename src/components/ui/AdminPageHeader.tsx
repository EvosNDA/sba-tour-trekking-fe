import React from 'react';

export interface AdminPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, eyebrow, actions, className = '' }: AdminPageHeaderProps) {
  return <header className={`flex flex-col justify-between gap-5 sm:flex-row sm:items-end ${className}`}>
    <div className="min-w-0">
      {eyebrow && <div className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#0D765E]">{eyebrow}</div>}
      <h1 className="break-words text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#101828] sm:text-[40px]">{title}</h1>
      {description && <div className="mt-2 max-w-3xl text-base leading-relaxed text-[#586579]">{description}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
  </header>;
}
