import { UploadStrip } from './UploadStrip';
import { ImageGallery } from './ImageGallery';
import { BottomActionBar } from './BottomActionBar';

export function ImagePage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <UploadStrip />
      <ImageGallery />
      <BottomActionBar />
    </div>
  );
}
