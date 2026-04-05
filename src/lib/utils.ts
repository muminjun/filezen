import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from './constants';
import type { ProcessingFile } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate if a file is a supported image format
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Supported: PNG, JPG, WebP, GIF`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 50MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique ID for files
 */
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get file extension from format string
 */
export function getFileExtension(format: 'png' | 'jpg' | 'webp'): string {
  const extensions: Record<string, string> = {
    png: 'png',
    jpg: 'jpg',
    webp: 'webp',
  };
  return extensions[format];
}

/**
 * Generate output filename based on settings
 */
export function generateOutputFilename(
  originalName: string,
  width: number,
  height: number,
  format: 'png' | 'jpg' | 'webp'
): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const ext = getFileExtension(format);
  return `${nameWithoutExt}_${width}x${height}.${ext}`;
}

/**
 * Create ObjectURL from File for preview
 */
export function createObjectUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke ObjectURL to free memory
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Load image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image dimensions'));
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate new dimensions based on resize mode
 */
export function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  resizeMode: 'contain' | 'cover' | 'stretch'
): { width: number; height: number } {
  if (resizeMode === 'stretch') {
    return { width: targetWidth, height: targetHeight };
  }

  const originalRatio = originalWidth / originalHeight;
  const targetRatio = targetWidth / targetHeight;

  if (resizeMode === 'contain') {
    if (originalRatio > targetRatio) {
      return { width: targetWidth, height: Math.round(targetWidth / originalRatio) };
    } else {
      return { width: Math.round(targetHeight * originalRatio), height: targetHeight };
    }
  }

  // cover mode
  if (originalRatio > targetRatio) {
    return { width: Math.round(targetHeight * originalRatio), height: targetHeight };
  } else {
    return { width: targetWidth, height: Math.round(targetWidth / originalRatio) };
  }
}

/**
 * Format file size for display (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function for settings updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
