'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, GripVertical, Download } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { mergePdfs } from '@/lib/pdfMerge';
import { FileUploadStrip } from '../FileUploadStrip';

interface PdfEntry {
  id: string;
  file: File;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function MergeTool() {
  const t = useTranslations('file.merge');
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleFiles = (files: File[]) => {
    const next: PdfEntry[] = files.map((f) => ({ id: generateId(), file: f }));
    setEntries((prev) => [...prev, ...next]);
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setEntries((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  const handleMerge = async () => {
    if (entries.length < 2) return;
    setIsMerging(true);
    try {
      const bytes = await mergePdfs(entries.map((e) => e.file));
      downloadBytes(bytes, `merged-${Date.now()}.pdf`);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isMerging} multiple />

      {entries.length > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {t('fileCount', { count: entries.length })}
          </span>
          <button
            onClick={handleMerge}
            disabled={entries.length < 2 || isMerging}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
              entries.length >= 2 && !isMerging
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Download size={12} />
            {isMerging ? t('merging') : t('merge')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-opacity',
                  draggedIdx === idx && 'opacity-30'
                )}
              >
                <GripVertical size={16} className="flex-shrink-0 cursor-move text-muted-foreground" />
                <span className="flex-1 truncate text-sm font-medium">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title={t('remove')}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
