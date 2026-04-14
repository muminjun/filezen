'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';
import { useToast } from '@/context/ToastContext';

export function useClipboardPaste() {
  const { addImages } = useAppContext();
  const { activeTab } = useUIContext();
  const { showToast } = useToast();

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith('image/'));

      if (imageItems.length === 0) return;

      if (activeTab !== 'image') {
        showToast('이미지 탭에서 붙여넣어 주세요', 'info');
        return;
      }

      e.preventDefault();
      const files = imageItems
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);

      if (files.length > 0) {
        await addImages(files);
      }
    }

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [addImages, activeTab, showToast]);
}
