'use client';

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { isValidImageFile } from '../lib/utils';
import { MAX_FILES } from '../lib/constants';

export function useFileManagement() {
  const { files, addFiles } = useAppContext();

  const handleFileInput = useCallback(
    async (newFiles: File[]) => {
      // Validate total files
      if (files.length + newFiles.length > MAX_FILES) {
        throw new Error(`Maximum ${MAX_FILES} files allowed`);
      }

      // Validate each file
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        const validation = isValidImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (validFiles.length > 0) {
        await addFiles(validFiles);
      }

      return { validFiles, errors };
    },
    [files, addFiles]
  );

  return {
    handleFileInput,
  };
}
