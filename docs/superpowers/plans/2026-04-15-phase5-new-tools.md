# Phase 5 New Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 5: 이미지 탭에 AI 업스케일링·배경 교체·이미지→PDF 도구, 변환 탭에 애니메이션 GIF 에디터·QR/바코드 생성기·오디오 변환 도구 총 6개 기능을 추가한다.

**Architecture:** 모든 처리는 클라이언트사이드에서만 동작한다. 이미지 탭 도구들은 `BgRemoveTool` 패턴을 따르는 modal overlay 컴포넌트로 구현하고, `BottomActionBar`에 트리거 버튼을 추가한다. 변환 탭 도구들은 `ConvertToolMode` 타입과 `ConvertPage`/`ConvertToolSelector`에 새 mode를 추가해 기존 라우팅 패턴을 따른다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, pdf-lib (이미 설치됨), @ffmpeg/ffmpeg (이미 설치됨), @imgly/background-removal (이미 설치됨), onnxruntime-web (신규), qrcode (신규), jsbarcode (신규)

---

## File Map

### 신규 생성
- `src/lib/aiUpscale.ts` — onnxruntime-web으로 Real-ESRGAN 2x/4x 추론 로직
- `src/lib/bgReplace.ts` — 배경 제거 후 Canvas API로 단색/그라데이션/이미지 합성
- `src/components/image/tools/AiUpscaleTool.tsx` — AI 업스케일링 modal
- `src/components/image/tools/BgReplaceTool.tsx` — 배경 교체 modal
- `src/components/image/tools/ImageToPdfTool.tsx` — 이미지→PDF 옵션 modal
- `src/components/convert/tools/GifEditorTool.tsx` — 애니메이션 GIF 에디터
- `src/components/convert/tools/QrBarcodeTool.tsx` — QR/바코드 생성기
- `src/components/convert/tools/AudioTool.tsx` — 오디오 포맷 변환

### 수정
- `src/lib/types.ts` — `ConvertToolMode` 에 `'gif-editor' | 'qr-barcode' | 'audio'` 추가
- `src/messages/en.json` — Phase 5 i18n 문자열 추가
- `src/messages/ko.json` — Phase 5 i18n 문자열 추가
- `src/components/image/BottomActionBar.tsx` — AI Upscale, BG Replace, Image→PDF 버튼 추가
- `src/components/convert/ConvertPage.tsx` — 3개 신규 tool 컴포넌트 연결
- `src/components/convert/ConvertToolSelector.tsx` — 3개 신규 mode 버튼 추가

---

## Task 1: npm 패키지 설치

**Files:**
- Modify: `package.json` (자동)

- [ ] **Step 1: 패키지 설치**

```bash
npm install onnxruntime-web qrcode jsbarcode
npm install --save-dev @types/qrcode @types/jsbarcode
```

- [ ] **Step 2: 설치 확인**

