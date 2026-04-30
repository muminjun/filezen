'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ImageEl } from '@/types/canvas';

interface ImageElementProps {
  el: ImageEl;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageEl>) => void;
}

export function ImageElement({ el, isSelected, onSelect, onChange }: ImageElementProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const ref = useRef<any>(null);

  useEffect(() => {
    const image = new window.Image();
    image.src = el.src;
    image.onload = () => setImg(image);
  }, [el.src]);

  return (
    <KonvaImage
      ref={ref}
      id={el.id}
      image={img ?? undefined}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * node.scaleX()),
          height: Math.max(10, node.height() * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
