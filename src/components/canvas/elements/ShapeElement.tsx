'use client';

import { Rect, Circle } from 'react-konva';
import type { ShapeEl } from '@/types/canvas';

interface ShapeElementProps {
  el: ShapeEl;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ShapeEl>) => void;
}

export function ShapeElement({ el, isSelected, onSelect, onChange }: ShapeElementProps) {
  const common = {
    id: el.id,
    rotation: el.rotation,
    opacity: el.opacity,
    fill: el.fill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: any) => onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: any) => {
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
    },
  };

  if (el.shape === 'circle') {
    // Konva Circle is center-based, so we convert the bounding box coordinates
    const centerX = el.x + el.width / 2;
    const centerY = el.y + el.height / 2;
    const radius = Math.min(el.width, el.height) / 2;

    return (
      <Circle
        {...common}
        x={centerX}
        y={centerY}
        radius={radius}
      />
    );
  }

  return (
    <Rect
      {...common}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      cornerRadius={4}
    />
  );
}
