'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';

export function ComparisonView() {
  const { files, selectedFileId } = useAppContext();
  const [sliderPos, setSliderPos] = useState(50);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  if (!selectedFile?.originalUrl || !selectedFile?.processedUrl) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50">
        <p className="text-muted-foreground">Process a file to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Comparison (Original vs Converted)</h3>
      <div className="relative w-full overflow-hidden rounded-lg border border-muted-foreground/25">
        <div className="relative">
          <img
            src={selectedFile.originalUrl}
            alt="Original"
            className="w-full h-auto"
          />
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={selectedFile.processedUrl}
              alt="Processed"
              className="w-full h-auto"
              style={{ width: `${(100 / sliderPos) * 100}%` }}
            />
          </div>
          <div
            className="absolute top-0 h-full w-1 bg-primary cursor-col-resize"
            style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => {
              const container = e.currentTarget.parentElement;
              if (!container) return;

              const onMouseMove = (moveEvent: MouseEvent) => {
                const rect = container.getBoundingClientRect();
                const newPos = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                setSliderPos(newPos);
              };

              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };

              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            Original
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            Processed
          </div>
        </div>
      </div>
    </div>
  );
}
