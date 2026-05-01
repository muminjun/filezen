'use client';

import { MousePointer2, Type, Square, Circle, ImageIcon, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolType } from '@/types/canvas';

interface CanvasToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onImageUpload: (file: File) => void;
}

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <MousePointer2 size={20} />, label: '선택' },
  { id: 'text', icon: <Type size={20} />, label: '텍스트' },
  { id: 'shape-rect', icon: <Square size={20} />, label: '사각형' },
  { id: 'shape-circle', icon: <Circle size={20} />, label: '원' },
  { id: 'image', icon: <ImageIcon size={20} />, label: '이미지' },
  { id: 'background', icon: <Palette size={20} />, label: '배경' },
];

export function CanvasToolbar({ activeTool, onToolChange, onImageUpload }: CanvasToolbarProps) {
  const handleToolClick = (tool: ToolType) => {
    if (tool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) onImageUpload(file);
      };
      input.click();
      return;
    }
    onToolChange(tool);
  };

  return (
    <div className="flex flex-shrink-0 items-center gap-1 border-b border-border bg-card px-3 py-1.5">
      {TOOLS.map(({ id, icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => handleToolClick(id)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            activeTool === id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
