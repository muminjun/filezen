# Edit Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 filezen UI를 유지한 채, BottomActionBar에 편집 버튼을 추가하고, 우측 슬라이드인 EditDrawer에서 크롭 설정과 색상 조정(14개 파라미터)을 한 화면에서 처리한다.

**Architecture:** CSS filter를 사용해 미리보기와 Canvas export가 동일한 결과를 내도록 한다. 각 ImageFile에 `colorAdjustment?`, `cropData?` 메타값을 저장하며, 다운로드 시 기존 `rotateImageBlob`을 확장해 반영한다. 즐겨찾기는 localStorage + 쿠키에 저장한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, next-intl, Lucide React, AppContext (전역 상태)

---

## File Map

| 작업 | 파일 |
|------|------|
| 신규 | `src/lib/colorAdjustment.ts` |
| 신규 | `src/hooks/useEditDrawer.ts` |
| 신규 | `src/hooks/useSavedAdjustments.ts` |
| 신규 | `src/components/image/editor/CropSection.tsx` |
| 신규 | `src/components/image/editor/AdjustSection.tsx` |
| 신규 | `src/components/image/EditDrawer.tsx` |
| 수정 | `src/lib/types.ts` |
| 수정 | `src/context/AppContext.tsx` |
| 수정 | `src/lib/imageRotation.ts` |
| 수정 | `src/components/image/BottomActionBar.tsx` |
| 수정 | `src/components/image/ImagePage.tsx` |
| 수정 | `src/messages/en.json` |
| 수정 | `src/messages/ko.json` |

---

## Task 1: 타입 정의 추가

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: types.ts에 새 인터페이스 추가**

기존 파일 끝에 다음을 추가한다. `ImageFile`에 두 개의 optional 필드도 추가한다.

```typescript
// src/lib/types.ts 전체 교체

export interface ColorAdjustment {
  exposure:   number; // -100 ~ 100
  brilliance: number; // -100 ~ 100
  highlights: number; // -100 ~ 0
  shadows:    number; //    0 ~ 100
  contrast:   number; // -100 ~ 100
  brightness: number; // -100 ~ 100
  blackpoint: number; //    0 ~ 100
  saturation: number; // -100 ~ 100
  vibrance:   number; // -100 ~ 100
  warmth:     number; // -100 ~ 100
  tint:       number; // -100 ~ 100
  sharpness:  number; //    0 ~ 100
  noise:      number; //    0 ~ 100
  vignette:   number; //    0 ~ 100
}

export interface CropData {
  x:           number;       // 0.0 ~ 1.0 (비율)
  y:           number;
  width:       number;
  height:      number;
  rotation:    number;       // -45 ~ 45
  aspectRatio: string | null; // '4:3', '16:9', null(자유)
}

export interface SavedAdjustment {
  id:         string;
  name:       string;
  adjustment: ColorAdjustment;
  createdAt:  number;
}

export interface ImageFile {
  id:               string;
  file:             File;
  previewUrl:       string;
  rotation:         number;
  flipped:          boolean;
  colorAdjustment?: ColorAdjustment;
  cropData?:        CropData;
}

export type OutputFormat = 'original' | 'png' | 'jpeg' | 'webp';

export interface AppContextType {
  images:             ImageFile[];
  selectedIds:        Set<string>;
  isDownloading:      boolean;
  outputFormat:       OutputFormat;
  quality:            number;
  savedAdjustments:   SavedAdjustment[];
  recentAdjustments:  ColorAdjustment[];
  addImages:          (files: File[]) => void;
  removeImage:        (id: string) => void;
  removeAllImages:    () => void;
  reorderImages:      (startIndex: number, endIndex: number) => void;
  toggleSelect:       (id: string) => void;
  rangeSelect:        (fromId: string, toId: string) => void;
  selectAll:          () => void;
  clearSelection:     () => void;
  rotateSelected:     (degrees: number) => void;
  flipSelected:       () => void;
  setOutputFormat:    (format: OutputFormat) => void;
  setQuality:         (quality: number) => void;
  downloadAsZip:      () => Promise<void>;
  applyEditToSelected:(edit: { colorAdjustment?: ColorAdjustment; cropData?: CropData }) => void;
  saveAdjustment:     (name: string, adj: ColorAdjustment) => void;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

타입 에러가 나면 `AppContext.tsx`가 아직 업데이트되지 않아서 발생하는 것이므로 Task 4 후 다시 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: add ColorAdjustment, CropData, SavedAdjustment types"
```

---

## Task 2: colorAdjustment 유틸리티

