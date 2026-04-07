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
import { buildCssFilter, isDefaultAdjustment } from '../lib/colorAdjustment';
import { useSavedAdjustments } from '../hooks/useSavedAdjustments';
import type { ImageFile, AppContextType, ColorAdjustment, CropData, OutputFormat } from '../lib/types';

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
  const [images, setImages]           = useState<ImageFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [outputFormat, setOutputFormat]   = useState<OutputFormat>('original');
  const [quality, setQuality]             = useState(90);

  const {
    saved: savedAdjustments,
    recent: recentAdjustments,
    saveAdjustment,
    addRecentAdjustment,
  } = useSavedAdjustments();

  const addImages = useCallback((files: File[]) => {
    const next: ImageFile[] = files.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      flipped: false,
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

  const removeAllImages = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setSelectedIds(new Set());
  }, []);

  const reorderImages = useCallback((startIndex: number, endIndex: number) => {
    setImages((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
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
    const fromIdx = images.findIndex((img) => img.id === fromId);
    const toIdx   = images.findIndex((img) => img.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const start   = Math.min(fromIdx, toIdx);
    const end     = Math.max(fromIdx, toIdx);
    const rangeIds = images.slice(start, end + 1).map((img) => img.id);
    setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
  }, [images]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(images.map((img) => img.id)));
  }, [images]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const rotateSelected = useCallback((degrees: number) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id)
          ? { ...img, rotation: normalizeRotation(img.rotation + degrees) }
          : img
      )
    );
  }, [selectedIds]);

  const flipSelected = useCallback(() => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, flipped: !img.flipped } : img
      )
    );
  }, [selectedIds]);

  const applyEditToSelected = useCallback(
    (edit: { colorAdjustment?: ColorAdjustment; cropData?: CropData }) => {
      setImages((prev) =>
        prev.map((img) =>
          selectedIds.has(img.id) ? { ...img, ...edit } : img
        )
      );
      if (edit.colorAdjustment && !isDefaultAdjustment(edit.colorAdjustment)) {
        addRecentAdjustment(edit.colorAdjustment);
      }
    },
    [selectedIds, addRecentAdjustment]
  );

  const downloadAsZip = useCallback(async () => {
    const selected = images.filter((img) => selectedIds.has(img.id));
    if (selected.length === 0) return;

    setIsDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip   = new JSZip();

      for (let i = 0; i < selected.length; i += MAX_CONCURRENT_PROCESSING) {
        const batch = selected.slice(i, i + MAX_CONCURRENT_PROCESSING);
        await Promise.all(
          batch.map(async (img) => {
            const targetMime = outputFormat === 'original'
              ? (img.file.type || 'image/jpeg')
              : `image/${outputFormat}`;

            const cssFilter = img.colorAdjustment && !isDefaultAdjustment(img.colorAdjustment)
              ? buildCssFilter(img.colorAdjustment)
              : undefined;

            const needsProcessing =
              img.rotation !== 0 ||
              img.flipped ||
              outputFormat !== 'original' ||
              cssFilter !== undefined ||
              img.cropData !== undefined;

            const blob = needsProcessing
              ? await rotateImageBlob(
                  img.previewUrl,
                  img.rotation,
                  img.flipped,
                  targetMime,
                  quality / 100,
                  cssFilter,
                  img.cropData,
                )
              : img.file;

            const extension = outputFormat === 'original'
              ? img.file.name.split('.').pop()
              : outputFormat;
            const baseName = img.file.name.replace(/\.[^/.]+$/, '');
            zip.file(`${baseName}.${extension}`, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `filezen-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [images, selectedIds, outputFormat, quality]);

  return (
    <AppContext.Provider
      value={{
        images,
        selectedIds,
        isDownloading,
        outputFormat,
        quality,
        savedAdjustments,
        recentAdjustments,
        addImages,
        removeImage,
        removeAllImages,
        reorderImages,
        toggleSelect,
        rangeSelect,
        selectAll,
        clearSelection,
        rotateSelected,
        flipSelected,
        setOutputFormat,
        setQuality,
        downloadAsZip,
        applyEditToSelected,
        saveAdjustment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
