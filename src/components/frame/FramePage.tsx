'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  FRAME_TEMPLATES,
  DEFAULT_FRAME_OPTIONS,
  getNaturalOrientation,
  getTemplate,
  type FrameOptionsState,
} from '@/lib/frameTemplates';
import { exportFrame } from '@/lib/frameExport';
import { FrameTemplateSelector } from './FrameTemplateSelector';
import { FrameCanvas } from './FrameCanvas';
import { FrameOptions } from './FrameOptions';

export function FramePage() {
  const t = useTranslations('frame');
  const [templateId, setTemplateId] = useState<string>(FRAME_TEMPLATES[0].id);
  const [slotImages, setSlotImages] = useState<(File | null)[]>(
    () => Array(FRAME_TEMPLATES[0].slots.length).fill(null),
  );
  const [options, setOptions] = useState<FrameOptionsState>(DEFAULT_FRAME_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(320);

  const template = getTemplate(templateId)!;

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const updatePreviewWidth = (width: number) => {
      setPreviewWidth(Math.max(1, Math.round(width)));
    };

    updatePreviewWidth(element.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      updatePreviewWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleTemplateChange = (id: string) => {
    const tmpl = getTemplate(id)!;
    setTemplateId(id);
    setSlotImages(Array(tmpl.slots.length).fill(null));
    setOptions((prev) => ({
      ...prev,
      orientation: getNaturalOrientation(tmpl),
    }));
  };

  const handleSlotImage = (index: number, file: File) => {
    setSlotImages((prev) => {
      const next = Array(template.slots.length).fill(null).map((_, i) => prev[i] ?? null);
      next[index] = file;
      return next;
    });
  };

  const handleSlotClear = (index: number) => {
    setSlotImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSlotSwap = (a: number, b: number) => {
    setSlotImages((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportFrame(template, slotImages, options, previewWidth);
    } finally {
      setIsExporting(false);
    }
  };

  const normalizedSlotImages = Array(template.slots.length)
    .fill(null)
    .map((_, i) => slotImages[i] ?? null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FrameTemplateSelector
        templates={FRAME_TEMPLATES}
        selectedId={templateId}
        onSelect={handleTemplateChange}
      />

      <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          <FrameCanvas
            template={template}
            slotImages={normalizedSlotImages}
            options={options}
            previewRef={previewRef}
            onSlotImage={handleSlotImage}
            onSlotClear={handleSlotClear}
            onSlotSwap={handleSlotSwap}
          />
        </div>

        <div className="flex flex-shrink-0 flex-col overflow-y-auto border-t border-border sm:w-64 sm:border-l sm:border-t-0">
          <FrameOptions
            template={template}
            options={options}
            onChange={setOptions}
          />
          <div className="px-4 pb-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={cn(
                'w-full rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                isExporting
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {isExporting ? t('exporting') : t('export')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
