# 포토부스 커스텀 레이아웃 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 포토부스 탭에서 사진 수·열 수·슬롯 병합을 사용자가 자유롭게 조작할 수 있도록 확장한다.

**Architecture:** `FramePage`의 `templateId` 상태를 `activeTemplate: FrameTemplate`으로 교체해 프리셋은 deep copy 초기값으로 사용하고, 이후 사진 수·열 수·슬롯 병합 변경은 모두 `activeTemplate`을 직접 변환한다. `frameTemplates.ts`에 헬퍼 함수 3개(`buildEqualSlots`, `mergeSlots`, `splitSlot`)를 추가하고, 신규 `GridEditor` 컴포넌트가 슬롯 병합·분리 인터랙션을 담당한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `src/lib/frameTemplates.ts` | 헬퍼 함수 3개 추가 + 프리셋 3개 추가 |
| `src/messages/ko.json` | pb-3/9/12 번역 키 추가 |
| `src/messages/en.json` | pb-3/9/12 번역 키 추가 |
| `src/components/frame/GridEditor.tsx` | 신규 — 슬롯 미니 그리드 + 클릭 병합/분리 |
| `src/components/frame/FrameOptions.tsx` | 레이아웃 섹션 추가 (스테퍼 + GridEditor) |
| `src/components/frame/FramePage.tsx` | activeTemplate 상태 전환 + 핸들러 추가 |

---

## Task 1: frameTemplates.ts — 헬퍼 함수 + 프리셋 추가

**Files:**
- Modify: `src/lib/frameTemplates.ts`

- [ ] **Step 1: `buildEqualSlots` 함수 추가**

`FRAME_TEMPLATES` 상수 **위에** 다음 함수를 삽입한다. (프리셋 정의에서 호출해야 하므로 먼저 위치해야 함)

```ts
export function buildEqualSlots(photoCount: number, cols: number): SlotDef[] {
  const slots: SlotDef[] = [];
  for (let i = 0; i < photoCount; i++) {
    slots.push({
      col: (i % cols) + 1,
      row: Math.floor(i / cols) + 1,
      colSpan: 1,
      rowSpan: 1,
    });
  }
  return slots;
}
```

- [ ] **Step 2: pb-3·pb-9·pb-12 프리셋을 `FRAME_TEMPLATES` 배열에 추가**

`pb-6` 항목 바로 뒤, `social-story` 항목 앞에 삽입:

```ts
  {
    id: 'pb-3',
    labelKey: 'pb-3',
    category: 'photobooth',
    canvasRatio: [2, 3] as [number, number],
    outputWidth: 1200,
    grid: { cols: 1, rows: 3 },
    slots: buildEqualSlots(3, 1),
  },
  {
    id: 'pb-9',
    labelKey: 'pb-9',
    category: 'photobooth',
    canvasRatio: [2, 3] as [number, number],
    outputWidth: 1200,
    grid: { cols: 3, rows: 3 },
    slots: buildEqualSlots(9, 3),
  },
  {
    id: 'pb-12',
    labelKey: 'pb-12',
    category: 'photobooth',
    canvasRatio: [2, 3] as [number, number],
    outputWidth: 1200,
    grid: { cols: 3, rows: 4 },
    slots: buildEqualSlots(12, 3),
  },
```

- [ ] **Step 3: `mergeSlots` 함수 추가**

파일 맨 끝 (기존 `getOrientedRatio` 뒤)에 추가:

```ts
// 두 인접 1×1 슬롯을 병합. 인접하지 않거나 병합 불가이면 원본 반환.
export function mergeSlots(
  slots: SlotDef[],
  _grid: { cols: number; rows: number },
  indexA: number,
  indexB: number,
): SlotDef[] {
  const a = slots[indexA];
  const b = slots[indexB];
  if (a.colSpan !== 1 || a.rowSpan !== 1 || b.colSpan !== 1 || b.rowSpan !== 1) return slots;

  const isHorizontal = a.row === b.row && Math.abs(a.col - b.col) === 1;
  const isVertical = a.col === b.col && Math.abs(a.row - b.row) === 1;
  if (!isHorizontal && !isVertical) return slots;

  const mergedSlot: SlotDef = isHorizontal
    ? { col: Math.min(a.col, b.col), row: a.row, colSpan: 2, rowSpan: 1 }
    : { col: a.col, row: Math.min(a.row, b.row), colSpan: 1, rowSpan: 2 };

  const result = [...slots];
  result[indexA] = mergedSlot;
  result.splice(indexB, 1);
  return result;
}
```

- [ ] **Step 4: `splitSlot` 함수 추가**

`mergeSlots` 바로 뒤에 추가:

