'use client';

import { useConvertContext } from '@/context/ConvertContext';
import { ConvertToolSelector } from './ConvertToolSelector';
import { VideoTool } from './tools/VideoTool';
import { OcrTool } from './tools/OcrTool';

export function ConvertPage() {
  const { activeTool } = useConvertContext();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTool === 'video-to-gif' && <VideoTool />}
        {activeTool === 'ocr'          && <OcrTool />}
      </div>
      <ConvertToolSelector />
    </div>
  );
}
