'use client';

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { imageProcessor } from '../lib/imageProcessor';
import type { ConversionSettings, ProcessingFile } from '../lib/types';

export function useImageProcessor() {
  const context = useAppContext();

  const processFile = useCallback(
    async (file: ProcessingFile, customSettings?: Partial<ConversionSettings>) => {
      const finalSettings = { ...context.settings, ...customSettings };

      try {
        // Create preview first
        const previewBlob = await imageProcessor.createPreview(file.file);
        const previewUrl = URL.createObjectURL(previewBlob);

        // Process full resolution
        const processedBlob = await imageProcessor.processImage(file.file, finalSettings);
        const processedUrl = URL.createObjectURL(processedBlob);

        return { previewUrl, processedUrl, processedBlob };
      } catch (error) {
        throw error;
      }
    },
    [context.settings]
  );

  const processAllFiles = useCallback(async () => {
    // Placeholder for batch processing
    return Promise.resolve();
  }, []);

  return {
    processFile,
    processAllFiles,
  };
}
