import { PDFDocument } from 'pdf-lib';

export interface SignOptions {
  signatureDataUrl: string;
  pageIndex:        number;  // 0-based
  x:                number;
  y:                number;
  width:            number;
  height:           number;
}

export async function addSignatureToPdf(
  file: File,
  signatures: SignOptions[],
): Promise<Uint8Array> {
  const bytes  = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages  = pdfDoc.getPages();

  for (const sig of signatures) {
    const page    = pages[Math.min(sig.pageIndex, pages.length - 1)];
    const base64  = sig.signatureDataUrl.replace(/^data:image\/png;base64,/, '');
    const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const img     = await pdfDoc.embedPng(pngBytes);
    page.drawImage(img, { x: sig.x, y: sig.y, width: sig.width, height: sig.height });
  }

  return pdfDoc.save();
}
