# Phase 1 — 이미지 탭 강화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 탭에 EXIF 제거, 리사이즈, 워터마크, AI 배경 제거 4가지 기능 추가

**Architecture:** 기존 `rotateImageBlob` 다운로드 파이프라인을 확장해 resize·watermark를 처리하고, `ImageFile` 타입에 각 기능의 설정값을 저장한다. AI 배경 제거는 `@imgly/background-removal`(WebAssembly)로 처리 후 `previewUrl`을 교체하는 방식으로 동작한다.

**Tech Stack:** Canvas API, `@imgly/background-removal` (WebAssembly), Next.js 16, TypeScript, next-intl

> **스코프 노트:** 이 계획은 스펙의 Phase 1만 다룬다. Phase 2(PDF 탭), Phase 3(신규 카테고리), Phase 4(UX 개선)는 별도 계획으로 작성해야 한다.

---

## 파일 구조

**신규 생성:**
- `src/lib/imageResize.ts` — 리사이즈 canvas 로직 (`computeTargetDimensions`, `applyTextWatermark`)
- `src/components/image/editor/ExifSection.tsx` — EXIF 제거 토글 UI
- `src/components/image/editor/ResizeSection.tsx` — 리사이즈 설정 UI
- `src/components/image/editor/WatermarkSection.tsx` — 워터마크 설정 UI
- `src/components/image/tools/BgRemoveTool.tsx` — AI 배경 제거 작업 UI

**수정:**
- `src/lib/types.ts` — `ResizeData`, `WatermarkConfig`, `WatermarkPosition` 추가; `ImageFile`·`AppContextType` 확장
- `src/lib/imageRotation.ts` — `rotateImageBlob`에 `resizeData`, `watermark` 파라미터 추가
- `src/context/AppContext.tsx` — 새 액션 3개 추가, `downloadAsZip` 조건 확장
- `src/components/image/EditDrawer.tsx` — 새 섹션 3개 통합
- `src/components/image/BottomActionBar.tsx` — BG Remove 버튼 추가
- `src/messages/en.json` + `src/messages/ko.json` — 새 i18n 키 추가

---

## Task 1: types.ts — 새 인터페이스 추가

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: `ImageFile`에 새 필드와 인터페이스 추가**

`src/lib/types.ts`의 `ImageFile` 인터페이스 위에 다음 타입을 추가하고, `ImageFile`을 확장:

```typescript
export interface ResizeData {
  width: number;    // px 또는 % 값 (UI에서 lockAspect 반영 후 저장)
  height: number;
  unit: 'px' | '%';
  lockAspect: boolean;
}

export type WatermarkPosition =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkConfig {
  text: string;
  fontSize: number;   // 12–120
  color: string;      // CSS hex e.g. '#ffffff'
  opacity: number;    // 0.0–1.0
  position: WatermarkPosition;
  repeat: boolean;
}
```

`ImageFile` 인터페이스에 다음 필드를 추가:
```typescript
export interface ImageFile {
  id:               string;
  file:             File;
  previewUrl:       string;
  rotation:         number;
  flipped:          boolean;
  colorAdjustment?: ColorAdjustment;
  cropData?:        CropData;
  // ↓ Phase 1 신규
  stripExif?:       boolean;
  resizeData?:      ResizeData;
  watermark?:       WatermarkConfig;
}
```

`AppContextType`에 다음 액션을 추가:
```typescript
export interface AppContextType {
  // ... 기존 필드 유지 ...
  applyResizeToSelected:      (resize: ResizeData | undefined) => void;
  applyWatermarkToSelected:   (watermark: WatermarkConfig | undefined) => void;
  toggleStripExifOnSelected:  () => void;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit
```