```bash
node -e "require('qrcode'); require('jsbarcode'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: commit**

```bash
git add package.json package-lock.json
git commit -m "feat(phase5): install onnxruntime-web, qrcode, jsbarcode"
```

---

## Task 2: 타입 업데이트 (ConvertToolMode)

**Files:**
- Modify: `src/lib/types.ts:143`

- [ ] **Step 1: ConvertToolMode에 새 mode 추가**

`src/lib/types.ts` 143번 줄의 `ConvertToolMode` 를:
```typescript
export type ConvertToolMode = 'icon' | 'social' | 'palette' | 'video-to-gif' | 'ocr';
```
다음으로 교체:
```typescript
export type ConvertToolMode = 'icon' | 'social' | 'palette' | 'video-to-gif' | 'ocr' | 'gif-editor' | 'qr-barcode' | 'audio';
```

- [ ] **Step 2: TypeScript 컴파일 체크**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: 에러 없음 (ConvertContext defaultValue 경고 무시)

- [ ] **Step 3: commit**

```bash
git add src/lib/types.ts
git commit -m "feat(phase5): extend ConvertToolMode with gif-editor, qr-barcode, audio"
```

---

## Task 3: i18n 문자열 추가

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: en.json에 추가**

`en.json` 의 `"convert"` → `"tools"` 객체에 3개 키 추가:
```json
"gifEditor": "GIF Editor",
"qrBarcode": "QR / Barcode",
"audio": "Audio Convert"
```

그 다음 `"convert"` 최상위 객체 안에 새 섹션 추가 (`"palette"` 섹션 뒤에):
```json
"gifEditor": {
  "empty": "Upload images to create an animated GIF",
  "uploadHint": "PNG, JPG, WebP · up to 20 frames",
  "delay": "Frame delay (ms)",
  "loop": "Loop",
  "loopForever": "Forever",
  "loopOnce": "Once",
  "moveUp": "Move Up",
  "moveDown": "Move Down",
  "remove": "Remove",
  "generate": "Generate GIF",
  "generating": "Encoding...",
  "done": "Download GIF"
},
"qrBarcode": {
  "tabQr": "QR Code",
  "tabBarcode": "Barcode",
  "inputLabel": "Content",
  "inputPlaceholderQr": "https://example.com",
  "inputPlaceholderBarcode": "1234567890",
  "fgColor": "Foreground",
  "bgColor": "Background",
  "size": "Size (px)",
  "barcodeFormat": "Format",
  "downloadPng": "Download PNG",
  "downloadSvg": "Download SVG"
},
"audio": {
  "empty": "Upload an audio file to convert",
  "uploadHint": "MP3, WAV, OGG, FLAC · up to 500MB",
  "outputFormat": "Output Format",
  "loadingWasm": "Loading ffmpeg.wasm (~30MB)…",
  "converting": "Converting… {pct}%",
  "done": "Download converted file",
  "waveform": "Waveform"
},
"aiUpscale": {
  "title": "AI Upscale",
  "hint": "Upscales images using Real-ESRGAN. First run downloads ~20MB model.",
  "scale": "Scale",
  "loading": "Loading model…",
  "processing": "Upscaling {current}/{total}…",
  "done": "Upscaling complete",
  "start": "Start",
  "close": "Close"
},
"bgReplace": {
  "title": "Replace Background",
  "hint": "Remove background then replace with color, gradient, or image.",
  "modeColor": "Solid Color",
  "modeGradient": "Gradient",
  "modeImage": "Custom Image",
  "color1": "Color",
  "color2": "Color 2",
  "gradientAngle": "Angle",
  "uploadBg": "Upload background image",
  "removing": "Removing background…",
  "compositing": "Compositing…",
  "done": "Done",
  "start": "Apply",
  "close": "Close"
},
"imageToPdf": {
  "title": "Export to PDF",
  "pageSize": "Page Size",
  "sizeA4": "A4",
  "sizeLetter": "Letter",
  "sizeFit": "Fit to image",
  "margin": "Margin (pt)",
  "creating": "Creating PDF…",
  "create": "Create PDF",
  "close": "Close"
}
```

그리고 `"actionBar"` 객체에 3개 키 추가:
```json
"aiUpscale": "AI Upscale",
"bgReplace": "BG Replace",
"imageToPdf": "To PDF"
```

- [ ] **Step 2: ko.json에 추가**

`ko.json` 의 `"convert"` → `"tools"` 객체에 3개 키 추가:
```json
"gifEditor": "GIF 에디터",
"qrBarcode": "QR / 바코드",
"audio": "오디오 변환"
```

`ko.json` `"convert"` 최상위 객체 안에 새 섹션 추가:
```json
"gifEditor": {
  "empty": "이미지를 업로드해서 움직이는 GIF를 만드세요",
  "uploadHint": "PNG, JPG, WebP · 최대 20프레임",
  "delay": "프레임 지연 (ms)",
  "loop": "반복",
  "loopForever": "무한 반복",
  "loopOnce": "1회만",
  "moveUp": "위로",
  "moveDown": "아래로",
  "remove": "삭제",
  "generate": "GIF 생성",
  "generating": "인코딩 중...",
  "done": "GIF 다운로드"
},
"qrBarcode": {
  "tabQr": "QR 코드",
  "tabBarcode": "바코드",
  "inputLabel": "내용",
  "inputPlaceholderQr": "https://example.com",
  "inputPlaceholderBarcode": "1234567890",
  "fgColor": "전경색",
  "bgColor": "배경색",
  "size": "크기 (px)",
  "barcodeFormat": "형식",
  "downloadPng": "PNG 다운로드",
  "downloadSvg": "SVG 다운로드"
},
"audio": {
  "empty": "오디오 파일을 업로드하세요",
  "uploadHint": "MP3, WAV, OGG, FLAC · 최대 500MB",
  "outputFormat": "출력 형식",
  "loadingWasm": "ffmpeg.wasm 로딩 중 (~30MB)…",
  "converting": "변환 중… {pct}%",
  "done": "변환된 파일 다운로드",
  "waveform": "파형"
},
"aiUpscale": {
  "title": "AI 업스케일",
  "hint": "Real-ESRGAN으로 이미지를 고해상도로 변환합니다. 최초 실행 시 ~20MB 모델을 다운로드합니다.",
  "scale": "배율",
  "loading": "모델 로딩 중…",
  "processing": "{current}/{total}장 처리 중…",
  "done": "업스케일 완료",
  "start": "시작",
  "close": "닫기"
},
"bgReplace": {
  "title": "배경 교체",
  "hint": "배경을 제거한 후 단색·그라데이션·이미지로 교체합니다.",
  "modeColor": "단색",
  "modeGradient": "그라데이션",
  "modeImage": "사용자 이미지",
  "color1": "색상",
  "color2": "색상 2",
  "gradientAngle": "각도",
  "uploadBg": "배경 이미지 업로드",
  "removing": "배경 제거 중…",
  "compositing": "합성 중…",
  "done": "완료",
  "start": "적용",
  "close": "닫기"
},
"imageToPdf": {
  "title": "PDF로 내보내기",
  "pageSize": "페이지 크기",
  "sizeA4": "A4",
  "sizeLetter": "Letter",
  "sizeFit": "이미지 크기에 맞춤",
  "margin": "여백 (pt)",
  "creating": "PDF 생성 중…",
  "create": "PDF 생성",
  "close": "닫기"
}
```

`ko.json` `"actionBar"` 객체에 3개 키 추가:
```json
"aiUpscale": "AI 업스케일",
"bgReplace": "배경 교체",
"imageToPdf": "PDF 변환"
```

- [ ] **Step 3: TypeScript/next-intl 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: commit**

```bash
git add src/messages/en.json src/messages/ko.json
git commit -m "feat(phase5): add i18n strings for all 6 new tools"
```

---

## Task 4: AI 업스케일 라이브러리 (src/lib/aiUpscale.ts)

**Files:**
- Create: `src/lib/aiUpscale.ts`

Real-ESRGAN x2 ONNX 모델 (약 17MB)을 lazy load 해서 타일 기반 추론. 타일 크기 128px, 오버랩 8px.

- [ ] **Step 1: aiUpscale.ts 생성**

```typescript
// src/lib/aiUpscale.ts
// Real-ESRGAN x2/x4 업스케일링 - onnxruntime-web 기반
// 모델 소스: https://github.com/xinntao/Real-ESRGAN (ONNX 포맷 변환 버전)

import type { InferenceSession, Tensor } from 'onnxruntime-web';

const MODEL_URLS: Record<2 | 4, string> = {
  2: 'https://huggingface.co/onnx-community/realesrgan-x2plus/resolve/main/model.onnx',
  4: 'https://huggingface.co/onnx-community/realesrgan-x4plus/resolve/main/model.onnx',
};

const TILE_SIZE   = 128;
const TILE_OVERLAP = 8;

let sessions: Partial<Record<2 | 4, InferenceSession>> = {};

