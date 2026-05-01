import { useCallback, useRef, useState } from 'react';
import type { CanvasState } from '@/types/canvas';
import { DEFAULT_CANVAS_STATE } from '@/types/canvas';

const MAX_HISTORY = 50;

export function useCanvasHistory() {
  const [state, setState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const past = useRef<CanvasState[]>([]);
  const future = useRef<CanvasState[]>([]);

  const push = useCallback((next: CanvasState) => {
    past.current = [...past.current.slice(-MAX_HISTORY + 1), state];
    future.current = [];
    setState(next);
  }, [state]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [state, ...future.current];
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, state];
    setState(next);
  }, [state]);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return { state, push, undo, redo, canUndo, canRedo };
}
