'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { SlotDef, SlotTransform } from '@/lib/frameTemplates';
import { DEFAULT_TRANSFORM } from '@/lib/frameTemplates';

interface Props {
  index: number;
  slot: SlotDef;
  file: File | null;
  borderRadius: number;
  transform: SlotTransform;
  isEditing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
  onSwap: (a: number, b: number) => void;
  onTransformChange: (t: SlotTransform) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FrameSlot({
  index,
  slot,
  file,
  borderRadius,
  transform,
  isEditing,
  onFile,
  onClear,
  onSwap,
  onTransformChange,
  onEditStart,
  onEditEnd,
}: Props) {
  const t = useTranslations('frame.slot');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const preview = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, moved: false });

  // 멀티터치 pinch 추적
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const startScaleRef = useRef<number>(1);

  const transformRef = useRef<SlotTransform>(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // 편집 모드일 때 외부 클릭 감지 → onEditEnd
  useEffect(() => {
    if (!isEditing) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onEditEnd();
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [isEditing, onEditEnd]);

  const getMaxOffset = (scale: number) => {
    if (!containerRef.current) return { maxX: 0, maxY: 0 };
    const { width: slotW, height: slotH } = containerRef.current.getBoundingClientRect();
    return {
      maxX: (slotW * scale - slotW) / 2,
      maxY: (slotH * scale - slotH) / 2,
    };
  };

  // 컨테이너에서 포인터 이벤트 처리 (단일 드래그 + 핀치줌 모두)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!preview) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: transformRef.current.offsetX,
        startOffsetY: transformRef.current.offsetY,
        moved: false,
      };
      lastPinchDistRef.current = null;
    } else if (pointersRef.current.size === 2) {
      // 두 번째 손가락 → pinch 시작, drag 취소
      dragRef.current.active = false;
      startScaleRef.current = transformRef.current.scale;
      const pts = Array.from(pointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!preview) return;
    e.preventDefault();
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(pointersRef.current.values());

    if (pts.length === 2 && lastPinchDistRef.current !== null) {
      // 핀치줌
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = dist / lastPinchDistRef.current;
      const current = transformRef.current;
      const newScale = clamp(current.scale * ratio, 1.0, 3.0);
      const { maxX, maxY } = getMaxOffset(newScale);
      onTransformChange({
        scale: newScale,
        offsetX: clamp(current.offsetX, -maxX, maxX),
        offsetY: clamp(current.offsetY, -maxY, maxY),
      });
      lastPinchDistRef.current = dist;
    } else if (pts.length === 1 && dragRef.current.active) {
      // 단일 드래그
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
      if (!dragRef.current.moved) return;

      const rawX = dragRef.current.startOffsetX + dx;
      const rawY = dragRef.current.startOffsetY + dy;
      const { maxX, maxY } = getMaxOffset(transformRef.current.scale);
      onTransformChange({
        ...transformRef.current,
        offsetX: clamp(rawX, -maxX, maxX),
        offsetY: clamp(rawY, -maxY, maxY),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const d = dragRef.current;
    const wasActive = d.active;
    const wasMoved = d.moved;

    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }

    if (pointersRef.current.size === 0) {
      d.active = false;
      if (wasActive && !wasMoved) {
        onEditStart();
      }
    }
  };

  // 데스크탑 wheel로 줌
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (!preview) return;
      e.preventDefault();
      const current = transformRef.current;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = clamp(current.scale + delta, 1.0, 3.0);
      const { maxX, maxY } = getMaxOffset(newScale);
      onTransformChange({
        scale: newScale,
        offsetX: clamp(current.offsetX, -maxX, maxX),
        offsetY: clamp(current.offsetY, -maxY, maxY),
      });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [preview, onTransformChange]);

  const handleFileDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) onSwap(from, index);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { onFile(f); e.target.value = ''; }
  };

  return (
    <div
      ref={containerRef}
      style={{
        gridColumn: `${slot.col} / span ${slot.colSpan}`,
        gridRow: `${slot.row} / span ${slot.rowSpan}`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        touchAction: preview ? 'none' : 'auto',
      }}
      className={cn('relative', isDragOver && 'ring-2 ring-primary ring-inset')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
            onDragStart={handleFileDragStart}
            style={{
              transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
              transformOrigin: 'center',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
          {isEditing && (
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-black/60 px-2 py-1.5"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={transform.scale}
                onChange={(e) => {
                  const newScale = parseFloat(e.target.value);
                  const { maxX, maxY } = getMaxOffset(newScale);
                  onTransformChange({
                    scale: newScale,
                    offsetX: clamp(transform.offsetX, -maxX, maxX),
                    offsetY: clamp(transform.offsetY, -maxY, maxY),
                  });
                }}
                className="h-1 flex-1 accent-white"
              />
              <button
                type="button"
                onClick={() => onTransformChange(DEFAULT_TRANSFORM)}
                title={t('reset')}
                className="flex-shrink-0 flex items-center justify-center rounded p-1 text-white hover:bg-white/20"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
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
