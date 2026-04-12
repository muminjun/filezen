// Note: Uses react-dropzone (already a project dependency) for better DX.
// The spec mentioned native HTML5 D&D, but react-dropzone is consistent with
// the image tab's UploadStrip and doesn't add new dependencies.
'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_PDF_FILES, MAX_PDF_FILE_SIZE } from '@/lib/constants';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function FileUploadStrip({ onFiles, disabled = false, multiple = false }: Props) {
  const t = useTranslations('file.upload');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: multiple ? MAX_PDF_FILES : 1,
    maxSize: MAX_PDF_FILE_SIZE,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200 ease-in-out',
        isDragActive
          ? 'bg-primary/10 border-primary shadow-inner'
          : 'bg-card hover:bg-muted/60 hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <input {...getInputProps()} />
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary',
        isDragActive && 'bg-primary text-primary-foreground'
      )}>
        <Upload size={20} className={cn(
          'transition-transform duration-300 group-hover:-translate-y-0.5',
          isDragActive && 'animate-bounce'
        )} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn(
          'truncate text-sm font-semibold transition-colors group-hover:text-primary',
          isDragActive && 'text-primary'
        )}>
          {disabled ? t('processing') : isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {t('formats')}
        </span>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
    </div>
  );
}
