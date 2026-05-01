'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type Konva from 'konva';
import { Undo2, Redo2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasExport } from '@/hooks/useCanvasExport';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasProperties } from './CanvasProperties';
import { CANVAS_PRESETS } from '@/types/canvas';
import type {
  CanvasElement, CanvasBackground, CanvasSize, ToolType,
  ImageEl, TextEl, ShapeEl,
} from '@/types/canvas';

const CanvasStage = dynamic(() => import('./CanvasStage').then((m) => m.CanvasStage), { ssr: false });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function computeScale(containerW: number, containerH: number, canvasW: number, canvasH: number) {
  const scaleX = (containerW - 64) / canvasW;
  const scaleY = (containerH - 32) / canvasH;
  return Math.min(scaleX, scaleY, 1);
}

export function CanvasPage() {
  const { state, push, undo, redo, canUndo, canRedo } = useCanvasHistory();
  const stageRef = useRef<Konva.Stage | null>(null);
  const { isExporting, handleExport } = useCanvasExport(stageRef);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [showBackground, setShowBackground] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-portal-target'));
  }, []);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;
      setScale(computeScale(offsetWidth, offsetHeight, state.canvasSize.width, state.canvasSize.height));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [state.canvasSize]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
        push({ ...state, elements: state.elements.filter((el) => el.id !== state.selectedId), selectedId: null });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, push, undo, redo]);

  const handleSelectElement = useCallback((id: string | null) => {
    setShowBackground(false);
    push({ ...state, selectedId: id });
  }, [state, push]);

  const handleChangeElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    push({
      ...state,
      elements: state.elements.map((el) => el.id === id ? { ...el, ...patch } as CanvasElement : el),
    });
  }, [state, push]);

  const handleDeleteElement = useCallback(() => {
    if (!state.selectedId) return;
    push({ ...state, elements: state.elements.filter((el) => el.id !== state.selectedId), selectedId: null });
  }, [state, push]);

  const handleMoveLayer = useCallback((direction: 'up' | 'down') => {
    if (!state.selectedId) return;
    const idx = state.elements.findIndex((el) => el.id === state.selectedId);
    if (idx === -1) return;
    const next = [...state.elements];
    if (direction === 'up' && idx < next.length - 1) {
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    } else if (direction === 'down' && idx > 0) {
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    }
    push({ ...state, elements: next });
  }, [state, push]);

  const handleChangeBackground = useCallback((bg: CanvasBackground) => {
    push({ ...state, background: bg });
  }, [state, push]);

  const handleSizeChange = useCallback((size: CanvasSize) => {
    push({ ...state, canvasSize: size });
  }, [state, push]);

  const handleImageUpload = useCallback((file: File) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxW = state.canvasSize.width * 0.6;
      const maxH = state.canvasSize.height * 0.6;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const el: ImageEl = {
        id: uid(), type: 'image', src,
        x: (state.canvasSize.width - w) / 2, y: (state.canvasSize.height - h) / 2,
        width: w, height: h, rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
    };
    img.src = src;
    setActiveTool('select');
  }, [state, push]);

  const handleStageClick = useCallback(() => {
    if (activeTool === 'text') {
      const el: TextEl = {
        id: uid(), type: 'text', text: '텍스트를 입력하세요',
        x: state.canvasSize.width / 2 - 100, y: state.canvasSize.height / 2 - 20,
        width: 200, height: 40, fontSize: 32, color: '#111827',
        bold: false, italic: false, align: 'center', rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
      setActiveTool('select');
    } else if (activeTool === 'shape-rect' || activeTool === 'shape-circle') {
      const el: ShapeEl = {
        id: uid(), type: 'shape',
        shape: activeTool === 'shape-rect' ? 'rect' : 'circle',
        x: state.canvasSize.width / 2 - 75, y: state.canvasSize.height / 2 - 75,
        width: 150, height: 150,
        fill: '#6366f1', stroke: '#4f46e5', strokeWidth: 0,
        rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
      setActiveTool('select');
    }
  }, [activeTool, state, push]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'background') {
      setShowBackground(true);
      push({ ...state, selectedId: null });
    } else {
      setShowBackground(false);
    }
  };

  const selectedEl = state.selectedId ? state.elements.find((el) => el.id === state.selectedId) ?? null : null;

  const topbarControls = (
    <>
      {/* 비율 프리셋 */}
      <div className="flex items-center gap-1">
        {CANVAS_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSizeChange(preset)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              state.canvasSize.label === preset.label
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {/* Undo / Redo / Export */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="실행취소 (Cmd+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="다시실행 (Cmd+Shift+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="ml-2 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download size={14} />
          {isExporting ? '내보내는 중...' : '내보내기'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {portalTarget && createPortal(topbarControls, portalTarget)}
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onImageUpload={handleImageUpload}
      />
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="flex flex-1 overflow-hidden" onClick={handleStageClick}>
          <CanvasStage
            state={state}
            stageRef={stageRef}
            onSelectElement={handleSelectElement}
            onChange={handleChangeElement}
            scale={scale}
          />
        </div>
        <CanvasProperties
          selected={selectedEl ?? null}
          background={state.background}
          showBackground={showBackground}
          onChangeElement={(patch) => { if (state.selectedId) handleChangeElement(state.selectedId, patch); }}
          onDeleteElement={handleDeleteElement}
          onMoveLayer={handleMoveLayer}
          onChangeBackground={handleChangeBackground}
        />
      </div>
    </div>
  );
}
