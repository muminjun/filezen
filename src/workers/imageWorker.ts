import { imageProcessor } from '../lib/imageProcessor';
import type { ConversionSettings } from '../lib/types';

/**
 * Worker message types
 */
interface WorkerMessage {
  id: string;
  type: 'process' | 'preview';
  file: File;
  settings: ConversionSettings;
}

interface WorkerResponse {
  id: string;
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  blob?: Blob;
  error?: string;
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, file, settings } = event.data;

  try {
    if (type === 'process') {
      const blob = await imageProcessor.processImage(file, settings);
      const response: WorkerResponse = {
        id,
        type: 'complete',
        blob,
      };
      self.postMessage(response);
    } else if (type === 'preview') {
      const blob = await imageProcessor.createPreview(file, 300);
      const response: WorkerResponse = {
        id,
        type: 'complete',
        blob,
      };
      self.postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};
