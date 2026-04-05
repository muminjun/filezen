import type { PresetConfig, ConversionSettings } from './types';

// File limits
export const MAX_FILES = 500;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Default settings
export const DEFAULT_SETTINGS: ConversionSettings = {
  format: 'webp',
  width: 640,
  height: 480,
  resizeMode: 'contain',
  jpgQuality: 80,
  pngCompressionLevel: 6,
  webpQuality: 75,
  removeMetadata: false,
};

// Default presets (10 presets)
export const DEFAULT_PRESETS: PresetConfig[] = [
  {
    id: 'preset-1',
    name: 'Thumbnail (200x200)',
    width: 200,
    height: 200,
    resizeMode: 'cover',
    format: 'webp',
  },
  {
    id: 'preset-2',
    name: 'Square (500x500)',
    width: 500,
    height: 500,
    resizeMode: 'cover',
    format: 'webp',
  },
  {
    id: 'preset-3',
    name: 'Instagram Feed (1080x1350)',
    width: 1080,
    height: 1350,
    resizeMode: 'cover',
    format: 'jpg',
  },
  {
    id: 'preset-4',
    name: 'Instagram Story (1080x1920)',
    width: 1080,
    height: 1920,
    resizeMode: 'contain',
    format: 'jpg',
  },
  {
    id: 'preset-5',
    name: 'Twitter Header (1500x500)',
    width: 1500,
    height: 500,
    resizeMode: 'cover',
    format: 'jpg',
  },
  {
    id: 'preset-6',
    name: 'LinkedIn Cover (1200x627)',
    width: 1200,
    height: 627,
    resizeMode: 'cover',
    format: 'jpg',
  },
  {
    id: 'preset-7',
    name: 'Facebook (1200x630)',
    width: 1200,
    height: 630,
    resizeMode: 'cover',
    format: 'jpg',
  },
  {
    id: 'preset-8',
    name: 'YouTube Thumbnail (1280x720)',
    width: 1280,
    height: 720,
    resizeMode: 'cover',
    format: 'jpg',
  },
  {
    id: 'preset-9',
    name: 'Web Small (640x480)',
    width: 640,
    height: 480,
    resizeMode: 'contain',
    format: 'webp',
  },
  {
    id: 'preset-10',
    name: 'Web Large (1920x1080)',
    width: 1920,
    height: 1080,
    resizeMode: 'contain',
    format: 'webp',
  },
];

// LocalStorage keys
export const STORAGE_KEYS = {
  HISTORY: 'filezen_history',
  PRESETS: 'filezen_presets',
  FAVORITES: 'filezen_favorites',
  SETTINGS: 'filezen_settings',
} as const;

// UI constants
export const MAX_HISTORY_ITEMS = 5;
export const MAX_FAVORITES = 10;
export const MAX_CONCURRENT_PROCESSING = 4;

// Resize mode labels
export const RESIZE_MODE_LABELS: Record<string, string> = {
  contain: 'Fit Inside (Contain)',
  cover: 'Cover (Auto Crop)',
  stretch: 'Stretch to Fit',
  crop: 'Manual Crop',
};

// Format labels
export const FORMAT_LABELS: Record<string, string> = {
  png: 'PNG (Lossless)',
  jpg: 'JPG (Lossy)',
  webp: 'WebP (Modern)',
};
