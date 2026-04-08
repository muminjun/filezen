import { PDFDocument } from 'pdf-lib';
import { renderPdfToBlobs } from './pdfThumbnail';

export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Compress a PDF file at the given level.
 *
 * - low:    Strip metadata only (lossless, fast)
 * - medium: Rasterize pages at 150 dpi, JPEG quality 75%
 * - high:   Rasterize pages at 72 dpi, JPEG quality 50% (text becomes image)
 */
export async function compressPdf(
  file: File,
  level: CompressionLevel
): Promise<Uint8Array> {
  if (level === 'low') {
    return compressLow(file);
  }

  const scale = level === 'medium' ? 1.5625 : 0.75;
  const quality = level === 'medium' ? 0.75 : 0.5;
  return compressRasterize(file, scale, quality);
}

// ── Level implementations ──────────────────────────────────────────────────

async function compressLow(file: File): Promise<Uint8Array> {
  const srcBytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(srcBytes);

  // Strip common metadata fields
  doc.setCreator('');
  doc.setProducer('');
  doc.setKeywords([]);
  doc.setSubject('');
  doc.setAuthor('');
  doc.setTitle('');

  return doc.save();
}

async function compressRasterize(
  file: File,
  scale: number,
  quality: number
): Promise<Uint8Array> {
  // Render pages to JPEG blobs
  const blobs = await renderPdfToBlobs(file, scale, 'image/jpeg', quality);

  // Load source to get original page dimensions (in points)
  const srcBytes = new Uint8Array(await file.arrayBuffer());
  const srcDoc = await PDFDocument.load(srcBytes);
  const srcPages = srcDoc.getPages();

  // Build new PDF with rasterized pages
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < blobs.length; i++) {
    const imgBytes = new Uint8Array(await blobs[i].arrayBuffer());
    const jpgImage = await newDoc.embedJpg(imgBytes);

    // Use original page dimensions so the PDF page size is preserved
    const { width, height } = srcPages[i].getSize();
    const page = newDoc.addPage([width, height]);
    page.drawImage(jpgImage, { x: 0, y: 0, width, height });
  }

  return new Uint8Array(await newDoc.save());
}
