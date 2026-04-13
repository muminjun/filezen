'use client';

import React from 'react';
import { Clapperboard, ScanText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConvertContext } from '@/context/ConvertContext';
import type { ConvertToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; label: string }> = [
  { mode: 'video-to-gif', icon: <Clapperboard size={14} />, label: '동영상 변환' },
  { mode: 'ocr',          icon: <ScanText size={14} />,     label: '텍스트 추출' },
];

export function ConvertToolSelector() {
  const { activeTool, setActiveTool } = useConvertContext();

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeTool === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
