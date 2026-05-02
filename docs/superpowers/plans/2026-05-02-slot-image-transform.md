# 슬롯 이미지 위치/크기 조정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 포토부스·소셜 프레임의 각 슬롯에 업로드된 이미지를 드래그로 위치 조정하고 스크롤/슬라이더로 확대·축소할 수 있도록 한다.

**Architecture:** `FramePage`에 `slotTransforms: SlotTransform[]` 상태를 별도로 추가하고, `FrameSlot`에 pointer event 기반 드래그·wheel 줌·오버레이 컨트롤을 구현한다. 내보내기는 `frameExport.ts`의 `drawCenterCrop` 대신 transform을 반영하는 `drawTransformedImage`로 교체한다.

**Tech Stack:** React 19, TypeScript, Pointer Events API, CSS transform, Next.js canvas API (no external lib)

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `src/lib/frameTemplates.ts` | `SlotTransform` 타입과 `DEFAULT_TRANSFORM` 상수 추가 |
| `src/components/frame/FrameSlot.tsx` | transform 렌더링 + 드래그/줌/오버레이 인터랙션 전면 개편 |
| `src/components/frame/FramePage.tsx` | `slotTransforms`·`editingSlot` 상태, 핸들러, 동기화 로직 추가 |
| `src/lib/frameExport.ts` | `drawTransformedImage` 함수 추가, `exportFrame` 시그니처 변경 |

---

## Task 1: SlotTransform 타입 및 상수 추가

**Files:**
- Modify: `src/lib/frameTemplates.ts`

- [ ] **Step 1: `SlotTransform` 타입과 `DEFAULT_TRANSFORM` 상수를 파일 상단 인터페이스 블록에 추가**

`src/lib/frameTemplates.ts` 파일의 `SlotDef` 인터페이스 아래에 다음을 추가:

```ts
export type SlotTransform = {
  offsetX: number; // px, 0 = 중앙
  offsetY: number; // px, 0 = 중앙
  scale: number;   // 1.0 = 원본 fit, 최대 3.0
};

export const DEFAULT_TRANSFORM: SlotTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};
```

