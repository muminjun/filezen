'use client';

import { UploadStrip } from './UploadStrip';
import { ImageGallery } from './ImageGallery';
import { BottomActionBar } from './BottomActionBar';
import { EditDrawer } from './EditDrawer';
import { useEditDrawer } from '@/hooks/useEditDrawer';

export function ImagePage() {
  const { isOpen, open, close } = useEditDrawer();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <UploadStrip />
      <ImageGallery />
      <BottomActionBar onEditClick={open} />
      <EditDrawer isOpen={isOpen} onClose={close} />
    </div>
  );
}
