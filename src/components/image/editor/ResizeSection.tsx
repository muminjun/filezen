'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResizeData } from '@/lib/types';

interface Props {
  resizeData: ResizeData | undefined;
  previewWidth: number;
  previewHeight: number;
  onChange: (resize: ResizeData | undefined) => void;
}

export function ResizeSection({ resizeData, previewWidth, previewHeight, onChange }: Props) {
  const t = useTranslations('editDrawer');
  const [unit, setUnit]               = useState<'px' | '%'>(resizeData?.unit ?? 'px');
  const [lockAspect, setLockAspect]   = useState(resizeData?.lockAspect ?? true);
  const [width, setWidth]             = useState<string>(
    resizeData ? String(resizeData.width) : String(previewWidth || 1920),
  );
  const [height, setHeight]           = useState<string>(
    resizeData ? String(resizeData.height) : String(previewHeight || 1080),
  );

  const aspectRatio = (previewWidth > 0 && previewHeight > 0)
    ? previewHeight / previewWidth
    : 1;

  useEffect(() => {
    if (unit === '%') {
      setWidth('100');
      setHeight('100');
    } else {
      setWidth(String(previewWidth || 1920));
      setHeight(String(previewHeight || 1080));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const handleWidthChange = (val: string) => {
    setWidth(val);
    if (lockAspect) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        setHeight(String(Math.round(n * aspectRatio)));
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    if (lockAspect) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        setWidth(String(Math.round(n / aspectRatio)));
      }
    }
  };

  const handleApply = () => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    onChange({ width: w, height: h, unit, lockAspect });
  };

  const handleClear = () => {
    onChange(undefined);
    setUnit('px');
    setLockAspect(true);
    setWidth(String(previewWidth || 1920));
    setHeight(String(previewHeight || 1080));
  };

  const isApplied = resizeData !== undefined;

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-[#555]">
          {t('resizeSection')}
        </p>
        {isApplied && (
          <span className="text-[10px] font-medium text-[#0a84ff]">
            {resizeData!.width}{resizeData!.unit} × {resizeData!.height}{resizeData!.unit}
          </span>
        )}
      </div>

      {/* Unit toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-[#2c2c2e] p-0.5">
        {(['px', '%'] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={cn(
              'flex-1 rounded-md py-1 text-xs font-medium transition-colors',
              unit === u ? 'bg-[#3a3a3c] text-white' : 'text-[#888] hover:text-[#ccc]',
            )}
          >
            {u === 'px' ? t('resizePx') : t('resizePercent')}
          </button>
        ))}
      </div>

      {/* Width / Height inputs */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-[#666]">{t('resizeWidth')}</label>
          <input
            type="number"
            min="1"
            max={unit === '%' ? 1000 : 10000}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>

        <button
          onClick={() => setLockAspect((v) => !v)}
          title={t('resizeLockAspect')}
          className="mt-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#2c2c2e] text-[#888] hover:text-[#ccc] transition-colors"
        >
          {lockAspect ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-[#666]">{t('resizeHeight')}</label>
          <input
            type="number"
            min="1"
            max={unit === '%' ? 1000 : 10000}
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>
      </div>

      <p className="mb-3 text-[10px] text-[#555]">{t('resizeHint')}</p>

      <div className="flex gap-2">
        {isApplied && (
          <button
            onClick={handleClear}
            className="rounded-lg bg-[#2c2c2e] px-3 py-2 text-[12px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('resizeClear')}
          </button>
        )}
        <button
          onClick={handleApply}
          className="flex-1 rounded-lg bg-[#0a84ff] py-2 text-[12px] font-semibold text-white hover:bg-[#0070d0] transition-colors"
        >
          {t('resizeApply')}
        </button>
      </div>
    </div>
  );
}
