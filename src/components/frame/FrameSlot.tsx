'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { SlotDef } from '@/lib/frameTemplates';

interface Props {
  index: number;
  slot: SlotDef;
  file: File | null;
  borderRadius: number;
  onFile: (file: File) => void;
  onClear: () => void;
  onSwap: (a: number, b: number) => void;
}

export function FrameSlot({ index, slot, file, borderRadius, onFile, onClear, onSwap }: Props) {
  const t = useTranslations('frame.slot');
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { onFile(f); e.target.value = ''; }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) onSwap(from, index);
  };

  return (
    <div
      style={{
        gridColumn: `${slot.col} / span ${slot.colSpan}`,
        gridRow: `${slot.row} / span ${slot.rowSpan}`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
      }}
      className={cn('relative', isDragOver && 'ring-2 ring-primary ring-inset')}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt=""
            draggable
            onDragStart={handleDragStart}
            onClick={() => inputRef.current?.click()}
            className="h-full w-full object-cover cursor-pointer"
          />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            title={t('remove')}
          >
            <X size={10} />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <Plus size={20} />
          <span className="text-xs">{t('empty')}</span>
        </button>
      )}
    </div>
  );
}
