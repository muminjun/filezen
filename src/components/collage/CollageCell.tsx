'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { LeafNode } from '@/lib/collageTree';

interface CollageCellProps {
  node: LeafNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
}

export function CollageCell({
  node,
  isSelected,
  onSelect,
  onImageDrag,
  onDropImage,
}: CollageCellProps) {
  const t = useTranslations('collage');
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!node.image) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY };
    },
    [node.image],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current || !node.image) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      onImageDrag(node.id, dx, dy);
    },
    [node.id, node.image, onImageDrag],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const src = URL.createObjectURL(file);
      onDropImage(node.id, src);
    },
    [node.id, onDropImage],
  );

  return (
    <div
      data-cell-id={node.id}
      className={cn(
        'relative w-full h-full overflow-hidden cursor-pointer select-none',
        'transition-all duration-100',
        isSelected && 'ring-2 ring-primary ring-offset-1',
      )}
      style={{ borderRadius: 'inherit' }}
      onClick={() => onSelect(node.id)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {node.image ? (
        <img
          src={node.image.src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `calc(50% + ${node.image.x}px) calc(50% + ${node.image.y}px)`,
            transform: `scale(${node.image.scale})`,
            transformOrigin: 'center',
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 border-2 border-dashed border-border">
          <span className="text-xs text-muted-foreground text-center px-2">
            {t('emptyCell')}
          </span>
        </div>
      )}
    </div>
  );
}
