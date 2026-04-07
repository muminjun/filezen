import type { CropData } from './types';

/**
 * Canvas API로 이미지를 회전·반전·색상조정·크롭 처리 후 Blob 반환
 */
export async function rotateImageBlob(
  originalUrl: string,
  rotation:    number,
  flipped:     boolean      = false,
  mimeType:    string       = 'image/jpeg',
  quality:     number       = 0.92,
  cssFilter?:  string,
  cropData?:   CropData,
): Promise<Blob> {
  const degrees = ((rotation % 360) + 360) % 360;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 크롭 소스 영역 계산 (비율값 → 픽셀)
      const srcX = cropData ? cropData.x      * img.naturalWidth  : 0;
      const srcY = cropData ? cropData.y      * img.naturalHeight : 0;
      const srcW = cropData ? cropData.width  * img.naturalWidth  : img.naturalWidth;
      const srcH = cropData ? cropData.height * img.naturalHeight : img.naturalHeight;

      // 미세 각도: cropData.rotation + 기존 rotation 합산
      const totalDeg = degrees + (cropData?.rotation ?? 0);
      const rad    = (totalDeg * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));

      const canvas = document.createElement('canvas');
      canvas.width  = srcW * absCos + srcH * absSin;
      canvas.height = srcW * absSin + srcH * absCos;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      // 색상 조정: ctx.filter 적용
      if (cssFilter) ctx.filter = cssFilter;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      if (flipped) ctx.scale(-1, 1);

      // 크롭 소스 영역만 그리기
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeType,
        quality,
      );
    };
    img.onerror = reject;
    img.src = originalUrl;
  });
}
