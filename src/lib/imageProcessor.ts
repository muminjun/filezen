import type { ConversionSettings } from './types';

/**
 * Wrapper around Canvas API for image processing
 * (Squoosh will be used in Web Worker for complex processing)
 */
export class ImageProcessor {
  private static instance: ImageProcessor;

  private constructor() {}

  static getInstance(): ImageProcessor {
    if (!this.instance) {
      this.instance = new ImageProcessor();
    }
    return this.instance;
  }

  /**
   * Convert image to target format with settings
   */
  async convertImage(
    file: File,
    settings: ConversionSettings
  ): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const canvas = await this.fileToCanvas(uint8Array);
      return this.canvasToBlob(canvas, settings.format, this.getQuality(settings));
    } catch (error) {
      throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resize image with specified mode
   */
  async resizeImage(
    file: File,
    width: number,
    height: number,
    resizeMode: 'contain' | 'cover' | 'stretch' | 'crop',
    settings: ConversionSettings
  ): Promise<Blob> {
    try {
      const canvas = await this.fileToCanvas(new Uint8Array(await file.arrayBuffer()));
      const resizedCanvas = this.resizeCanvas(canvas, width, height, resizeMode);
      return this.canvasToBlob(resizedCanvas, settings.format, this.getQuality(settings));
    } catch (error) {
      throw new Error(`Image resize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Full pipeline: resize + convert + remove metadata
   */
  async processImage(
    file: File,
    settings: ConversionSettings
  ): Promise<Blob> {
    try {
      let canvas = await this.fileToCanvas(new Uint8Array(await file.arrayBuffer()));

      // Resize
      canvas = this.resizeCanvas(canvas, settings.width, settings.height, settings.resizeMode);

      // Convert format and apply quality
      const blob = this.canvasToBlob(canvas, settings.format, this.getQuality(settings));

      return blob;
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create image preview (lower quality for faster rendering)
   */
  async createPreview(file: File, maxWidth: number = 300): Promise<Blob> {
    try {
      const canvas = await this.fileToCanvas(new Uint8Array(await file.arrayBuffer()));
      const ratio = canvas.width / canvas.height;

      let width = maxWidth;
      let height = Math.round(maxWidth / ratio);

      if (height > maxWidth) {
        height = maxWidth;
        width = Math.round(maxWidth * ratio);
      }

      const previewCanvas = this.resizeCanvas(canvas, width, height, 'contain');
      return this.canvasToBlob(previewCanvas, 'jpg', 0.7);
    } catch (error) {
      throw new Error(`Preview creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert File to Canvas
   */
  private async fileToCanvas(uint8Array: Uint8Array): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([uint8Array.buffer as ArrayBuffer], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Resize canvas based on resize mode
   */
  private resizeCanvas(
    canvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    resizeMode: 'contain' | 'cover' | 'stretch' | 'crop'
  ): HTMLCanvasElement {
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const srcWidth = canvas.width;
    const srcHeight = canvas.height;
    const srcRatio = srcWidth / srcHeight;
    const tgtRatio = targetWidth / targetHeight;

    let drawWidth = targetWidth;
    let drawHeight = targetHeight;
    let drawX = 0;
    let drawY = 0;

    if (resizeMode === 'contain') {
      if (srcRatio > tgtRatio) {
        drawHeight = Math.round(targetWidth / srcRatio);
        drawY = (targetHeight - drawHeight) / 2;
      } else {
        drawWidth = Math.round(targetHeight * srcRatio);
        drawX = (targetWidth - drawWidth) / 2;
      }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (resizeMode === 'cover') {
      if (srcRatio > tgtRatio) {
        drawWidth = Math.round(targetHeight * srcRatio);
        drawX = (targetWidth - drawWidth) / 2;
      } else {
        drawHeight = Math.round(targetWidth / srcRatio);
        drawY = (targetHeight - drawHeight) / 2;
      }
    } else if (resizeMode === 'stretch') {
      drawWidth = targetWidth;
      drawHeight = targetHeight;
    }

    ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
    return targetCanvas;
  }

  /**
   * Convert canvas to Blob with format and quality
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpg' | 'webp',
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = this.getMimeType(format);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: 'png' | 'jpg' | 'webp'): string {
    const types: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };
    return types[format];
  }

  /**
   * Get quality value based on settings
   */
  private getQuality(settings: ConversionSettings): number {
    switch (settings.format) {
      case 'jpg':
        return settings.jpgQuality / 100;
      case 'webp':
        return settings.webpQuality / 100;
      case 'png':
        return 0.9; // PNG uses compression level, not quality
      default:
        return 0.8;
    }
  }
}

export const imageProcessor = ImageProcessor.getInstance();
