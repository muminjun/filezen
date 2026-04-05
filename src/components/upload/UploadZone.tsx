'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useFileManagement } from '../../hooks/useFileManagement';
import { MAX_FILES } from '../../lib/constants';

interface UploadZoneProps {
  disabled?: boolean;
}

export function UploadZone({ disabled = false }: UploadZoneProps) {
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
        {isDragActive ? 'Drop files here' : 'Drag & drop images here'}
      </h3>

      <p className="mb-4 text-sm text-muted-foreground">
        or click to select up to {MAX_FILES} files (max 50MB each)
      </p>

      <Button type="button" variant="outline" disabled={disabled}>
        Select Files
      </Button>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-medium">Supported formats:</p>
          <p>PNG, JPG, WebP, GIF</p>
        </div>
      </div>
    </div>
  );
}
