/**
 * 소셜 미디어 사이즈 프리셋 상수 및 Canvas 크롭 로직
 */

export interface SocialPreset {
  label: string;
  width: number;
  height: number;
}

export interface Platform {
  name: string;
  key: string;
  presets: SocialPreset[];
}

export const PLATFORMS: Platform[] = [
  {
    name: 'Instagram',
    key: 'instagram',
    presets: [
      { label: '피드 정사각형', width: 1080, height: 1080 },
      { label: '피드 세로',     width: 1080, height: 1350 },
      { label: '스토리/릴스',   width: 1080, height: 1920 },
    ],
  },
  {
    name: 'Twitter/X',
    key: 'twitter',
    presets: [
      { label: '포스트', width: 1600, height: 900 },
      { label: '프로필', width: 400,  height: 400 },
      { label: '헤더',   width: 1500, height: 500 },
    ],
  },
  {
    name: 'YouTube',
    key: 'youtube',
    presets: [
      { label: '썸네일',    width: 1280, height: 720  },
      { label: '채널 아트', width: 2560, height: 1440 },
    ],
  },
  {
    name: 'LinkedIn',
    key: 'linkedin',
    presets: [
      { label: '포스트', width: 1200, height: 628 },
      { label: '커버',   width: 1584, height: 396 },
    ],
  },
];

export type CropMode = 'center-crop' | 'letter-box';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function applyCenterCrop(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = width / height;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > dstRatio) {
    sw = Math.round(img.naturalHeight * dstRatio);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / dstRatio);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

function applyLetterBox(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = width / height;

  let drawW: number, drawH: number;
  if (srcRatio > dstRatio) {
    drawW = width;
    drawH = Math.round(width / srcRatio);
  } else {
    drawH = height;
    drawW = Math.round(height * srcRatio);
  }

  const dx = Math.round((width - drawW) / 2);
  const dy = Math.round((height - drawH) / 2);

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, drawW, drawH);
  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

export interface PresetOutputFile {
  filename: string;
  blob: Blob;
}

export async function applyPreset(
  file: File,
  platformKey: string,
  preset: SocialPreset,
  mode: CropMode
): Promise<PresetOutputFile> {
  const img = await loadImage(file);
  const canvas =
    mode === 'center-crop'
      ? applyCenterCrop(img, preset.width, preset.height)
      : applyLetterBox(img, preset.width, preset.height);

  const blob = await canvasToPngBlob(canvas);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${baseName}_${platformKey}_${preset.width}x${preset.height}.png`;

  return { filename, blob };
}
