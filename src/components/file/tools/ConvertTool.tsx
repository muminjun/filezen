'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, GripVertical, Download, ImageIcon, Send } from 'lucide-react';
import JSZip from 'jszip';
import { cn, downloadBlob, downloadBytes } from '@/lib/utils';
import { pdfToImages, imagesToPdf } from '@/lib/pdfConvert';
import { FileUploadStrip } from '../FileUploadStrip';
import { useAppContext } from '@/context/AppContext';

// ── Types ──────────────────────────────────────────────────────────────────────

type PdfFormat = 'png' | 'jpeg' | 'webp';
type DpiOption = 72 | 150 | 300;
type PageSize = 'a4' | 'letter' | 'fit';

interface ImageEntry {
  id: string;
  file: File;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DPI_SCALE: Record<DpiOption, number> = {
  72: 0.75,
  150: 1.5625,
  300: 3.125,
};

// ── Sub-tab: PDF → Images ──────────────────────────────────────────────────────

function PdfToImageTab() {
  const t = useTranslations('file.convert');
  const { addImages } = useAppContext();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PdfFormat>('png');
  const [dpi, setDpi] = useState<DpiOption>(150);
  const [converting, setConverting] = useState(false);
  const [resultBlobs, setResultBlobs] = useState<Blob[] | null>(null);
  const [resultFormat, setResultFormat] = useState<PdfFormat>('png');

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setPdfFile(files[0]);
      setResultBlobs(null);
    }
  };

  const handleConvert = async () => {
    if (!pdfFile) return;
    setConverting(true);
    try {
      const blobs = await pdfToImages(pdfFile, format, DPI_SCALE[dpi]);
      setResultBlobs(blobs);
      setResultFormat(format);

      const ext = format === 'jpeg' ? 'jpg' : format;
      const baseName = pdfFile.name.replace(/\.pdf$/i, '');

      if (blobs.length === 1) {
        downloadBlob(blobs[0], `${baseName}.${ext}`);
      } else {
        const zip = new JSZip();
        blobs.forEach((blob, i) => {
          zip.file(`${baseName}-page-${i + 1}.${ext}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${baseName}-images.zip`);
      }
    } finally {
      setConverting(false);
    }
  };

  const handleSendToImageTab = async () => {
    if (!resultBlobs || resultBlobs.length === 0) return;
    const ext = resultFormat === 'jpeg' ? 'jpg' : resultFormat;
    const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'page';
    const mimeType =
      resultFormat === 'png'
        ? 'image/png'
        : resultFormat === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    const files = resultBlobs.map(
      (blob, i) =>
        new File([blob], `${baseName}-page-${i + 1}.${ext}`, { type: mimeType })
    );
    addImages(files);
  };

  const formats: { value: PdfFormat; label: string }[] = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
  ];

  const dpiOptions: { value: DpiOption; labelKey: 'res72' | 'res150' | 'res300' }[] = [
    { value: 72, labelKey: 'res72' },
    { value: 150, labelKey: 'res150' },
    { value: 300, labelKey: 'res300' },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFile} disabled={converting} />

      {pdfFile && (
        <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border px-4 py-3">
          {/* File info */}
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="flex-shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm font-medium">{pdfFile.name}</span>
            <span className="flex-shrink-0 text-xs text-muted-foreground">
              {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 text-xs text-muted-foreground">
              {t('format')}
            </span>
            <div className="flex gap-1">
              {formats.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                    format === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* DPI selector */}
          <div className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 text-xs text-muted-foreground">
              {t('resolution')}
            </span>
            <div className="flex gap-1 flex-wrap">
              {dpiOptions.map(({ value, labelKey }) => (
                <button
                  key={value}
                  onClick={() => setDpi(value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                    dpi === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleConvert}
              disabled={converting}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
                !converting
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              )}
            >
              <Download size={12} />
              {converting ? t('converting') : t('convert')}
            </button>

            {resultBlobs && resultBlobs.length > 0 && !converting && (
              <button
                onClick={handleSendToImageTab}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted active:scale-95 cursor-pointer"
              >
                <Send size={12} />
                {t('sendToImageTab')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {!pdfFile && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('emptyPdf')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-tab: Images → PDF ──────────────────────────────────────────────────────

function ImageToPdfTab() {
  const t = useTranslations('file.convert');
  const inputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const handleFiles = (newFiles: File[]) => {
    const next: ImageEntry[] = newFiles.map((f) => ({ id: generateId(), file: f }));
    setEntries((prev) => [...prev, ...next]);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
    // reset so the same files can be picked again
    e.target.value = '';
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  // Drag-and-drop reorder (same pattern as MergeTool)
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

  const handleCreate = async () => {
    if (entries.length === 0) return;
    setCreating(true);
    try {
      const bytes = await imagesToPdf(entries.map((e) => e.file), pageSize);
      downloadBytes(bytes, `images-to-pdf-${Date.now()}.pdf`);
    } finally {
      setCreating(false);
    }
  };

  const pageSizeOptions: { value: PageSize; labelKey: 'sizeA4' | 'sizeLetter' | 'sizeFit' }[] =
    [
      { value: 'a4', labelKey: 'sizeA4' },
      { value: 'letter', labelKey: 'sizeLetter' },
      { value: 'fit', labelKey: 'sizeFit' },
    ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Hidden file input for images */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      {/* Upload strip styled consistently with FileUploadStrip */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={creating}
        className={cn(
          'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200 ease-in-out',
          'bg-card hover:bg-muted/60 hover:border-primary/50',
          creating && 'cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
          <ImageIcon size={20} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
            {t('emptyImages')}
          </span>
          <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
            PNG, JPG, WebP, GIF
          </span>
        </div>
      </button>

      {/* Controls bar */}
      {entries.length > 0 && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-2">
          {/* Page size */}
          <span className="text-xs text-muted-foreground">{t('pageSize')}</span>
          <div className="flex gap-1">
            {pageSizeOptions.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setPageSize(value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                  pageSize === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={entries.length === 0 || creating}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
              entries.length > 0 && !creating
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Download size={12} />
            {creating ? t('creating') : t('createPdf')}
          </button>
        </div>
      )}

      {/* Image list */}
      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('emptyImages')}</p>
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
                <GripVertical
                  size={16}
                  className="flex-shrink-0 cursor-move text-muted-foreground"
                />
                <span className="flex-1 truncate text-sm font-medium">{entry.file.name}</span>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
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

// ── Main ConvertTool ───────────────────────────────────────────────────────────

type SubTab = 'pdfToImage' | 'imageToPdf';

export function ConvertTool() {
  const t = useTranslations('file.convert');
  const [activeTab, setActiveTab] = useState<SubTab>('pdfToImage');

  const tabs: { value: SubTab; labelKey: 'tabPdfToImage' | 'tabImageToPdf' }[] = [
    { value: 'pdfToImage', labelKey: 'tabPdfToImage' },
    { value: 'imageToPdf', labelKey: 'tabImageToPdf' },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex flex-shrink-0 gap-1 border-b border-border px-4 pt-2">
        {tabs.map(({ value, labelKey }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === value
                ? 'border border-b-0 border-border bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'pdfToImage' ? <PdfToImageTab /> : <ImageToPdfTab />}
    </div>
  );
}
