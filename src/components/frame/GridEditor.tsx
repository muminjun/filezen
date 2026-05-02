'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SlotDef } from '@/lib/frameTemplates';

interface Props {
  slots: SlotDef[];
  grid: { cols: number; rows: number };
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
}

export function GridEditor({ slots, grid, onMerge, onSplit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (index: number) => {
    const slot = slots[index];
    const isMerged = slot.colSpan > 1 || slot.rowSpan > 1;

    if (isMerged) {
      onSplit(index);
      setSelected(null);
      return;
    }

    if (selected === null) {
      setSelected(index);
      return;
    }

    if (selected === index) {
      setSelected(null);
      return;
    }

    const a = slots[selected];
    const b = slot;
    const canMerge =
      a.colSpan === 1 && a.rowSpan === 1 && b.colSpan === 1 && b.rowSpan === 1 &&
      ((a.row === b.row && Math.abs(a.col - b.col) === 1) ||
       (a.col === b.col && Math.abs(a.row - b.row) === 1));

    if (canMerge) {
      onMerge(selected, index);
      setSelected(null);
    } else {
      setSelected(index);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        gap: '3px',
        minHeight: '48px',
      }}
      className="w-full rounded overflow-hidden"
    >
      {slots.map((slot, i) => {
        const isMerged = slot.colSpan > 1 || slot.rowSpan > 1;
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            style={{
              gridColumn: `${slot.col} / span ${slot.colSpan}`,
              gridRow: `${slot.row} / span ${slot.rowSpan}`,
            }}
            className={cn(
              'cursor-pointer rounded text-xs flex items-center justify-center font-medium transition-colors select-none',
              isMerged
                ? 'bg-primary/60 text-primary-foreground hover:bg-primary/80'
                : selected === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/20 hover:bg-primary/40 text-primary',
            )}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}
