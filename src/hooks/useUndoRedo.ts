'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useAppContext();
  const { activeTab } = useUIContext();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (activeTab !== 'image') return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      if (e.key === 'z' && !e.shiftKey) {
        if (canUndo) { e.preventDefault(); undo(); }
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (canRedo) { e.preventDefault(); redo(); }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeTab, undo, redo, canUndo, canRedo]);
}
