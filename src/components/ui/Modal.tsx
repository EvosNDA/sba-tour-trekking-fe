import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  className?: string;
  footer?: React.ReactNode;
  preventClose?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

let openDialogs = 0;
let previousOverflow = '';

/** Native dialogs provide focus containment and an inert background. */
export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, children, maxWidth = 'md', className,
  footer, preventClose = false, closeOnBackdrop = true, initialFocusRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => {
      dialog.close();
      openDialogs = Math.max(0, openDialogs - 1);
      if (openDialogs === 0) document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;
  const widths = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
    '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl', '6xl': 'max-w-6xl', full: 'max-w-[calc(100vw-2rem)]',
  };
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Hộp thoại'}
      aria-describedby={subtitle ? descriptionId : undefined}
      aria-modal="true"
      className={cn('wetrek-dialog m-auto w-[calc(100%-2rem)] max-h-[90dvh] overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white p-0 text-[#1C2526] shadow-2xl', widths[maxWidth], className)}
      onCancel={(event) => { event.preventDefault(); if (!preventClose) onCloseRef.current(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const dialog = event.currentTarget;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); dialog.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || preventClose || !closeOnBackdrop) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCloseRef.current();
      }}
    >
      <div className="flex max-h-[90dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E6E1D8] bg-[#FDFBF7] p-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 id={titleId} className="break-words text-xl font-semibold tracking-tight">{title}</h2>}
            {subtitle && <div id={descriptionId} className="mt-2 text-sm leading-relaxed text-[#6B7068]">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} disabled={preventClose} aria-label="Đóng hộp thoại" className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#6B7068] transition-colors hover:bg-[#E6E1D8]/60 disabled:cursor-not-allowed disabled:opacity-40">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#E6E1D8] bg-[#FDFBF7] p-4 sm:px-6">{footer}</footer>}
      </div>
    </dialog>, document.body,
  );
};