async function getSession(scale: 2 | 4): Promise<InferenceSession> {
  if (sessions[scale]) return sessions[scale]!;

  const ort = await import('onnxruntime-web');
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';

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
function imageDataToTensor(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Float32Array {
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

  // 모델 로드
  onProgress?.(0);
  const session = await getSession(scale);

  // 이미지 로드
  const url    = URL.createObjectURL(file);
  const img    = await new Promise<HTMLImageElement>((res, rej) => {
    const el = new Image();
    el.onload = () => res(el);
    el.onerror = rej;
    el.src = url;
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
  const step    = TILE_SIZE - TILE_OVERLAP * 2;
  const tilesX  = Math.ceil(srcW / step);
  const tilesY  = Math.ceil(srcH / step);
  const total   = tilesX * tilesY;
  let   done    = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const sx = Math.max(0, tx * step - TILE_OVERLAP);
      const sy = Math.max(0, ty * step - TILE_OVERLAP);
      const sw = Math.min(TILE_SIZE, srcW - sx);
      const sh = Math.min(TILE_SIZE, srcH - sy);

      const tensorData = imageDataToTensor(srcCtx, sx, sy, sw, sh);
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
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep aiUpscale
```
Expected: 출력 없음

- [ ] **Step 3: commit**

```bash
git add src/lib/aiUpscale.ts
git commit -m "feat(phase5): add aiUpscale lib with Real-ESRGAN tile inference"
```

---

## Task 5: AI 업스케일 UI (src/components/image/tools/AiUpscaleTool.tsx)

**Files:**
- Create: `src/components/image/tools/AiUpscaleTool.tsx`

BgRemoveTool 패턴을 그대로 따르는 modal overlay 컴포넌트.

- [ ] **Step 1: AiUpscaleTool.tsx 생성**

```tsx
// src/components/image/tools/AiUpscaleTool.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upscaleImage } from '@/lib/aiUpscale';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function AiUpscaleTool({ onClose }: Props) {
  const t = useTranslations('aiUpscale');
  const { images, selectedIds, replaceImageBlob } = useAppContext();
  const [scale,    setScale]    = useState<2 | 4>(2);
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleStart = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setProgress(0);
    setErrorMsg('');

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrent(i + 1);
        const img = selectedImages[i];
        const blob = await upscaleImage(img.file, scale, (pct) => {
          const base = (i / selectedImages.length) * 100;
          const step = (1 / selectedImages.length) * 100;
          setProgress(Math.round(base + (pct / 100) * step));
        });
        const suffix = scale === 2 ? '-2x' : '-4x';
        const newName = img.file.name.replace(/\.[^.]+$/, `${suffix}.png`);
        replaceImageBlob(img.id, blob, newName);
      }
      setStatus('done');
    } catch (err) {
      console.error('AI upscale failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, replaceImageBlob, scale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[320px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        <p className="mb-4 text-[12px] text-[#888] leading-relaxed">{t('hint')}</p>

        {/* Scale selector */}
        {status === 'idle' && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] text-[#888]">{t('scale')}</p>
            <div className="flex gap-2">
              {([2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors',
                    scale === s
                      ? 'bg-[#0a84ff] text-white'
                      : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#888]">
              <span>{progress < 5 ? t('loading') : t('processing', { current, total: selectedImages.length })}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#3a3a3c]">
              <div
                className="h-full rounded-full bg-[#0a84ff] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <p className="mb-4 text-[12px] text-[#30d158]">{t('done')}</p>
        )}

        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a] break-words">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleStart}
              disabled={selectedImages.length === 0}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0
                  ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
                  : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
              )}
            >
              {t('start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep AiUpscale
```
Expected: 출력 없음

- [ ] **Step 3: commit**

```bash
git add src/components/image/tools/AiUpscaleTool.tsx
git commit -m "feat(phase5): add AiUpscaleTool modal component"
```

---

## Task 6: 배경 교체 라이브러리 + UI

**Files:**
- Create: `src/lib/bgReplace.ts`
- Create: `src/components/image/tools/BgReplaceTool.tsx`

- [ ] **Step 1: bgReplace.ts 생성**

```typescript
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
  const [subjectBitmap] = await Promise.all([createImageBitmap(noBgBlob)]);
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
```

- [ ] **Step 2: BgReplaceTool.tsx 생성**

```tsx
// src/components/image/tools/BgReplaceTool.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { replaceBackground, BgReplaceMode } from '@/lib/bgReplace';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function BgReplaceTool({ onClose }: Props) {
  const t = useTranslations('bgReplace');
  const { images, selectedIds, replaceImageBlob } = useAppContext();

  const [mode,          setMode]          = useState<BgReplaceMode>('color');
  const [color1,        setColor1]        = useState('#ffffff');
  const [color2,        setColor2]        = useState('#000000');
  const [gradientAngle, setGradientAngle] = useState(90);
  const [bgImageFile,   setBgImageFile]   = useState<File | undefined>();
  const [status,        setStatus]        = useState<Status>('idle');
  const [progress,      setProgress]      = useState(0);
  const [current,       setCurrent]       = useState(0);
  const [errorMsg,      setErrorMsg]      = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleStart = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setProgress(0);
    setErrorMsg('');

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrent(i + 1);
        const img = selectedImages[i];
        const blob = await replaceBackground(
          img.file,
          { mode, color1, color2, gradientAngle, bgImageFile },
          (pct) => {
            const base = (i / selectedImages.length) * 100;
            const step = (1 / selectedImages.length) * 100;
            setProgress(Math.round(base + (pct / 100) * step));
          },
        );
        const newName = img.file.name.replace(/\.[^.]+$/, '-bgreplaced.png');
        replaceImageBlob(img.id, blob, newName);
      }
      setStatus('done');
    } catch (err) {
      console.error('BG replace failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, replaceImageBlob, mode, color1, color2, gradientAngle, bgImageFile]);

  const MODES: BgReplaceMode[] = ['color', 'gradient', 'image'];
  const MODE_LABELS: Record<BgReplaceMode, string> = {
    color:    t('modeColor'),
    gradient: t('modeGradient'),
    image:    t('modeImage'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[340px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        <p className="mb-4 text-[12px] text-[#888] leading-relaxed">{t('hint')}</p>

        {status === 'idle' && (
          <>
            {/* Mode tabs */}
            <div className="mb-4 flex gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                    mode === m
                      ? 'bg-[#0a84ff] text-white'
                      : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Mode-specific controls */}
            {mode === 'color' && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-[12px] text-[#aaa]">{t('color1')}</label>
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
                />
              </div>
            )}

            {mode === 'gradient' && (
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('color1')}</label>
                  <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('color2')}</label>
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-[12px] text-[#aaa]">{t('gradientAngle')}</label>
                  <input type="range" min={0} max={360} value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    className="flex-1 accent-[#0a84ff]" />
                  <span className="w-10 text-right text-[12px] text-[#aaa]">{gradientAngle}°</span>
                </div>
              </div>
            )}

            {mode === 'image' && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBgImageFile(e.target.files?.[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl bg-[#2c2c2e] py-2 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
                >
                  {bgImageFile ? bgImageFile.name : t('uploadBg')}
                </button>
              </div>
            )}

            <p className="mb-4 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </>
        )}

        {status === 'loading' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#888]">
              <span>{progress < 10 ? t('removing') : t('compositing')}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#3a3a3c]">
              <div className="h-full rounded-full bg-[#0a84ff] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === 'done' && (
          <p className="mb-4 text-[12px] text-[#30d158]">{t('done')}</p>
        )}
        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a] break-words">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors">
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleStart}
              disabled={selectedImages.length === 0 || (mode === 'image' && !bgImageFile)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0 && (mode !== 'image' || bgImageFile)
                  ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
                  : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
              )}
            >
              {t('start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep -E "bgReplace|BgReplace"
```
Expected: 출력 없음

- [ ] **Step 4: commit**

```bash
git add src/lib/bgReplace.ts src/components/image/tools/BgReplaceTool.tsx
git commit -m "feat(phase5): add bgReplace lib and BgReplaceTool modal"
```

---

## Task 7: 이미지→PDF 옵션 modal (src/components/image/tools/ImageToPdfTool.tsx)

**Files:**
- Modify: `src/lib/pdfConvert.ts` — `imagesToPdf`에 margin 파라미터 추가
- Create: `src/components/image/tools/ImageToPdfTool.tsx`

- [ ] **Step 1: pdfConvert.ts의 imagesToPdf에 margin 파라미터 추가**

`src/lib/pdfConvert.ts` 의 `imagesToPdf` 함수 시그니처를:
```typescript
export async function imagesToPdf(
  files: File[],
  pageSize: 'a4' | 'letter' | 'fit'
): Promise<Uint8Array> {
```
다음으로 변경:
```typescript
export async function imagesToPdf(
  files: File[],
  pageSize: 'a4' | 'letter' | 'fit',
  marginPt: number = 0,
): Promise<Uint8Array> {
```

그리고 `page.drawImage` 호출 부분을 margin 고려하도록 수정:
기존 코드:
```typescript
    const x = (pgWidth - drawWidth) / 2;
    const y = (pgHeight - drawHeight) / 2;

    page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
```
다음으로 변경:
```typescript
    const availW = pgWidth  - marginPt * 2;
    const availH = pgHeight - marginPt * 2;

    const mImgRatio = embedded.width / embedded.height;
    const mPgRatio  = availW / availH;
    let mDrawW: number, mDrawH: number;
    if (mImgRatio > mPgRatio) {
      mDrawH = availH;
      mDrawW = availH * mImgRatio;
    } else {
      mDrawW = availW;
      mDrawH = availW / mImgRatio;
    }
    const mx = marginPt + (availW - mDrawW) / 2;
    const my = marginPt + (availH - mDrawH) / 2;

    page.drawImage(embedded, { x: mx, y: my, width: mDrawW, height: mDrawH });
```

- [ ] **Step 2: ImageToPdfTool.tsx 생성**

```tsx
// src/components/image/tools/ImageToPdfTool.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { imagesToPdf } from '@/lib/pdfConvert';
import { downloadBytes } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type PageSize = 'a4' | 'letter' | 'fit';
type Status   = 'idle' | 'loading' | 'done' | 'error';

export function ImageToPdfTool({ onClose }: Props) {
  const t = useTranslations('imageToPdf');
  const { images, selectedIds } = useAppContext();

  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [margin,   setMargin]   = useState(20);
  const [status,   setStatus]   = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  const handleCreate = useCallback(async () => {
    if (selectedImages.length === 0) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const files = selectedImages.map((img) => img.file);
      const bytes = await imagesToPdf(files, pageSize, margin);
      downloadBytes(bytes, 'images.pdf');
      setStatus('done');
    } catch (err) {
      console.error('Image to PDF failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, pageSize, margin]);

  const PAGE_SIZES: PageSize[] = ['a4', 'letter', 'fit'];
  const PAGE_LABELS: Record<PageSize, string> = {
    a4:     t('sizeA4'),
    letter: t('sizeLetter'),
    fit:    t('sizeFit'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[320px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('title')}</h2>
        </div>

        {status === 'idle' && (
          <>
            {/* Page size */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] text-[#888]">{t('pageSize')}</p>
              <div className="flex gap-1.5">
                {PAGE_SIZES.map((ps) => (
                  <button
                    key={ps}
                    onClick={() => setPageSize(ps)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                      pageSize === ps
                        ? 'bg-[#0a84ff] text-white'
                        : 'bg-[#2c2c2e] text-[#aaa] hover:bg-[#3a3a3c]',
                    )}
                  >
                    {PAGE_LABELS[ps]}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin */}
            {pageSize !== 'fit' && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-[12px] text-[#aaa]">{t('margin')}</label>
                <input
                  type="range" min={0} max={72} step={4} value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="flex-1 accent-[#0a84ff]"
                />
                <span className="w-10 text-right text-[12px] text-[#aaa]">{margin}pt</span>
              </div>
            )}

            <p className="mb-4 text-[11px] text-[#aaa]">{selectedImages.length}장 선택됨</p>
          </>
        )}

        {status === 'loading' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-[#0a84ff] border-t-transparent rounded-full inline-block" />
            <span className="text-[12px] text-[#888]">{t('creating')}</span>
          </div>
        )}

        {status === 'done' && (
          <p className="mb-4 text-[12px] text-[#30d158]">PDF 생성 완료!</p>
        )}
        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a] break-words">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors">
            {t('close')}
          </button>
          {status === 'idle' && (
            <button
              onClick={handleCreate}
              disabled={selectedImages.length === 0}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                selectedImages.length > 0
                  ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
                  : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
              )}
            >
              {t('create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep -E "pdfConvert|ImageToPdf"
```
Expected: 출력 없음

- [ ] **Step 4: commit**

```bash
git add src/lib/pdfConvert.ts src/components/image/tools/ImageToPdfTool.tsx
git commit -m "feat(phase5): add margin to imagesToPdf and ImageToPdfTool modal"
```

---

## Task 8: 애니메이션 GIF 에디터 (convert 탭)

**Files:**
- Create: `src/components/convert/tools/GifEditorTool.tsx`

여러 이미지를 프레임으로 업로드, 순서 조정, 프레임 지연시간 설정, GIF 출력. @ffmpeg/ffmpeg 재활용.

- [ ] **Step 1: GifEditorTool.tsx 생성**

```tsx
// src/components/convert/tools/GifEditorTool.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFFmpeg } from '@/lib/ffmpegLoader';

interface Frame {
  id: string;
  file: File;
  previewUrl: string;
  delay: number; // ms
}

type Status = 'idle' | 'loading-wasm' | 'encoding' | 'done' | 'error';

export function GifEditorTool() {
  const t = useTranslations('convert.gifEditor');
  const [frames,   setFrames]   = useState<Frame[]>([]);
  const [loop,     setLoop]     = useState<'forever' | 'once'>('forever');
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState<string | null>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    const newFrames: Frame[] = files.map((file) => ({
      id:         crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      delay:      100,
    }));
    setFrames((prev) => [...prev, ...newFrames].slice(0, 20));
    e.target.value = '';
  }, []);

  const moveUp   = (idx: number) => setFrames((prev) => {
    if (idx === 0) return prev;
    const next = [...prev];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    return next;
  });

  const moveDown = (idx: number) => setFrames((prev) => {
    if (idx === prev.length - 1) return prev;
    const next = [...prev];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    return next;
  });

  const remove   = (id: string) => setFrames((prev) => {
    const f = prev.find((fr) => fr.id === id);
    if (f) URL.revokeObjectURL(f.previewUrl);
    return prev.filter((fr) => fr.id !== id);
  });

  const setDelay = (id: string, delay: number) =>
    setFrames((prev) => prev.map((fr) => fr.id === id ? { ...fr, delay } : fr));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (frames.length === 0) return;
    setError(null);
    setProgress(0);

    try {
      setStatus('loading-wasm');
      const ffmpeg = await getFFmpeg((p) => setProgress(Math.round(p * 100)));
      setStatus('encoding');

      const { fetchFile } = await import('@ffmpeg/util');

      // 각 프레임 파일 write
      for (let i = 0; i < frames.length; i++) {
        const name = `frame_${String(i).padStart(4, '0')}.png`;
        await ffmpeg.writeFile(name, await fetchFile(frames[i].file));
      }

      // concat demuxer용 파일 작성
      const concatLines = frames
        .map((fr, i) => `file 'frame_${String(i).padStart(4, '0')}.png'\nduration ${fr.delay / 1000}`)
        .join('\n');
      const encoder = new TextEncoder();
      await ffmpeg.writeFile('concat.txt', encoder.encode(concatLines));

      // GIF 인코딩
      await ffmpeg.exec([
        '-f',  'concat',
        '-safe', '0',
        '-i',  'concat.txt',
        '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', loop === 'forever' ? '0' : '1',
        'output.gif',
      ]);

      const raw  = await ffmpeg.readFile('output.gif') as Uint8Array;
      downloadBlob(new Blob([new Uint8Array(raw)], { type: 'image/gif' }), 'animated.gif');

      // cleanup
      await ffmpeg.deleteFile('concat.txt');
      await ffmpeg.deleteFile('output.gif');
      for (let i = 0; i < frames.length; i++) {
        await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`);
      }

      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const isProcessing = status === 'loading-wasm' || status === 'encoding';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Upload strip */}
      <label className={cn(
        'flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 border-b-2 border-dashed border-border px-4 bg-card hover:bg-muted/60 transition-colors',
        isProcessing && 'cursor-not-allowed opacity-60',
      )}>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
          onChange={handleFiles} disabled={isProcessing} />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          +
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{frames.length === 0 ? t('empty') : `${frames.length}프레임`}</span>
          <span className="text-[11px] text-muted-foreground">{t('uploadHint')}</span>
        </div>
      </label>

      {frames.length > 0 ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* Frame list */}
          <div className="flex flex-col gap-2">
            {frames.map((fr, idx) => (
              <div key={fr.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <img src={fr.previewUrl} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                <span className="flex-1 truncate text-xs text-foreground">{fr.file.name}</span>
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-muted-foreground">{t('delay')}</label>
                  <input
                    type="number" min={50} max={5000} step={50} value={fr.delay}
                    onChange={(e) => setDelay(fr.id, Number(e.target.value))}
                    className="w-16 rounded border border-border bg-background px-1 py-0.5 text-xs text-center"
                  />
                </div>
                <button onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === frames.length - 1}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowDown size={12} />
                </button>
                <button onClick={() => remove(fr.id)}
                  className="rounded p-1 text-muted-foreground hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Loop */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">{t('loop')}</label>
            <div className="flex gap-2">
              {(['forever', 'once'] as const).map((l) => (
                <button key={l} onClick={() => setLoop(l)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    loop === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}>
                  {l === 'forever' ? t('loopForever') : t('loopOnce')}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">ffmpeg.wasm 로딩 중...</span>
            </div>
          )}
          {status === 'encoding' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{t('generating')} {progress}%</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && <p className="text-xs text-green-600 dark:text-green-400">{t('done')}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleGenerate} disabled={isProcessing || frames.length === 0}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
              !isProcessing && frames.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {isProcessing && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
            {isProcessing ? t('generating') : t('generate')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep GifEditor
```
Expected: 출력 없음

- [ ] **Step 3: commit**

```bash
git add src/components/convert/tools/GifEditorTool.tsx
git commit -m "feat(phase5): add GifEditorTool with ffmpeg palette-based GIF encoding"
```

---

## Task 9: QR/바코드 생성기

**Files:**
- Create: `src/components/convert/tools/QrBarcodeTool.tsx`

qrcode 패키지로 QR 코드, jsbarcode 패키지로 바코드 생성. PNG/SVG 다운로드.

- [ ] **Step 1: QrBarcodeTool.tsx 생성**

```tsx
// src/components/convert/tools/QrBarcodeTool.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Tab = 'qr' | 'barcode';
type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'CODE39';

const BARCODE_FORMATS: BarcodeFormat[] = ['CODE128', 'EAN13', 'EAN8', 'UPC', 'ITF14', 'CODE39'];

export function QrBarcodeTool() {
  const t = useTranslations('convert.qrBarcode');

  const [tab,           setTab]           = useState<Tab>('qr');
  const [input,         setInput]         = useState('https://example.com');
  const [fgColor,       setFgColor]       = useState('#000000');
  const [bgColor,       setBgColor]       = useState('#ffffff');
  const [size,          setSize]          = useState(256);
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');
  const [qrDataUrl,     setQrDataUrl]     = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const svgRef    = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QR 코드 생성
  useEffect(() => {
    if (tab !== 'qr' || !input.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(input, {
          width: size,
          color: { dark: fgColor, light: bgColor },
          margin: 2,
        });
        if (!cancelled) {
          setQrDataUrl(url);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [tab, input, fgColor, bgColor, size]);

  // 바코드 생성
  useEffect(() => {
    if (tab !== 'barcode' || !input.trim() || !svgRef.current) return;
    (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default;
        JsBarcode(svgRef.current!, input, {
          format:     barcodeFormat,
          lineColor:  fgColor,
          background: bgColor,
          width:      2,
          height:     80,
          displayValue: true,
          fontSize:   14,
        });
        setError(null);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [tab, input, fgColor, bgColor, barcodeFormat]);

  const downloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href     = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const downloadBarcodePng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const canvas  = canvasRef.current!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: 'image/svg+xml' });
    const url     = URL.createObjectURL(blob);
    const img     = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a');
        a.href     = URL.createObjectURL(b);
        a.download = 'barcode.png';
        a.click();
      }, 'image/png');
    };
    img.src = url;
  };

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'barcode.svg';
    a.click();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
      {/* Tab selector */}
      <div className="flex gap-2">
        {(['qr', 'barcode'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === tb ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}>
            {tb === 'qr' ? t('tabQr') : t('tabBarcode')}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('inputLabel')}</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tab === 'qr' ? t('inputPlaceholderQr') : t('inputPlaceholderBarcode')}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
      </div>

      {/* Barcode format selector */}
      {tab === 'barcode' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('barcodeFormat')}</label>
          <select value={barcodeFormat} onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary">
            {BARCODE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}

      {/* Size (QR only) */}
      {tab === 'qr' && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground w-16">{t('size')}</label>
          <input type="range" min={128} max={512} step={32} value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="text-xs text-muted-foreground w-16">{size}px</span>
        </div>
      )}

      {/* Colors */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('fgColor')}</label>
          <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('bgColor')}</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview */}
      <div className="flex justify-center rounded-lg border border-border bg-card p-4">
        {tab === 'qr' && qrDataUrl && (
          <img src={qrDataUrl} alt="QR Code" className="max-w-full" style={{ imageRendering: 'pixelated' }} />
        )}
        {tab === 'barcode' && (
          <svg ref={svgRef} />
        )}
      </div>
      {/* Hidden canvas for PNG export of barcode */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Download buttons */}
      <div className="flex gap-2">
        <button
          onClick={tab === 'qr' ? downloadQrPng : downloadBarcodePng}
          disabled={!!error || !input.trim()}
          className={cn(
            'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
            !error && input.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
          )}>
          {t('downloadPng')}
        </button>
        {tab === 'barcode' && (
          <button
            onClick={downloadSvg}
            disabled={!!error || !input.trim()}
            className={cn(
              'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
              !error && input.trim()
                ? 'bg-muted text-foreground hover:bg-muted/80 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {t('downloadSvg')}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep QrBarcode
```
Expected: 출력 없음

- [ ] **Step 3: commit**

```bash
git add src/components/convert/tools/QrBarcodeTool.tsx
git commit -m "feat(phase5): add QrBarcodeTool with qrcode and jsbarcode"
```

---

## Task 10: 오디오 변환 도구

**Files:**
- Create: `src/components/convert/tools/AudioTool.tsx`

MP3/WAV/OGG/FLAC 간 변환. @ffmpeg/ffmpeg 재활용. Web Audio API로 파형 시각화.

- [ ] **Step 1: AudioTool.tsx 생성**

```tsx
// src/components/convert/tools/AudioTool.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getFFmpeg } from '@/lib/ffmpegLoader';

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac';
type Status      = 'idle' | 'loading-wasm' | 'converting' | 'done' | 'error';

const FORMATS: AudioFormat[] = ['mp3', 'wav', 'ogg', 'flac'];

export function AudioTool() {
  const t = useTranslations('convert.audio');

  const [file,         setFile]         = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('mp3');
  const [status,       setStatus]       = useState<Status>('idle');
  const [progress,     setProgress]     = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setStatus('idle');
    setError(null);
    setProgress(0);
    drawWaveform(f);
  }, []);

  const drawWaveform = async (f: File) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const arrayBuffer = await f.arrayBuffer();
      const audioCtx    = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();

      const data    = audioBuffer.getChannelData(0);
      const ctx     = canvas.getContext('2d')!;
      const W       = canvas.width;
      const H       = canvas.height;
      const step    = Math.ceil(data.length / W);
      const mid     = H / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary').trim() || '#0a84ff';
      ctx.lineWidth   = 1;
      ctx.beginPath();

      for (let x = 0; x < W; x++) {
        let min = 1, max = -1;
        for (let s = 0; s < step; s++) {
          const v = data[x * step + s] ?? 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        ctx.moveTo(x, mid + min * mid);
        ctx.lineTo(x, mid + max * mid);
      }
      ctx.stroke();
    } catch {
      // 오디오 디코드 실패 (일부 포맷 미지원)
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);

    try {
      setStatus('loading-wasm');
      const ffmpeg = await getFFmpeg((p) => setProgress(Math.round(p * 100)));
      setStatus('converting');

      const { fetchFile } = await import('@ffmpeg/util');
      const ext       = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      const inputName = `input.${ext}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const ffmpegArgs: string[] = ['-i', inputName];
      if (outputFormat === 'mp3') {
        ffmpegArgs.push('-codec:a', 'libmp3lame', '-q:a', '2');
      } else if (outputFormat === 'ogg') {
        ffmpegArgs.push('-codec:a', 'libvorbis', '-q:a', '4');
      } else if (outputFormat === 'flac') {
        ffmpegArgs.push('-codec:a', 'flac');
      }
      // wav: no extra flags needed
      ffmpegArgs.push(outputName);

      await ffmpeg.exec(ffmpegArgs);

      const raw  = await ffmpeg.readFile(outputName) as Uint8Array;
      const mime = outputFormat === 'mp3' ? 'audio/mpeg'
                 : outputFormat === 'wav' ? 'audio/wav'
                 : outputFormat === 'ogg' ? 'audio/ogg'
                 : 'audio/flac';
      downloadBlob(
        new Blob([new Uint8Array(raw)], { type: mime }),
        file.name.replace(/\.[^.]+$/, `.${outputFormat}`),
      );

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const isProcessing = status === 'loading-wasm' || status === 'converting';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{
          'audio/mpeg':  ['.mp3'],
          'audio/wav':   ['.wav'],
          'audio/ogg':   ['.ogg'],
          'audio/flac':  ['.flac'],
          'audio/x-flac': ['.flac'],
        }}
        formatHint={t('uploadHint')}
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          {/* Waveform */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('waveform')}</p>
            <canvas
              ref={canvasRef}
              width={600}
              height={80}
              className="w-full rounded-lg border border-border bg-muted/30"
            />
          </div>

          {/* Output format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('outputFormat')}</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button key={f} onClick={() => setOutputFormat(f)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                    outputFormat === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">{t('loadingWasm')}</span>
            </div>
          )}
          {status === 'converting' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{t('converting', { pct: progress })}</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && <p className="text-xs text-green-600 dark:text-green-400">{t('done')}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleConvert} disabled={isProcessing}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
              !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}>
            {isProcessing && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
            {isProcessing ? t('converting', { pct: progress }) : `${outputFormat.toUpperCase()}로 변환`}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | grep AudioTool
```
Expected: 출력 없음

- [ ] **Step 3: commit**

```bash
git add src/components/convert/tools/AudioTool.tsx
git commit -m "feat(phase5): add AudioTool with ffmpeg conversion and waveform visualization"
```

---

## Task 11: 모든 도구 연결 (Wire-up)

**Files:**
- Modify: `src/components/image/BottomActionBar.tsx` — AI Upscale, BG Replace, Image→PDF 버튼 추가
- Modify: `src/components/convert/ConvertPage.tsx` — 3개 신규 도구 컴포넌트 연결
- Modify: `src/components/convert/ConvertToolSelector.tsx` — 3개 신규 mode 버튼 추가

### 11a: BottomActionBar 업데이트

- [ ] **Step 1: BottomActionBar.tsx - import 추가**

기존 import 블록에 추가:
```typescript
import { AiUpscaleTool }    from './tools/AiUpscaleTool';
import { BgReplaceTool }    from './tools/BgReplaceTool';
import { ImageToPdfTool }   from './tools/ImageToPdfTool';
import { Sparkles, Image }  from 'lucide-react';
```

- [ ] **Step 2: BottomActionBar.tsx - state 추가**

기존 `const [showBgRemove, setShowBgRemove] = useState(false);` 다음에 추가:
```typescript
const [showAiUpscale,  setShowAiUpscale]  = useState(false);
const [showBgReplace,  setShowBgReplace]  = useState(false);
const [showImgToPdf,   setShowImgToPdf]   = useState(false);
```

- [ ] **Step 3: BottomActionBar.tsx - Desktop toolbar에 버튼 추가**

기존 BG Remove 버튼 바로 앞에 새 버튼 3개 추가 (desktop toolbar의 `ml-auto` div 안):
```tsx
<button
  onClick={() => setShowAiUpscale(true)}
  disabled={!hasSelection}
  className={cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
  )}
>
  <Sparkles size={14} className="flex-shrink-0" />
  {t('aiUpscale')}
</button>
<button
  onClick={() => setShowBgReplace(true)}
  disabled={!hasSelection}
  className={cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
  )}
>
  <Image size={14} className="flex-shrink-0" />
  {t('bgReplace')}
</button>
```

- [ ] **Step 4: BottomActionBar.tsx - Mobile toolbar에 버튼 추가 (Mobile용 BG Remove 버튼 뒤)**

Mobile toolbar 안 기존 BG Remove 버튼 뒤에 추가:
```tsx
<button
  onClick={() => setShowAiUpscale(true)}
  disabled={!hasSelection}
  title={t('aiUpscale')}
  className={cn(
    'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'opacity-35 text-muted-foreground cursor-not-allowed',
  )}
>
  <Sparkles size={14} />
</button>
<button
  onClick={() => setShowBgReplace(true)}
  disabled={!hasSelection}
  title={t('bgReplace')}
  className={cn(
    'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'opacity-35 text-muted-foreground cursor-not-allowed',
  )}
>
  <Image size={14} />
</button>
```

- [ ] **Step 5: BottomActionBar.tsx - ImageToPdfTool을 기존 PDF 버튼과 교체**

기존 `handleExportAsPdf` 함수와 PDF 버튼을 삭제하고, PDF 버튼을 `setShowImgToPdf(true)` 를 호출하는 버튼으로 교체:

Desktop toolbar의 기존 PDF 버튼:
```tsx
<button
  onClick={handleExportAsPdf}
  disabled={!hasSelection || isExportingPdf}
  className={...}
>
  <FileText size={14} className="flex-shrink-0" />
  {isExportingPdf ? tFile('exportingPdf') : tFile('exportAsPdf')}
</button>
```
다음으로 교체:
```tsx
<button
  onClick={() => setShowImgToPdf(true)}
  disabled={!hasSelection}
  className={cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
  )}
>
  <FileText size={14} className="flex-shrink-0" />
  {tFile('exportAsPdf')}
</button>
```

Mobile toolbar의 PDF 버튼도 동일하게 교체:
```tsx
<button
  onClick={() => setShowImgToPdf(true)}
  disabled={!hasSelection}
  title={tFile('exportAsPdf')}
  className={cn(
    'flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
  )}
>
  <FileText size={12} className="flex-shrink-0" />
  PDF
</button>
```

`isExportingPdf` state와 `tFile` 의존도가 사라지므로 관련 코드 정리:
- `const [isExportingPdf, setIsExportingPdf] = useState(false);` 삭제
- `const tFile = useTranslations('file.convert');` 삭제 (mobile에서만 쓰였다면 확인 후 삭제)
- `handleExportAsPdf` 함수 삭제

- [ ] **Step 6: BottomActionBar.tsx - modal 렌더링 추가**

파일 맨 끝 `{showBgRemove && <BgRemoveTool onClose={...} />}` 다음에 추가:
```tsx
{showAiUpscale  && <AiUpscaleTool  onClose={() => setShowAiUpscale(false)}  />}
{showBgReplace  && <BgReplaceTool  onClose={() => setShowBgReplace(false)}  />}
{showImgToPdf   && <ImageToPdfTool onClose={() => setShowImgToPdf(false)}   />}
```

### 11b: ConvertPage 업데이트

- [ ] **Step 7: ConvertPage.tsx 수정**

기존 import에 추가:
```typescript
import { GifEditorTool }  from './tools/GifEditorTool';
import { QrBarcodeTool }  from './tools/QrBarcodeTool';
import { AudioTool }      from './tools/AudioTool';
```

기존 조건부 렌더링에 추가:
```tsx
{activeTool === 'gif-editor'  && <GifEditorTool />}
{activeTool === 'qr-barcode'  && <QrBarcodeTool />}
{activeTool === 'audio'       && <AudioTool />}
```

### 11c: ConvertToolSelector 업데이트

- [ ] **Step 8: ConvertToolSelector.tsx 수정**

import에 아이콘 추가:
```typescript
import { Layers, MonitorSmartphone, Palette, Clapperboard, ScanText, Gif, QrCode, Music } from 'lucide-react';
```

`TOOLS` 배열에 3개 추가:
```typescript
{ mode: 'gif-editor', icon: <Gif size={14} />,    labelKey: 'gifEditor' },
{ mode: 'qr-barcode', icon: <QrCode size={14} />, labelKey: 'qrBarcode' },
{ mode: 'audio',      icon: <Music size={14} />,  labelKey: 'audio' },
```

> 참고: lucide-react 에 `Gif` 아이콘이 없을 수 있음. 없으면 `Film` 또는 `ImagePlay` 아이콘으로 대체:
```typescript
import { Film, QrCode, Music } from 'lucide-react';
{ mode: 'gif-editor', icon: <Film size={14} />,   labelKey: 'gifEditor' },
```

- [ ] **Step 9: TypeScript 확인**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: 에러 없음

- [ ] **Step 10: commit**

```bash
git add src/components/image/BottomActionBar.tsx \
        src/components/convert/ConvertPage.tsx \
        src/components/convert/ConvertToolSelector.tsx
git commit -m "feat(phase5): wire up all 6 new tools to image and convert tabs"
```

---

## Task 12: 빌드 검증

**Files:**
- 없음 (빌드만 실행)

- [ ] **Step 1: 전체 빌드 실행**

```bash
npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully` 또는 `Route (app) | Size | First Load JS` 섹션이 나옴. 에러 없음.

- [ ] **Step 2: 빌드 에러 있으면 수정**

타입 에러나 import 에러 발생 시:
```bash
npx tsc --noEmit 2>&1
```
로 에러 위치 확인 후 수정.

- [ ] **Step 3: 최종 commit**

```bash
git add -A
git commit -m "feat(phase5): Phase 5 complete - AI upscale, BG replace, Image→PDF, GIF editor, QR/barcode, audio convert"
```

---

## Self-Review

### 스펙 커버리지 체크

| 스펙 요구사항 | 구현 Task |
|---|---|
| AI 업스케일링 (onnxruntime-web + Real-ESRGAN 2x/4x, lazy load, 프로그레스 UI) | Task 4, 5 |
| 배경 교체 (BgRemoveTool 확장, 단색/그라데이션/이미지, Canvas API) | Task 6 |
| 이미지→PDF (A4/Letter/원본, 여백, pdf-lib) | Task 7 |
| 애니메이션 GIF 에디터 (프레임 업로드, 순서 조정, 프레임별 지연시간, GIF 출력, @ffmpeg/ffmpeg) | Task 8 |
| QR/바코드 생성기 (qrcode, jsbarcode, 색상/크기, PNG/SVG) | Task 9 |
| 오디오 변환 (MP3/WAV/OGG/FLAC, 파형 시각화, @ffmpeg/ffmpeg) | Task 10 |
| 클라이언트사이드만 | ✅ 모든 처리 브라우저 내 |
| i18n (en/ko) | Task 3 |
| npm run build 확인 | Task 12 |

### 타입 일관성
- `ConvertToolMode`에 `'gif-editor' | 'qr-barcode' | 'audio'` 추가 (Task 2)
- `ConvertPage`/`ConvertToolSelector` 에서 동일 문자열 사용 (Task 11b, 11c)
- `BgReplaceMode` 타입은 `bgReplace.ts`에서 export, `BgReplaceTool.tsx`에서 import ✅
- `upscaleImage` 시그니처: `(file: File, scale: 2 | 4, onProgress?) => Promise<Blob>` ✅
- `replaceBackground` 시그니처: `(subjectFile: File, opts: BgReplaceOptions, onProgress?) => Promise<Blob>` ✅
- `imagesToPdf` 시그니처: `(files: File[], pageSize, marginPt?: number) => Promise<Uint8Array>` — 기본값 0으로 기존 호출 코드(`BottomActionBar`의 기존 버튼) 호환 ✅