Expected: 에러 없음 (AppContext.tsx에서 새 액션이 없어 에러가 나면 Step 3에서 해결됨 — AppContext.tsx 수정이 아직 안 됐으므로 타입 에러는 무시)

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): ResizeData, WatermarkConfig, WatermarkPosition 추가; ImageFile·AppContextType 확장"
```

---

## Task 2: imageRotation.ts — 다운로드 파이프라인에 resize·watermark 추가

**Files:**
- Modify: `src/lib/imageRotation.ts`

- [ ] **Step 1: 파일 상단 import 및 헬퍼 함수 추가**

`src/lib/imageRotation.ts` 전체를 아래로 교체:

```typescript
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
    case 'left':   x = padding;               align = 'left';   break;
    case 'right':  x = canvas.width - padding; align = 'right';  break;
    default:       x = canvas.width / 2;       align = 'center'; break;
  }
  switch (vPos) {
    case 'top':    y = padding + textH / 2;              break;
    case 'bottom': y = canvas.height - padding - textH / 2; break;
    default:       y = canvas.height / 2;                 break;
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
    // 대각선 45° 타일 패턴
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
      // 크롭 소스 영역 계산
      const srcX = cropData ? cropData.x      * img.naturalWidth  : 0;
      const srcY = cropData ? cropData.y      * img.naturalHeight : 0;
      const srcW = cropData ? cropData.width  * img.naturalWidth  : img.naturalWidth;
      const srcH = cropData ? cropData.height * img.naturalHeight : img.naturalHeight;

      // 회전각도 (fine rotation + coarse rotation 합산)
      const totalDeg = degrees + (cropData?.rotation ?? 0);
      const rad    = (totalDeg * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));

      // 기본 캔버스 (회전 후 크기)
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
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/lib/imageRotation.ts
git commit -m "feat(imageRotation): resize·watermark 파이프라인 추가; EXIF 자동 제거 (Canvas 재인코딩)"
```

---

## Task 3: AppContext — 새 액션 추가 및 downloadAsZip 조건 확장

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: import에 새 타입 추가**

`src/context/AppContext.tsx` 상단 import를 수정:

```typescript
import type { ImageFile, AppContextType, ColorAdjustment, CropData, OutputFormat, ResizeData, WatermarkConfig } from '../lib/types';
```

- [ ] **Step 2: 새 액션 3개 추가**

`clearSelection` 콜백 다음에 삽입:

```typescript
  const applyResizeToSelected = useCallback((resize: ResizeData | undefined) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, resizeData: resize } : img
      )
    );
  }, [selectedIds]);

  const applyWatermarkToSelected = useCallback((watermark: WatermarkConfig | undefined) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, watermark } : img
      )
    );
  }, [selectedIds]);

  const toggleStripExifOnSelected = useCallback(() => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, stripExif: !img.stripExif } : img
      )
    );
  }, [selectedIds]);
```

- [ ] **Step 3: `downloadAsZip`의 `needsProcessing` 조건 확장**

기존:
```typescript
const needsProcessing =
  img.rotation !== 0 ||
  img.flipped ||
  outputFormat !== 'original' ||
  cssFilter !== undefined ||
  img.cropData !== undefined;
```

교체:
```typescript
const needsProcessing =
  img.rotation !== 0 ||
  img.flipped ||
  outputFormat !== 'original' ||
  cssFilter !== undefined ||
  img.cropData !== undefined ||
  img.stripExif === true ||
  img.resizeData !== undefined ||
  img.watermark !== undefined;
```

- [ ] **Step 4: `rotateImageBlob` 호출에 새 인자 추가**

기존 `rotateImageBlob(img.previewUrl, img.rotation, ...)` 호출을:

```typescript
const blob = needsProcessing
  ? await rotateImageBlob(
      img.previewUrl,
      img.rotation,
      img.flipped,
      targetMime,
      quality / 100,
      cssFilter,
      img.cropData,
      img.resizeData,
      img.watermark,
    )
  : img.file;
```

- [ ] **Step 5: Context.Provider value에 새 액션 추가**

`<AppContext.Provider value={{ ... }}>` 블록에 추가:

```typescript
applyResizeToSelected,
applyWatermarkToSelected,
toggleStripExifOnSelected,
```

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 7: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat(AppContext): resize·watermark·EXIF strip 액션 추가; downloadAsZip 파이프라인 확장"
```

---

## Task 4: EXIF Section UI 및 i18n

