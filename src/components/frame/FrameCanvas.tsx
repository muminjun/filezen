'use client';

import { FrameSlot } from './FrameSlot';
import { getOrientedRatio } from '@/lib/frameTemplates';
import type { Ref } from 'react';
import type { FrameTemplate, FrameOptionsState } from '@/lib/frameTemplates';

interface Props {
  template: FrameTemplate;
  slotImages: (File | null)[];
  options: FrameOptionsState;
  previewRef?: Ref<HTMLDivElement>;
  onSlotImage: (index: number, file: File) => void;
  onSlotClear: (index: number) => void;
  onSlotSwap: (a: number, b: number) => void;
}

export function FrameCanvas({
  template, slotImages, options, previewRef, onSlotImage, onSlotClear, onSlotSwap,
}: Props) {
  const [ratioW, ratioH] = getOrientedRatio(template, options.orientation);

  const { cols, rows } = template.grid;
  const gap = options.gapSize;

  return (
    <div
      ref={previewRef}
      className="w-full max-w-xs sm:max-w-sm"
      style={{ aspectRatio: `${ratioW} / ${ratioH}` }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          backgroundColor: options.gapColor,
          outline: options.borderWidth > 0
            ? `${options.borderWidth}px solid ${options.borderColor}`
            : undefined,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: `${gap}px`,
          padding: `${gap}px`,
        }}
      >
        {template.slots.map((slot, i) => (
          <FrameSlot
            key={i}
            index={i}
            slot={slot}
            file={slotImages[i] ?? null}
            borderRadius={options.borderRadius}
            onFile={(file) => onSlotImage(i, file)}
            onClear={() => onSlotClear(i)}
            onSwap={onSlotSwap}
          />
        ))}
      </div>
    </div>
  );
}
