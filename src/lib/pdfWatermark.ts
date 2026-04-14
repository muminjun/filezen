import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export type WatermarkPageRange = 'all' | { from: number; to: number };

export interface PdfWatermarkOptions {
  text:       string;
  fontSize:   number;
  opacity:    number;
  color:      string;   // '#rrggbb'
  angle:      number;   // 도 단위
  repeat:     boolean;
  pageRange:  WatermarkPageRange;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export async function addPdfWatermark(
  file: File,
  options: PdfWatermarkOptions,
): Promise<Uint8Array> {
  const bytes  = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages  = pdfDoc.getPages();
  const { r, g, b } = hexToRgb(options.color);
  const color = rgb(r, g, b);
  const rad   = degrees(options.angle);

  const targetPages = options.pageRange === 'all'
    ? pages
    : pages.slice(
        Math.max(0, options.pageRange.from - 1),
        options.pageRange.to,
      );

  for (const page of targetPages) {
    const { width, height } = page.getSize();
    const textWidth  = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = options.fontSize;

    if (options.repeat) {
      const stepX = textWidth  + options.fontSize * 2;
      const stepY = textHeight + options.fontSize * 2;
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawText(options.text, {
            x,
            y,
            size:    options.fontSize,
            font,
            color,
            opacity: options.opacity,
            rotate:  rad,
          });
        }
      }
    } else {
      page.drawText(options.text, {
        x:       (width  - textWidth)  / 2,
        y:       (height - textHeight) / 2,
        size:    options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate:  rad,
      });
    }
  }

  return pdfDoc.save();
}
