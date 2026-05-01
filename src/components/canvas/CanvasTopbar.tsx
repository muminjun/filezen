'use client';

import { Undo2, Redo2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CANVAS_PRESETS } from '@/types/canvas';
import type { CanvasSize } from '@/types/canvas';

interface CanvasTopbarProps {
  canvasSize: CanvasSize;
  onSizeChange: (size: CanvasSize) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isExporting: boolean;
  onExport: () => void;
}

export function CanvasTopbar({
  canvasSize,
  onSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isExporting,
  onExport,
}: CanvasTopbarProps) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center border-b border-border bg-card px-4 gap-4">
      {/* 비율 프리셋 */}
      <div className="flex items-center gap-1">
        {CANVAS_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSizeChange(preset)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              canvasSize.label === preset.label
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Undo / Redo / Export — ml-auto + mr-36으로 LanguageSwitcher(absolute right-6) 영역 회피 */}
      <div className="flex items-center gap-1 ml-auto mr-36">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="실행취소 (Cmd+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="다시실행 (Cmd+Shift+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="ml-2 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download size={14} />
          {isExporting ? '내보내는 중...' : '내보내기'}
        </button>
      </div>
    </div>
  );
}
