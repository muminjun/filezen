'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const PRESET_DEGREES = [90, 180, 270] as const;
const ROTATION_LABEL_KEYS = {
  90: 'rotate90',
  180: 'rotate180',
  270: 'rotate270',
} as const;

export function BottomActionBar() {
  const t = useTranslations('actionBar');
  const { 
    selectedIds, 
    rotateSelected, 
    downloadAsZip, 
    isDownloading,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality
  } = useAppContext();
  const [customAngle, setCustomAngle] = useState('');

  const hasSelection = selectedIds.size > 0;

  const handleApplyCustom = () => {
    const deg = parseInt(customAngle, 10);
    if (isNaN(deg) || !hasSelection) return;
    rotateSelected(deg);
    setCustomAngle('');
  };

  return (
    <div className="flex h-[52px] flex-shrink-0 items-center gap-2 border-t border-border bg-card px-4 overflow-x-auto no-scrollbar shadow-sm">
      <span className="min-w-[90px] flex-shrink-0 text-xs text-muted-foreground">
        {hasSelection
          ? t('selectedCount', { count: selectedIds.size })
          : t('noneSelected')}
      </span>

      <div className="h-5 w-px flex-shrink-0 bg-border" />

      <div className="flex flex-shrink-0 items-center gap-2">
        {PRESET_DEGREES.map((deg) => (
          <button
            key={deg}
            onClick={() => hasSelection && rotateSelected(deg)}
            disabled={!hasSelection}
            title={t(ROTATION_LABEL_KEYS[deg])}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              hasSelection
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'cursor-not-allowed text-muted-foreground opacity-40'
            )}
          >
            <RotateCw size={12} className="flex-shrink-0" />
            {deg}°
          </button>
        ))}
      </div>

      <div className="h-5 w-px flex-shrink-0 bg-border" />

      <div className="flex flex-shrink-0 items-center gap-1">
        <input
          type="number"
          value={customAngle}
          onChange={(e) => setCustomAngle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCustom()}
          disabled={!hasSelection}
          placeholder={t('customAngle')}
          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
        />
        <span className="text-xs text-muted-foreground">°</span>
        <button
          onClick={handleApplyCustom}
          disabled={!hasSelection || customAngle === ''}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap',
            hasSelection && customAngle !== ''
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          {t('apply')}
        </button>
      </div>

      <div className="h-5 w-px flex-shrink-0 bg-border" />

      <div className="flex flex-shrink-0 items-center gap-2">
        <Select value={outputFormat} onValueChange={(val) => setOutputFormat(val as any)}>
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue placeholder={t('format')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">{t('original')}</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>

        {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-muted-foreground uppercase">{t('quality')}</span>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] font-mono w-6 text-center">{quality}%</span>
          </div>
        )}
      </div>

      <div className="ml-auto flex flex-shrink-0 items-center pl-2">
        <button
          onClick={downloadAsZip}
          disabled={!hasSelection || isDownloading}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
            hasSelection && !isDownloading
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
          )}
        >
          <Download size={14} className="flex-shrink-0" />
          {isDownloading ? t('downloading') : t('downloadZip')}
        </button>
      </div>
    </div>
  );
}
