'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes } from '@/lib/utils';
import { addPdfWatermark } from '@/lib/pdfWatermark';
import type { PdfWatermarkOptions, WatermarkPageRange } from '@/lib/pdfWatermark';
import { FileUploadStrip } from '../FileUploadStrip';

const DEFAULT: PdfWatermarkOptions = {
  text:      'CONFIDENTIAL',
  fontSize:  48,
  opacity:   0.3,
  color:     '#ff0000',
  angle:     45,
  repeat:    true,
  pageRange: 'all',
};

export function PdfWatermarkTool() {
  const t = useTranslations('file.pdfWatermark');

  const [file, setFile]           = useState<File | null>(null);
  const [opts, setOpts]           = useState<PdfWatermarkOptions>({ ...DEFAULT });
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo]     = useState('1');
  const [isApplying, setIsApplying] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const update = (partial: Partial<PdfWatermarkOptions>) =>
    setOpts((prev) => ({ ...prev, ...partial }));

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleApply = async () => {
    if (!file || !opts.text.trim()) return;
    setIsApplying(true);
    setError(null);
    setDone(false);

    try {
      const pageRange: WatermarkPageRange = opts.pageRange === 'all'
        ? 'all'
        : { from: parseInt(rangeFrom, 10) || 1, to: parseInt(rangeTo, 10) || 1 };

      const bytes = await addPdfWatermark(file, { ...opts, pageRange });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-watermarked.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isApplying} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('text')}
            </label>
            <input
              type="text"
              value={opts.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder={t('textPlaceholder')}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Font size + Color + Angle row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('fontSize')}</label>
              <input
                type="number" min={12} max={120}
                value={opts.fontSize}
                onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) || 48 })}
                className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('color')}</label>
              <input
                type="color" value={opts.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-[30px] w-full cursor-pointer rounded-md border border-border bg-card p-0.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('angle')}°</label>
              <input
                type="number" min={0} max={360}
                value={opts.angle}
                onChange={(e) => update({ angle: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{t('opacity')}</label>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(opts.opacity * 100)}%
              </span>
            </div>
            <input
              type="range" min={0} max={100}
              value={Math.round(opts.opacity * 100)}
              onChange={(e) => update({ opacity: parseInt(e.target.value, 10) / 100 })}
              className="w-full h-1 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Repeat toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={opts.repeat}
              onChange={(e) => update({ repeat: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">{t('repeat')}</span>
          </label>

          {/* Page range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('pageRange')}
            </label>
            <div className="flex gap-2">
              {(['all', 'custom'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => update({ pageRange: v === 'all' ? 'all' : { from: 1, to: 1 } })}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    (v === 'all' ? opts.pageRange === 'all' : opts.pageRange !== 'all')
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {v === 'all' ? t('pageRangeAll') : t('pageRangeCustom')}
                </button>
              ))}
            </div>
            {opts.pageRange !== 'all' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">{t('pageFrom')}</label>
                <input
                  type="number" min={1} value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
                <label className="text-xs text-muted-foreground">{t('pageTo')}</label>
                <input
                  type="number" min={1} value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}

          <button
            onClick={handleApply}
            disabled={isApplying || !opts.text.trim()}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isApplying && opts.text.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isApplying
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isApplying ? t('applying') : t('apply')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
