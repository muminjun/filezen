import type { FrameTemplate, FrameOptionsState } from './frameTemplates';
import { getOrientedRatio } from './frameTemplates';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawCenterCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
) {
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > dstRatio) {
    sw = Math.round(img.naturalHeight * dstRatio);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / dstRatio);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export async function exportFrame(
  template: FrameTemplate,
  slotImages: (File | null)[],
  opts: FrameOptionsState,
  previewWidth: number,
): Promise<void> {
  const [ratioW, ratioH] = getOrientedRatio(template, opts.orientation);

  const [naturalW, naturalH] = template.canvasRatio;
  const nativeWidth = template.outputWidth;
  const nativeHeight = Math.round(nativeWidth * naturalH / naturalW);
  const longSide = Math.max(nativeWidth, nativeHeight);
  const shortSide = Math.min(nativeWidth, nativeHeight);
  const outputWidth = ratioW > ratioH ? longSide : shortSide;
  const outputHeight = ratioW > ratioH ? shortSide : longSide;

  const scale = outputWidth / Math.max(1, previewWidth);
  const gap = Math.round(opts.gapSize * scale);
  const borderRadius = Math.round(opts.borderRadius * scale);
  const borderWidth = Math.round(opts.borderWidth * scale);

  const { cols, rows } = template.grid;
  const cellW = (outputWidth - gap * (cols + 1)) / cols;
  const cellH = (outputHeight - gap * (rows + 1)) / rows;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = opts.gapColor;
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  const images = await Promise.all(
    slotImages.map((f) => (f ? loadImage(f) : null)),
  );

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    const img = images[i];
    if (!img) continue;

    const x = gap + (slot.col - 1) * (cellW + gap);
    const y = gap + (slot.row - 1) * (cellH + gap);
    const w = cellW * slot.colSpan + gap * (slot.colSpan - 1);
    const h = cellH * slot.rowSpan + gap * (slot.rowSpan - 1);

    ctx.save();
    roundRectPath(ctx, x, y, w, h, borderRadius);
    ctx.clip();
    drawCenterCrop(ctx, img, x, y, w, h);
    ctx.restore();
  }

  if (borderWidth > 0) {
    ctx.strokeStyle = opts.borderColor;
    ctx.lineWidth = borderWidth * 2;
    ctx.strokeRect(0, 0, outputWidth, outputHeight);
  }

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-${template.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}