- [ ] **Step 2: TypeScript 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/frameTemplates.ts
git commit -m "feat: SlotTransform 타입 및 DEFAULT_TRANSFORM 상수 추가"
```

---

## Task 2: FrameSlot — transform 렌더링 + 드래그/줌/오버레이

**Files:**
- Modify: `src/components/frame/FrameSlot.tsx`

현재 FrameSlot은 `<img className="h-full w-full object-cover cursor-pointer" />`로 고정 센터크롭 렌더링. 이를 transform 기반으로 교체하고 드래그·wheel·오버레이를 추가한다.

- [ ] **Step 1: 기존 파일 내용을 아래 코드로 교체**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { SlotDef, SlotTransform } from '@/lib/frameTemplates';
import { DEFAULT_TRANSFORM } from '@/lib/frameTemplates';

interface Props {
  index: number;
  slot: SlotDef;
  file: File | null;
  borderRadius: number;
  transform: SlotTransform;
  isEditing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
  onSwap: (a: number, b: number) => void;
  onTransformChange: (t: SlotTransform) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FrameSlot({
  index,
  slot,
  file,
  borderRadius,
  transform,
  isEditing,
  onFile,
  onClear,
  onSwap,
  onTransformChange,
  onEditStart,
  onEditEnd,
}: Props) {
  const t = useTranslations('frame.slot');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 드래그 추적용 ref (렌더 불필요)
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, moved: false });

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 편집 모드일 때 외부 클릭 감지 → onEditEnd
  useEffect(() => {
    if (!isEditing) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onEditEnd();
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [isEditing, onEditEnd]);

  const getMaxOffset = (scale: number) => {
    if (!containerRef.current) return { maxX: 0, maxY: 0 };
    const { width: slotW, height: slotH } = containerRef.current.getBoundingClientRect();
    return {
      maxX: (slotW * scale - slotW) / 2,
      maxY: (slotH * scale - slotH) / 2,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
    if (!d.moved) return;

    const rawX = d.startOffsetX + dx;
    const rawY = d.startOffsetY + dy;
    const { maxX, maxY } = getMaxOffset(transform.scale);
    onTransformChange({
      ...transform,
      offsetX: clamp(rawX, -maxX, maxX),
      offsetY: clamp(rawY, -maxY, maxY),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d.moved) {
      // 클릭 판정 → 편집 모드 진입
      onEditStart();
    }
    dragRef.current.active = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = clamp(transform.scale + delta, 1.0, 3.0);
    // scale 변경 시 offset도 새 scale 기준으로 재클램핑
    const { maxX, maxY } = getMaxOffset(newScale);
    onTransformChange({
      scale: newScale,
      offsetX: clamp(transform.offsetX, -maxX, maxX),
      offsetY: clamp(transform.offsetY, -maxY, maxY),
    });
  };

  const handleFileDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) onSwap(from, index);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { onFile(f); e.target.value = ''; }
  };

  return (
    <div
      ref={containerRef}
      style={{
        gridColumn: `${slot.col} / span ${slot.colSpan}`,
        gridRow: `${slot.row} / span ${slot.rowSpan}`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
      }}
      className={cn('relative', isDragOver && 'ring-2 ring-primary ring-inset')}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt=""
            draggable
            onDragStart={handleFileDragStart}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{
              transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
              transformOrigin: 'center',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              cursor: 'grab',
              display: 'block',
            }}
          />
          {isEditing && (
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-black/60 px-2 py-1.5"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={transform.scale}
                onChange={(e) => {
                  const newScale = parseFloat(e.target.value);
                  const { maxX, maxY } = getMaxOffset(newScale);
                  onTransformChange({
                    scale: newScale,
                    offsetX: clamp(transform.offsetX, -maxX, maxX),
                    offsetY: clamp(transform.offsetY, -maxY, maxY),
                  });
                }}
                className="h-1 flex-1 accent-white"
              />
              <button
                type="button"
                onClick={() => onTransformChange(DEFAULT_TRANSFORM)}
                className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs text-white hover:bg-white/20"
              >
                {t('reset')}
              </button>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            title={t('remove')}
          >
            <X size={10} />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <Plus size={20} />
          <span className="text-xs">{t('empty')}</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `frame.slot.reset` i18n 키 추가**

`src/messages/ko.json`의 `frame.slot` 객체에 `"reset": "초기화"` 추가:

```json
"slot": {
  "empty": "사진 추가",
  "remove": "사진 삭제",
  "reset": "초기화"
}
```

`src/messages/en.json`의 `frame.slot` 객체에 `"reset": "Reset"` 추가:

```json
"slot": {
  "empty": "Add photo",
  "remove": "Remove photo",
  "reset": "Reset"
}
```

- [ ] **Step 3: TypeScript 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (FrameCanvas/FramePage가 아직 새 props를 주지 않아 에러가 날 수 있음 — Task 3에서 해결)

- [ ] **Step 4: 커밋**

```bash
git add src/components/frame/FrameSlot.tsx src/messages/ko.json src/messages/en.json
git commit -m "feat: FrameSlot — transform 렌더링, 드래그/줌/오버레이 추가"
```

---

## Task 3: FramePage — slotTransforms 상태 및 동기화

**Files:**
- Modify: `src/components/frame/FramePage.tsx`

현재 `FramePage`에는 `slotTransforms`가 없고 `FrameSlot`에 transform props를 전달하지 않는다. `FrameCanvas`를 통해 FrameSlot에 props가 전달되므로 `FrameCanvas`의 중간 전달 경로도 함께 확인한다.

먼저 FrameCanvas 파일을 확인해야 한다:

- [ ] **Step 1: FrameCanvas에 transform props 추가 및 FrameSlot에 전달**

`src/components/frame/FrameCanvas.tsx`를 다음으로 교체:

```tsx
'use client';

import { FrameSlot } from './FrameSlot';
import { getOrientedRatio, DEFAULT_TRANSFORM } from '@/lib/frameTemplates';
import type { Ref } from 'react';
import type { FrameTemplate, FrameOptionsState, SlotTransform } from '@/lib/frameTemplates';

interface Props {
  template: FrameTemplate;
  slotImages: (File | null)[];
  options: FrameOptionsState;
  previewRef?: Ref<HTMLDivElement>;
  slotTransforms: SlotTransform[];
  editingSlot: number | null;
  onSlotImage: (index: number, file: File) => void;
  onSlotClear: (index: number) => void;
  onSlotSwap: (a: number, b: number) => void;
  onTransformChange: (index: number, t: SlotTransform) => void;
  onEditStart: (index: number) => void;
  onEditEnd: () => void;
}

