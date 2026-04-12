'use client';

import { UploadStrip } from './UploadStrip';
import { ImageGallery } from './ImageGallery';
import { BottomActionBar } from './BottomActionBar';
import { EditDrawer } from './EditDrawer';
import { useEditDrawer } from '@/hooks/useEditDrawer';
import { useAppContext } from '@/context/AppContext';
import { useTranslations } from 'next-intl';

export function ImagePage() {
  const { isOpen, open, close } = useEditDrawer();
  const { isDownloading } = useAppContext();
  const t = useTranslations('actionBar');

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <UploadStrip />
      <ImageGallery />
      <BottomActionBar onEditClick={open} />
      <EditDrawer isOpen={isOpen} onClose={close} />

      {isDownloading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-10 py-8 shadow-xl border border-border">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t('downloading')}</p>
            <p className="text-xs text-muted-foreground">{t('downloadingHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
