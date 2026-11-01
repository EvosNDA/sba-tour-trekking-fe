import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

const listeners = new Set<(toasts: ToastItem[]) => void>();
let toastsState: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l([...toastsState]));
}

export const toast = {
  show: (item: Omit<ToastItem, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const newToast: ToastItem = { duration: 4500, ...item, id };
    toastsState = [...toastsState, newToast];
    notify();

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, newToast.duration);
    }
    return id;
  },
  success: (message: string, title?: string) => toast.show({ type: 'success', message, title }),
  error: (message: string, title?: string) => toast.show({ type: 'error', message, title, duration: 6000 }),
  warning: (message: string, title?: string) => toast.show({ type: 'warning', message, title }),
  info: (message: string, title?: string) => toast.show({ type: 'info', message, title }),
  dismiss: (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    notify();
  },
};

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>(toastsState);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {items.map((item) => {
        const styles: Record<ToastType, string> = {
          success: 'bg-[#1F4E43] text-white border-[#15372F]',
          error: 'bg-red-900 text-white border-red-950',
          warning: 'bg-amber-800 text-white border-amber-900',
          info: 'bg-[#1C2526] text-white border-stone-800',
        };

        const icons: Record<ToastType, React.ReactNode> = {
          success: <CheckCircle2 className="w-5 h-5 text-[#B9EADB] shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-200 shrink-0" />,
        };

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-200 ${styles[item.type]}`}
          >
            <div className="mt-0.5">{icons[item.type]}</div>
            <div className="flex-1 min-w-0 text-xs sm:text-sm">
              {item.title && <div className="font-bold mb-0.5">{item.title}</div>}
              <div className="leading-relaxed break-words opacity-95">{item.message}</div>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(item.id)}
              aria-label="Đóng thông báo"
              className="p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
