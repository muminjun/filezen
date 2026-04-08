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
        'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200 ease-in-out',
        isDragActive
          ? 'bg-primary/10 border-primary shadow-inner'
          : 'bg-card hover:bg-muted/60 hover:border-primary/50'
      )}
    >
      <input {...getInputProps()} />
      
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary",
        isDragActive && "bg-primary text-primary-foreground"
      )}>
        <Upload size={20} className={cn(
          "transition-transform duration-300 group-hover:-translate-y-0.5",
          isDragActive && "animate-bounce"
        )} />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn(
          "truncate text-sm font-semibold transition-colors group-hover:text-primary",
          isDragActive && "text-primary scale-105 origin-left"
        )}>
          {isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {t('formats')}
        </span>
      </div>

      {/* Decorative hover effect */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
    </div>
  );
}
