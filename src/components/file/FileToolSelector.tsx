'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Merge, Scissors, RefreshCw, Archive, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileContext } from '@/context/FileContext';
import type { FileToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: FileToolMode; icon: React.ReactNode; key: string }> = [
  { mode: 'page-manager', icon: <LayoutGrid size={14} />, key: 'pageManager' },
  { mode: 'merge',        icon: <Merge size={14} />,      key: 'merge' },
  { mode: 'split',        icon: <Scissors size={14} />,   key: 'split' },
  { mode: 'convert',      icon: <RefreshCw size={14} />,  key: 'convert' },
  { mode: 'compress',     icon: <Archive size={14} />,    key: 'compress' },
  { mode: 'unlock',       icon: <Unlock size={14} />,     key: 'unlock' },
];

export function FileToolSelector() {
  const t = useTranslations('file.tools');
  const { activeTool, setActiveTool } = useFileContext();

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, key }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeTool === mode
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