```ts
// 병합된 슬롯을 인접한 두 1×1 슬롯으로 분리. 이미 1×1이면 원본 반환.
export function splitSlot(
  slots: SlotDef[],
  _grid: { cols: number; rows: number },
  index: number,
): SlotDef[] {
  const slot = slots[index];
  if (slot.colSpan === 1 && slot.rowSpan === 1) return slots;

  let slotA: SlotDef;
  let slotB: SlotDef;

  if (slot.colSpan > 1) {
    slotA = { col: slot.col,     row: slot.row, colSpan: 1,                  rowSpan: slot.rowSpan };
    slotB = { col: slot.col + 1, row: slot.row, colSpan: slot.colSpan - 1,   rowSpan: slot.rowSpan };
  } else {
    slotA = { col: slot.col, row: slot.row,     colSpan: slot.colSpan, rowSpan: 1 };
    slotB = { col: slot.col, row: slot.row + 1, colSpan: slot.colSpan, rowSpan: slot.rowSpan - 1 };
  }

  const result = [...slots];
  result.splice(index, 1, slotA, slotB);
  return result;
}
```

- [ ] **Step 5: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/frameTemplates.ts
git commit -m "feat: frameTemplates — buildEqualSlots·mergeSlots·splitSlot + pb-3/9/12 프리셋"
```

---

## Task 2: i18n — 번역 키 추가

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: ko.json에 키 추가**

`src/messages/ko.json`의 `frame.templates` 객체에서 `"pb-6": "6컷"` 줄 뒤에 추가:

```json
      "pb-3": "3컷",
      "pb-9": "9컷",
      "pb-12": "12컷",
```

또한 `frame.options` 객체에 레이아웃 섹션 레이블 추가 (`"orientation"` 줄 앞):

```json
      "layout": "레이아웃",
      "photoCount": "사진 수",
      "cols": "열 수",
```

- [ ] **Step 2: en.json에 키 추가**

`src/messages/en.json`의 `frame.templates` 객체에서 `"pb-6": "6-Shot"` 줄 뒤에 추가:

```json
      "pb-3": "3-Shot",
      "pb-9": "9-Shot",
      "pb-12": "12-Shot",
```

`frame.options` 객체에 추가 (`"orientation"` 줄 앞):

```json
      "layout": "Layout",
      "photoCount": "Photos",
      "cols": "Columns",
```

- [ ] **Step 3: 커밋**

```bash
git add src/messages/ko.json src/messages/en.json
git commit -m "feat: i18n — pb-3/9/12 및 레이아웃 섹션 번역 키 추가"
```

---

## Task 3: GridEditor.tsx — 신규 컴포넌트

**Files:**
- Create: `src/components/frame/GridEditor.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SlotDef } from '@/lib/frameTemplates';

interface Props {
  slots: SlotDef[];
  grid: { cols: number; rows: number };
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
}

