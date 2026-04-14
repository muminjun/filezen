// src/lib/collageExport.ts

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportScale = 1 | 2 | 3;

export interface ExportOptions {
  format: ExportFormat;
  scale: ExportScale;
  element: HTMLElement;
}

/**
 * html2canvas로 element를 래스터화하여 파일 다운로드.
 * html2canvas는 내보내기 시점에만 동적 import.
 */
export async function exportCollage(options: ExportOptions): Promise<void> {
  const { format, scale, element } = options;
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });

  const mimeType = `image/${format}`;
  const quality = format === 'png' ? undefined : 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('canvas.toBlob returned null')); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 15);
        a.href = url;
        a.download = `collage-${timestamp}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      },
      mimeType,
      quality,
    );
  });
}
