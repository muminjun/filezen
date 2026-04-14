'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CollageDividerProps {
  direction: 'h' | 'v';
  firstChildId: string;
  containerSize: number;
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  gap: number;
}

export function CollageDivider({
  direction,
  firstChildId,
  containerSize,
  onRatioChange,
  gap,
}: CollageDividerProps) {
  const startRef = useRef<{ pos: number; ratio: number } | null>(null);
  const currentRatioRef = useRef(0.5);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current = {
        pos: direction === 'v' ? e.clientX : e.clientY,
        ratio: currentRatioRef.current,
      };
    },
    [direction],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!startRef.current || containerSize === 0) return;
      const delta = (direction === 'v' ? e.clientX : e.clientY) - startRef.current.pos;
      const newRatio = startRef.current.ratio + delta / containerSize;
      const clamped = Math.max(0.1, Math.min(0.9, newRatio));
      currentRatioRef.current = clamped;
      onRatioChange(firstChildId, clamped, false);
    },
    [direction, containerSize, firstChildId, onRatioChange],
  );

  const handlePointerUp = useCallback(() => {
    if (!startRef.current) return;
    onRatioChange(firstChildId, currentRatioRef.current, true);
    startRef.current = null;
  }, [firstChildId, onRatioChange]);

  const isVertical = direction === 'v';

  return (
    <div
      className={cn(
        'absolute z-10 flex items-center justify-center group',
        isVertical
          ? 'top-0 bottom-0 cursor-col-resize'
          : 'left-0 right-0 cursor-row-resize',
      )}
      style={
        isVertical
          ? { width: gap + 8, marginLeft: -(gap / 2 + 4), left: '100%' }
          : { height: gap + 8, marginTop: -(gap / 2 + 4), top: '100%' }
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={cn(
          'bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
          isVertical ? 'w-1 h-8' : 'w-8 h-1',
        )}
      />
    </div>
  );
}
