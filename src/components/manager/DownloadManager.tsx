'use client';

import { Download, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';

export function DownloadManager() {
  const { files, selectedFileId, downloadFile, downloadAllAsZip } = useAppContext();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const hasProcessedFiles = files.some((f) => f.status === 'completed' && f.processedFile);

  return (
    <div className="flex flex-wrap gap-2">
      {selectedFile?.status === 'completed' && selectedFile?.processedFile && (
        <Button
          size="sm"
          className="gap-2"
          onClick={() => downloadFile(selectedFile.id)}
        >
          <Download className="h-4 w-4" />
          Download Selected
        </Button>
      )}

      {hasProcessedFiles && (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => downloadAllAsZip()}
        >
          <Package className="h-4 w-4" />
          Download as ZIP
        </Button>
      )}

      {!hasProcessedFiles && (
        <p className="text-sm text-muted-foreground">Process files to download</p>
      )}
    </div>
  );
}
