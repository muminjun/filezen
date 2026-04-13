'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { rotateImageBlob } from '../lib/imageRotation';
import { MAX_CONCURRENT_PROCESSING, HEIC_MIME_TYPES } from '../lib/constants';
import { buildCssFilter, isDefaultAdjustment } from '../lib/colorAdjustment';
import { useSavedAdjustments } from '../hooks/useSavedAdjustments';
import type { ImageFile, AppContextType, ColorAdjustment, CropData, OutputFormat, ResizeData, WatermarkConfig } from '../lib/types';

async function heicToJpegBlob(file: File): Promise<Blob> {
  // 1. Server-side conversion via API route (sharp handles HEVC-encoded iPhone HEIC)
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/heic-convert', { method: 'POST', body: formData });
  if (res.ok) return res.blob();

  // 2. Native browser decoding (Safari natively supports HEIC)
  const nativeOk = await createImageBitmap(file).then(bm => { bm.close(); return true; }).catch(() => false);
  if (nativeOk) {
    const tempUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(tempUrl);
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
          'image/jpeg', 0.92,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(tempUrl); reject(new Error('Image load failed')); };
      img.src = tempUrl;
    });
  }

  // 3. Last resort: heic2any (works for AV1-based HEIF)
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}

async function convertHeicToJpeg(file: File): Promise<{ previewUrl: string; convertedFile: File }> {
  const blob = await heicToJpegBlob(file);
  const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
  return { previewUrl: URL.createObjectURL(blob), convertedFile };
}

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

  const addImages = useCallback(async (files: File[]) => {
    const results = await Promise.allSettled(
      files.map(async (file): Promise<ImageFile> => {
        if (HEIC_MIME_TYPES.includes(file.type) || /\.(heic|heif)$/i.test(file.name)) {
          const { previewUrl, convertedFile } = await convertHeicToJpeg(file);
          return { id: generateId(), file: convertedFile, previewUrl, rotation: 0, flipped: false };
        }
        return { id: generateId(), file, previewUrl: URL.createObjectURL(file), rotation: 0, flipped: false };
      })
    );
    const next = results
      .filter((r): r is PromiseFulfilledResult<ImageFile> => r.status === 'fulfilled')
      .map(r => r.value);
    if (next.length > 0) setImages((prev) => [...prev, ...next]);
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
              img.cropData !== undefined ||
              img.stripExif === true ||
              img.resizeData !== undefined ||
              img.watermark !== undefined;

            const blob = needsProcessing
              ? await rotateImageBlob(
                  img.previewUrl,
                  img.rotation,
                  img.flipped,
                  targetMime,
                  quality / 100,
                  cssFilter,
                  img.cropData,
                  img.resizeData,
                  img.watermark,
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

  const applyResizeToSelected = useCallback((resize: ResizeData | undefined) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, resizeData: resize } : img
      )
    );
  }, [selectedIds]);

  const applyWatermarkToSelected = useCallback((watermark: WatermarkConfig | undefined) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, watermark } : img
      )
    );
  }, [selectedIds]);

  const toggleStripExifOnSelected = useCallback(() => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, stripExif: !img.stripExif } : img
      )
    );
  }, [selectedIds]);

  const replaceImageBlob = useCallback((id: string, newBlob: Blob, newFileName: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const newFile = new File([newBlob], newFileName, { type: newBlob.type });
        const newPreviewUrl = URL.createObjectURL(newBlob);
        // Revoke old preview URL
        URL.revokeObjectURL(img.previewUrl);
        return {
          id: img.id,
          file: newFile,
          previewUrl: newPreviewUrl,
          rotation: 0,
          flipped: false,
        };
      })
    );
  }, []);

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
        applyResizeToSelected,
        applyWatermarkToSelected,
        toggleStripExifOnSelected,
        replaceImageBlob,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
