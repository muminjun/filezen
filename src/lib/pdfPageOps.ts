import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Build a new PDF from a subset/reordering/rotation of the original pages.
 * @param file  Original PDF file
 * @param pages Array of { originalIndex, rotation } in desired output order.
 *              Pages not included are deleted. rotation is additional degrees (0/90/180/270).
 */
export async function buildModifiedPdf(
  file: File,
  pages: Array<{ originalIndex: number; rotation: number }>
): Promise<Uint8Array> {
  const srcBytes = new Uint8Array(await file.arrayBuffer());
  const srcDoc = await PDFDocument.load(srcBytes);
  const newDoc = await PDFDocument.create();

  for (const { originalIndex, rotation } of pages) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [originalIndex]);
    if (rotation !== 0) {
      const current = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((current + rotation) % 360));
    }
    newDoc.addPage(copiedPage);
  }

  return newDoc.save();
}