**Files:**
- Create: `src/components/image/editor/ExifSection.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"editDrawer"` 객체 안에 추가:

```json
"exifSection": "Privacy",
"exifStrip": "Remove EXIF Metadata",
"exifStripHint": "Strips GPS location, camera model, and author info from all selected images on export."
```

- [ ] **Step 2: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"editDrawer"` 객체 안에 추가:

```json
"exifSection": "개인정보",
"exifStrip": "EXIF 메타데이터 제거",
"exifStripHint": "저장 시 선택한 이미지의 GPS 위치, 카메라 기종, 작성자 정보를 제거합니다."
```

- [ ] **Step 3: ExifSection 컴포넌트 작성**

`src/components/image/editor/ExifSection.tsx` 생성:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ExifSection({ enabled, onChange }: Props) {
  const t = useTranslations('editDrawer');

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <p className="mb-3 text-[11px] uppercase tracking-widest text-[#555]">
        {t('exifSection')}
      </p>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
          enabled
            ? 'bg-[#1a3a2a] border border-[#2a5a3a]'
            : 'bg-[#2c2c2e] border border-transparent hover:bg-[#3a3a3c]',
        )}
      >
        <ShieldCheck
          size={16}
          className={enabled ? 'text-[#30d158]' : 'text-[#888]'}
        />
        <div className="flex-1 min-w-0">
          <p className={cn('text-[13px] font-medium', enabled ? 'text-[#30d158]' : 'text-[#ddd]')}>
            {t('exifStrip')}
          </p>
          <p className="mt-0.5 text-[11px] text-[#666] leading-snug">
            {t('exifStripHint')}
          </p>
        </div>
        {/* Toggle pill */}
        <div
          className={cn(
            'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors',
            enabled ? 'bg-[#30d158]' : 'bg-[#3a3a3c]',
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </div>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/components/image/editor/ExifSection.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(ExifSection): EXIF 메타데이터 제거 토글 UI 추가"
```

---

## Task 5: Resize Section UI 및 i18n

**Files:**
- Create: `src/components/image/editor/ResizeSection.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"editDrawer"` 객체 안에 추가:

```json
"resizeSection": "Resize",
"resizeWidth": "Width",
"resizeHeight": "Height",
"resizePx": "px",
"resizePercent": "%",
"resizeLockAspect": "Lock aspect ratio",
"resizeApply": "Apply Resize",
"resizeClear": "Clear",
"resizeHint": "Applied on export. Original file is not modified."
```

