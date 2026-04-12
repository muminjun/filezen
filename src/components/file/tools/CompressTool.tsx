'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, AlertTriangle } from 'lucide-react';
import { cn, downloadBytes, formatFileSize } from '@/lib/utils';
import { compressPdf, type CompressionLevel } from '@/lib/pdfCompress';
import { FileUploadStrip } from '../FileUploadStrip';

const LEVELS: CompressionLevel[] = ['low', 'medium', 'high'];

export function CompressTool() {
  const t = useTranslations('file.compress');

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);

  const handleFiles = (files: File[]) => {
    if (files[0]) {
      setFile(files[0]);
      setResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);
    setResult(null);
    try {
      const bytes = await compressPdf(file, level);
      setResult({ bytes, size: bytes.byteLength });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadBytes(result.bytes, `${baseName}-compressed.pdf`);
  };

  const savings =
    file && result
      ? Math.round((1 - result.size / file.size) * 100)
      : null;

  const levelLabel = (l: CompressionLevel) => {
    if (l === 'low') return t('levelLow');
    if (l === 'medium') return t('levelMedium');
    return t('levelHigh');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isCompressing} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {t('originalSize')}: {formatFileSize(file.size)}
            </span>
          </div>

          {/* Level selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('level')}
            </span>
            <div className="flex flex-col gap-1">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l);
                    setResult(null);
                  }}
                  disabled={isCompressing}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all cursor-pointer',
                    level === l
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-card text-foreground hover:bg-muted/60',
                    isCompressing && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'h-3 w-3 flex-shrink-0 rounded-full border-2',
                      level === l ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}
                  />
                  {levelLabel(l)}
                </button>
              ))}
            </div>
          </div>

          {/* Warning for lossy modes */}
          {(level === 'medium' || level === 'high') && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-700 dark:text-amber-400">{t('warning')}</span>
            </div>
          )}

          {/* Result */}
          {result && savings !== null && (
            <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground">{t('compressedSize')}</span>
                <span className="text-sm font-medium">{formatFileSize(result.size)}</span>
              </div>
              {savings > 0 ? (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                  {t('savings', { percent: savings })}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {t('noSavings')}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                !isCompressing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              )}
            >
              {isCompressing ? t('compressing') : t('compress')}
            </button>

            {result && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
