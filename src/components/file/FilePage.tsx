'use client';

import { useFileContext } from '@/context/FileContext';
import { FileToolSelector } from './FileToolSelector';
import { PageManager } from './tools/PageManager';
import { MergeTool } from './tools/MergeTool';
import { SplitTool } from './tools/SplitTool';
import { ConvertTool } from './tools/ConvertTool';
import { CompressTool } from './tools/CompressTool';
import { UnlockTool } from './tools/UnlockTool';

export function FilePage() {
  const { activeTool } = useFileContext();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FileToolSelector />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTool === 'page-manager' && <PageManager />}
        {activeTool === 'merge'        && <MergeTool />}
        {activeTool === 'split'        && <SplitTool />}
        {activeTool === 'convert'      && <ConvertTool />}
        {activeTool === 'compress'     && <CompressTool />}
        {activeTool === 'unlock'       && <UnlockTool />}
      </div>
    </div>
  );
}
