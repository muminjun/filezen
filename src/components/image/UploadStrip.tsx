'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { MAX_FILES } from '@/lib/constants';

export function UploadStrip() {
  const t = useTranslations('upload');
  const { addImages } = useAppContext();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) addImages(acceptedFiles);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: MAX_FILES,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex h-16 flex-shrink-0 cursor-pointer items-center gap-3 border-b border-border px-4 transition-colors',
        isDragActive
          ? 'bg-primary/10 border-primary'
          : 'bg-card hover:bg-muted/50'
      )}
    >
      <input {...getInputProps()} />
      <Upload size={18} className="flex-shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-xs text-muted-foreground">{t('formats')}</span>
      </div>
    </div>
  );
}
