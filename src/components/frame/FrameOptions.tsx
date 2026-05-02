'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FrameTemplate, FrameOptionsState } from '@/lib/frameTemplates';

const GAP_COLORS = ['#ffffff', '#000000', '#f5f5f5', '#1a1a1a', '#ffd6e0', '#d6eaff'];

interface Props {
  template: FrameTemplate;
  options: FrameOptionsState;
  onChange: (opts: FrameOptionsState) => void;
}

export function FrameOptions({ template, options, onChange }: Props) {
  const t = useTranslations('frame.options');
  const isSingleSlot = template.slots.length === 1;
  const isNonSquare = template.canvasRatio[0] !== template.canvasRatio[1];

  const set = <K extends keyof FrameOptionsState>(key: K, value: FrameOptionsState[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <div className="flex flex-col gap-5 p-4">
      {isSingleSlot && isNonSquare && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('orientation')}
          </span>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map((o) => (
              <button
                key={o}
                onClick={() => set('orientation', o)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer',
                  options.orientation === o
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:bg-muted/60',
                )}
              >
                {t(o)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('gapColor')}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {GAP_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set('gapColor', c)}
              style={{ backgroundColor: c }}
              className={cn(
                'h-6 w-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110',
                options.gapColor === c ? 'border-primary scale-110' : 'border-border',
              )}
            />
          ))}
          <input
            type="color"
            value={options.gapColor}
            onChange={(e) => set('gapColor', e.target.value)}
            className="h-6 w-6 cursor-pointer rounded-full border border-border"
            title="Custom color"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('gapSize')}{' '}
          <span className="normal-case font-normal">{options.gapSize}px</span>
        </span>
        <input
          type="range" min={0} max={40} step={1} value={options.gapSize}
          onChange={(e) => set('gapSize', Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('borderRadius')}{' '}
          <span className="normal-case font-normal">{options.borderRadius}px</span>
        </span>
        <input
          type="range" min={0} max={20} step={1} value={options.borderRadius}
          onChange={(e) => set('borderRadius', Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('borderWidth')}{' '}
          <span className="normal-case font-normal">{options.borderWidth}px</span>
        </span>
        <input
          type="range" min={0} max={10} step={1} value={options.borderWidth}
          onChange={(e) => set('borderWidth', Number(e.target.value))}
          className="w-full cursor-pointer accent-primary"
        />
      </div>

      {options.borderWidth > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('borderColor')}
          </span>
          <input
            type="color"
            value={options.borderColor}
            onChange={(e) => set('borderColor', e.target.value)}
            className="h-8 w-full cursor-pointer rounded border border-border"
          />
        </div>
      )}
    </div>
  );
}
