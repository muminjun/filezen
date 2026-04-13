import { PDFDocument } from 'pdf-lib';

export interface SignOptions {
  signatureDataUrl: string;  // canvas.toDataURL('image/png')
  pageIndex:        number;  // 0-based
  x:                number;
  y:                number;
  width:            number;
  height:           number;
}

export async function addSignatureToPdf(
  file: File,
  options: SignOptions,
): Promise<Uint8Array> {
  const bytes  = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const pages  = pdfDoc.getPages();
  const page   = pages[Math.min(options.pageIndex, pages.length - 1)];

  const base64   = options.signatureDataUrl.replace(/^data:image\/png;base64,/, '');
  const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const signImage = await pdfDoc.embedPng(pngBytes);

  page.drawImage(signImage, {
    x:      options.x,
    y:      options.y,
    width:  options.width,
    height: options.height,
  });

  return pdfDoc.save();
}
