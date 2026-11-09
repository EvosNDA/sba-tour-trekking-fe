import React from 'react';
import { AlertCircle, Compass } from 'lucide-react';

export function DataState({ title, description, action, variant = 'empty' }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; variant?: 'empty' | 'error' }) {
  const Icon = variant === 'error' ? AlertCircle : Compass;
  return <div role={variant === 'error' ? 'alert' : 'status'} className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-12 text-center sm:py-16">
    <Icon aria-hidden="true" className={`mx-auto mb-5 h-8 w-8 ${variant === 'error' ? 'text-[#C2410C]' : 'text-[#1F4E43]'}`} strokeWidth={1.5} />
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    {description && <div className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6B7068]">{description}</div>}
    {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
  </div>;
}
