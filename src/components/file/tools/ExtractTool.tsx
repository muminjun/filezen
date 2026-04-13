'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { extractPdfToImages } from '@/lib/pdfToImages';
import type { ImageOutputFormat, ExtractOptions } from '@/lib/pdfToImages';
import { FileUploadStrip } from '../FileUploadStrip';

export function ExtractTool() {
  const t = useTranslations('file.extract');

  const [file, setFile]           = useState<File | null>(null);
  const [format, setFormat]       = useState<ImageOutputFormat>('png');
  const [dpi, setDpi]             = useState<72 | 150 | 300>(150);
  const [useRange, setUseRange]   = useState(false);
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo]     = useState('1');
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress]   = useState({ current: 0, total: 0 });
  const [done, setDone]           = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError(null);
    setDone(false);
    setProgress({ current: 0, total: 0 });

    try {
      const pageRange: ExtractOptions['pageRange'] = useRange
        ? { from: parseInt(rangeFrom, 10) || 1, to: parseInt(rangeTo, 10) || 1 }
        : 'all';

      const images = await extractPdfToImages(file, {
        format,
        dpi,
        pageRange,
        onProgress: (current, total) => setProgress({ current, total }),
      });

      const JSZip = (await import('jszip')).default;
      const zip   = new JSZip();
      for (const { name, blob } of images) {
        zip.file(name, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url     = URL.createObjectURL(content);
      const a       = document.createElement('a');
      a.href        = url;
      a.download    = `${file.name.replace(/\.pdf$/i, '')}-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDoneCount(images.length);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isExtracting} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('format')}
            </label>
            <div className="flex gap-2">
              {(['png', 'jpeg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                    format === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* DPI */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('dpi')}
            </label>
            <div className="flex gap-2">
              {([72, 150, 300] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDpi(d)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    dpi === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {d === 72 ? t('dpi72') : d === 150 ? t('dpi150') : t('dpi300')}
                </button>
              ))}
            </div>
          </div>

          {/* Page range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('pageRange')}
            </label>
            <div className="flex gap-2">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setUseRange(v)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    useRange === v
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {v ? t('pageRangeCustom') : t('pageRangeAll')}
                </button>
              ))}
            </div>
            {useRange && (
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

          {/* Progress */}
          {isExtracting && progress.total > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {t('extracting', { current: progress.current, total: progress.total })}
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('success', { count: doneCount })}
            </p>
          )}

          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isExtracting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isExtracting
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isExtracting ? '...' : t('extract')}
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
