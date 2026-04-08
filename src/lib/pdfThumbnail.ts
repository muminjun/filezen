import type { PdfPage } from './types';
import { PDF_THUMBNAIL_SCALE } from './constants';
import { getPdfjsLib, isPasswordError } from './pdfjsLoader';

export type ThumbnailResult =
  | { success: true; pages: PdfPage[]; pageCount: number }
  | { success: false; requiresPassword: true };

/**
 * Generate thumbnails for all pages of a PDF file.
 * Returns { success: false, requiresPassword: true } if password-protected.
 */
export async function generateThumbnails(
  file: File,
  scale = PDF_THUMBNAIL_SCALE
): Promise<ThumbnailResult> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pages = await renderAllPages(pdf, scale);
    return { success: true, pages, pageCount: pdf.numPages };
  } catch (err: unknown) {
    if (isPasswordError(err)) {
      return { success: false, requiresPassword: true };
    }
    throw err;
  }
}

/**
 * Generate thumbnails with a password for protected PDFs.
 * Throws if password is wrong.
 */
export async function generateThumbnailsWithPassword(
  file: File,
  password: string,
  scale = PDF_THUMBNAIL_SCALE
): Promise<{ pages: PdfPage[]; pageCount: number }> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password,
  });
  const pdf = await loadingTask.promise;
  const pages = await renderAllPages(pdf, scale);
  return { pages, pageCount: pdf.numPages };
}

/**
 * Render a PDF at a given scale and return an array of Blobs.
 * Used by pdfConvert.ts and pdfCompress.ts.
 */
export async function renderPdfToBlobs(
  file: File,
  scale: number,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<Blob[]> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const blobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, mimeType, quality);
    blobs.push(blob);
  }

  return blobs;
}

// ── Internals ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderAllPages(pdf: any, scale: number): Promise<PdfPage[]> {
  const pages: PdfPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.7);
    pages.push({ pageIndex: i - 1, thumbnail: URL.createObjectURL(blob), rotation: 0 });
  }
  return pages;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mimeType,
      quality
    );
  });
}