export function GridEditor({ slots, grid, onMerge, onSplit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (index: number) => {
    const slot = slots[index];
    const isMerged = slot.colSpan > 1 || slot.rowSpan > 1;

    if (isMerged) {
      onSplit(index);
      setSelected(null);
      return;
    }

    if (selected === null) {
      setSelected(index);
      return;
    }

    if (selected === index) {
      setSelected(null);
      return;
    }

    const a = slots[selected];
    const b = slot;
    const canMerge =
      a.colSpan === 1 && a.rowSpan === 1 && b.colSpan === 1 && b.rowSpan === 1 &&
      ((a.row === b.row && Math.abs(a.col - b.col) === 1) ||
       (a.col === b.col && Math.abs(a.row - b.row) === 1));

    if (canMerge) {
      onMerge(selected, index);
      setSelected(null);
    } else {
      setSelected(index);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        gap: '3px',
        minHeight: '48px',
      }}
      className="w-full rounded overflow-hidden"
    >
      {slots.map((slot, i) => {
        const isMerged = slot.colSpan > 1 || slot.rowSpan > 1;
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            style={{
              gridColumn: `${slot.col} / span ${slot.colSpan}`,
              gridRow: `${slot.row} / span ${slot.rowSpan}`,
            }}
            className={cn(
              'cursor-pointer rounded text-xs flex items-center justify-center font-medium transition-colors select-none',
              isMerged
                ? 'bg-primary/60 text-primary-foreground hover:bg-primary/80'
                : selected === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/20 hover:bg-primary/40 text-primary',
            )}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/components/frame/GridEditor.tsx
git commit -m "feat: GridEditor — 슬롯 클릭 병합·분리 컴포넌트"
```

---

## Task 4: FrameOptions.tsx — 레이아웃 섹션 추가

**Files:**
- Modify: `src/components/frame/FrameOptions.tsx`

- [ ] **Step 1: Props 인터페이스 확장 + GridEditor import 추가**

파일 상단 import에 추가:

```ts
import { GridEditor } from './GridEditor';
```

Props 인터페이스를 다음으로 교체:

```ts
interface Props {
  template: FrameTemplate;
  options: FrameOptionsState;
  onChange: (opts: FrameOptionsState) => void;
  onPhotoCountChange: (n: number) => void;
  onColsChange: (c: number) => void;
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
}
```

함수 시그니처도 업데이트:

```ts
export function FrameOptions({
  template, options, onChange,
  onPhotoCountChange, onColsChange, onMerge, onSplit,
}: Props) {
```

- [ ] **Step 2: 레이아웃 섹션 삽입**

`useTranslations` 호출 직후 (`const isSingleSlot = ...` 위)에 변수 추가:

```ts
  const photoCount = template.slots.length;
  const cols = template.grid.cols;
```

기존 `return` 내부의 최상단 (`{isSingleSlot && isNonSquare && ...}` 블록 **앞**)에 레이아웃 섹션 삽입:

```tsx
      {/* 레이아웃 섹션 */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('layout')}
        </span>

        {/* 사진 수 스테퍼 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">{t('photoCount')}</span>
          <div className="flex items-center overflow-hidden rounded-md border border-border">
            <button
              onClick={() => onPhotoCountChange(photoCount - 1)}
              disabled={photoCount <= 1}
              className="border-r border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="min-w-[2rem] bg-card px-2 py-1 text-center text-xs font-semibold">
              {photoCount}
            </span>
            <button
              onClick={() => onPhotoCountChange(photoCount + 1)}
              disabled={photoCount >= 16}
              className="border-l border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* 열 수 스테퍼 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">{t('cols')}</span>
          <div className="flex items-center overflow-hidden rounded-md border border-border">
            <button
              onClick={() => onColsChange(cols - 1)}
              disabled={cols <= 1}
              className="border-r border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="min-w-[2rem] bg-card px-2 py-1 text-center text-xs font-semibold">
              {cols}
            </span>
            <button
              onClick={() => onColsChange(cols + 1)}
              disabled={cols >= 4}
              className="border-l border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* 그리드 에디터 */}
        <GridEditor
          slots={template.slots}
          grid={template.grid}
          onMerge={onMerge}
          onSplit={onSplit}
        />
      </div>
```

- [ ] **Step 3: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: `FramePage`에서 새 props를 전달하지 않아 오류 발생 — Task 5에서 해결.

- [ ] **Step 4: 커밋 (Task 5 이후로 미뤄도 됨 — TS 오류 상태)**

Task 5 완료 후 함께 커밋해도 무방. 바로 커밋하려면:

```bash
git add src/components/frame/FrameOptions.tsx
git commit -m "feat: FrameOptions — 레이아웃 섹션 및 GridEditor 통합"
```

---

## Task 5: FramePage.tsx — activeTemplate 상태 전환 + 핸들러

**Files:**
- Modify: `src/components/frame/FramePage.tsx`

- [ ] **Step 1: import 업데이트**

기존 import 블록을 다음으로 교체:

```ts
import {
  FRAME_TEMPLATES,
  DEFAULT_FRAME_OPTIONS,
  getNaturalOrientation,
  getTemplate,
  buildEqualSlots,
  mergeSlots,
  splitSlot,
  type FrameTemplate,
  type FrameOptionsState,
} from '@/lib/frameTemplates';
```

- [ ] **Step 2: 상태 선언 교체**

```ts
// 삭제
const [templateId, setTemplateId] = useState<string>(FRAME_TEMPLATES[0].id);

// 추가
const [activeTemplate, setActiveTemplate] = useState<FrameTemplate>(
  () => structuredClone(FRAME_TEMPLATES[0]) as FrameTemplate,
);
```

`const template = getTemplate(templateId)!;` 줄도 삭제.

- [ ] **Step 3: `handleTemplateChange` 교체**

기존 `handleTemplateChange` 전체를 다음으로 교체:

```ts
  const handleTemplateChange = (id: string) => {
    const tmpl = getTemplate(id)!;
    setActiveTemplate(structuredClone(tmpl) as FrameTemplate);
    setSlotImages(Array(tmpl.slots.length).fill(null));
    setOptions((prev) => ({ ...prev, orientation: getNaturalOrientation(tmpl) }));
  };
```

- [ ] **Step 4: `handlePhotoCountChange` 추가**

`handleTemplateChange` 바로 뒤에 추가:

```ts
  const handlePhotoCountChange = (n: number) => {
    const clamped = Math.max(1, Math.min(16, n));
    const cols = activeTemplate.grid.cols;
    const rows = Math.ceil(clamped / cols);
    setActiveTemplate((prev) => ({
      ...prev,
      slots: buildEqualSlots(clamped, cols),
      grid: { cols, rows },
    }));
    setSlotImages((prev) => {
      const next: (File | null)[] = Array(clamped).fill(null);
      for (let i = 0; i < Math.min(prev.length, clamped); i++) next[i] = prev[i] ?? null;
      return next;
    });
  };
```

- [ ] **Step 5: `handleColsChange` 추가**

```ts
  const handleColsChange = (c: number) => {
    const clamped = Math.max(1, Math.min(4, c));
    const photoCount = activeTemplate.slots.length;
    const rows = Math.ceil(photoCount / clamped);
    setActiveTemplate((prev) => ({
      ...prev,
      slots: buildEqualSlots(photoCount, clamped),
      grid: { cols: clamped, rows },
    }));
  };
```

- [ ] **Step 6: `handleSlotMerge` 추가**

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
  };
```

- [ ] **Step 7: `handleSlotSplit` 추가**

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
  };
```

- [ ] **Step 8: 기존 핸들러 내 `template` → `activeTemplate` 참조 교체**

`handleSlotImage`, `handleSlotClear`, `handleSlotSwap`, `handleExport` 내부의 `template` 참조를 모두 `activeTemplate`으로 교체:

```ts
  const handleSlotImage = (index: number, file: File) => {
    setSlotImages((prev) => {
      const next = Array(activeTemplate.slots.length).fill(null).map((_, i) => prev[i] ?? null);
      next[index] = file;
      return next;
    });
  };
```

`handleExport` 내:
```ts
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportFrame(activeTemplate, slotImages, options, previewWidth);
    } finally {
      setIsExporting(false);
    }
  };
```

`normalizedSlotImages`:
```ts
  const normalizedSlotImages = Array(activeTemplate.slots.length)
    .fill(null)
    .map((_, i) => slotImages[i] ?? null);
```

- [ ] **Step 9: JSX 내 `template` → `activeTemplate` + FrameOptions props 추가**

`<FrameTemplateSelector>` prop:
```tsx
<FrameTemplateSelector
  templates={FRAME_TEMPLATES}
  selectedId={activeTemplate.id}
  onSelect={handleTemplateChange}
/>
```

`<FrameCanvas>` prop:
```tsx
<FrameCanvas
  template={activeTemplate}
  slotImages={normalizedSlotImages}
  options={options}
  previewRef={previewRef}
  onSlotImage={handleSlotImage}
  onSlotClear={handleSlotClear}
  onSlotSwap={handleSlotSwap}
/>
```

`<FrameOptions>` props 확장:
```tsx
<FrameOptions
  template={activeTemplate}
  options={options}
  onChange={setOptions}
  onPhotoCountChange={handlePhotoCountChange}
  onColsChange={handleColsChange}
  onMerge={handleSlotMerge}
  onSplit={handleSlotSplit}
/>
```

- [ ] **Step 10: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 11: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공.

- [ ] **Step 12: 커밋**

```bash
git add src/components/frame/FramePage.tsx src/components/frame/FrameOptions.tsx
git commit -m "feat: FramePage — activeTemplate 상태 + 사진 수·열·병합·분리 핸들러"
```

---

## Task 6: 수동 동작 검증

**Files:** 없음 (런타임 테스트)

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열고 포토부스 탭으로 이동.

- [ ] **Step 2: 프리셋 확장 확인**

탭바에 `3컷`, `9컷`, `12컷` 버튼이 표시되고, 클릭 시 캔버스가 해당 슬롯 수로 바뀌는지 확인.

- [ ] **Step 3: 사진 수 스테퍼 확인**

사이드패널에서 `+` 클릭 → 슬롯 추가됨. `-` 클릭 → 슬롯 감소됨. 1 이하로 내려가지 않음. 16 이상으로 올라가지 않음.

- [ ] **Step 4: 열 수 스테퍼 확인**

열 수 변경 시 캔버스 그리드가 즉시 재배치됨. 1열 이하, 4열 이상으로 변경 안 됨.

- [ ] **Step 5: 슬롯 병합 확인**

GridEditor에서 슬롯 클릭 → 하이라이트. 인접 슬롯 클릭 → 두 슬롯이 합쳐짐 (캔버스와 GridEditor 모두 반영).

- [ ] **Step 6: 슬롯 분리 확인**

병합된 슬롯(진한 색) 클릭 → 두 슬롯으로 분리됨.

- [ ] **Step 7: 기존 기능 회귀 확인**

소셜 탭 전환, 이미지 드래그 스왑, 여백·테두리 슬라이더, 내보내기 모두 정상 작동 확인.

- [ ] **Step 8: 최종 커밋**

```bash
git add -A
git status  # 변경 파일 확인
git commit -m "feat: 포토부스 커스텀 레이아웃 — 사진 수·열·슬롯 병합 지원"
```
