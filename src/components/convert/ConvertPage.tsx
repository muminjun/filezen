'use client';

import { useState } from 'react';
import { ConvertToolSelector } from './ConvertToolSelector';
import { IconTool } from './tools/IconTool';
import { SocialPresetTool } from './tools/SocialPresetTool';
import { ColorPaletteTool } from './tools/ColorPaletteTool';
import type { ConvertToolMode } from '@/lib/types';

export function ConvertPage() {
  const [mode, setMode] = useState<ConvertToolMode>('icon');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ConvertToolSelector activeMode={mode} onModeChange={setMode} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {mode === 'icon'    && <IconTool />}
        {mode === 'social'  && <SocialPresetTool />}
        {mode === 'palette' && <ColorPaletteTool />}
      </div>
    </div>
  );
}
