'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes, downloadBlob } from '@/lib/utils';
import { generateThumbnails } from '@/lib/pdfThumbnail';
import { splitPdfAll, splitPdfSelection, splitPdfByRange } from '@/lib/pdfSplit';
import { FileUploadStrip } from '../FileUploadStrip';
import type { PdfPage } from '@/lib/types';

type SplitMode = 'all' | 'selection' | 'range';

export function SplitTool() {
  const t = useTranslations('file.split');

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<SplitMode>('all');
  const [rangeStr, setRangeStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const prevPagesRef = useRef<PdfPage[]>([]);

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
    try {
      const result = await generateThumbnails(f);
      if (!result.success) {
        alert('This PDF is password-protected. Use the Unlock tool first.');
        return;
      }
      setFile(f);
      setPages(result.pages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePage = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsSplitting(true);
    try {
      const JSZip = (await import('jszip')).default;

      if (mode === 'all') {
        const results = await splitPdfAll(file);
        if (results.length === 1) {
          downloadBytes(results[0], 'page-1.pdf');
        } else {
          const zip = new JSZip();
          results.forEach((bytes, i) => zip.file(`page-${i + 1}.pdf`, bytes));
          const content = await zip.generateAsync({ type: 'blob' });
          downloadBlob(content, `split-${file.name.replace(/\.pdf$/i, '')}.zip`);
        }
      } else if (mode === 'selection') {
        const indices = Array.from(selectedIndices).sort((a, b) => a - b);
        const bytes = await splitPdfSelection(file, indices);
        downloadBytes(bytes, `extracted-${file.name}`);
      } else {
        const results = await splitPdfByRange(file, rangeStr);
        if (results.length === 1) {
          downloadBytes(results[0].bytes, 'split-1.pdf');
        } else {
          const zip = new JSZip();
          results.forEach((r, i) => {
            const label = r.pages.map((p) => p + 1).join('-');
            zip.file(`pages-${label}.pdf`, r.bytes);
          });
          const content = await zip.generateAsync({ type: 'blob' });
          downloadBlob(content, `split-${file.name.replace(/\.pdf$/i, '')}.zip`);
        }
      }
    } finally {
      setIsSplitting(false);
    }
  };

  const canSplit =
    file &&
    !isSplitting &&
    (mode === 'all' ||
      (mode === 'selection' && selectedIndices.size > 0) ||
      (mode === 'range' && rangeStr.trim().length > 0));

  const modeLabels: Record<SplitMode, string> = {
    all: t('modeAll'),
    selection: t('modeSelection'),
    range: t('modeRange'),
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isLoading || isSplitting} multiple={false} />

      {file && (
        <>
          <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'selection', 'range'] as SplitMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>

            {mode === 'range' && (
              <input
                type="text"
                value={rangeStr}
                onChange={(e) => setRangeStr(e.target.value)}
                placeholder={t('rangePlaceholder')}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            )}
            {mode === 'selection' && (
              <p className="text-[11px] text-muted-foreground">{t('selectPages')}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('pageCount', { count: pages.length })}
              </span>
              <button
                onClick={handleSplit}
                disabled={!canSplit}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
                  canSplit
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                {isSplitting ? t('splitting') : t('split')}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {pages.map((page, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={page.pageIndex}
                    onClick={() => mode === 'selection' && togglePage(idx)}
                    className={cn(
                      'relative aspect-[3/4] rounded-md border-2 overflow-hidden transition-all',
                      mode === 'selection' ? 'cursor-pointer' : 'cursor-default',
                      isSelected && mode === 'selection'
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border'
                    )}
                  >
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center">
                      <span className="text-[10px] text-white font-medium">{page.pageIndex + 1}</span>
                    </div>
                    {isSelected && mode === 'selection' && (
                      <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!file && !isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
