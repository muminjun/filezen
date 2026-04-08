'use client';

import { getPdfjsLib, isPasswordError } from './pdfjsLoader';
import { PDFDocument } from 'pdf-lib';

/**
 * Check if a PDF requires a password (without knowing the password).
 * Returns true if the PDF is password-protected.
 */
export async function isPdfPasswordProtected(file: File): Promise<boolean> {
  const pdfjsLib = await getPdfjsLib();
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const task = pdfjsLib.getDocument({ data: bytes.slice() });
    await task.promise;
    return false;
  } catch (err) {
    if (isPasswordError(err)) return true;
    throw err;
  }
}

/**
 * Unlock a password-protected PDF by rendering each page to a PNG image
 * and embedding them into a new pdf-lib document (without a password).
 *
 * NOTE: The output PDF contains rasterized page images — text will not be
 * selectable or searchable. This is the only viable client-side approach
 * because pdf-lib does not support decryption.
 *
 * Throws a PasswordException if the password is wrong.
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  const pdfjsLib = await getPdfjsLib();
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Load with password — throws PasswordException if wrong
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(), password });
  const pdf = await loadingTask.promise;

  const newDoc = await PDFDocument.create();
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);

    // Get original page dimensions in PDF points (1 CSS px at scale=1 = 0.75 pt)
    const vp1 = page.getViewport({ scale: 1 });
    const widthPt = vp1.width * 0.75;
    const heightPt = vp1.height * 0.75;

    // Render at 2x scale for quality
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    // Export as PNG
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    );
    const pngBytes = new Uint8Array(await blob.arrayBuffer());

    const pngImage = await newDoc.embedPng(pngBytes);
    const newPage = newDoc.addPage([widthPt, heightPt]);
    newPage.drawImage(pngImage, { x: 0, y: 0, width: widthPt, height: heightPt });
  }

  await pdf.destroy();
  return new Uint8Array(await newDoc.save());
}
