'use client';

import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';

export function PreviewPanel() {
  const { files, selectedFileId } = useAppContext();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50">
        <p className="text-muted-foreground">Select a file to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Preview</h3>
      <div className="space-y-2">
        {selectedFile.originalUrl && (
          <div className="rounded-lg border border-muted-foreground/25 overflow-hidden bg-muted">
            <img
              src={selectedFile.originalUrl}
              alt="Original"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        )}
        {selectedFile.processedUrl && (
          <div className="rounded-lg border border-muted-foreground/25 overflow-hidden bg-muted">
            <img
              src={selectedFile.processedUrl}
              alt="Processed"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
