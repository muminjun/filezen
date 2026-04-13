'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WatermarkConfig, WatermarkPosition } from '@/lib/types';

const POSITIONS: WatermarkPosition[] = [
  'top-left',    'top-center',    'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

interface Props {
  watermark: WatermarkConfig | undefined;
  onChange: (watermark: WatermarkConfig | undefined) => void;
}

const DEFAULT: WatermarkConfig = {
  text:     '',
  fontSize: 36,
  color:    '#ffffff',
  opacity:  0.5,
  position: 'bottom-right',
  repeat:   false,
};

export function WatermarkSection({ watermark, onChange }: Props) {
  const t = useTranslations('editDrawer');
  const [draft, setDraft] = useState<WatermarkConfig>(watermark ?? { ...DEFAULT });
  const isApplied = watermark !== undefined;

  const update = (partial: Partial<WatermarkConfig>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const handleApply = () => {
    if (!draft.text.trim()) return;
    onChange({ ...draft });
  };

  const handleClear = () => {
    onChange(undefined);
    setDraft({ ...DEFAULT });
  };

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-[#555]">
          {t('watermarkSection')}
        </p>
        {isApplied && (
          <span className="text-[10px] font-medium text-[#0a84ff]">ON</span>
        )}
      </div>

      {/* Text input */}
      <div className="mb-3">
        <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkText')}</label>
        <input
          type="text"
          value={draft.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={t('watermarkTextPlaceholder')}
          className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-3 py-2 text-xs text-white placeholder:text-[#555] outline-none focus:border-[#0a84ff]"
        />
      </div>

      {/* Font size + Color row */}
      <div className="mb-3 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkFontSize')}</label>
          <input
            type="number"
            min={12}
            max={120}
            value={draft.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) || 36 })}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>
        <div className="flex-shrink-0">
          <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkColor')}</label>
          <input
            type="color"
            value={draft.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-[30px] w-[52px] cursor-pointer rounded-md border border-[#3a3a3c] bg-[#2c2c2e] p-0.5"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[10px] text-[#666]">{t('watermarkOpacity')}</label>
          <span className="text-[10px] font-mono text-[#888]">
            {Math.round(draft.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(draft.opacity * 100)}
          onChange={(e) => update({ opacity: parseInt(e.target.value, 10) / 100 })}
          className="w-full h-1 rounded-lg bg-[#3a3a3c] appearance-none cursor-pointer accent-[#0a84ff]"
        />
      </div>

      {/* Position grid */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] text-[#666]">{t('watermarkPosition')}</label>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => update({ position: pos })}
              className={cn(
                'h-7 rounded-md border text-[10px] transition-colors',
                draft.position === pos
                  ? 'border-[#0a84ff] bg-[#0a84ff]/20 text-[#0a84ff]'
                  : 'border-[#3a3a3c] bg-[#2c2c2e] text-[#666] hover:border-[#555]',
              )}
            >
              {pos.split('-').map((s) => s[0].toUpperCase()).join('')}
            </button>
          ))}
        </div>
      </div>

      {/* Repeat toggle */}
      <button
        onClick={() => update({ repeat: !draft.repeat })}
        className={cn(
          'mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition-colors',
          draft.repeat
            ? 'border-[#0a84ff]/40 bg-[#0a84ff]/10'
            : 'border-[#3a3a3c] bg-[#2c2c2e] hover:bg-[#3a3a3c]',
        )}
      >
        <span className={cn('text-[12px]', draft.repeat ? 'text-[#0a84ff]' : 'text-[#aaa]')}>
          {t('watermarkRepeat')}
        </span>
        <div className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          draft.repeat ? 'bg-[#0a84ff]' : 'bg-[#3a3a3c]',
        )}>
          <div className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            draft.repeat ? 'translate-x-4' : 'translate-x-0.5',
          )} />
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex gap-2">
        {isApplied && (
          <button
            onClick={handleClear}
            className="rounded-lg bg-[#2c2c2e] px-3 py-2 text-[12px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('watermarkClear')}
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={!draft.text.trim()}
          className={cn(
            'flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors',
            draft.text.trim()
              ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
              : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
          )}
        >
          {t('watermarkApply')}
        </button>
      </div>
    </div>
  );
}
