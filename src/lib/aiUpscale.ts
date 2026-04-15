// src/lib/aiUpscale.ts
// Real-ESRGAN x2/x4 업스케일링 - onnxruntime-web 기반
// 모델 소스: Hugging Face onnx-community

import type { InferenceSession, Tensor } from 'onnxruntime-web';

const MODEL_URLS: Record<2 | 4, string> = {
  2: 'https://huggingface.co/onnx-community/realesrgan-x2plus/resolve/main/model.onnx',
  4: 'https://huggingface.co/onnx-community/realesrgan-x4plus/resolve/main/model.onnx',
};

const TILE_SIZE    = 128;
const TILE_OVERLAP = 8;

let sessions: Partial<Record<2 | 4, InferenceSession>> = {};

async function getSession(scale: 2 | 4): Promise<InferenceSession> {
  if (sessions[scale]) return sessions[scale]!;

  const ort = await import('onnxruntime-web');
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

  const modelUrl = MODEL_URLS[scale];
  const resp = await fetch(modelUrl);
  if (!resp.ok) throw new Error(`Failed to fetch model: ${resp.statusText}`);
  const buffer = await resp.arrayBuffer();

  const session = await ort.InferenceSession.create(new Uint8Array(buffer), {
    executionProviders: ['wasm'],
  });
  sessions[scale] = session;
  return session;
}

/** imageData를 Float32Array [1,3,H,W] 로 정규화 (0~255 → 0~1) */
function imageDataToTensor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): Float32Array {
  const data = ctx.getImageData(x, y, w, h).data; // RGBA
  const tensor = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    tensor[i]             = data[i * 4]     / 255; // R
    tensor[i + w * h]     = data[i * 4 + 1] / 255; // G
    tensor[i + 2 * w * h] = data[i * 4 + 2] / 255; // B
  }
  return tensor;
}

/** Float32Array [1,3,H,W] 을 canvas에 그리기 (0~1 → 0~255) */
function tensorToImageData(tensor: Float32Array, w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4]     = Math.round(Math.min(1, Math.max(0, tensor[i]))             * 255);
    data[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, tensor[i + w * h]))     * 255);
    data[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, tensor[i + 2 * w * h])) * 255);
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, w, h);
}

export async function upscaleImage(
  file: File,
  scale: 2 | 4,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const ort = await import('onnxruntime-web');

  onProgress?.(0);
  const session = await getSession(scale);

  // 이미지 로드
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const el = new Image();
    el.onload  = () => res(el);
    el.onerror = rej;
    el.src     = url;
  });
  URL.revokeObjectURL(url);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const dstW = srcW * scale;
  const dstH = srcH * scale;

  // 소스 canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width  = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0);

  // 결과 canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width  = dstW;
  dstCanvas.height = dstH;
  const dstCtx = dstCanvas.getContext('2d')!;

  // 타일 기반 추론
  const step   = TILE_SIZE - TILE_OVERLAP * 2;
  const tilesX = Math.ceil(srcW / step);
  const tilesY = Math.ceil(srcH / step);
  const total  = tilesX * tilesY;
  let   done   = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const sx = Math.max(0, tx * step - TILE_OVERLAP);
      const sy = Math.max(0, ty * step - TILE_OVERLAP);
      const sw = Math.min(TILE_SIZE, srcW - sx);
      const sh = Math.min(TILE_SIZE, srcH - sy);

      const tensorData  = imageDataToTensor(srcCtx, sx, sy, sw, sh);
      const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, sh, sw]);

      const inputName = session.inputNames[0];
      const feeds: Record<string, InstanceType<typeof ort.Tensor>> = {};
      feeds[inputName] = inputTensor;

      const results = await session.run(feeds);
      const output  = results[session.outputNames[0]];
      const outData = output.data as Float32Array;
      const outH    = sh * scale;
      const outW    = sw * scale;

      const imgData = tensorToImageData(outData, outW, outH);
      dstCtx.putImageData(imgData, sx * scale, sy * scale);

      done++;
      onProgress?.(Math.round((done / total) * 100));
    }
  }

  return new Promise<Blob>((res, rej) => {
    dstCanvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('canvas.toBlob failed'))),
      'image/png',
    );
  });
}