- [ ] **Step 2: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"editDrawer"` 객체 안에 추가:

```json
"resizeSection": "리사이즈",
"resizeWidth": "가로",
"resizeHeight": "세로",
"resizePx": "px",
"resizePercent": "%",
"resizeLockAspect": "비율 잠금",
"resizeApply": "리사이즈 적용",
"resizeClear": "초기화",
"resizeHint": "저장 시 적용됩니다. 원본 파일은 변경되지 않습니다."
```

- [ ] **Step 3: ResizeSection 컴포넌트 작성**

`src/components/image/editor/ResizeSection.tsx` 생성:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResizeData } from '@/lib/types';

interface Props {
  resizeData: ResizeData | undefined;
  previewWidth: number;   // px — 원본 이미지 자연 너비
  previewHeight: number;  // px
  onChange: (resize: ResizeData | undefined) => void;
}

export function ResizeSection({ resizeData, previewWidth, previewHeight, onChange }: Props) {
  const t = useTranslations('editDrawer');
  const [unit, setUnit]           = useState<'px' | '%'>(resizeData?.unit ?? 'px');
  const [lockAspect, setLockAspect] = useState(resizeData?.lockAspect ?? true);
  const [width, setWidth]         = useState<string>(
    resizeData ? String(resizeData.width) : String(previewWidth),
  );
  const [height, setHeight]       = useState<string>(
    resizeData ? String(resizeData.height) : String(previewHeight),
  );

  // unit 전환 시 값 재계산
  useEffect(() => {
    if (unit === '%') {
      setWidth('100');
      setHeight('100');
    } else {
      setWidth(String(previewWidth));
      setHeight(String(previewHeight));
    }
  }, [unit, previewWidth, previewHeight]);

  const aspectRatio = previewWidth > 0 ? previewHeight / previewWidth : 1;

  const handleWidthChange = (val: string) => {
    setWidth(val);
    if (lockAspect) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        setHeight(String(Math.round(n * aspectRatio)));
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    if (lockAspect) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        setWidth(String(Math.round(n / aspectRatio)));
      }
    }
  };

  const handleApply = () => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    onChange({ width: w, height: h, unit, lockAspect });
  };

  const handleClear = () => {
    onChange(undefined);
    setUnit('px');
    setLockAspect(true);
    setWidth(String(previewWidth));
    setHeight(String(previewHeight));
  };

  const isApplied = resizeData !== undefined;

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-[#555]">
          {t('resizeSection')}
        </p>
        {isApplied && (
          <span className="text-[10px] font-medium text-[#0a84ff]">
            {resizeData!.width}{resizeData!.unit} × {resizeData!.height}{resizeData!.unit}
          </span>
        )}
      </div>

      {/* Unit toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-[#2c2c2e] p-0.5">
        {(['px', '%'] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={cn(
              'flex-1 rounded-md py-1 text-xs font-medium transition-colors',
              unit === u
                ? 'bg-[#3a3a3c] text-white'
                : 'text-[#888] hover:text-[#ccc]',
            )}
          >
            {u === 'px' ? t('resizePx') : t('resizePercent')}
          </button>
        ))}
      </div>

      {/* Width / Height inputs */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-[#666]">{t('resizeWidth')}</label>
          <input
            type="number"
            min="1"
            max={unit === '%' ? 1000 : 10000}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>

        {/* Lock button */}
        <button
          onClick={() => setLockAspect((v) => !v)}
          title={t('resizeLockAspect')}
          className="mt-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#2c2c2e] text-[#888] hover:text-[#ccc] transition-colors"
        >
          {lockAspect ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-[#666]">{t('resizeHeight')}</label>
          <input
            type="number"
            min="1"
            max={unit === '%' ? 1000 : 10000}
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>
      </div>

      <p className="mb-3 text-[10px] text-[#555]">{t('resizeHint')}</p>

      {/* Action buttons */}
      <div className="flex gap-2">
        {isApplied && (
          <button
            onClick={handleClear}
            className="rounded-lg bg-[#2c2c2e] px-3 py-2 text-[12px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('resizeClear')}
          </button>
        )}
        <button
          onClick={handleApply}
          className="flex-1 rounded-lg bg-[#0a84ff] py-2 text-[12px] font-semibold text-white hover:bg-[#0070d0] transition-colors"
        >
          {t('resizeApply')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/components/image/editor/ResizeSection.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(ResizeSection): 이미지 리사이즈 UI (px/% 단위, 비율 잠금)"
```

---

## Task 6: Watermark Section UI 및 i18n

**Files:**
- Create: `src/components/image/editor/WatermarkSection.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"editDrawer"` 객체 안에 추가:

```json
"watermarkSection": "Watermark",
"watermarkText": "Text",
"watermarkTextPlaceholder": "e.g. © 2026 MyBrand",
"watermarkFontSize": "Size",
"watermarkColor": "Color",
"watermarkOpacity": "Opacity",
"watermarkPosition": "Position",
"watermarkRepeat": "Repeat pattern",
"watermarkApply": "Apply Watermark",
"watermarkClear": "Remove"
```

