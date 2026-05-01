'use client';

import { useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { CanvasState, CanvasElement, ImageEl, TextEl, ShapeEl } from '@/types/canvas';
import { ImageElement } from './elements/ImageElement';
import { TextElement } from './elements/TextElement';
import { ShapeElement } from './elements/ShapeElement';

interface CanvasStageProps {
  state: CanvasState;
  stageRef: React.RefObject<Konva.Stage | null>;
  onSelectElement: (id: string | null) => void;
  onChange: (id: string, patch: Partial<CanvasElement>) => void;
  scale: number;
}

export function CanvasStage({ state, stageRef, onSelectElement, onChange, scale }: CanvasStageProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    if (state.selectedId) {
      const node = stage.findOne(`#${state.selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [state.selectedId, stageRef]);

  const { width, height } = state.canvasSize;

  const renderBackground = () => {
    const bg = state.background;
    if (bg.type === 'color') {
      return <Rect x={0} y={0} width={width} height={height} fill={bg.color} listening={false} />;
    }
    if (bg.type === 'gradient') {
      const isH = bg.direction === 'horizontal';
      return (
        <Rect
          x={0} y={0} width={width} height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: isH ? width : 0, y: isH ? 0 : height }}
          fillLinearGradientColorStops={[0, bg.from, 1, bg.to]}
          listening={false}
        />
      );
    }
    return null;
  };

  return (
    <div
      className="flex flex-1 items-center justify-center bg-muted/20 overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onClick={(e) => { if (e.target === e.target.getStage()) onSelectElement(null); }}
          onTap={(e) => { if (e.target === e.target.getStage()) onSelectElement(null); }}
        >
          <Layer>
            {renderBackground()}
            {state.elements.map((el) => {
              if (el.type === 'image') {
                return (
                  <ImageElement
                    key={el.id}
                    el={el as ImageEl}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              if (el.type === 'text') {
                return (
                  <TextElement
                    key={el.id}
                    el={el as TextEl}
                    stageRef={stageRef}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              if (el.type === 'shape') {
                return (
                  <ShapeElement
                    key={el.id}
                    el={el as ShapeEl}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              return null;
            })}
            <Transformer
              ref={transformerRef}
              anchorFill="#6366f1"
              anchorStroke="#6366f1"
              anchorSize={8}
              anchorCornerRadius={4}
              borderStroke="#6366f1"
              borderDash={[4, 4]}
              rotateAnchorOffset={20}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
