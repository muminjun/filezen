'use client';

import { useRef } from 'react';
import { CollageCell } from './CollageCell';
import { CollageDivider } from './CollageDivider';
import type { CollageNode, CollageStyle } from '@/lib/collageTree';

interface CollageCanvasProps {
  tree: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
  onSelectCell: (id: string) => void;
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

const ASPECT_MAP: Record<string, string> = {
  '1:1':  '1 / 1',
  '4:5':  '4 / 5',
  '9:16': '9 / 16',
  '16:9': '16 / 9',
  'free': 'auto',
};

export function CollageCanvas({
  tree,
  style,
  selectedId,
  onSelectCell,
  onRatioChange,
  onImageDrag,
  onDropImage,
  canvasRef,
}: CollageCanvasProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-muted/20 overflow-hidden">
      <div
        ref={canvasRef}
        className="relative shadow-lg"
        style={{
          aspectRatio: ASPECT_MAP[style.aspectRatio] ?? '1 / 1',
          maxWidth: '100%',
          maxHeight: '100%',
          padding: style.padding,
          background: style.background,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
        }}
      >
        <NodeRenderer
          node={tree}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
      </div>
    </div>
  );
}

interface NodeRendererProps {
  node: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
  onSelectCell: (id: string) => void;
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
}

function NodeRenderer({
  node,
  style,
  selectedId,
  onSelectCell,
  onRatioChange,
  onImageDrag,
  onDropImage,
}: NodeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (node.type === 'leaf') {
    return (
      <CollageCell
        node={node}
        isSelected={selectedId === node.id}
        onSelect={onSelectCell}
        onImageDrag={onImageDrag}
        onDropImage={onDropImage}
      />
    );
  }

  const isVertical = node.direction === 'v';
  const [firstChild, secondChild] = node.children;
  const firstSize = `${node.ratio * 100}%`;
  const secondSize = `${(1 - node.ratio) * 100}%`;

  const getContainerSize = () => {
    if (!containerRef.current) return 300;
    return isVertical
      ? containerRef.current.offsetWidth
      : containerRef.current.offsetHeight;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        gap: style.gap,
      }}
    >
      <div
        style={{
          flexBasis: firstSize,
          flexShrink: 0,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <NodeRenderer
          node={firstChild}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
        <CollageDivider
          direction={node.direction}
          firstChildId={firstChild.type === 'leaf' ? firstChild.id : ''}
          containerSize={getContainerSize()}
          onRatioChange={onRatioChange}
          gap={style.gap}
        />
      </div>

      <div
        style={{
          flexBasis: secondSize,
          flexShrink: 0,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <NodeRenderer
          node={secondChild}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
      </div>
    </div>
  );
}
