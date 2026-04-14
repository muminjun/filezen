'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Download } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { generateThumbnails } from '@/lib/pdfThumbnail';
import { buildModifiedPdf } from '@/lib/pdfPageOps';
import { FileUploadStrip } from '../FileUploadStrip';
import type { PdfPage } from '@/lib/types';
import { useUIContext } from '@/context/UIContext';

export function PageManager() {
  const t = useTranslations('file.pageManager');

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevPagesRef = useRef<PdfPage[]>([]);
  const { pendingPdfFiles, setPendingPdfFiles } = useUIContext();

  // Revoke blob URLs that are no longer used when pages change
  useEffect(() => {
    const prev = prevPagesRef.current;
    prevPagesRef.current = pages;
    const currentUrls = new Set(pages.map((p) => p.thumbnail));
    prev.forEach((p) => {
      if (!currentUrls.has(p.thumbnail)) {
        URL.revokeObjectURL(p.thumbnail);
      }
    });
  }, [pages]);

  // Revoke all remaining blob URLs on unmount
  useEffect(() => {
    return () => {
      prevPagesRef.current.forEach((p) => URL.revokeObjectURL(p.thumbnail));
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setIsLoading(true);
    setSelectedIndices(new Set());
    setError(null);
    try {
      const result = await generateThumbnails(f);
      if (!result.success) {
        setError(t('passwordProtected'));
        return;
      }
      setFile(f);
      setPages(result.pages);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (pendingPdfFiles && pendingPdfFiles.length > 0) {
      handleFiles(pendingPdfFiles);
      setPendingPdfFiles(null);
    }
  }, [pendingPdfFiles, setPendingPdfFiles, handleFiles]);

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedIndices(new Set(pages.map((_, i) => i)));
  const deselectAll = () => setSelectedIndices(new Set());

  const deleteSelected = () => {
    setPages((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const rotateSelected = () => {
    setPages((prev) =>
      prev.map((p, i) =>
        selectedIndices.has(i) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setPages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setIsSaving(true);
    try {
      const bytes = await buildModifiedPdf(
        file,
        pages.map((p) => ({ originalIndex: p.pageIndex, rotation: p.rotation }))
      );
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-edited.pdf`);
    } finally {
      setIsSaving(false);
    }
  };

  const allSelected = pages.length > 0 && selectedIndices.size === pages.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isLoading} multiple={false} />

      {error && (
        <p className="px-4 py-2 text-sm text-red-500">{error}</p>
      )}

      {pages.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap cursor-pointer"
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </button>

          <button
            onClick={deleteSelected}
            disabled={selectedIndices.size === 0}
            className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {t('deleteSelected')}
          </button>

          <button
            onClick={rotateSelected}
            disabled={selectedIndices.size === 0}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            <RotateCw size={12} />
            {t('rotateSelected')}
          </button>

          {selectedIndices.size > 0 && (
            <span className="text-xs font-medium text-primary whitespace-nowrap">
              {t('selectedCount', { count: selectedIndices.size })}
            </span>
          )}

          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {t('pageCount', { count: pages.length })}
          </span>

          <button
            onClick={handleSave}
            disabled={isSaving || pages.length === 0}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 whitespace-nowrap cursor-pointer',
              !isSaving
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Download size={12} />
            {isSaving ? t('saving') : t('save')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
            {pages.map((page, idx) => (
              <div
                key={`${page.pageIndex}-${idx}`}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                onClick={() => toggleSelect(idx)}
                className={cn(
                  'relative aspect-[3/4] cursor-pointer rounded-md border-2 overflow-hidden transition-all select-none',
                  selectedIndices.has(idx)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50',
                  draggedIdx === idx && 'opacity-30'
                )}
              >
                <img
                  src={page.thumbnail}
                  alt={`Page ${page.pageIndex + 1}`}
                  className="h-full w-full object-cover"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center">
                  <span className="text-[10px] text-white font-medium">{page.pageIndex + 1}</span>
                </div>
                {selectedIndices.has(idx) && (
                  <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
