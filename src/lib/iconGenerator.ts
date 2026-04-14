/**
 * Canvas 기반 아이콘 리사이즈 + ICO 바이너리 인코딩
 * 외부 라이브러리 없이 ArrayBuffer + DataView로 ICO 포맷 직접 조립
 */

export interface IconOutputSpec {
  filename: string;
  width: number;
  height: number;
  format: 'png' | 'ico';
}

export const ICON_OUTPUT_SPECS: IconOutputSpec[] = [
  { filename: 'favicon.ico',          width: 48,   height: 48,   format: 'ico' },
  { filename: 'favicon-32x32.png',    width: 32,   height: 32,   format: 'png' },
  { filename: 'favicon-16x16.png',    width: 16,   height: 16,   format: 'png' },
  { filename: 'apple-touch-icon.png', width: 180,  height: 180,  format: 'png' },
  { filename: 'android-192.png',      width: 192,  height: 192,  format: 'png' },
  { filename: 'android-512.png',      width: 512,  height: 512,  format: 'png' },
  { filename: 'og-image.png',         width: 1200, height: 630,  format: 'png' },
  { filename: 'windows-tile.png',     width: 150,  height: 150,  format: 'png' },
];

/** File → HTMLImageElement 로드 */
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

/**
 * 이미지를 지정 크기로 리사이즈한 Canvas 반환
 * bgColor: null이면 투명, '#rrggbb' 문자열이면 단색 배경
 * center-crop 방식으로 비율 유지
 */
function resizeToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  bgColor: string | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

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

/** Canvas → PNG Blob */
function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

/**
 * ICO 바이너리 인코딩
 * 16/32/48px 3가지 사이즈를 하나의 ICO 파일에 묶음
 * ICO 포맷: 헤더(6B) + 디렉터리 엔트리(16B × n) + PNG 데이터
 */
async function encodeIco(
  img: HTMLImageElement,
  bgColor: string | null
): Promise<Blob> {
  const sizes = [16, 32, 48];
  const pngBlobs: Blob[] = [];

  for (const size of sizes) {
    const canvas = resizeToCanvas(img, size, size, bgColor);
    const blob = await canvasToPngBlob(canvas);
    pngBlobs.push(blob);
  }

  const pngBuffers = await Promise.all(pngBlobs.map((b) => b.arrayBuffer()));

  const n = sizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * n;
  const dataOffset = headerSize + dirSize;

  let totalSize = dataOffset;
  for (const buf of pngBuffers) totalSize += buf.byteLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // ICO 헤더
  view.setUint16(0, 0, true);   // reserved
  view.setUint16(2, 1, true);   // type: 1 = ICO
  view.setUint16(4, n, true);   // count

  // 디렉터리 엔트리
  let dataPos = dataOffset;
  for (let i = 0; i < n; i++) {
    const size = sizes[i];
    const bufLen = pngBuffers[i].byteLength;
    const base = headerSize + dirEntrySize * i;

    view.setUint8(base + 0, size === 256 ? 0 : size);
    view.setUint8(base + 1, size === 256 ? 0 : size);
    view.setUint8(base + 2, 0);
    view.setUint8(base + 3, 0);
    view.setUint16(base + 4, 1, true);
    view.setUint16(base + 6, 32, true);
    view.setUint32(base + 8, bufLen, true);
    view.setUint32(base + 12, dataPos, true);

    uint8.set(new Uint8Array(pngBuffers[i]), dataPos);
    dataPos += bufLen;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

export interface IconGeneratorOptions {
  bgColor: string | null;
  selectedSpecs: IconOutputSpec[];
}

export interface IconOutputFile {
  filename: string;
  blob: Blob;
}

/** 이미지 File로부터 선택된 아이콘 세트 생성 */
export async function generateIconSet(
  file: File,
  options: IconGeneratorOptions
): Promise<IconOutputFile[]> {
  const img = await loadImage(file);
  const results: IconOutputFile[] = [];

  for (const spec of options.selectedSpecs) {
    if (spec.format === 'ico') {
      const blob = await encodeIco(img, options.bgColor);
      results.push({ filename: spec.filename, blob });
    } else {
      const canvas = resizeToCanvas(img, spec.width, spec.height, options.bgColor);
      const blob = await canvasToPngBlob(canvas);
      results.push({ filename: spec.filename, blob });
    }
  }

  return results;
}
