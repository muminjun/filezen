'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg pointer-events-auto',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
            toast.type === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-foreground text-background'
          )}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
