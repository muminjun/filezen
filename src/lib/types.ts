// Enums
export type ImageFormat = 'png' | 'jpg' | 'webp';
export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'crop';
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

// Interfaces
export interface ConversionSettings {
  format: ImageFormat;
  width: number;
  height: number;
  resizeMode: ResizeMode;
  jpgQuality: number; // 50-100
  pngCompressionLevel: number; // 0-9
  webpQuality: number; // 50-100
  removeMetadata: boolean;
}

export interface ProcessingFile {
  id: string;
  file: File;
  originalUrl: string; // ObjectURL of original
  processedUrl: string; // ObjectURL of processed image
  status: FileStatus;
  progress: number; // 0-100
  error?: string;
  processedFile?: Blob;
  settings?: ConversionSettings;
}

export interface ProcessingRecord {
  id: string;
  timestamp: number;
  originalFileName: string;
  format: ImageFormat;
  width: number;
  height: number;
  resizeMode: ResizeMode;
}

export interface PresetConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  resizeMode: ResizeMode;
  format: ImageFormat;
}

export interface FavoriteSettings {
  id: string;
  name: string;
  settings: ConversionSettings;
  createdAt: number;
}

export interface AppContextType {
  files: ProcessingFile[];
  selectedFileId: string | null;
  settings: ConversionSettings;
  history: ProcessingRecord[];
  presets: PresetConfig[];
  favorites: FavoriteSettings[];
  isProcessing: boolean;

  // Actions (dispatch functions)
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  selectFile: (fileId: string) => void;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
  processFiles: () => Promise<void>;
  addToHistory: (record: ProcessingRecord) => void;
  clearHistory: () => void;
  addPreset: (preset: PresetConfig) => void;
  removePreset: (presetId: string) => void;
  addFavorite: (favorite: FavoriteSettings) => void;
  removeFavorite: (favoriteId: string) => void;
  downloadFile: (fileId: string) => void;
  downloadAllAsZip: () => void;
}

export interface SquooshOptions {
  png?: {
    level?: number; // 0-9
  };
  jpeg?: {
    quality?: number; // 0-100
  };
  webp?: {
    quality?: number; // 0-100
  };
}
