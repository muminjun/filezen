'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

const PRESET_DEGREES = [90, 180, 270] as const;
const ROTATION_LABEL_KEYS = {
  90: 'rotate90',
  180: 'rotate180',
  270: 'rotate270',
} as const;

export function BottomActionBar() {
  const t = useTranslations('actionBar');
  const { selectedIds, rotateSelected, downloadAsZip, isDownloading } = useAppContext();
  const [customAngle, setCustomAngle] = useState('');

  const hasSelection = selectedIds.size > 0;

  const handleApplyCustom = () => {
    const deg = parseInt(customAngle, 10);
    if (isNaN(deg) || !hasSelection) return;
    rotateSelected(deg);
    setCustomAngle('');
  };

  return (
    <div className="flex h-[52px] flex-shrink-0 items-center gap-2 border-t border-border bg-card px-4">
      <span className="min-w-[90px] text-xs text-muted-foreground">
        {hasSelection
          ? t('selectedCount', { count: selectedIds.size })
          : t('noneSelected')}
      </span>

      <div className="h-5 w-px bg-border" />

      {PRESET_DEGREES.map((deg) => (
        <button
          key={deg}
          onClick={() => hasSelection && rotateSelected(deg)}
          disabled={!hasSelection}
          title={t(ROTATION_LABEL_KEYS[deg])}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            hasSelection
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          <RotateCw size={12} />
          {deg}°
        </button>
      ))}

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={customAngle}
          onChange={(e) => setCustomAngle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCustom()}
          disabled={!hasSelection}
          placeholder={t('customAngle')}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
        />
        <span className="text-xs text-muted-foreground">°</span>
        <button
          onClick={handleApplyCustom}
          disabled={!hasSelection || customAngle === ''}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium transition-colors',
            hasSelection && customAngle !== ''
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          {t('apply')}
        </button>
      </div>

      <button
        onClick={downloadAsZip}
        disabled={!hasSelection || isDownloading}
        className={cn(
          'ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          hasSelection && !isDownloading
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
        )}
      >
        <Download size={14} />
        {isDownloading ? t('downloading') : t('downloadZip')}
      </button>
    </div>
  );
}
