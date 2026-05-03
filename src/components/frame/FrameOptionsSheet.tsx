'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FrameTemplate, FrameOptionsState } from '@/lib/frameTemplates';
import { FrameOptions } from './FrameOptions';

const SNAP_POINTS = [0.12, 0.45, 0.88] as const;
type SnapPoint = (typeof SNAP_POINTS)[number];

interface FrameOptionsSheetProps {
  template: FrameTemplate;
  options: FrameOptionsState;
  onChange: (opts: FrameOptionsState) => void;
  onPhotoCountChange: (n: number) => void;
  onColsChange: (c: number) => void;
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
  isExporting: boolean;
  onExport: () => void;
}

export function FrameOptionsSheet({
  template,
  options,
  onChange,
  onPhotoCountChange,
  onColsChange,
  onMerge,
  onSplit,
  isExporting,
  onExport,
}: FrameOptionsSheetProps) {
  const t = useTranslations('frame');
  const [snap, setSnap] = useState<SnapPoint>(0.45);

  return (
    <Drawer.Root
      open
      modal={false}
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={(s) => {
        if (s !== null && (SNAP_POINTS as readonly (string | number)[]).includes(s)) {
          setSnap(s as SnapPoint);
        }
      }}
      fadeFromIndex={2}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-label={t('tab')}
          className="fixed bottom-14 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-card shadow-lg focus:outline-none h-[calc(88vh-3.5rem)]"
        >
          <div role="presentation" className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div aria-hidden="true" className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="px-4 pt-2 pb-3 flex-shrink-0">
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className={cn(
                'w-full rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                isExporting
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {isExporting ? t('exporting') : t('export')}
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <FrameOptions
              template={template}
              options={options}
              onChange={onChange}
              onPhotoCountChange={onPhotoCountChange}
              onColsChange={onColsChange}
              onMerge={onMerge}
              onSplit={onSplit}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