**Files:**
- Create: `src/lib/colorAdjustment.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/lib/colorAdjustment.ts

import type { ColorAdjustment } from './types';

export const DEFAULT_ADJUSTMENT: ColorAdjustment = {
  exposure:   0,
  brilliance: 0,
  highlights: 0,
  shadows:    0,
  contrast:   0,
  brightness: 0,
  blackpoint: 0,
  saturation: 0,
  vibrance:   0,
  warmth:     0,
  tint:       0,
  sharpness:  0,
  noise:      0,
  vignette:   0,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * ColorAdjustment → CSS filter 문자열 변환
 * Canvas ctx.filter에도 동일하게 사용 가능 (미리보기 = 출력 결과 보장)
 */
export function buildCssFilter(adj: ColorAdjustment): string {
  const brightness = 1 + (adj.exposure + adj.brightness) / 100;
  const contrast   = 1 + adj.contrast / 100;
  const saturate   = 1 + (adj.saturation + adj.vibrance * 0.4) / 100;
  const hueRotate  = adj.warmth * 0.3;

  const parts = [
    `brightness(${clamp(brightness, 0.05, 3).toFixed(2)})`,
    `contrast(${clamp(contrast, 0.1, 3).toFixed(2)})`,
    `saturate(${clamp(saturate, 0, 3).toFixed(2)})`,
    hueRotate !== 0 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** 모든 값이 기본값(0)인지 확인 */
export function isDefaultAdjustment(adj: ColorAdjustment): boolean {
  return Object.values(adj).every((v) => v === 0);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/colorAdjustment.ts
git commit -m "feat: add buildCssFilter utility for color adjustment"
```

---

## Task 3: useSavedAdjustments 훅

**Files:**
- Create: `src/hooks/useSavedAdjustments.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/hooks/useSavedAdjustments.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedAdjustment, ColorAdjustment } from '@/lib/types';

const LS_RECENT = 'filezen_recent_adjustments';
const LS_SAVED  = 'filezen_saved_adjustments';
const COOKIE_KEY = 'filezen_saved_adj_ids';
const MAX_RECENT = 5;
const COOKIE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useSavedAdjustments() {
  const [saved, setSaved]   = useState<SavedAdjustment[]>([]);
  const [recent, setRecent] = useState<ColorAdjustment[]>([]);

  // 초기 로드
  useEffect(() => {
    setSaved(loadJson<SavedAdjustment[]>(LS_SAVED, []));
    setRecent(loadJson<ColorAdjustment[]>(LS_RECENT, []));
  }, []);

  /** 즐겨찾기 저장 */
  const saveAdjustment = useCallback((name: string, adjustment: ColorAdjustment) => {
    const entry: SavedAdjustment = {
      id: `adj-${Date.now()}`,
      name,
      adjustment,
      createdAt: Date.now(),
    };
    setSaved((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(LS_SAVED, JSON.stringify(next));
      // 쿠키에 id 목록 저장 (30일)
      setCookie(COOKIE_KEY, next.map((s) => s.id).join(','), COOKIE_DAYS);
      return next;
    });
  }, []);

  /** 최근 사용 자동 저장 */
  const addRecentAdjustment = useCallback((adjustment: ColorAdjustment) => {
    setRecent((prev) => {
      const deduplicated = prev.filter(
        (a) => JSON.stringify(a) !== JSON.stringify(adjustment)
      );
      const next = [adjustment, ...deduplicated].slice(0, MAX_RECENT);
      localStorage.setItem(LS_RECENT, JSON.stringify(next));
      return next;
    });
  }, []);

  /** 즐겨찾기 삭제 */
  const removeSavedAdjustment = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(LS_SAVED, JSON.stringify(next));
      setCookie(COOKIE_KEY, next.map((s) => s.id).join(','), COOKIE_DAYS);
      return next;
    });
  }, []);

  return { saved, recent, saveAdjustment, addRecentAdjustment, removeSavedAdjustment };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useSavedAdjustments.ts
git commit -m "feat: add useSavedAdjustments hook (localStorage + cookie)"
```

---

## Task 4: AppContext 업데이트

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: AppContext에 편집 관련 상태·액션 추가**

`AppContext.tsx` 전체를 다음으로 교체한다:

