'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';
import { formatFileSize } from '../../lib/utils';

export function FileList() {
  const t = useTranslations('files');
  const { files, selectedFileId, selectFile, removeFile } = useAppContext();

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-muted-foreground/25 p-4 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">{t('noFiles')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => selectFile(file.id)}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
            selectedFileId === file.id
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:bg-muted/50'
          } cursor-pointer`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="truncate font-medium text-sm">{file.file.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.file.size)}
              </span>
            </div>
            {file.progress > 0 && file.progress < 100 && (
              <Progress value={file.progress} className="h-1" />
            )}
            {file.error && (
              <p className="text-xs text-destructive mt-1">{file.error}</p>
            )}
            {file.status === 'completed' && (
              <p className="text-xs text-green-600">✓ {t('status.completed')}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(file.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
