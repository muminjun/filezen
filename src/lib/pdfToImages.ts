import { getPdfjsLib } from './pdfjsLoader';

export type ImageOutputFormat = 'png' | 'jpeg';

export interface ExtractOptions {
  format:      ImageOutputFormat;
  dpi:         72 | 150 | 300;
  pageRange:   'all' | { from: number; to: number };
  onProgress?: (current: number, total: number) => void;
}

const DPI_SCALE: Record<number, number> = { 72: 1.0, 150: 2.08, 300: 4.17 };

export async function extractPdfToImages(
  file: File,
  options: ExtractOptions,
): Promise<{ name: string; blob: Blob }[]> {
  const pdfjsLib = await getPdfjsLib();
  const bytes    = new Uint8Array(await file.arrayBuffer());
  const pdf      = await pdfjsLib.getDocument({ data: bytes }).promise;
  const total    = pdf.numPages;
  const scale    = DPI_SCALE[options.dpi] ?? 1.0;
  const mime     = `image/${options.format}`;
  const quality  = options.format === 'jpeg' ? 0.92 : undefined;
  const baseName = file.name.replace(/\.pdf$/i, '');

  const startPage = options.pageRange === 'all' ? 1 : options.pageRange.from;
  const endPage   = options.pageRange === 'all' ? total : Math.min(options.pageRange.to, total);

  const results: { name: string; blob: Blob }[] = [];

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const page     = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas   = document.createElement('canvas');
    canvas.width   = Math.ceil(viewport.width);
    canvas.height  = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        mime,
        quality,
      );
    });

    results.push({
      name: `${baseName}-page${String(pageNum).padStart(3, '0')}.${options.format}`,
      blob,
    });

    options.onProgress?.(pageNum - startPage + 1, endPage - startPage + 1);
  }

  return results;
}
