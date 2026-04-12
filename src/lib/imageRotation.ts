import type { CropData, ResizeData, WatermarkConfig, WatermarkPosition } from './types';

// ── 워터마크 위치 계산 헬퍼 ───────────────────────────────────────────────
function getWatermarkXY(
  canvas: HTMLCanvasElement,
  position: WatermarkPosition,
  textW: number,
  textH: number,
  padding: number,
): { x: number; y: number; align: CanvasTextAlign } {
  const [vPos, hPos] = position.split('-') as [string, string];
  let x: number, y: number, align: CanvasTextAlign;

  switch (hPos) {
    case 'left':   x = padding;                align = 'left';   break;
    case 'right':  x = canvas.width - padding; align = 'right';  break;
    default:       x = canvas.width / 2;       align = 'center'; break;
  }
  switch (vPos) {
    case 'top':    y = padding + textH / 2;               break;
    case 'bottom': y = canvas.height - padding - textH / 2; break;
    default:       y = canvas.height / 2;                  break;
  }
  return { x, y, align };
}

// ── 텍스트 워터마크 적용 ──────────────────────────────────────────────────
function applyTextWatermark(canvas: HTMLCanvasElement, config: WatermarkConfig): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !config.text.trim()) return;

  ctx.save();
  ctx.globalAlpha = config.opacity;
  ctx.fillStyle   = config.color;
  ctx.font        = `bold ${config.fontSize}px sans-serif`;

  if (config.repeat) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(config.text);
    const stepX = metrics.width + config.fontSize * 2;
    const stepY = config.fontSize * 3;
    const span  = Math.max(canvas.width, canvas.height) * 1.5;
    for (let y = -span; y < span; y += stepY) {
      for (let x = -span; x < span; x += stepX) {
        ctx.fillText(config.text, x, y);
      }
    }
  } else {
    const metrics = ctx.measureText(config.text);
    const { x, y, align } = getWatermarkXY(
      canvas, config.position, metrics.width, config.fontSize, 20,
    );
    ctx.textAlign    = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(config.text, x, y);
  }

  ctx.restore();
}

// ── 메인 처리 함수 ────────────────────────────────────────────────────────

/**
 * Canvas API로 이미지를 회전·반전·색상조정·크롭·리사이즈·워터마크 처리 후 Blob 반환
 * Canvas로 재인코딩하므로 EXIF는 자동 제거됨
 */
export async function rotateImageBlob(
  originalUrl: string,
  rotation:    number,
  flipped:     boolean         = false,
  mimeType:    string          = 'image/jpeg',
  quality:     number          = 0.92,
  cssFilter?:  string,
  cropData?:   CropData,
  resizeData?: ResizeData,
  watermark?:  WatermarkConfig,
): Promise<Blob> {
  const degrees = ((rotation % 360) + 360) % 360;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcX = cropData ? cropData.x      * img.naturalWidth  : 0;
      const srcY = cropData ? cropData.y      * img.naturalHeight : 0;
      const srcW = cropData ? cropData.width  * img.naturalWidth  : img.naturalWidth;
      const srcH = cropData ? cropData.height * img.naturalHeight : img.naturalHeight;

      const totalDeg = degrees + (cropData?.rotation ?? 0);
      const rad    = (totalDeg * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));

      const canvas = document.createElement('canvas');
      canvas.width  = srcW * absCos + srcH * absSin;
      canvas.height = srcW * absSin + srcH * absCos;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      if (cssFilter) ctx.filter = cssFilter;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      if (flipped) ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);

      // ── 리사이즈 ─────────────────────────────────────────────────────
      let outputCanvas = canvas;
      if (resizeData) {
        const targetW = resizeData.unit === '%'
          ? Math.max(1, Math.round(canvas.width  * resizeData.width  / 100))
          : Math.max(1, resizeData.width);
        const targetH = resizeData.unit === '%'
          ? Math.max(1, Math.round(canvas.height * resizeData.height / 100))
          : Math.max(1, resizeData.height);

        const rc = document.createElement('canvas');
        rc.width  = targetW;
        rc.height = targetH;
        const rctx = rc.getContext('2d');
        if (!rctx) return reject(new Error('Resize canvas context unavailable'));
        rctx.drawImage(canvas, 0, 0, targetW, targetH);
        outputCanvas = rc;
      }

      // ── 워터마크 ─────────────────────────────────────────────────────
      if (watermark) {
        applyTextWatermark(outputCanvas, watermark);
      }

      outputCanvas.toBlob(
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
