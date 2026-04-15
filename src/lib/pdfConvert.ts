import { PDFDocument } from 'pdf-lib';
import { renderPdfToBlobs } from './pdfThumbnail';

/**
 * Convert a PDF to an array of image Blobs (one per page).
 *
 * @param file       - The PDF file to convert
 * @param format     - Output image format: 'png' | 'jpeg' | 'webp'
 * @param dpiScale   - Viewport scale factor (72dpi≈0.75, 150dpi≈1.5625, 300dpi≈3.125)
 */
export async function pdfToImages(
  file: File,
  format: 'png' | 'jpeg' | 'webp',
  dpiScale: number
): Promise<Blob[]> {
  const mimeType =
    format === 'png'
      ? 'image/png'
      : format === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  return renderPdfToBlobs(file, dpiScale, mimeType, 0.92);
}

// ── Page size constants (points) ───────────────────────────────────────────────
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

/**
 * Draw an image to a canvas and return a PNG blob.
 * Used to convert WebP images to PNG before embedding in pdf-lib.
 */
function imageToPngBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('canvas.toBlob returned null')),
        'image/png'
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Convert an array of image files to a single PDF document.
 *
 * @param files    - Image files (png, jpeg, webp, gif …)
 * @param pageSize - 'a4' | 'letter' | 'fit' (page dimensions match the image)
 */
export async function imagesToPdf(
  files: File[],
  pageSize: 'a4' | 'letter' | 'fit',
  marginPt: number = 0,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const mime = file.type.toLowerCase();

    let imageBytes: ArrayBuffer;
    let embedAsJpeg = false;

    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      imageBytes = await file.arrayBuffer();
      embedAsJpeg = true;
    } else if (mime === 'image/png') {
      imageBytes = await file.arrayBuffer();
    } else {
      // webp, gif, bmp, etc. → rasterise to PNG via canvas
      const pngBlob = await imageToPngBlob(file);
      imageBytes = await pngBlob.arrayBuffer();
    }

    const embedded = embedAsJpeg
      ? await doc.embedJpg(new Uint8Array(imageBytes))
      : await doc.embedPng(new Uint8Array(imageBytes));

    let pgWidth: number;
    let pgHeight: number;

    if (pageSize === 'fit') {
      // 1 px = 0.75 pt  (96 dpi screen → 72 pt/inch → 72/96 = 0.75)
      pgWidth = embedded.width * 0.75;
      pgHeight = embedded.height * 0.75;
    } else {
      const preset = PAGE_SIZES[pageSize];
      pgWidth = preset.width;
      pgHeight = preset.height;
    }

    const page = doc.addPage([pgWidth, pgHeight]);

    const availW = pgWidth  - marginPt * 2;
    const availH = pgHeight - marginPt * 2;

    const mImgRatio = embedded.width / embedded.height;
    const mPgRatio  = availW / availH;
    let mDrawW: number, mDrawH: number;
    if (mImgRatio > mPgRatio) {
      mDrawH = availH;
      mDrawW = availH * mImgRatio;
    } else {
      mDrawW = availW;
      mDrawH = availW / mImgRatio;
    }
    const mx = marginPt + (availW - mDrawW) / 2;
    const my = marginPt + (availH - mDrawH) / 2;

    page.drawImage(embedded, { x: mx, y: my, width: mDrawW, height: mDrawH });
  }

  return doc.save();
}