```typescript
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { rotateImageBlob } from '../lib/imageRotation';
import { MAX_CONCURRENT_PROCESSING } from '../lib/constants';
import { buildCssFilter, isDefaultAdjustment } from '../lib/colorAdjustment';
import { useSavedAdjustments } from '../hooks/useSavedAdjustments';
import type { ImageFile, AppContextType, ColorAdjustment, CropData, OutputFormat } from '../lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

function generateId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [images, setImages]           = useState<ImageFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [outputFormat, setOutputFormat]   = useState<OutputFormat>('original');
  const [quality, setQuality]             = useState(90);

  const {
    saved: savedAdjustments,
    recent: recentAdjustments,
    saveAdjustment,
    addRecentAdjustment,
  } = useSavedAdjustments();

  const addImages = useCallback((files: File[]) => {
    const next: ImageFile[] = files.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      flipped: false,
    }));
    setImages((prev) => [...prev, ...next]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const removeAllImages = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setSelectedIds(new Set());
  }, []);

  const reorderImages = useCallback((startIndex: number, endIndex: number) => {
    setImages((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rangeSelect = useCallback((fromId: string, toId: string) => {
    const fromIdx = images.findIndex((img) => img.id === fromId);
    const toIdx   = images.findIndex((img) => img.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const start   = Math.min(fromIdx, toIdx);
    const end     = Math.max(fromIdx, toIdx);
    const rangeIds = images.slice(start, end + 1).map((img) => img.id);
    setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
  }, [images]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(images.map((img) => img.id)));
  }, [images]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const rotateSelected = useCallback((degrees: number) => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id)
          ? { ...img, rotation: normalizeRotation(img.rotation + degrees) }
          : img
      )
    );
  }, [selectedIds]);

  const flipSelected = useCallback(() => {
    setImages((prev) =>
      prev.map((img) =>
        selectedIds.has(img.id) ? { ...img, flipped: !img.flipped } : img
      )
    );
  }, [selectedIds]);

  /** 선택된 이미지에 편집(크롭 + 색상 조정) 메타값 저장 */
  const applyEditToSelected = useCallback(
    (edit: { colorAdjustment?: ColorAdjustment; cropData?: CropData }) => {
      setImages((prev) =>
        prev.map((img) =>
          selectedIds.has(img.id) ? { ...img, ...edit } : img
        )
      );
      if (edit.colorAdjustment && !isDefaultAdjustment(edit.colorAdjustment)) {
        addRecentAdjustment(edit.colorAdjustment);
      }
    },
    [selectedIds, addRecentAdjustment]
  );

  const downloadAsZip = useCallback(async () => {
    const selected = images.filter((img) => selectedIds.has(img.id));
    if (selected.length === 0) return;

    setIsDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip   = new JSZip();

      for (let i = 0; i < selected.length; i += MAX_CONCURRENT_PROCESSING) {
        const batch = selected.slice(i, i + MAX_CONCURRENT_PROCESSING);
        await Promise.all(
          batch.map(async (img) => {
            const targetMime = outputFormat === 'original'
              ? (img.file.type || 'image/jpeg')
              : `image/${outputFormat}`;

            const cssFilter = img.colorAdjustment && !isDefaultAdjustment(img.colorAdjustment)
              ? buildCssFilter(img.colorAdjustment)
              : undefined;

            const needsProcessing =
              img.rotation !== 0 ||
              img.flipped ||
              outputFormat !== 'original' ||
              cssFilter !== undefined ||
              img.cropData !== undefined;

            const blob = needsProcessing
              ? await rotateImageBlob(
                  img.previewUrl,
                  img.rotation,
                  img.flipped,
                  targetMime,
                  quality / 100,
                  cssFilter,
                  img.cropData,
                )
              : img.file;

            const extension = outputFormat === 'original'
              ? img.file.name.split('.').pop()
              : outputFormat;
            const baseName = img.file.name.replace(/\.[^/.]+$/, '');
            zip.file(`${baseName}.${extension}`, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `filezen-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [images, selectedIds, outputFormat, quality]);

  return (
    <AppContext.Provider
      value={{
        images,
        selectedIds,
        isDownloading,
        outputFormat,
        quality,
        savedAdjustments,
        recentAdjustments,
        addImages,
        removeImage,
        removeAllImages,
        reorderImages,
        toggleSelect,
        rangeSelect,
        selectAll,
        clearSelection,
        rotateSelected,
        flipSelected,
        setOutputFormat,
        setQuality,
        downloadAsZip,
        applyEditToSelected,
        saveAdjustment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: add applyEditToSelected and adjustment state to AppContext"
```

---

## Task 5: imageRotation.ts 확장

**Files:**
- Modify: `src/lib/imageRotation.ts`

- [ ] **Step 1: colorAdjustment + cropData 파라미터 추가**

```typescript
// src/lib/imageRotation.ts 전체 교체

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
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/imageRotation.ts
git commit -m "feat: extend rotateImageBlob with cssFilter and cropData support"
```

---

## Task 6: i18n 키 추가

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: en.json에 editDrawer 섹션 추가**

`"actionBar"` 섹션 뒤에 추가:

```json
"actionBar": {
  "noneSelected": "Select images to rotate",
  "selectedCount": "{count} selected",
  "rotate90": "Rotate 90°",
  "rotate180": "Rotate 180°",
  "rotate270": "Rotate 270°",
  "customAngle": "Custom angle",
  "apply": "Apply",
  "downloadZip": "Save as ZIP",
  "downloading": "Saving...",
  "format": "Format",
  "quality": "Quality",
  "original": "Original",
  "flipHorizontal": "Flip",
  "edit": "Edit",
  "removeSelected": "Remove Selected"
},
"editDrawer": {
  "title": "Edit",
  "bulkLabel": "{count} images · apply to all",
  "singleLabel": "Single image",
  "done": "Done",
  "applyToThis": "Apply to this image",
  "applyToAll": "Apply to {count} images",
  "cropSection": "Crop",
  "adjustSection": "Color Adjustments",
  "rotate90": "Rotate 90°",
  "flipH": "Flip",
  "reset": "Reset",
  "aspectFree": "Free",
  "savePreset": "Save to Favorites",
  "saved": "Saved ✓",
  "recentLabel": "Recent",
  "favoritesLabel": "Favorites",
  "resetAll": "Reset All",
  "params": {
    "exposure": "Exposure",
    "brilliance": "Brilliance",
    "highlights": "Highlights",
    "shadows": "Shadows",
    "contrast": "Contrast",
    "brightness": "Brightness",
    "blackpoint": "Black Point",
    "saturation": "Saturation",
    "vibrance": "Vibrance",
    "warmth": "Warmth",
    "tint": "Tint",
    "sharpness": "Sharpness",
    "noise": "Noise Reduction",
    "vignette": "Vignette"
  },
  "paramRanges": {
    "warmthMin": "Cool",
    "warmthMax": "Warm",
    "tintMin": "Green",
    "tintMax": "Magenta"
  }
}
```

- [ ] **Step 2: ko.json에 editDrawer 섹션 추가**

```json
"actionBar": {
  "noneSelected": "이미지를 선택하세요",
  "selectedCount": "{count}개 선택됨",
  "rotate90": "90° 회전",
  "rotate180": "180° 회전",
  "rotate270": "270° 회전",
  "customAngle": "각도 입력",
  "apply": "적용",
  "downloadZip": "ZIP 저장",
  "downloading": "저장 중...",
  "format": "포맷",
  "quality": "품질",
  "original": "원본 유지",
  "flipHorizontal": "좌우반전",
  "edit": "편집",
  "removeSelected": "선택 삭제"
},
"editDrawer": {
  "title": "편집",
  "bulkLabel": "{count}장 · 동일 적용",
  "singleLabel": "단일 이미지",
  "done": "완료",
  "applyToThis": "이 이미지에만 적용",
  "applyToAll": "{count}장 모두에 적용",
  "cropSection": "크롭",
  "adjustSection": "색상 조정",
  "rotate90": "90° 회전",
  "flipH": "좌우반전",
  "reset": "초기화",
  "aspectFree": "자유",
  "savePreset": "즐겨찾기에 저장",
  "saved": "저장됨 ✓",
  "recentLabel": "최근 사용",
  "favoritesLabel": "즐겨찾기",
  "resetAll": "전체 초기화",
  "params": {
    "exposure": "노출",
    "brilliance": "생동감",
    "highlights": "하이라이트",
    "shadows": "어두운 영역",
    "contrast": "대비",
    "brightness": "밝기",
    "blackpoint": "검정점",
    "saturation": "채도",
    "vibrance": "활기",
    "warmth": "따뜻함",
    "tint": "색조",
    "sharpness": "선명도",
    "noise": "노이즈 감소",
    "vignette": "비네팅"
  },
  "paramRanges": {
    "warmthMin": "차갑게",
    "warmthMax": "따뜻하게",
    "tintMin": "녹색",
    "tintMax": "자홍색"
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/messages/en.json src/messages/ko.json
git commit -m "feat: add editDrawer i18n keys (en + ko)"
```

---

## Task 7: useEditDrawer 훅

**Files:**
- Create: `src/hooks/useEditDrawer.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/hooks/useEditDrawer.ts
'use client';

import { useState, useCallback } from 'react';

export function useEditDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useEditDrawer.ts
git commit -m "feat: add useEditDrawer hook"
```

---

## Task 8: CropSection 컴포넌트

**Files:**
- Create: `src/components/image/editor/CropSection.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/image/editor/CropSection.tsx
'use client';

import { useTranslations } from 'next-intl';
import { RotateCw, FlipHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CropData } from '@/lib/types';

const ASPECT_RATIOS: Array<{ label: string; value: string | null; w: number; h: number }> = [
  { label: 'aspectFree', value: null,   w: 20, h: 20 },
  { label: '1:1',        value: '1:1',  w: 20, h: 20 },
  { label: '4:3',        value: '4:3',  w: 24, h: 18 },
  { label: '3:4',        value: '3:4',  w: 18, h: 24 },
  { label: '16:9',       value: '16:9', w: 28, h: 16 },
  { label: '9:16',       value: '9:16', w: 16, h: 28 },
];

interface Props {
  cropData:    CropData;
  onChange:    (data: Partial<CropData>) => void;
  previewUrl:  string;
}

export function CropSection({ cropData, onChange, previewUrl }: Props) {
  const t = useTranslations('editDrawer');

  // CSS transform으로 크롭 영역 시각화 (실제 픽셀 처리 없음)
  const cropStyle: React.CSSProperties = {
    transform: `rotate(${cropData.rotation}deg)`,
    backgroundImage: `url(${previewUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: `${-cropData.x * 100}% ${-cropData.y * 100}%`,
  };

  return (
    <div className="flex flex-col">
      {/* 이미지 + 크롭 오버레이 */}
      <div className="flex items-center justify-center bg-black px-5 py-5">
        <div className="relative" style={{ width: 260, height: 195 }}>
          <div className="absolute inset-0 rounded-sm" style={cropStyle} />
          {/* 3×3 그리드 */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/20" />
            ))}
          </div>
          {/* 크롭 경계선 */}
          <div className="pointer-events-none absolute inset-0 border border-white/80" />
          {/* 모서리 핸들 */}
          {(['tl','tr','bl','br'] as const).map((pos) => (
            <div
              key={pos}
              className={cn(
                'absolute h-5 w-5 border-white border-solid',
                pos === 'tl' && '-left-px -top-px border-l-[3px] border-t-[3px]',
                pos === 'tr' && '-right-px -top-px border-r-[3px] border-t-[3px]',
                pos === 'bl' && '-bottom-px -left-px border-b-[3px] border-l-[3px]',
                pos === 'br' && '-bottom-px -right-px border-b-[3px] border-r-[3px]',
              )}
            />
          ))}
        </div>
      </div>

      {/* 각도 룰러 */}
      <div className="bg-black px-5 pb-3 pt-1">
        <p className="mb-1 text-center text-[11px] text-[#0a84ff]">
          {cropData.rotation === 0 ? '0°' : `${cropData.rotation > 0 ? '+' : ''}${cropData.rotation}°`}
          <span className="ml-1.5 text-[#3a3a3c]">{t('cropSection')}</span>
        </p>
        <input
          type="range"
          min="-45"
          max="45"
          value={cropData.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full cursor-pointer accent-[#0a84ff]"
          style={{ height: 3 }}
        />
        <div className="mt-1 flex justify-between text-[9px] text-[#444]">
          <span>-45°</span><span>-30°</span><span>-15°</span>
          <span className="text-[#0a84ff]">0°</span>
          <span>15°</span><span>30°</span><span>45°</span>
        </div>
      </div>

      {/* 크롭 버튼 + 비율 */}
      <div className="flex items-center justify-between border-t border-[#1a1a1c] bg-black px-5 py-2.5">
        {/* 회전/반전/초기화 */}
        <div className="flex gap-1.5">
          {[
            { icon: <RotateCw size={14} />, label: t('rotate90'),  action: () => onChange({ rotation: ((cropData.rotation + 90) % 360) as number }) },
            { icon: <FlipHorizontal size={14} />, label: t('flipH'), action: () => {} },
            { icon: <RotateCcw size={14} />, label: t('reset'),    action: () => onChange({ rotation: 0, x: 0, y: 0, width: 1, height: 1, aspectRatio: null }) },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2c2c2e] text-white transition-colors hover:bg-[#3a3a3c]">
                {icon}
              </div>
              <span className="text-[9px] text-[#666]">{label}</span>
            </button>
          ))}
        </div>

        {/* 비율 프리셋 */}
        <div className="flex items-end gap-1.5">
          {ASPECT_RATIOS.map(({ label, value, w, h }) => (
            <button
              key={label}
              onClick={() => onChange({ aspectRatio: value })}
              className={cn(
                'flex flex-col items-center gap-1 cursor-pointer transition-opacity',
                cropData.aspectRatio === value ? 'opacity-100' : 'opacity-40'
              )}
            >
              <div
                className={cn(
                  'border-[1.5px] rounded-[2px]',
                  cropData.aspectRatio === value ? 'border-[#0a84ff]' : 'border-[#777]'
                )}
                style={{ width: w, height: h }}
              />
              <span className={cn(
                'text-[9px]',
                cropData.aspectRatio === value ? 'text-[#0a84ff]' : 'text-[#777]'
              )}>
                {value ?? t('aspectFree')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 디렉터리 확인 후 커밋**

```bash
mkdir -p /Users/minjun/Documents/filezen/src/components/image/editor
git add src/components/image/editor/CropSection.tsx
git commit -m "feat: add CropSection component"
```

---

## Task 9: AdjustSection 컴포넌트

**Files:**
- Create: `src/components/image/editor/AdjustSection.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/image/editor/AdjustSection.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { buildCssFilter, DEFAULT_ADJUSTMENT } from '@/lib/colorAdjustment';
import type { ColorAdjustment, SavedAdjustment } from '@/lib/types';

type ParamKey = keyof ColorAdjustment;

interface ParamConfig {
  key:   ParamKey;
  min:   number;
  max:   number;
  icon:  string;
  iconBg: string;
  iconColor: string;
}

const PARAM_CONFIGS: ParamConfig[] = [
  { key: 'exposure',   min: -100, max: 100, icon: '☀️', iconBg: '#2c2c2e', iconColor: '#fff'    },
  { key: 'brilliance', min: -100, max: 100, icon: '✦',  iconBg: '#3a2a1a', iconColor: '#ffaa44' },
  { key: 'highlights', min: -100, max: 0,   icon: '◑',  iconBg: '#3a3a1a', iconColor: '#ffdd44' },
  { key: 'shadows',    min: 0,    max: 100, icon: '◐',  iconBg: '#1a1a3a', iconColor: '#6688ff' },
  { key: 'contrast',   min: -100, max: 100, icon: '◈',  iconBg: '#2a2a2a', iconColor: '#ccc'    },
  { key: 'brightness', min: -100, max: 100, icon: '○',  iconBg: '#3a3518', iconColor: '#ffee88' },
  { key: 'blackpoint', min: 0,    max: 100, icon: '●',  iconBg: '#181818', iconColor: '#888'    },
  { key: 'saturation', min: -100, max: 100, icon: '❋',  iconBg: '#2a1a3a', iconColor: '#bb66ff' },
  { key: 'vibrance',   min: -100, max: 100, icon: '⬡',  iconBg: '#1a3a2a', iconColor: '#44ffaa' },
  { key: 'warmth',     min: -100, max: 100, icon: '⬥',  iconBg: '#3a2010', iconColor: '#ff7733' },
  { key: 'tint',       min: -100, max: 100, icon: '⬦',  iconBg: '#102a1a', iconColor: '#44bb88' },
  { key: 'sharpness',  min: 0,    max: 100, icon: '◇',  iconBg: '#1a2a3a', iconColor: '#88ccff' },
  { key: 'noise',      min: 0,    max: 100, icon: '≋',  iconBg: '#2a2a1a', iconColor: '#aaaa66' },
  { key: 'vignette',   min: 0,    max: 100, icon: '◎',  iconBg: '#111',    iconColor: '#999'    },
];

interface Props {
  adjustment:       ColorAdjustment;
  onChange:         (adj: ColorAdjustment) => void;
  previewUrl:       string;
  savedAdjustments: SavedAdjustment[];
  recentAdjustments: ColorAdjustment[];
  onSavePreset:     (name: string) => void;
}

export function AdjustSection({
  adjustment,
  onChange,
  previewUrl,
  savedAdjustments,
  recentAdjustments,
  onSavePreset,
}: Props) {
  const t = useTranslations('editDrawer');
  const [selectedParam, setSelectedParam] = useState<ParamKey>('exposure');
  const [saveLabel, setSaveLabel]         = useState<string>(t('savePreset'));

  const current = PARAM_CONFIGS.find((c) => c.key === selectedParam)!;
  const value   = adjustment[selectedParam];

  const handleSliderChange = useCallback((v: number) => {
    onChange({ ...adjustment, [selectedParam]: v });
  }, [adjustment, selectedParam, onChange]);

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_ADJUSTMENT });
  }, [onChange]);

  const handleSave = useCallback(() => {
    const name = window.prompt(t('savePreset'), t('savePreset'));
    if (!name) return;
    onSavePreset(name);
    setSaveLabel(t('saved'));
    setTimeout(() => setSaveLabel(t('savePreset')), 1500);
  }, [onSavePreset, t]);

  // 슬라이더 track 채우기 계산
  const fillStyle = useCallback((min: number, max: number, val: number): React.CSSProperties => {
    const range = max - min;
    if (min < 0) {
      const center = (-min) / range * 100;
      const pos    = (val - min) / range * 100;
      const lo     = Math.min(center, pos);
      const hi     = Math.max(center, pos);
      return val === 0
        ? { background: '#3a3a3c' }
        : { background: `linear-gradient(to right,#3a3a3c ${lo}%,#0a84ff ${lo}%,#0a84ff ${hi}%,#3a3a3c ${hi}%)` };
    }
    const pos = (val - min) / range * 100;
    return { background: pos > 0 ? `linear-gradient(to right,#0a84ff ${pos}%,#3a3a3c ${pos}%)` : '#3a3a3c' };
  }, []);

  const cssFilter = buildCssFilter(adjustment);

  return (
    <div className="flex flex-col">
      {/* 이미지 미리보기 */}
      <div className="flex items-center justify-center bg-black px-5 py-5">
        <div
          className="h-[195px] w-[260px] rounded"
          style={{
            backgroundImage:    `url(${previewUrl})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center',
            filter:             cssFilter || undefined,
          }}
        />
      </div>

      {/* 선택된 파라미터 + 큰 슬라이더 */}
      <div className="bg-[#1c1c1e] px-5 py-3">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-white">
            {t(`params.${selectedParam}`)}
          </span>
          <span className="text-[22px] font-light tabular-nums text-[#0a84ff]">
            {value > 0 ? `+${value}` : value}
          </span>
        </div>
        <div className="relative flex h-7 items-center">
          {current.min < 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-[#3a3a3c]" />
          )}
          <input
            type="range"
            min={current.min}
            max={current.max}
            value={value}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="relative z-10 h-1 w-full cursor-pointer appearance-none rounded-full"
            style={fillStyle(current.min, current.max, value)}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-[#444]">
          {selectedParam === 'warmth' ? (
            <><span>{t('paramRanges.warmthMin')}</span><span>{t('paramRanges.warmthMax')}</span></>
          ) : selectedParam === 'tint' ? (
            <><span>{t('paramRanges.tintMin')}</span><span>{t('paramRanges.tintMax')}</span></>
          ) : (
            <><span>{current.min}</span><span>{current.min < 0 ? `+${current.max}` : `+${current.max}`}</span></>
          )}
        </div>
      </div>

      {/* 아이콘 스트립 */}
      <div className="border-t border-[#2a2a2c] bg-[#1c1c1e]">
        <div className="flex overflow-x-auto pb-2 pt-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {PARAM_CONFIGS.map(({ key, icon, iconBg, iconColor }) => {
            const isTouched = adjustment[key] !== 0;
            const isSel     = key === selectedParam;
            return (
              <button
                key={key}
                onClick={() => setSelectedParam(key)}
                className={cn(
                  'flex flex-shrink-0 flex-col items-center gap-1 rounded-[10px] px-2 py-1.5 transition-colors',
                  isSel ? 'bg-[#2c2c2e]' : 'bg-transparent'
                )}
              >
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-transform',
                    isSel && 'scale-110'
                  )}
                  style={{ background: iconBg, color: iconColor }}
                >
                  {icon}
                  {isTouched && (
                    <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#0a84ff]" />
                  )}
                </div>
                <span className={cn(
                  'whitespace-nowrap text-[9px]',
                  isSel ? 'font-semibold text-[#0a84ff]' : 'text-[#666]'
                )}>
                  {t(`params.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 즐겨찾기 저장 / 최근 / 즐겨찾기 */}
      <div className="border-t border-[#2a2a2c] bg-[#1c1c1e] px-5 py-3">
        <button
          onClick={handleSave}
          className="mb-3 w-full rounded-[9px] border border-[#0a84ff33] py-2 text-xs text-[#0a84ff] transition-colors hover:bg-[#0a84ff18]"
        >
          {saveLabel}
        </button>

        {recentAdjustments.length > 0 && (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#555]">
              {t('recentLabel')}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {recentAdjustments.map((adj, i) => (
                <button
                  key={i}
                  onClick={() => onChange(adj)}
                  className="rounded-[10px] border border-[#3a3a3c] bg-[#2c2c2e] px-2.5 py-1 text-[11px] text-[#bbb] transition-colors hover:border-[#0a84ff] hover:text-[#0a84ff]"
                >
                  {t('recentLabel')} {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {savedAdjustments.length > 0 && (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#555]">
              {t('favoritesLabel')}
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {savedAdjustments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange(s.adjustment)}
                  className="rounded-[10px] border border-[#3a3a3c] bg-[#2c2c2e] px-2.5 py-1 text-[11px] text-[#bbb] transition-colors hover:border-[#0a84ff] hover:text-[#0a84ff]"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleReset}
          className="rounded-[10px] border border-[#ff453a33] px-2.5 py-1 text-[11px] text-[#ff453a] transition-colors hover:border-[#ff453a] hover:bg-[#ff453a18]"
        >
          {t('resetAll')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/image/editor/AdjustSection.tsx
git commit -m "feat: add AdjustSection component with 14-param iOS-style sliders"
```

---

## Task 10: EditDrawer 컨테이너

**Files:**
- Create: `src/components/image/EditDrawer.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/image/EditDrawer.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_ADJUSTMENT } from '@/lib/colorAdjustment';
import { CropSection } from './editor/CropSection';
import { AdjustSection } from './editor/AdjustSection';
import type { ColorAdjustment, CropData } from '@/lib/types';

const DEFAULT_CROP: CropData = {
  x: 0, y: 0, width: 1, height: 1,
  rotation: 0,
  aspectRatio: null,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EditDrawer({ isOpen, onClose }: Props) {
  const t = useTranslations('editDrawer');
  const {
    images,
    selectedIds,
    savedAdjustments,
    recentAdjustments,
    applyEditToSelected,
    saveAdjustment,
  } = useAppContext();

  const selectedImages = images.filter((img) => selectedIds.has(img.id));
  const previewImage   = selectedImages[0];

  // 로컬 편집 상태 (완료/적용 전까지 AppContext에 반영 안 됨)
  const [adjustment, setAdjustment] = useState<ColorAdjustment>(
    previewImage?.colorAdjustment ?? { ...DEFAULT_ADJUSTMENT }
  );
  const [cropData, setCropData] = useState<CropData>(
    previewImage?.cropData ?? { ...DEFAULT_CROP }
  );

  const handleCropChange = useCallback((data: Partial<CropData>) => {
    setCropData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleAdjustChange = useCallback((adj: ColorAdjustment) => {
    setAdjustment(adj);
  }, []);

  const handleApply = useCallback((single: boolean) => {
    if (single) {
      // 첫 번째 선택 이미지에만 적용
      if (!previewImage) return;
      applyEditToSelected({ colorAdjustment: adjustment, cropData });
    } else {
      applyEditToSelected({ colorAdjustment: adjustment, cropData });
    }
    onClose();
  }, [adjustment, cropData, previewImage, applyEditToSelected, onClose]);

  if (!previewImage) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 right-0 top-0 z-50 flex w-[380px] flex-col',
          'border-l border-[#2a2a2c] bg-[#1c1c1e]',
          'shadow-[−20px_0_60px_rgba(0,0,0,0.7)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center border-b border-[#2a2a2c] px-5 py-3.5">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2c2c2e] text-[#aaa] transition-colors hover:bg-[#3a3a3c]"
          >
            <X size={14} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[15px] font-semibold text-white">{t('title')}</p>
            <p className="text-[11px] text-[#f5a623]">
              {selectedIds.size > 1
                ? t('bulkLabel', { count: selectedIds.size })
                : t('singleLabel')}
            </p>
          </div>
          <button
            onClick={() => handleApply(false)}
            className="text-[15px] font-semibold text-[#0a84ff]"
          >
            {t('done')}
          </button>
        </div>

        {/* Bulk thumbnail strip */}
        {selectedImages.length > 1 && (
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#2a2a2c] bg-[#1a1a1c] px-5 py-2.5">
            <span className="text-[11px] text-[#555]">대상</span>
            {selectedImages.slice(0, 6).map((img) => (
              <div
                key={img.id}
                className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border-2 border-transparent first:border-[#0a84ff]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {selectedImages.length > 6 && (
              <span className="text-[11px] text-[#555]">+{selectedImages.length - 6}</span>
            )}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a3a3c transparent' }}>
          <CropSection
            cropData={cropData}
            onChange={handleCropChange}
            previewUrl={previewImage.previewUrl}
          />

          {/* 섹션 구분선 */}
          <div className="flex items-center gap-2 bg-[#1c1c1e] px-5 py-2">
            <div className="h-px flex-1 bg-[#2a2a2c]" />
            <span className="text-[10px] uppercase tracking-widest text-[#444]">
              {t('adjustSection')}
            </span>
            <div className="h-px flex-1 bg-[#2a2a2c]" />
          </div>

          <AdjustSection
            adjustment={adjustment}
            onChange={handleAdjustChange}
            previewUrl={previewImage.previewUrl}
            savedAdjustments={savedAdjustments}
            recentAdjustments={recentAdjustments}
            onSavePreset={(name) => saveAdjustment(name, adjustment)}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 gap-2.5 border-t border-[#2a2a2c] bg-[#1c1c1e] px-5 py-3">
          <button
            onClick={() => handleApply(true)}
            className="flex-1 rounded-[10px] bg-[#2c2c2e] py-3 text-[13px] font-semibold text-[#ddd] transition-opacity active:opacity-75"
          >
            {t('applyToThis')}
          </button>
          <button
            onClick={() => handleApply(false)}
            className="flex-1 rounded-[10px] bg-[#0a84ff] py-3 text-[13px] font-semibold text-white transition-opacity active:opacity-75"
          >
            {t('applyToAll', { count: selectedIds.size })}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/image/EditDrawer.tsx
git commit -m "feat: add EditDrawer component (crop + adjust + bulk apply)"
```

---

## Task 11: BottomActionBar — 편집 버튼 추가

**Files:**
- Modify: `src/components/image/BottomActionBar.tsx`

- [ ] **Step 1: 편집 버튼 추가**

`BottomActionBar.tsx`에서 `flipSelected` 버튼 바로 뒤, 포맷 Select 앞에 구분선 + 편집 버튼을 추가한다.

`useAppContext` import에 변경 없음. Props로 `onEditClick` 추가:

```typescript
// BottomActionBar.tsx 상단 Props 추가
interface Props {
  onEditClick: () => void;
}

export function BottomActionBar({ onEditClick }: Props) {
  // ... 기존 코드 그대로 ...
```

그리고 좌우반전 버튼 바로 뒤 (`<div className="h-5 w-px ... />` 다음)에 추가:

```tsx
<div className="h-5 w-px flex-shrink-0 bg-border" />

<button
  onClick={onEditClick}
  disabled={!hasSelection}
  title={t('edit')}
  className={cn(
    'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
    hasSelection
      ? 'border border-primary/30 text-primary hover:bg-primary/10'
      : 'cursor-not-allowed text-muted-foreground opacity-40'
  )}
>
  ✏️ {t('edit')}
</button>
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/image/BottomActionBar.tsx
git commit -m "feat: add edit button to BottomActionBar"
```

---

## Task 12: ImagePage — EditDrawer 마운트

**Files:**
- Modify: `src/components/image/ImagePage.tsx`

- [ ] **Step 1: EditDrawer 연결**

```typescript
// src/components/image/ImagePage.tsx
'use client';

import { UploadStrip } from './UploadStrip';
import { ImageGallery } from './ImageGallery';
import { BottomActionBar } from './BottomActionBar';
import { EditDrawer } from './EditDrawer';
import { useEditDrawer } from '@/hooks/useEditDrawer';

export function ImagePage() {
  const { isOpen, open, close } = useEditDrawer();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <UploadStrip />
      <ImageGallery />
      <BottomActionBar onEditClick={open} />
      <EditDrawer isOpen={isOpen} onClose={close} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1
```

에러 없으면 다음 단계.

- [ ] **Step 3: lint 확인**

```bash
npm run lint 2>&1 | tail -20
```

- [ ] **Step 4: 최종 커밋**

```bash
git add src/components/image/ImagePage.tsx
git commit -m "feat: mount EditDrawer in ImagePage"
```

---

## Task 13: 통합 확인

- [ ] **Step 1: dev 서버 실행 후 수동 확인**

```bash
npm run dev
```

확인 항목:
1. 갤러리에서 이미지 선택 → BottomActionBar에 **✏️ 편집** 버튼 노출
2. 편집 클릭 → 우측에서 EditDrawer 슬라이드인
3. 크롭 섹션: 각도 룰러 드래그, 비율 프리셋 클릭
4. 조정 섹션: 아이콘 클릭 → 슬라이더 전환, 값 변경 시 미리보기 실시간 반영
5. "즐겨찾기에 저장" → 이름 입력 → 칩 추가
6. "선택된 N장 모두에 적용" → 드로어 닫힘
7. ZIP 다운로드 → 색상 조정 반영된 이미지 확인
8. 선택 없을 때 편집 버튼 비활성 확인

- [ ] **Step 2: 최종 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

`✓ Compiled successfully` 확인.

- [ ] **Step 3: 최종 커밋**

```bash
git add -p  # 빠진 파일 없는지 확인
git commit -m "feat: complete EditDrawer — crop + color adjustment + localStorage"
```