- [ ] **Step 2: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"editDrawer"` 객체 안에 추가:

```json
"watermarkSection": "워터마크",
"watermarkText": "텍스트",
"watermarkTextPlaceholder": "예: © 2026 MyBrand",
"watermarkFontSize": "크기",
"watermarkColor": "색상",
"watermarkOpacity": "불투명도",
"watermarkPosition": "위치",
"watermarkRepeat": "반복 패턴",
"watermarkApply": "워터마크 적용",
"watermarkClear": "제거"
```

- [ ] **Step 3: WatermarkSection 컴포넌트 작성**

`src/components/image/editor/WatermarkSection.tsx` 생성:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WatermarkConfig, WatermarkPosition } from '@/lib/types';

const POSITIONS: WatermarkPosition[] = [
  'top-left',    'top-center',    'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

interface Props {
  watermark: WatermarkConfig | undefined;
  onChange: (watermark: WatermarkConfig | undefined) => void;
}

const DEFAULT: WatermarkConfig = {
  text:     '',
  fontSize: 36,
  color:    '#ffffff',
  opacity:  0.5,
  position: 'bottom-right',
  repeat:   false,
};

export function WatermarkSection({ watermark, onChange }: Props) {
  const t = useTranslations('editDrawer');
  const [draft, setDraft] = useState<WatermarkConfig>(watermark ?? { ...DEFAULT });
  const isApplied = watermark !== undefined;

  const update = (partial: Partial<WatermarkConfig>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const handleApply = () => {
    if (!draft.text.trim()) return;
    onChange({ ...draft });
  };

  const handleClear = () => {
    onChange(undefined);
    setDraft({ ...DEFAULT });
  };

  return (
    <div className="px-5 py-4 border-t border-[#2a2a2c]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-[#555]">
          {t('watermarkSection')}
        </p>
        {isApplied && (
          <span className="text-[10px] font-medium text-[#0a84ff]">ON</span>
        )}
      </div>

      {/* Text input */}
      <div className="mb-3">
        <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkText')}</label>
        <input
          type="text"
          value={draft.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={t('watermarkTextPlaceholder')}
          className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-3 py-2 text-xs text-white placeholder:text-[#555] outline-none focus:border-[#0a84ff]"
        />
      </div>

      {/* Font size + Color row */}
      <div className="mb-3 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkFontSize')}</label>
          <input
            type="number"
            min={12}
            max={120}
            value={draft.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) || 36 })}
            className="w-full rounded-md border border-[#3a3a3c] bg-[#2c2c2e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0a84ff]"
          />
        </div>
        <div className="flex-shrink-0">
          <label className="mb-1 block text-[10px] text-[#666]">{t('watermarkColor')}</label>
          <input
            type="color"
            value={draft.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-[30px] w-[52px] cursor-pointer rounded-md border border-[#3a3a3c] bg-[#2c2c2e] p-0.5"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[10px] text-[#666]">{t('watermarkOpacity')}</label>
          <span className="text-[10px] font-mono text-[#888]">
            {Math.round(draft.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(draft.opacity * 100)}
          onChange={(e) => update({ opacity: parseInt(e.target.value, 10) / 100 })}
          className="w-full h-1 rounded-lg bg-[#3a3a3c] appearance-none cursor-pointer accent-[#0a84ff]"
        />
      </div>

      {/* Position grid */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] text-[#666]">{t('watermarkPosition')}</label>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => update({ position: pos })}
              className={cn(
                'h-7 rounded-md border text-[10px] transition-colors',
                draft.position === pos
                  ? 'border-[#0a84ff] bg-[#0a84ff]/20 text-[#0a84ff]'
                  : 'border-[#3a3a3c] bg-[#2c2c2e] text-[#666] hover:border-[#555]',
              )}
            >
              {pos.split('-').map((s) => s[0].toUpperCase()).join('')}
            </button>
          ))}
        </div>
      </div>

      {/* Repeat toggle */}
      <button
        onClick={() => update({ repeat: !draft.repeat })}
        className={cn(
          'mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition-colors',
          draft.repeat
            ? 'border-[#0a84ff]/40 bg-[#0a84ff]/10'
            : 'border-[#3a3a3c] bg-[#2c2c2e] hover:bg-[#3a3a3c]',
        )}
      >
        <span className={cn('text-[12px]', draft.repeat ? 'text-[#0a84ff]' : 'text-[#aaa]')}>
          {t('watermarkRepeat')}
        </span>
        <div className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          draft.repeat ? 'bg-[#0a84ff]' : 'bg-[#3a3a3c]',
        )}>
          <div className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            draft.repeat ? 'translate-x-4' : 'translate-x-0.5',
          )} />
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex gap-2">
        {isApplied && (
          <button
            onClick={handleClear}
            className="rounded-lg bg-[#2c2c2e] px-3 py-2 text-[12px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            {t('watermarkClear')}
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={!draft.text.trim()}
          className={cn(
            'flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors',
            draft.text.trim()
              ? 'bg-[#0a84ff] text-white hover:bg-[#0070d0]'
              : 'bg-[#2c2c2e] text-[#555] cursor-not-allowed',
          )}
        >
          {t('watermarkApply')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/components/image/editor/WatermarkSection.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(WatermarkSection): 텍스트 워터마크 UI (위치·불투명도·반복 패턴)"
```

