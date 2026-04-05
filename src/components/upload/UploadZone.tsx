'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Cloud, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useFileManagement } from '../../hooks/useFileManagement';
import { MAX_FILES } from '../../lib/constants';

interface UploadZoneProps {
  disabled?: boolean;
}

export function UploadZone({ disabled = false }: UploadZoneProps) {
  const t = useTranslations('upload');
  const { handleFileInput } = useFileManagement();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        await handleFileInput(acceptedFiles);
      } catch (error) {
        console.error('Failed to upload files:', error);
      }
    },
    [handleFileInput]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    disabled,
    maxFiles: MAX_FILES,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input {...getInputProps()} />

      <Cloud className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

      <h3 className="mb-2 text-lg font-semibold">
        {isDragActive ? t('dropHere') : t('dragDrop')}
      </h3>

      <p className="mb-4 text-sm text-muted-foreground">
        {t('orClick', { count: MAX_FILES })}
      </p>

      <Button type="button" variant="outline" disabled={disabled}>
        {t('selectFiles')}
      </Button>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-medium">{t('supportedFormats')}</p>
          <p>{t('formats')}</p>
        </div>
      </div>
    </div>
  );
}
