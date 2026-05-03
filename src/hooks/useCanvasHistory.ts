import { useCallback, useState } from 'react';
import type { CanvasState } from '@/types/canvas';
import { DEFAULT_CANVAS_STATE } from '@/types/canvas';

const MAX_HISTORY = 50;

interface CanvasHistory {
  state: CanvasState;
  past: CanvasState[];
  future: CanvasState[];
}

export function useCanvasHistory() {
  const [history, setHistory] = useState<CanvasHistory>({
    state: DEFAULT_CANVAS_STATE,
    past: [],
    future: [],
  });

  const push = useCallback((next: CanvasState) => {
    setHistory((current) => ({
      state: next,
      past: [...current.past.slice(-MAX_HISTORY + 1), current.state],
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;
      const prev = current.past[current.past.length - 1];
      return {
        state: prev,
        past: current.past.slice(0, -1),
        future: [current.state, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      return {
        state: next,
        past: [...current.past, current.state],
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.state,
    push,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