---

## Task 7: EditDrawer에 새 섹션 통합

**Files:**
- Modify: `src/components/image/EditDrawer.tsx`

- [ ] **Step 1: 새 섹션 import 추가**

`src/components/image/EditDrawer.tsx` 상단 import에 추가:

```typescript
import { ExifSection }      from './editor/ExifSection';
import { ResizeSection }    from './editor/ResizeSection';
import { WatermarkSection } from './editor/WatermarkSection';
```

- [ ] **Step 2: AppContext에서 새 액션 구조분해**

`useAppContext()` 호출부에 다음 추가:

```typescript
const {
  images,
  selectedIds,
  savedAdjustments,
  recentAdjustments,
  applyEditToSelected,
  saveAdjustment,
  applyResizeToSelected,
  applyWatermarkToSelected,
  toggleStripExifOnSelected,
} = useAppContext();
```

- [ ] **Step 3: 섹션 렌더링 추가**

EditDrawer의 스크롤 영역 (`<div className="flex-1 overflow-y-auto">`) 안, `<AdjustSection />` 바로 다음에 삽입:

```typescript
          {/* EXIF Section */}
          <ExifSection
            enabled={previewImage.stripExif ?? false}
            onChange={toggleStripExifOnSelected}
          />

          {/* Resize Section */}
          <ResizeSection
            resizeData={previewImage.resizeData}
            previewWidth={imgRef.current?.naturalWidth ?? 1920}
            previewHeight={imgRef.current?.naturalHeight ?? 1080}
            onChange={applyResizeToSelected}
          />

          {/* Watermark Section */}
          <WatermarkSection
            watermark={previewImage.watermark}
            onChange={applyWatermarkToSelected}
          />
```

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 브라우저 수동 확인**

```bash
npm run dev
```

1. 이미지 1장 업로드 → 선택 → Edit 버튼 클릭
2. 드로어 하단에 "개인정보 / EXIF", "리사이즈", "워터마크" 섹션이 보이는지 확인
3. EXIF 토글 ON → Done → ZIP 다운로드 → 이미지 메타데이터 확인 (Mac: 파일 정보 → EXIF 없음)
4. 리사이즈 400px × 400px 입력 → Apply → ZIP 다운로드 → 이미지 크기 확인
5. 워터마크 텍스트 입력 → Apply → ZIP → 이미지에 워터마크 확인

- [ ] **Step 6: Commit**

```bash
git add src/components/image/EditDrawer.tsx
git commit -m "feat(EditDrawer): EXIF·리사이즈·워터마크 섹션 통합"
```

---

## Task 8: AI 배경 제거 — 라이브러리 및 유틸

**Files:**
- Create: `src/lib/backgroundRemoval.ts`

- [ ] **Step 1: 패키지 설치**

```bash
npm install @imgly/background-removal
```

Expected: `package.json`에 `@imgly/background-removal` 추가됨

- [ ] **Step 2: backgroundRemoval.ts 작성**

`src/lib/backgroundRemoval.ts` 생성:

```typescript
// @imgly/background-removal은 WebAssembly 기반이므로 lazy import 필수
// 최초 호출 시 ~40MB 모델 다운로드

export type BgRemovalProgress = {
  loaded: number;   // 0-100
  total: number;
};

export async function removeBackground(
  imageFile: File,
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<Blob> {
  const { removeBackground: removeBg } = await import('@imgly/background-removal');

  const blob = await removeBg(imageFile, {
    model: 'small',   // 'small' (~40MB) or 'medium' — small이 빠름
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: (key: string, current: number, total: number) => {
      if (onProgress) {
        onProgress({ loaded: Math.round((current / total) * 100), total: 100 });
      }
    },
  });

  return blob;
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (`@imgly/background-removal`에 타입 선언이 없으면 `// @ts-ignore` 추가)

