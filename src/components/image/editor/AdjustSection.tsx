'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { DEFAULT_ADJUSTMENT } from '@/lib/colorAdjustment';
import type { ColorAdjustment, SavedAdjustment } from '@/lib/types';

type ParamKey = keyof ColorAdjustment;

interface ParamConfig {
  key:   ParamKey;
  min:   number;
  max:   number;
  icon:  string;
  iconBg: string;
  iconColor: string;
}

const PARAM_CONFIGS: ParamConfig[] = [
  { key: 'exposure',   min: -100, max: 100, icon: '☀️', iconBg: '#2c2c2e', iconColor: '#fff'    },
  { key: 'brilliance', min: -100, max: 100, icon: '✦',  iconBg: '#3a2a1a', iconColor: '#ffaa44' },
  { key: 'highlights', min: -100, max: 0,   icon: '◑',  iconBg: '#3a3a1a', iconColor: '#ffdd44' },
  { key: 'shadows',    min: 0,    max: 100, icon: '◐',  iconBg: '#1a1a3a', iconColor: '#6688ff' },
  { key: 'contrast',   min: -100, max: 100, icon: '◈',  iconBg: '#2a2a2a', iconColor: '#ccc'    },
  { key: 'brightness', min: -100, max: 100, icon: '○',  iconBg: '#3a3518', iconColor: '#ffee88' },
  { key: 'blackpoint', min: 0,    max: 100, icon: '●',  iconBg: '#181818', iconColor: '#888'    },
  { key: 'saturation', min: -100, max: 100, icon: '❋',  iconBg: '#2a1a3a', iconColor: '#bb66ff' },
  { key: 'vibrance',   min: -100, max: 100, icon: '⬡',  iconBg: '#1a3a2a', iconColor: '#44ffaa' },
  { key: 'warmth',     min: -100, max: 100, icon: '⬥',  iconBg: '#3a2010', iconColor: '#ff7733' },
  { key: 'tint',       min: -100, max: 100, icon: '⬦',  iconBg: '#102a1a', iconColor: '#44bb88' },
  { key: 'sharpness',  min: 0,    max: 100, icon: '◇',  iconBg: '#1a2a3a', iconColor: '#88ccff' },
  { key: 'definition', min: 0,    max: 100, icon: '⬡',  iconBg: '#1a2a2a', iconColor: '#66ccaa' },
  { key: 'noise',      min: 0,    max: 100, icon: '≋',  iconBg: '#2a2a1a', iconColor: '#aaaa66' },
  { key: 'vignette',   min: 0,    max: 100, icon: '◎',  iconBg: '#111',    iconColor: '#999'    },
];

interface Props {
  adjustment:        ColorAdjustment;
  onChange:          (adj: ColorAdjustment) => void;
  savedAdjustments:  SavedAdjustment[];
  recentAdjustments: ColorAdjustment[];
  onSavePreset:      (name: string) => void;
}

