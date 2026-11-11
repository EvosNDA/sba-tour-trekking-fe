import React from 'react';

export interface AdminSectionNavProps {
  items: Array<{ id: string; label: string }>;
  label?: string;
}

/** In-page links keep long workspaces navigable without unmounting unsaved editors. */
export function AdminSectionNav({ items, label = 'Các mục trên trang' }: AdminSectionNavProps) {
  return (
    <nav aria-label={label} className="sticky top-20 z-20 rounded-xl border border-[#E0E6EE] bg-[#F3F6FA]/95 p-2 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap gap-1">
        {items.map(({ id, label: title }) => <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#0B7058] transition-colors hover:bg-[#0B7058]/10">{title}</a>)}
      </div>
    </nav>
  );
}
