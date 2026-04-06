'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { rotateImageBlob } from '../lib/imageRotation';
import { MAX_CONCURRENT_PROCESSING } from '../lib/constants';
import type { ImageFile, AppContextType } from '../lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

function generateId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const addImages = useCallback((files: File[]) => {
    const next: ImageFile[] = files.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
    }));
    setImages((prev) => [...prev, ...next]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rangeSelect = useCallback((fromId: string, toId: string) => {
    setImages((prev) => {
      const fromIdx = prev.findIndex((img) => img.id === fromId);
      const toIdx = prev.findIndex((img) => img.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const rangeIds = prev.slice(start, end + 1).map((img) => img.id);
      setSelectedIds((prevSel) => new Set([...prevSel, ...rangeIds]));
      return prev;
    });
  }, []);

  const selectAll = useCallback(() => {
    setImages((prev) => {
      setSelectedIds(new Set(prev.map((img) => img.id)));
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const rotateSelected = useCallback(
    (degrees: number) => {
      setImages((prev) =>
        prev.map((img) =>
          selectedIds.has(img.id)
            ? { ...img, rotation: normalizeRotation(img.rotation + degrees) }
            : img
        )
      );
    },
    [selectedIds]
  );

  const downloadAsZip = useCallback(async () => {
    const selected = images.filter((img) => selectedIds.has(img.id));
    if (selected.length === 0) return;

    setIsDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < selected.length; i += MAX_CONCURRENT_PROCESSING) {
        const batch = selected.slice(i, i + MAX_CONCURRENT_PROCESSING);
        await Promise.all(
          batch.map(async (img) => {
            const mimeType = img.file.type || 'image/jpeg';
            const blob =
              img.rotation === 0
                ? img.file
                : await rotateImageBlob(img.previewUrl, img.rotation, mimeType);
            zip.file(img.file.name, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filezen-rotated-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [images, selectedIds]);

  return (
    <AppContext.Provider
      value={{
        images,
        selectedIds,
        isDownloading,
        addImages,
        removeImage,
        toggleSelect,
        rangeSelect,
        selectAll,
        clearSelection,
        rotateSelected,
        downloadAsZip,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