- [ ] **Step 4: Commit**

```bash
git add src/lib/backgroundRemoval.ts package.json package-lock.json
git commit -m "feat(backgroundRemoval): @imgly/background-removal WebAssembly 래퍼 추가"
```

---

## Task 9: AI 배경 제거 UI — BgRemoveTool 및 BottomActionBar

**Files:**
- Create: `src/components/image/tools/BgRemoveTool.tsx`
- Modify: `src/components/image/BottomActionBar.tsx`
- Modify: `src/context/AppContext.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"actionBar"` 객체 안에 추가:

```json
"bgRemove": "Remove BG",
"bgRemoving": "Processing...",
"bgRemoveHint": "AI removes background. First run downloads ~40MB model.",
"bgRemoveDone": "Background removed"
```

- [ ] **Step 2: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"actionBar"` 객체 안에 추가:

```json
"bgRemove": "배경 제거",
"bgRemoving": "처리 중...",
"bgRemoveHint": "AI가 배경을 제거합니다. 최초 실행 시 ~40MB 모델을 다운로드합니다.",
"bgRemoveDone": "배경 제거 완료"
```

- [ ] **Step 3: AppContext에 `replaceImageBlob` 액션 추가**

`src/context/AppContext.tsx`에 새 액션 추가:

타입(`AppContextType`):
```typescript
replaceImageBlob: (id: string, newBlob: Blob, newFileName: string) => void;
```

구현 (AppProvider 내부):
```typescript
  const replaceImageBlob = useCallback((id: string, newBlob: Blob, newFileName: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        URL.revokeObjectURL(img.previewUrl);
        const newFile = new File([newBlob], newFileName, { type: 'image/png' });
        return {
          ...img,
          file: newFile,
          previewUrl: URL.createObjectURL(newBlob),
          // 배경 제거 후에는 기존 편집 설정 초기화
          rotation: 0,
          flipped: false,
          cropData: undefined,
          colorAdjustment: undefined,
          stripExif: undefined,
          resizeData: undefined,
          watermark: undefined,
        };
      })
    );
  }, []);
```

Context Provider value에 추가:
```typescript
replaceImageBlob,
```

- [ ] **Step 4: BgRemoveTool 컴포넌트 작성**

`src/components/image/tools/BgRemoveTool.tsx` 생성:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { removeBackground } from '@/lib/backgroundRemoval';
import { useAppContext } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function BgRemoveTool({ onClose }: Props) {
  const t = useTranslations('actionBar');
  const { images, selectedIds, replaceImageBlob } = useAppContext();
  const [status, setStatus]     = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [current, setCurrent]   = useState(0);
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
        const blob = await removeBackground(img.file, ({ loaded }) => {
          // 전체 진행률: 각 이미지의 로딩 진행률을 균등 배분
          const base = (i / selectedImages.length) * 100;
          const step = (1 / selectedImages.length) * 100;
          setProgress(Math.round(base + (loaded / 100) * step));
        });
        const newName = img.file.name.replace(/\.[^.]+$/, '') + '-nobg.png';
        replaceImageBlob(img.id, blob, newName);
      }
      setStatus('done');
    } catch (err) {
      console.error('BG removal failed:', err);
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, [selectedImages, replaceImageBlob]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[300px] rounded-2xl bg-[#1c1c1e] border border-[#2a2a2c] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Wand2 size={18} className="text-[#0a84ff]" />
          <h2 className="text-[15px] font-semibold text-white">{t('bgRemove')}</h2>
        </div>

        <p className="mb-4 text-[12px] text-[#888] leading-relaxed">{t('bgRemoveHint')}</p>

        {status === 'idle' && (
          <p className="mb-4 text-[12px] text-[#aaa]">
            {selectedImages.length}장 선택됨
          </p>
        )}

        {status === 'loading' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#888]">
              <span>{current}/{selectedImages.length}장 처리 중</span>
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
          <p className="mb-4 text-[12px] text-[#30d158]">{t('bgRemoveDone')}</p>
        )}

        {status === 'error' && (
          <p className="mb-4 text-[12px] text-[#ff453a]">오류: {errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#2c2c2e] py-2.5 text-[13px] text-[#aaa] hover:bg-[#3a3a3c] transition-colors"
          >
            닫기
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
              시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: BottomActionBar에 BG Remove 버튼 추가**

`src/components/image/BottomActionBar.tsx`에 다음을 추가:

import에 추가:
```typescript
import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { BgRemoveTool } from './tools/BgRemoveTool';
```

`BottomActionBar` 컴포넌트 내부 state 추가:
```typescript
const [showBgRemove, setShowBgRemove] = useState(false);
```

데스크탑 툴바의 PDF Export 버튼 바로 앞에 BG Remove 버튼 추가:
```typescript
          <button
            onClick={() => setShowBgRemove(true)}
            disabled={!hasSelection}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
              hasSelection
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
            )}
          >
            <Wand2 size={14} className="flex-shrink-0" />
            {t('bgRemove')}
          </button>
