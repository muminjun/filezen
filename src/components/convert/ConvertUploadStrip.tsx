'use client';

import { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onFiles: (files: File[]) => void;
  accept: Accept;
  formatHint: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function ConvertUploadStrip({
  onFiles,
  accept,
  formatHint,
  multiple = false,
  disabled = false,
}: Props) {
  const t = useTranslations('convert.upload');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? 10 : 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200',
        isDragActive
          ? 'bg-primary/10 border-primary shadow-inner'
          : 'bg-card hover:bg-muted/60 hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all group-hover:bg-primary/10 group-hover:text-primary',
          isDragActive && 'bg-primary text-primary-foreground',
        )}
      >
        <Upload
          size={20}
          className={cn(
            'transition-transform group-hover:-translate-y-0.5',
            isDragActive && 'animate-bounce',
          )}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'truncate text-sm font-semibold transition-colors group-hover:text-primary',
            isDragActive && 'text-primary',
          )}
        >
          {isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {formatHint}
        </span>
      </div>
    </div>
  );
}
