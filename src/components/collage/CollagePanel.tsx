'use client';

import { useTranslations } from 'next-intl';
import type { CollageStyle, AspectRatio } from '@/lib/collageTree';

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16', '16:9', 'free'];

interface CollagePanelProps {
  style: CollageStyle;
  onStyleChange: (patch: Partial<CollageStyle>) => void;
  onUploadPhoto: (files: File[]) => void;
  onSelectFromImageTab: () => void;
  onExport: () => void;
  isExporting: boolean;
  isMobile?: boolean;
}

export function CollagePanel({
  style,
  onStyleChange,
  onUploadPhoto,
  onSelectFromImageTab,
  onExport,
  isExporting,
  isMobile = false,
}: CollagePanelProps) {
  const t = useTranslations('collage');

  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      if (input.files) onUploadPhoto(Array.from(input.files));
    };
    input.click();
  };

  if (isMobile) {
    return (
      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-border bg-card px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onStyleChange({ aspectRatio: r })}
              className={`flex-shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
                style.aspectRatio === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10">{t('styleGap')}</span>
          <input
            type="range"
            min={0}
            max={20}
            value={style.gap}
            onChange={(e) => onStyleChange({ gap: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-8">{style.gap}px</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFileInput}
            className="flex-1 rounded-md bg-muted py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('uploadPhoto')}
          </button>
          <button
            onClick={onSelectFromImageTab}
            className="flex-1 rounded-md bg-muted py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('fromImageTab')}
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 transition-colors"
          >
            {isExporting ? t('exporting') : t('export')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden sm:flex w-44 flex-shrink-0 flex-col gap-4 border-r border-border bg-card p-3 overflow-y-auto">
      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('aspectRatio')}
        </p>
        <div className="flex flex-wrap gap-1">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onStyleChange({ aspectRatio: r })}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                style.aspectRatio === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          스타일
        </p>
        <div className="flex flex-col gap-2">
          <SliderRow label={t('styleGap')} value={style.gap} min={0} max={20} unit="px" onChange={(v) => onStyleChange({ gap: v })} />
          <SliderRow label={t('styleRadius')} value={style.borderRadius} min={0} max={24} unit="px" onChange={(v) => onStyleChange({ borderRadius: v })} />
          <SliderRow label={t('stylePadding')} value={style.padding} min={0} max={40} unit="px" onChange={(v) => onStyleChange({ padding: v })} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('styleBackground')}</span>
            <input
              type="color"
              value={style.background}
              onChange={(e) => onStyleChange({ background: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
            />
          </div>
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          사진
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleFileInput}
            className="w-full rounded-md border-2 border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {t('uploadPhoto')}
          </button>
          <button
            onClick={onSelectFromImageTab}
            className="w-full rounded-md bg-muted py-2 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('fromImageTab')}
          </button>
        </div>
      </section>

      <div className="mt-auto">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-colors hover:bg-primary/90"
        >
          {isExporting ? t('exporting') : `⬇ ${t('export')}`}
        </button>
      </div>
    </aside>
  );
}

function SliderRow({
  label, value, min, max, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-8 text-right text-xs text-muted-foreground">{value}{unit}</span>
    </div>
  );
}