```

컴포넌트 return의 Fragment(`<>`) 닫기 전에 추가:
```typescript
      {showBgRemove && <BgRemoveTool onClose={() => setShowBgRemove(false)} />}
```

모바일 툴바에도 동일 버튼 추가 (Download 버튼 앞):
```typescript
        {/* BG Remove */}
        <button
          onClick={() => setShowBgRemove(true)}
          disabled={!hasSelection}
          title={t('bgRemove')}
          className={cn(
            'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
            hasSelection
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'opacity-35 text-muted-foreground cursor-not-allowed',
          )}
        >
          <Wand2 size={14} />
        </button>
```

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 7: 브라우저 수동 확인**

```bash
npm run dev
```

1. 이미지 1장 업로드 → 선택 → "배경 제거" 버튼 클릭
2. 모달 표시, "시작" 클릭 → 최초 실행 시 모델 다운로드 진행률 표시 확인
3. 완료 후 이미지 갤러리에서 배경이 제거된 PNG 미리보기 확인
4. ZIP 다운로드 → PNG 파일 확인

- [ ] **Step 8: Commit**

```bash
git add src/lib/backgroundRemoval.ts src/components/image/tools/BgRemoveTool.tsx src/components/image/BottomActionBar.tsx src/context/AppContext.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(BgRemove): AI 배경 제거 기능 추가 (@imgly/background-removal WebAssembly)"
```

---

## 최종 검증

- [ ] **빌드 검증**

```bash
npm run build
```

Expected: Build succeeded, 에러 없음

- [ ] **기능 체크리스트**

| 기능 | 확인 방법 | 예상 결과 |
|------|---------|---------|
| EXIF 제거 | Edit → EXIF 토글 ON → ZIP → 파일 정보 확인 | GPS·카메라 정보 없음 |
| 리사이즈 400×300 | Edit → Resize 400×300px → Apply → ZIP | 이미지 크기 400×300 |
| 리사이즈 50% | Edit → Resize 50% → Apply → ZIP | 원본의 절반 크기 |
| 비율 잠금 | Width 변경 → Height 자동 계산 | 비율 유지됨 |
| 워터마크 텍스트 | Edit → Watermark "© 2026" → Apply → ZIP | 워터마크 표시됨 |
| 워터마크 반복 | repeat 토글 → Apply → ZIP | 전체 이미지에 반복됨 |
| AI 배경 제거 | 인물 사진 선택 → 배경 제거 | 투명 배경 PNG |
| 일괄 적용 | 이미지 3장 선택 → 각 기능 → ZIP | 3장 모두 적용됨 |

- [ ] **최종 Commit**

```bash
git add .
git commit -m "feat: Phase 1 이미지 탭 강화 완료 (EXIF 제거·리사이즈·워터마크·AI 배경 제거)"
```
