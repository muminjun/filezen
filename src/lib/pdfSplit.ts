import { PDFDocument } from 'pdf-lib';

async function extractPages(srcDoc: PDFDocument, pageIndices: number[]): Promise<Uint8Array> {
  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  copied.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

/** Split every page into its own PDF. Returns one Uint8Array per page. */
export async function splitPdfAll(file: File): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  const results: Uint8Array[] = [];
  for (let i = 0; i < srcDoc.getPageCount(); i++) {
    results.push(await extractPages(srcDoc, [i]));
  }
  return results;
}

/** Extract only the given page indices (0-based) into a single PDF. */
export async function splitPdfSelection(file: File, pageIndices: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  return extractPages(srcDoc, pageIndices);
}

/**
 * Parse a range string like "1-3, 5, 7-10" into groups of 0-based indices.
 * Each comma-separated segment becomes one output PDF.
 */
export function parseRangeString(rangeStr: string, maxPages: number): number[][] {
  return rangeStr
    .split(',')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const match = seg.match(/^(\d+)(?:-(\d+))?$/);
      if (!match) return [];
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : start;
      const indices: number[] = [];
      for (let p = Math.max(1, start); p <= Math.min(end, maxPages); p++) {
        indices.push(p - 1);
      }
      return indices;
    })
    .filter((group) => group.length > 0);
}

/** Split by range string. Returns one PDF per range group. */
export async function splitPdfByRange(
  file: File,
  rangeStr: string
): Promise<Array<{ pages: number[]; bytes: Uint8Array }>> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  const groups = parseRangeString(rangeStr, srcDoc.getPageCount());
  const results: Array<{ pages: number[]; bytes: Uint8Array }> = [];
  for (const group of groups) {
    results.push({ pages: group, bytes: await extractPages(srcDoc, group) });
  }
  return results;
}
