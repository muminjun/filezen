// src/lib/bgReplace.ts
// 배경 제거(removeBackground) 후 Canvas API로 배경 교체

import { removeBackground } from './backgroundRemoval';

export type BgReplaceMode = 'color' | 'gradient' | 'image';

export interface BgReplaceOptions {
  mode: BgReplaceMode;
  color1: string;        // hex, solid or gradient start
  color2: string;        // hex, gradient end
  gradientAngle: number; // deg
  bgImageFile?: File;    // mode === 'image'
}

export async function replaceBackground(
  subjectFile: File,
  opts: BgReplaceOptions,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  // 1. 배경 제거
  onProgress?.(5);
  const noBgBlob = await removeBackground(subjectFile, ({ loaded }) => {
    onProgress?.(5 + Math.round(loaded * 0.7));
  });

  // 2. canvas 합성
  const subjectBitmap = await createImageBitmap(noBgBlob);
  const W = subjectBitmap.width;
  const H = subjectBitmap.height;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 배경 그리기
  if (opts.mode === 'color') {
    ctx.fillStyle = opts.color1;
    ctx.fillRect(0, 0, W, H);
  } else if (opts.mode === 'gradient') {
    const rad = (opts.gradientAngle * Math.PI) / 180;
    const dx = Math.cos(rad) * W;
    const dy = Math.sin(rad) * H;
    const grad = ctx.createLinearGradient(0, 0, dx, dy);
    grad.addColorStop(0, opts.color1);
    grad.addColorStop(1, opts.color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (opts.mode === 'image' && opts.bgImageFile) {
    const bgBitmap = await createImageBitmap(opts.bgImageFile);
    // cover 방식으로 배경 이미지 그리기
    const bgRatio  = bgBitmap.width / bgBitmap.height;
    const fgRatio  = W / H;
    let sx = 0, sy = 0, sw = bgBitmap.width, sh = bgBitmap.height;
    if (bgRatio > fgRatio) {
      sw = bgBitmap.height * fgRatio;
      sx = (bgBitmap.width - sw) / 2;
    } else {
      sh = bgBitmap.width / fgRatio;
      sy = (bgBitmap.height - sh) / 2;
    }
    ctx.drawImage(bgBitmap, sx, sy, sw, sh, 0, 0, W, H);
    bgBitmap.close();
  }

  // 3. 피사체(배경 제거된 이미지) 합성
  onProgress?.(85);
  ctx.drawImage(subjectBitmap, 0, 0);
  subjectBitmap.close();

  onProgress?.(100);

  return new Promise<Blob>((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('canvas.toBlob failed'))),
      'image/png',
    );
  });
}
