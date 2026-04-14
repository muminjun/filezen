'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Layers, MonitorSmartphone, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConvertToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; key: string }> = [
  { mode: 'icon',    icon: <Layers size={14} />,            key: 'icon' },
  { mode: 'social',  icon: <MonitorSmartphone size={14} />, key: 'social' },
  { mode: 'palette', icon: <Palette size={14} />,            key: 'palette' },
];

interface Props {
  activeMode: ConvertToolMode;
  onModeChange: (mode: ConvertToolMode) => void;
}

export function ConvertToolSelector({ activeMode, onModeChange }: Props) {
  const t = useTranslations('convert.tools');

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, key }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeMode === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {icon}
          {t(key)}
        </button>
      ))}
    </div>
  );
}
