'use client';

import React from 'react';
import { Layers, Palette, Clapperboard, ScanText, Film, QrCode, Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useConvertContext } from '@/context/ConvertContext';
import type { ConvertToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; labelKey: string }> = [
  { mode: 'icon',         icon: <Layers size={14} />,       labelKey: 'icon' },
  { mode: 'palette',      icon: <Palette size={14} />,      labelKey: 'palette' },
  { mode: 'video-to-gif', icon: <Clapperboard size={14} />, labelKey: 'videoToGif' },
  { mode: 'ocr',          icon: <ScanText size={14} />,     labelKey: 'ocr' },
  { mode: 'gif-editor',   icon: <Film size={14} />,         labelKey: 'gifEditor' },
  { mode: 'qr-barcode',   icon: <QrCode size={14} />,       labelKey: 'qrBarcode' },
  { mode: 'audio',        icon: <Music size={14} />,        labelKey: 'audio' },
];

export function ConvertToolSelector() {
  const { activeTool, setActiveTool } = useConvertContext();
  const t = useTranslations('convert.tools');

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, labelKey }) => (
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
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