export function AdjustSection({
  adjustment,
  onChange,
  savedAdjustments,
  recentAdjustments,
  onSavePreset,
}: Props) {
  const t = useTranslations('editDrawer');
  const [selectedParam, setSelectedParam] = useState<ParamKey>('exposure');
  const [saveLabel, setSaveLabel]         = useState<string>(t('savePreset'));

  const current = PARAM_CONFIGS.find((c) => c.key === selectedParam)!;
  const value   = adjustment[selectedParam];

  const handleSliderChange = useCallback((v: number) => {
    onChange({ ...adjustment, [selectedParam]: v });
  }, [adjustment, selectedParam, onChange]);

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_ADJUSTMENT });
  }, [onChange]);

  const handleSave = useCallback(() => {
    const name = window.prompt(t('savePreset'), t('savePreset'));
    if (!name) return;
    onSavePreset(name);
    setSaveLabel(t('saved'));
    setTimeout(() => setSaveLabel(t('savePreset')), 1500);
  }, [onSavePreset, t]);

  const fillStyle = useCallback((min: number, max: number, val: number): React.CSSProperties => {
    const range = max - min;
    if (min < 0) {
      const center = (-min) / range * 100;
      const pos    = (val - min) / range * 100;
      const lo     = Math.min(center, pos);
      const hi     = Math.max(center, pos);
      return val === 0
        ? { background: '#3a3a3c' }
        : { background: `linear-gradient(to right,#3a3a3c ${lo}%,#0a84ff ${lo}%,#0a84ff ${hi}%,#3a3a3c ${hi}%)` };
    }
    const pos = (val - min) / range * 100;
    return { background: pos > 0 ? `linear-gradient(to right,#0a84ff ${pos}%,#3a3a3c ${pos}%)` : '#3a3a3c' };
  }, []);

  return (
    <div className="flex flex-col">
      {/* 선택된 파라미터 + 큰 슬라이더 */}
      <div className="bg-[#1c1c1e] px-5 py-3">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-white">
            {t(`params.${selectedParam}`)}
          </span>
          <span className="text-[22px] font-light tabular-nums text-[#0a84ff]">
            {value > 0 ? `+${value}` : value}
          </span>
        </div>
        <div className="relative flex h-7 items-center">
          {current.min < 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-[#3a3a3c]" />
          )}
          <input
            type="range"
            min={current.min}
            max={current.max}
            value={value}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="relative z-10 h-1 w-full cursor-pointer appearance-none rounded-full"
            style={fillStyle(current.min, current.max, value)}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-[#444]">
          {selectedParam === 'warmth' ? (
            <><span>{t('paramRanges.warmthMin')}</span><span>{t('paramRanges.warmthMax')}</span></>
          ) : selectedParam === 'tint' ? (
            <><span>{t('paramRanges.tintMin')}</span><span>{t('paramRanges.tintMax')}</span></>
          ) : (
            <><span>{current.min}</span><span>{current.min < 0 ? `+${current.max}` : `+${current.max}`}</span></>
          )}
        </div>
      </div>

      {/* 아이콘 스트립 */}
      <div className="border-t border-[#2a2a2c] bg-[#1c1c1e]">
        <div className="flex overflow-x-auto pb-2 pt-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {PARAM_CONFIGS.map(({ key, icon, iconBg, iconColor }) => {
            const isTouched = adjustment[key] !== 0;
            const isSel     = key === selectedParam;
            return (
              <button
                key={key}
                onClick={() => setSelectedParam(key)}
                className={cn(
                  'flex flex-shrink-0 flex-col items-center gap-1 rounded-[10px] px-2 py-1.5 transition-colors',
                  isSel ? 'bg-[#2c2c2e]' : 'bg-transparent'
                )}
              >
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-transform',
                    isSel && 'scale-110'
                  )}
                  style={{ background: iconBg, color: iconColor }}
                >
                  {icon}
                  {isTouched && (
                    <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#0a84ff]" />
                  )}
                </div>
                <span className={cn(
                  'whitespace-nowrap text-[9px]',
                  isSel ? 'font-semibold text-[#0a84ff]' : 'text-[#666]'
                )}>
                  {t(`params.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 즐겨찾기 저장 / 최근 / 즐겨찾기 */}
      <div className="border-t border-[#2a2a2c] bg-[#1c1c1e] px-5 py-3">
        <button
          onClick={handleSave}
          className="mb-3 w-full rounded-[9px] border border-[#0a84ff33] py-2 text-xs text-[#0a84ff] transition-colors hover:bg-[#0a84ff18]"
        >
          {saveLabel}
        </button>

        {recentAdjustments.length > 0 && (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#555]">
              {t('recentLabel')}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {recentAdjustments.map((adj, i) => (
                <button
                  key={i}
                  onClick={() => onChange(adj)}
                  className="rounded-[10px] border border-[#3a3a3c] bg-[#2c2c2e] px-2.5 py-1 text-[11px] text-[#bbb] transition-colors hover:border-[#0a84ff] hover:text-[#0a84ff]"
                >
                  {t('recentLabel')} {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {savedAdjustments.length > 0 && (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#555]">
              {t('favoritesLabel')}
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {savedAdjustments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange(s.adjustment)}
                  className="rounded-[10px] border border-[#3a3a3c] bg-[#2c2c2e] px-2.5 py-1 text-[11px] text-[#bbb] transition-colors hover:border-[#0a84ff] hover:text-[#0a84ff]"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleReset}
          className="rounded-[10px] border border-[#ff453a33] px-2.5 py-1 text-[11px] text-[#ff453a] transition-colors hover:border-[#ff453a] hover:bg-[#ff453a18]"
        >
          {t('resetAll')}
        </button>
      </div>
    </div>
  );
}