export function FrameCanvas({
  template, slotImages, options, previewRef,
  slotTransforms, editingSlot,
  onSlotImage, onSlotClear, onSlotSwap,
  onTransformChange, onEditStart, onEditEnd,
}: Props) {
  const [ratioW, ratioH] = getOrientedRatio(template, options.orientation);

  const { cols, rows } = template.grid;
  const gap = options.gapSize;

  return (
    <div
      ref={previewRef}
      className="w-full max-w-xs sm:max-w-sm"
      style={{ aspectRatio: `${ratioW} / ${ratioH}` }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          backgroundColor: options.gapColor,
          outline: options.borderWidth > 0
            ? `${options.borderWidth}px solid ${options.borderColor}`
            : undefined,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: `${gap}px`,
          padding: `${gap}px`,
        }}
      >
        {template.slots.map((slot, i) => (
          <FrameSlot
            key={i}
            index={i}
            slot={slot}
            file={slotImages[i] ?? null}
            borderRadius={options.borderRadius}
            transform={slotTransforms[i] ?? DEFAULT_TRANSFORM}
            isEditing={editingSlot === i}
            onFile={(file) => onSlotImage(i, file)}
            onClear={() => onSlotClear(i)}
            onSwap={onSlotSwap}
            onTransformChange={(t) => onTransformChange(i, t)}
            onEditStart={() => onEditStart(i)}
            onEditEnd={onEditEnd}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: FramePage에 slotTransforms 상태 추가**

`src/components/frame/FramePage.tsx`에서:

1. import에 `SlotTransform`, `DEFAULT_TRANSFORM` 추가:

```ts
import {
  FRAME_TEMPLATES,
  DEFAULT_FRAME_OPTIONS,
  getNaturalOrientation,
  getTemplate,
  buildEqualSlots,
  mergeSlots,
  splitSlot,
  DEFAULT_TRANSFORM,
  type FrameTemplate,
  type FrameOptionsState,
  type SlotTransform,
} from '@/lib/frameTemplates';
```

2. 상태 선언 (기존 `slotImages` 선언 바로 아래):

```ts
const [slotTransforms, setSlotTransforms] = useState<SlotTransform[]>(
  () => Array(FRAME_TEMPLATES[0].slots.length).fill(DEFAULT_TRANSFORM),
);
const [editingSlot, setEditingSlot] = useState<number | null>(null);
```

- [ ] **Step 3: 기존 핸들러에 slotTransforms 동기화 추가**

**handleTemplateChange** — 템플릿 변경 시 전체 리셋:

```ts
const handleTemplateChange = (id: string) => {
  const tmpl = getTemplate(id)!;
  setActiveTemplate(structuredClone(tmpl) as FrameTemplate);
  setSlotImages(Array(tmpl.slots.length).fill(null));
  setSlotTransforms(Array(tmpl.slots.length).fill(DEFAULT_TRANSFORM));
  setEditingSlot(null);
  setOptions((prev) => ({ ...prev, orientation: getNaturalOrientation(tmpl) }));
};
```

**handlePhotoCountChange** — 슬롯 수 변경 시 동기화:

```ts
const handlePhotoCountChange = (n: number) => {
  const clamped = Math.max(1, Math.min(16, n));
  setActiveTemplate((prev) => {
    const cols = prev.grid.cols;
    const rows = Math.ceil(clamped / cols);
    return { ...prev, slots: buildEqualSlots(clamped, cols), grid: { cols, rows } };
  });
  setSlotImages((prev) => {
    const next: (File | null)[] = Array(clamped).fill(null);
    for (let i = 0; i < Math.min(prev.length, clamped); i++) next[i] = prev[i] ?? null;
    return next;
  });
  setSlotTransforms((prev) => {
    const next: SlotTransform[] = Array(clamped).fill(DEFAULT_TRANSFORM);
    for (let i = 0; i < Math.min(prev.length, clamped); i++) next[i] = prev[i];
    return next;
  });
};
```

**handleColsChange** — 열 수 변경 시 동기화 (슬롯 수는 유지, transform 유지):

```ts
const handleColsChange = (c: number) => {
  const clamped = Math.max(1, Math.min(4, c));
  setActiveTemplate((prev) => {
    const photoCount = prev.slots.length;
    const rows = Math.ceil(photoCount / clamped);
    return { ...prev, slots: buildEqualSlots(photoCount, clamped), grid: { cols: clamped, rows } };
  });
  // slotTransforms 길이 불변, 내용 유지
};
```

**handleSlotMerge** — 병합 시 두 번째 제거:

```ts
const handleSlotMerge = (indexA: number, indexB: number) => {
  const newSlots = mergeSlots(activeTemplate.slots, activeTemplate.grid, indexA, indexB);
  if (newSlots === activeTemplate.slots) return;
  setActiveTemplate((prev) => ({ ...prev, slots: newSlots }));
  setSlotImages((prev) => {
    const next = [...prev];
    next.splice(indexB, 1);
    return next;
  });
  setSlotTransforms((prev) => {
    const next = [...prev];
    next.splice(indexB, 1);
    return next;
  });
};
```

**handleSlotSplit** — 분리 시 DEFAULT_TRANSFORM 삽입:

```ts
const handleSlotSplit = (index: number) => {
  const newSlots = splitSlot(activeTemplate.slots, activeTemplate.grid, index);
  if (newSlots === activeTemplate.slots) return;
  setActiveTemplate((prev) => ({ ...prev, slots: newSlots }));
  setSlotImages((prev) => {
    const next = [...prev];
    next.splice(index + 1, 0, null);
    return next;
  });
  setSlotTransforms((prev) => {
    const next = [...prev];
    next.splice(index + 1, 0, DEFAULT_TRANSFORM);
    return next;
  });
};
```

**handleSlotImage** — 이미지 업로드 시 해당 인덱스 transform 리셋:

```ts
const handleSlotImage = (index: number, file: File) => {
  setSlotImages((prev) => {
    const next = Array(activeTemplate.slots.length).fill(null).map((_, i) => prev[i] ?? null);
    next[index] = file;
    return next;
  });
  setSlotTransforms((prev) => {
    const next = [...prev];
    next[index] = DEFAULT_TRANSFORM;
    return next;
  });
};
```

- [ ] **Step 4: handleTransformChange 핸들러 추가**

```ts
const handleTransformChange = (index: number, t: SlotTransform) => {
  setSlotTransforms((prev) => {
    const next = [...prev];
    next[index] = t;
    return next;
  });
};
```

- [ ] **Step 5: FrameCanvas에 새 props 전달**

FramePage의 `<FrameCanvas>` JSX에 추가:

```tsx
<FrameCanvas
  template={activeTemplate}
  slotImages={normalizedSlotImages}
  options={options}
  previewRef={previewRef}
  slotTransforms={slotTransforms}
  editingSlot={editingSlot}
  onSlotImage={handleSlotImage}
  onSlotClear={handleSlotClear}
  onSlotSwap={handleSlotSwap}
  onTransformChange={handleTransformChange}
  onEditStart={(i) => setEditingSlot(i)}
  onEditEnd={() => setEditingSlot(null)}
/>
```

- [ ] **Step 6: exportFrame 호출에 slotTransforms 전달 (Task 4 이후 수정 예고)**

현재 `handleExport`는:

```ts
await exportFrame(activeTemplate, slotImages, options, previewWidth);
```

Task 4에서 `exportFrame` 시그니처가 바뀌면 다음으로 교체:

```ts
await exportFrame(activeTemplate, slotImages, slotTransforms, options, previewWidth);
```

이 수정은 Task 4에서 함께 처리.

- [ ] **Step 7: TypeScript 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/components/frame/FrameCanvas.tsx src/components/frame/FramePage.tsx
git commit -m "feat: FramePage/FrameCanvas — slotTransforms 상태 및 동기화 추가"
```

---

## Task 4: frameExport — drawTransformedImage 적용

**Files:**
- Modify: `src/lib/frameExport.ts`
- Modify: `src/components/frame/FramePage.tsx` (exportFrame 호출 수정)

현재 `exportFrame`은 `drawCenterCrop`으로 항상 중앙 크롭. `SlotTransform`의 offsetX/Y/scale을 반영한 `drawTransformedImage`로 교체한다.

CSS `transform: translate(offsetX, offsetY) scale(scale)`의 캔버스 등가 계산:
- `object-cover` 기본 fit을 먼저 계산 (srcRatio vs dstRatio)
- scale 적용: 이미지를 `scale`배 크게 그림 → 슬롯 크기에서 `scale`배 축소된 source 영역을 읽는 것과 동일
- offsetX/Y 적용: CSS offsetX/Y는 슬롯 px 단위, canvas에서는 source 이미지 px 단위로 변환 필요

변환 공식:
```
// 기본 fit (object-cover) 계산
srcRatio = img.naturalWidth / img.naturalHeight
dstRatio = dw / dh
if srcRatio > dstRatio:
  sw_base = img.naturalHeight * dstRatio
  sx_base = (img.naturalWidth - sw_base) / 2
  sy_base = 0
  sh_base = img.naturalHeight
else:
  sh_base = img.naturalWidth / dstRatio
  sy_base = (img.naturalHeight - sh_base) / 2
  sx_base = 0
  sw_base = img.naturalWidth

// scale 적용: 더 작은 source 영역을 읽음
sw = sw_base / scale
sh = sh_base / scale

// offset 적용: CSS offsetX(px)는 slotW 기준, source 좌표계로 변환
// CSS에서 offsetX px → source에서 offsetX * (sw_base / dw) px 이동 (반대 방향)
sx = sx_base + (sw_base - sw) / 2 - offsetX * (sw_base / dw)
sy = sy_base + (sh_base - sh) / 2 - offsetY * (sh_base / dh)
```

- [ ] **Step 1: `frameExport.ts`에서 `drawCenterCrop` 대신 `drawTransformedImage` 작성**

`src/lib/frameExport.ts`에서 `drawCenterCrop` 함수를 다음으로 교체:

```ts
import type { SlotTransform } from './frameTemplates';

function drawTransformedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  transform: SlotTransform,
): void {
  const { offsetX, offsetY, scale } = transform;
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = dw / dh;

  let sxBase: number, syBase: number, swBase: number, shBase: number;
  if (srcRatio > dstRatio) {
    swBase = img.naturalHeight * dstRatio;
    sxBase = (img.naturalWidth - swBase) / 2;
    syBase = 0;
    shBase = img.naturalHeight;
  } else {
    shBase = img.naturalWidth / dstRatio;
    syBase = (img.naturalHeight - shBase) / 2;
    sxBase = 0;
    swBase = img.naturalWidth;
  }

  const sw = swBase / scale;
  const sh = shBase / scale;
  const sx = sxBase + (swBase - sw) / 2 - offsetX * (swBase / dw);
  const sy = syBase + (shBase - sh) / 2 - offsetY * (shBase / dh);

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
```

- [ ] **Step 2: `exportFrame` 시그니처에 `slotTransforms` 파라미터 추가**

```ts
export async function exportFrame(
  template: FrameTemplate,
  slotImages: (File | null)[],
  slotTransforms: SlotTransform[],
  opts: FrameOptionsState,
  previewWidth: number,
): Promise<void> {
```

- [ ] **Step 3: `exportFrame` 내부 `drawCenterCrop` 호출을 `drawTransformedImage`로 교체**

```ts
// 기존
drawCenterCrop(ctx, img, x, y, w, h);

// 변경 후
drawTransformedImage(ctx, img, x, y, w, h, slotTransforms[i] ?? DEFAULT_TRANSFORM);
```

import에 `DEFAULT_TRANSFORM` 추가:

```ts
import type { FrameTemplate, FrameOptionsState, SlotTransform } from './frameTemplates';
import { getOrientedRatio, DEFAULT_TRANSFORM } from './frameTemplates';
```

- [ ] **Step 4: FramePage의 exportFrame 호출에 slotTransforms 추가**

`src/components/frame/FramePage.tsx`의 `handleExport`:

```ts
const handleExport = async () => {
  setIsExporting(true);
  try {
    await exportFrame(activeTemplate, slotImages, slotTransforms, options, previewWidth);
  } finally {
    setIsExporting(false);
  }
};
```

- [ ] **Step 5: TypeScript 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: 빌드 검사**

```bash
npm run build
```

Expected: 빌드 성공, 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/lib/frameExport.ts src/components/frame/FramePage.tsx
git commit -m "feat: frameExport — drawTransformedImage로 transform 반영 내보내기"
```

---

## Task 5: 수동 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 다음 시나리오를 브라우저에서 확인**

1. **이미지 업로드 후 드래그**: 슬롯에 이미지 업로드 → 이미지를 드래그해서 상하좌우 이동 → 슬롯 경계 밖으로 벗어나지 않는지 확인
2. **스크롤 줌**: 슬롯 위에서 마우스 휠 → 확대/축소 (1.0×–3.0× 범위 클램핑 확인)
3. **오버레이 진입**: 슬롯 클릭 → 하단 오버레이(슬라이더 + 리셋 버튼) 표시 확인
4. **슬라이더 줌**: 오버레이 슬라이더 조작 → 줌 변경 확인
5. **리셋**: 리셋 버튼 → transform이 중앙/기본으로 복원 확인
6. **오버레이 외부 클릭**: 슬롯 밖 클릭 → 오버레이 닫힘 확인
7. **내보내기**: transform 적용 후 내보내기 → 다운로드된 PNG가 미리보기와 일치하는지 확인
8. **템플릿 변경**: 다른 탭 클릭 → slotTransforms 리셋 확인 (이미지 위치 초기화)
9. **이미지 교체**: 이미지 다시 업로드 → transform 리셋 확인

- [ ] **Step 3: 최종 커밋 (변경사항 없을 경우 스킵)**

```bash
git status
```

---

## 최종 빌드 확인

```bash
npm run build
```

Expected: 빌드 성공, TypeScript 에러, ESLint 에러 없음
