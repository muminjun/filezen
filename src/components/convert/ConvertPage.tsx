'use client';

import { useConvertContext } from '@/context/ConvertContext';
import { ConvertToolSelector } from './ConvertToolSelector';
import { IconTool } from './tools/IconTool';
import { SocialPresetTool } from './tools/SocialPresetTool';
import { ColorPaletteTool } from './tools/ColorPaletteTool';
import { VideoTool } from './tools/VideoTool';
import { OcrTool } from './tools/OcrTool';

export function ConvertPage() {
  const { activeTool } = useConvertContext();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ConvertToolSelector />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTool === 'icon'         && <IconTool />}
        {activeTool === 'social'       && <SocialPresetTool />}
        {activeTool === 'palette'      && <ColorPaletteTool />}
        {activeTool === 'video-to-gif' && <VideoTool />}
        {activeTool === 'ocr'          && <OcrTool />}
      </div>
    </div>
  );
}
