# Phase 3b — 프리폼 콜라주 에디터 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 재귀 바이너리 트리 기반의 프리폼 콜라주 에디터를 DrawerLayout 세 번째 탭으로 추가한다.

**Architecture:** 셀 레이아웃을 Binary Split Tree(`SplitNode | LeafNode`)로 표현한다. `collageTree.ts`의 순수 함수로 트리를 조작하고, `CollageCanvas`가 재귀적으로 flex 레이아웃을 렌더링한다. 내보내기는 `html2canvas`를 동적 import로 사용하며, `collageExport.ts`로 분리한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, `html2canvas` (lazy), `next-intl`, `lucide-react`

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| `src/lib/collageTree.ts` | 트리 타입 정의 + split/merge/ratio/image 조작 순수 함수 |
| `src/lib/collageExport.ts` | html2canvas 래스터화 + Blob 다운로드 |
| `src/components/collage/CollagePage.tsx` | 탭 진입점, PC/모바일 레이아웃 분기 |
| `src/components/collage/CollageCanvas.tsx` | 트리 재귀 렌더링, 셀 선택 상태 관리 |
| `src/components/collage/CollageCell.tsx` | 개별 리프 셀: 사진 표시(object-cover), 클릭·드래그 |
| `src/components/collage/CollageDivider.tsx` | SplitNode 경계 드래그 핸들 (ratio 조절) |
| `src/components/collage/CellPopover.tsx` | 분할·병합·교체 팝오버 |
| `src/components/collage/CollagePanel.tsx` | PC 좌측 / 모바일 하단 컨트롤 패널 |
| `src/components/collage/CollageExport.tsx` | 내보내기 UI (포맷·해상도 선택 + 다운로드) |
| `src/components/layout/DrawerLayout.tsx` | `'collage'` 탭 추가 (수정) |
| `src/app/[locale]/page.tsx` | `collageTab` prop 추가 (수정) |
| `src/messages/ko.json` | `collage.*` i18n 키 추가 (수정) |
| `src/messages/en.json` | `collage.*` i18n 키 추가 (수정) |

---

## Task 1: collageTree.ts — 타입 + 조작 유틸

**Files:**
- Create: `src/lib/collageTree.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/lib/collageTree.ts

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'free';

export interface CellImage {
  src: string;    // Object URL
  x: number;     // 셀 내 오프셋 (px)
  y: number;
  scale: number;  // 기본값 1
}

export interface SplitNode {
  type: 'split';
  direction: 'h' | 'v'; // h: 위아래, v: 좌우
  ratio: number;         // 0~1, 첫 번째 자식의 비율
  children: [CollageNode, CollageNode];
}

export interface LeafNode {
  type: 'leaf';
  id: string;
  image?: CellImage;
}

export type CollageNode = SplitNode | LeafNode;

export interface CollageStyle {
  aspectRatio: AspectRatio;
  gap: number;          // 0~20
  padding: number;      // 0~40
  borderRadius: number; // 0~24
  background: string;   // CSS color
}

export interface CollageState {
  tree: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `cell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeLeaf(image?: CellImage): LeafNode {
  return { type: 'leaf', id: generateId(), image };
}

export function defaultState(): CollageState {
  return {
    tree: makeLeaf(),
    style: {
      aspectRatio: '1:1',
      gap: 4,
      padding: 0,
      borderRadius: 8,
      background: '#ffffff',
    },
    selectedId: null,
  };
}

/** 지정 id의 리프를 SplitNode로 교체 */
export function splitNode(
  node: CollageNode,
  id: string,
  direction: 'h' | 'v',
): CollageNode {
  if (node.type === 'leaf') {
    if (node.id !== id) return node;
    return {
      type: 'split',
      direction,
      ratio: 0.5,
      children: [{ ...node }, makeLeaf()],
    };
  }
  return {
    ...node,
    children: [
      splitNode(node.children[0], id, direction),
      splitNode(node.children[1], id, direction),
    ],
  };
}

/**
 * 지정 id(리프)의 부모 SplitNode를 형제 노드로 교체.
 * 형제가 LeafNode일 때만 동작 (병합 가능 여부 확인은 canMerge 사용).
 */
export function mergeNode(node: CollageNode, id: string): CollageNode {
  if (node.type === 'leaf') return node;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === id && b.type === 'leaf') return b;
  if (b.type === 'leaf' && b.id === id && a.type === 'leaf') return a;
  return {
    ...node,
    children: [mergeNode(a, id), mergeNode(b, id)],
  };
}

/** 병합 가능 여부: id 리프의 형제도 리프여야 함 */
export function canMerge(node: CollageNode, id: string): boolean {
  if (node.type === 'leaf') return false;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === id) return b.type === 'leaf';
  if (b.type === 'leaf' && b.id === id) return a.type === 'leaf';
  return canMerge(a, id) || canMerge(b, id);
}

/** SplitNode의 ratio 업데이트 (CollageDivider 드래그용) */
export function updateRatio(
  node: CollageNode,
  splitId: string, // SplitNode를 식별하기 위해 첫 번째 자식 리프 id 사용
  ratio: number,
): CollageNode {
  if (node.type === 'leaf') return node;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === splitId) {
    return { ...node, ratio: Math.max(0.1, Math.min(0.9, ratio)) };
  }
  return {
    ...node,
    children: [updateRatio(a, splitId, ratio), updateRatio(b, splitId, ratio)],
  };
}

/** 셀에 이미지 설정 */
export function setImage(
  node: CollageNode,
  id: string,
  image: CellImage | undefined,
): CollageNode {
  if (node.type === 'leaf') {
    return node.id === id ? { ...node, image } : node;
  }
  return {
    ...node,
    children: [setImage(node.children[0], id, image), setImage(node.children[1], id, image)],
  };
}

/** 셀 내 이미지 오프셋·스케일 업데이트 */
export function updateImageTransform(
  node: CollageNode,
  id: string,
  patch: Partial<CellImage>,
): CollageNode {
  if (node.type === 'leaf') {
    if (node.id !== id || !node.image) return node;
    return { ...node, image: { ...node.image, ...patch } };
  }
  return {
    ...node,
    children: [
      updateImageTransform(node.children[0], id, patch),
      updateImageTransform(node.children[1], id, patch),
    ],
  };
}

/** 두 셀의 이미지 교체 */
export function swapImages(
  node: CollageNode,
  idA: string,
  idB: string,
): CollageNode {
  const imgA = findImage(node, idA);
  const imgB = findImage(node, idB);
  let result = setImage(node, idA, imgB);
  result = setImage(result, idB, imgA);
  return result;
}

function findImage(node: CollageNode, id: string): CellImage | undefined {
  if (node.type === 'leaf') return node.id === id ? node.image : undefined;
  return findImage(node.children[0], id) ?? findImage(node.children[1], id);
}

/** 모든 리프 id 목록 (순서 보장: 좌→우, 위→아래) */
export function collectLeafIds(node: CollageNode): string[] {
  if (node.type === 'leaf') return [node.id];
  return [...collectLeafIds(node.children[0]), ...collectLeafIds(node.children[1])];
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen-phase3b
npm run build 2>&1 | tail -20
```

Expected: 에러 없이 컴파일 성공 (또는 다른 파일 에러만 표시)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/collageTree.ts
git commit -m "feat(collage): collageTree 타입 및 순수 함수 유틸"
```

---

## Task 2: collageExport.ts — Canvas 래스터화

**Files:**
- Create: `src/lib/collageExport.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/lib/collageExport.ts

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportScale = 1 | 2 | 3;

export interface ExportOptions {
  format: ExportFormat;
  scale: ExportScale;
  element: HTMLElement; // CollageCanvas의 루트 DOM 요소
}

/**
 * html2canvas로 element를 래스터화하여 파일 다운로드.
 * html2canvas는 내보내기 시점에만 동적 import.
 */
export async function exportCollage(options: ExportOptions): Promise<void> {
  const { format, scale, element } = options;
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });

  const mimeType = `image/${format}`;
  const quality = format === 'png' ? undefined : 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('canvas.toBlob returned null')); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 15);
        a.href = url;
        a.download = `collage-${timestamp}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      },
      mimeType,
      quality,
    );
  });
}
```

- [ ] **Step 2: html2canvas 설치**

```bash
npm install html2canvas
npm install --save-dev @types/html2canvas
```

Expected: `package.json`에 `html2canvas` 추가됨

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/collageExport.ts package.json package-lock.json
git commit -m "feat(collage): collageExport html2canvas 래스터화 유틸"
```

---

## Task 3: i18n + DrawerLayout 탭 확장

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`
- Modify: `src/components/layout/DrawerLayout.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: ko.json에 collage 키 추가**

`src/messages/ko.json`의 `"language"` 키 바로 앞에 추가:

```json
"collage": {
  "tab": "콜라주",
  "aspectRatio": "캔버스 비율",
  "styleGap": "간격",
  "styleRadius": "모서리",
  "styleBackground": "배경색",
  "stylePadding": "여백",
  "uploadPhoto": "+ 사진 업로드",
  "fromImageTab": "이미지탭에서 가져오기",
  "export": "내보내기",
  "exportFormat": "포맷",
  "exportScale": "해상도",
  "exportScale1x": "1x (원본)",
  "exportScale2x": "2x (권장)",
  "exportScale3x": "3x (고해상도)",
  "exporting": "내보내는 중...",
  "splitH": "가로 분할",
  "splitV": "세로 분할",
  "merge": "병합",
  "replacePhoto": "사진 교체",
  "removePhoto": "사진 제거",
  "emptyCell": "클릭하여 사진 추가",
  "selectFromImageTab": "이미지탭 사진 선택",
  "selectFromImageTabHint": "이미지 탭에 업로드된 사진을 선택하세요",
  "confirm": "적용",
  "cancel": "취소",
  "noImages": "이미지 탭에 사진이 없습니다"
},
```

- [ ] **Step 2: en.json에 collage 키 추가**

`src/messages/en.json`의 `"language"` 키 바로 앞에 추가:

```json
"collage": {
  "tab": "Collage",
  "aspectRatio": "Canvas Ratio",
  "styleGap": "Gap",
  "styleRadius": "Radius",
  "styleBackground": "Background",
  "stylePadding": "Padding",
  "uploadPhoto": "+ Upload Photo",
  "fromImageTab": "From Image Tab",
  "export": "Export",
  "exportFormat": "Format",
  "exportScale": "Resolution",
  "exportScale1x": "1x (Original)",
  "exportScale2x": "2x (Recommended)",
  "exportScale3x": "3x (High-res)",
  "exporting": "Exporting...",
  "splitH": "Split Horizontal",
  "splitV": "Split Vertical",
  "merge": "Merge",
  "replacePhoto": "Replace Photo",
  "removePhoto": "Remove Photo",
  "emptyCell": "Click to add photo",
  "selectFromImageTab": "Select from Image Tab",
  "selectFromImageTabHint": "Select a photo uploaded in the Image tab",
  "confirm": "Apply",
  "cancel": "Cancel",
  "noImages": "No images in Image tab"
},
```

- [ ] **Step 3: DrawerLayout.tsx 수정**

`src/components/layout/DrawerLayout.tsx` 전체를 아래로 교체:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon, FolderIcon, LayoutGridIcon } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type Tab = 'image' | 'file' | 'collage';

interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
  collageTab: React.ReactNode;
}

export function DrawerLayout({ imageTab, fileTab, collageTab }: DrawerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const t = useTranslations('drawer');
  const tc = useTranslations('collage');
  const locale = useLocale();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center border-r border-border bg-card py-4 gap-2">
        <Link
          href={`/${locale}`}
          className="mb-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary transition-transform hover:scale-105 active:scale-95"
        >
          <img src="/logo.svg" alt="FileZen" className="h-6 w-6" />
        </Link>

        <DrawerItem
          icon={<ImageIcon size={20} />}
          label={t('images')}
          active={activeTab === 'image'}
          onClick={() => setActiveTab('image')}
        />
        <DrawerItem
          icon={<FolderIcon size={20} />}
          label={t('files')}
          active={activeTab === 'file'}
          onClick={() => setActiveTab('file')}
        />
        <DrawerItem
          icon={<LayoutGridIcon size={20} />}
          label={tc('tab')}
          active={activeTab === 'collage'}
          onClick={() => setActiveTab('collage')}
        />

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top-right controls (desktop only) */}
        <div className="hidden sm:flex absolute top-4 right-6 z-50 items-center gap-2">
          <LanguageSwitcher />
        </div>

        {/* Mobile top bar */}
        <div className="sm:hidden flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <img src="/logo.svg" alt="FileZen" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-tight">FileZen</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'image' && imageTab}
          {activeTab === 'file' && fileTab}
          {activeTab === 'collage' && collageTab}
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="sm:hidden flex flex-shrink-0 items-center justify-around border-t border-border bg-card px-2 pb-safe">
          <MobileNavItem
            icon={<ImageIcon size={22} />}
            label={t('images')}
            active={activeTab === 'image'}
            onClick={() => setActiveTab('image')}
          />
          <MobileNavItem
            icon={<FolderIcon size={22} />}
            label={t('files')}
            active={activeTab === 'file'}
            onClick={() => setActiveTab('file')}
          />
          <MobileNavItem
            icon={<LayoutGridIcon size={22} />}
            label={tc('tab')}
            active={activeTab === 'collage'}
            onClick={() => setActiveTab('collage')}
          />
        </nav>
      </main>
    </div>
  );
}

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function DrawerItem({ icon, label, active, onClick }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
```

- [ ] **Step 4: page.tsx 수정**

```typescript
// src/app/[locale]/page.tsx
import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage } from '@/components/image/ImagePage';
import { FilePage } from '@/components/file/FilePage';
import { CollagePage } from '@/components/collage/CollagePage';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DrawerLayout
      imageTab={<ImagePage />}
      fileTab={<FilePage />}
      collageTab={<CollagePage />}
    />
  );
}
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | tail -30
```

Expected: `CollagePage` 없다는 에러만 표시됨 (다음 Task에서 생성)

- [ ] **Step 6: 커밋**

```bash
git add src/messages/ko.json src/messages/en.json \
        src/components/layout/DrawerLayout.tsx \
        src/app/[locale]/page.tsx
git commit -m "feat(collage): DrawerLayout 세 번째 탭 추가 + i18n 키"
```

---

## Task 4: CollageCell.tsx — 개별 셀 컴포넌트

**Files:**
- Create: `src/components/collage/CollageCell.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollageCell.tsx
'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { LeafNode, CellImage } from '@/lib/collageTree';

interface CollageCellProps {
  node: LeafNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
}

export function CollageCell({
  node,
  isSelected,
  onSelect,
  onImageDrag,
  onDropImage,
}: CollageCellProps) {
  const t = useTranslations('collage');
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!node.image) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY };
    },
    [node.image],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current || !node.image) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      onImageDrag(node.id, dx, dy);
    },
    [node.id, node.image, onImageDrag],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // 드래그앤드롭으로 이미지 파일 받기
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const src = URL.createObjectURL(file);
      onDropImage(node.id, src);
    },
    [node.id, onDropImage],
  );

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden cursor-pointer select-none',
        'transition-all duration-100',
        isSelected && 'ring-2 ring-primary ring-offset-1',
      )}
      style={{ borderRadius: 'inherit' }}
      onClick={() => onSelect(node.id)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {node.image ? (
        <img
          src={node.image.src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `calc(50% + ${node.image.x}px) calc(50% + ${node.image.y}px)`,
            transform: `scale(${node.image.scale})`,
            transformOrigin: 'center',
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 border-2 border-dashed border-border">
          <span className="text-xs text-muted-foreground text-center px-2">
            {t('emptyCell')}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E 'error|Error' | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/collage/CollageCell.tsx
git commit -m "feat(collage): CollageCell 개별 셀 컴포넌트"
```

---

## Task 5: CollageDivider.tsx — 드래그 가능한 경계선

**Files:**
- Create: `src/components/collage/CollageDivider.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollageDivider.tsx
'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CollageDividerProps {
  direction: 'h' | 'v'; // h: 수평 경계(상하 드래그), v: 수직 경계(좌우 드래그)
  firstChildId: string;  // 부모 SplitNode 식별에 사용
  containerSize: number; // px — 드래그 비율 계산용 (방향에 따라 width 또는 height)
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  gap: number;
}

export function CollageDivider({
  direction,
  firstChildId,
  containerSize,
  onRatioChange,
  gap,
}: CollageDividerProps) {
  const startRef = useRef<{ pos: number; ratio: number } | null>(null);
  const currentRatioRef = useRef(0.5);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current = {
        pos: direction === 'v' ? e.clientX : e.clientY,
        ratio: currentRatioRef.current,
      };
    },
    [direction],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!startRef.current || containerSize === 0) return;
      const delta = (direction === 'v' ? e.clientX : e.clientY) - startRef.current.pos;
      const newRatio = startRef.current.ratio + delta / containerSize;
      const clamped = Math.max(0.1, Math.min(0.9, newRatio));
      currentRatioRef.current = clamped;
      onRatioChange(firstChildId, clamped, false);
    },
    [direction, containerSize, firstChildId, onRatioChange],
  );

  const handlePointerUp = useCallback(() => {
    if (!startRef.current) return;
    onRatioChange(firstChildId, currentRatioRef.current, true);
    startRef.current = null;
  }, [firstChildId, onRatioChange]);

  const isVertical = direction === 'v';

  return (
    <div
      className={cn(
        'absolute z-10 flex items-center justify-center group',
        isVertical
          ? 'top-0 bottom-0 cursor-col-resize'
          : 'left-0 right-0 cursor-row-resize',
      )}
      style={
        isVertical
          ? { width: gap + 8, marginLeft: -(gap / 2 + 4), left: '100%' }
          : { height: gap + 8, marginTop: -(gap / 2 + 4), top: '100%' }
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 시각 핸들 */}
      <div
        className={cn(
          'bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
          isVertical ? 'w-1 h-8' : 'w-8 h-1',
        )}
      />
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/collage/CollageDivider.tsx
git commit -m "feat(collage): CollageDivider 드래그 경계선"
```

---

## Task 6: CollageCanvas.tsx — 재귀 트리 렌더러

**Files:**
- Create: `src/components/collage/CollageCanvas.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollageCanvas.tsx
'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CollageCell } from './CollageCell';
import { CollageDivider } from './CollageDivider';
import type { CollageNode, CollageStyle } from '@/lib/collageTree';

interface CollageCanvasProps {
  tree: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
  onSelectCell: (id: string) => void;
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

const ASPECT_MAP: Record<string, string> = {
  '1:1':  '1 / 1',
  '4:5':  '4 / 5',
  '9:16': '9 / 16',
  '16:9': '16 / 9',
  'free': 'auto',
};

export function CollageCanvas({
  tree,
  style,
  selectedId,
  onSelectCell,
  onRatioChange,
  onImageDrag,
  onDropImage,
  canvasRef,
}: CollageCanvasProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-muted/20 overflow-hidden">
      <div
        ref={canvasRef}
        className="relative shadow-lg"
        style={{
          aspectRatio: ASPECT_MAP[style.aspectRatio] ?? '1 / 1',
          maxWidth: '100%',
          maxHeight: '100%',
          padding: style.padding,
          background: style.background,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
        }}
      >
        <NodeRenderer
          node={tree}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
      </div>
    </div>
  );
}

interface NodeRendererProps {
  node: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
  onSelectCell: (id: string) => void;
  onRatioChange: (firstChildId: string, ratio: number, isDone: boolean) => void;
  onImageDrag: (id: string, dx: number, dy: number) => void;
  onDropImage: (id: string, src: string) => void;
}

function NodeRenderer({
  node,
  style,
  selectedId,
  onSelectCell,
  onRatioChange,
  onImageDrag,
  onDropImage,
}: NodeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (node.type === 'leaf') {
    return (
      <CollageCell
        node={node}
        isSelected={selectedId === node.id}
        onSelect={onSelectCell}
        onImageDrag={onImageDrag}
        onDropImage={onDropImage}
      />
    );
  }

  // SplitNode
  const isVertical = node.direction === 'v';
  const [firstChild, secondChild] = node.children;
  const firstSize = `${node.ratio * 100}%`;
  const secondSize = `${(1 - node.ratio) * 100}%`;

  // CollageDivider의 containerSize를 위해 ref 사용
  const getContainerSize = () => {
    if (!containerRef.current) return 300;
    return isVertical
      ? containerRef.current.offsetWidth
      : containerRef.current.offsetHeight;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        gap: style.gap,
      }}
    >
      {/* 첫 번째 자식 */}
      <div
        style={{
          flexBasis: firstSize,
          flexShrink: 0,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <NodeRenderer
          node={firstChild}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
        {/* 드래그 핸들 (첫 번째 자식 우/하단에 배치) */}
        <CollageDivider
          direction={node.direction}
          firstChildId={firstChild.type === 'leaf' ? firstChild.id : ''}
          containerSize={getContainerSize()}
          onRatioChange={onRatioChange}
          gap={style.gap}
        />
      </div>

      {/* 두 번째 자식 */}
      <div
        style={{
          flexBasis: secondSize,
          flexShrink: 0,
          borderRadius: style.borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <NodeRenderer
          node={secondChild}
          style={style}
          selectedId={selectedId}
          onSelectCell={onSelectCell}
          onRatioChange={onRatioChange}
          onImageDrag={onImageDrag}
          onDropImage={onDropImage}
        />
      </div>
    </div>
  );
}
```

> **Note:** `CollageDivider`의 `firstChildId`는 첫 번째 자식이 `SplitNode`일 때 빈 문자열이 되는 한계가 있다. Task 1의 `updateRatio`는 `firstChildId`로 리프 id를 찾으므로, SplitNode가 중첩될 경우 `collageDividerNodeId`를 SplitNode 자체에 부여하는 방식으로 추후 개선 가능하다. 이번 MVP에서는 2단계 분할까지만 동작함을 허용한다.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E '^.*error' | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/collage/CollageCanvas.tsx
git commit -m "feat(collage): CollageCanvas 재귀 트리 렌더러"
```

---

## Task 7: CellPopover.tsx — 분할·병합·교체 팝오버

**Files:**
- Create: `src/components/collage/CellPopover.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CellPopover.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CellPopoverProps {
  anchorRect: DOMRect | null; // 선택된 셀의 getBoundingClientRect()
  canMerge: boolean;
  hasImage: boolean;
  isMobile: boolean;
  onSplitH: () => void;
  onSplitV: () => void;
  onMerge: () => void;
  onReplacePhoto: () => void;
  onRemovePhoto: () => void;
  onClose: () => void;
}

export function CellPopover({
  anchorRect,
  canMerge,
  hasImage,
  isMobile,
  onSplitH,
  onSplitV,
  onMerge,
  onReplacePhoto,
  onRemovePhoto,
  onClose,
}: CellPopoverProps) {
  const t = useTranslations('collage');
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!anchorRect) return null;

  // 팝오버 위치: 셀 상단 중앙 (PC), 셀 하단 중앙 (모바일)
  const popoverStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translateX(-50%)',
      }
    : {
        position: 'fixed',
        top: anchorRect.top - 8,
        left: anchorRect.left + anchorRect.width / 2,
        transform: 'translate(-50%, -100%)',
      };

  return (
    <div
      ref={ref}
      style={popoverStyle}
      className={cn(
        'z-50 flex items-center gap-1 rounded-lg border border-border bg-card shadow-lg px-2 py-1.5',
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <PopoverButton onClick={onSplitH} title={t('splitH')}>↔</PopoverButton>
      <Separator />
      <PopoverButton onClick={onSplitV} title={t('splitV')}>↕</PopoverButton>
      {canMerge && (
        <>
          <Separator />
          <PopoverButton onClick={onMerge} title={t('merge')}>⊞</PopoverButton>
        </>
      )}
      <Separator />
      <PopoverButton onClick={onReplacePhoto} title={t('replacePhoto')}>🖼</PopoverButton>
      {hasImage && (
        <>
          <Separator />
          <PopoverButton onClick={onRemovePhoto} title={t('removePhoto')} danger>✕</PopoverButton>
        </>
      )}
    </div>
  );
}

function PopoverButton({
  onClick,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="h-4 w-px bg-border" />;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/collage/CellPopover.tsx
git commit -m "feat(collage): CellPopover 분할·병합·교체 팝오버"
```

---

## Task 8: CollagePanel.tsx — 컨트롤 패널

**Files:**
- Create: `src/components/collage/CollagePanel.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollagePanel.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import type { CollageStyle, AspectRatio } from '@/lib/collageTree';
import type { ImageFile } from '@/lib/types';

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16', '16:9', 'free'];

interface CollagePanelProps {
  style: CollageStyle;
  onStyleChange: (patch: Partial<CollageStyle>) => void;
  onUploadPhoto: (files: File[]) => void;
  onSelectFromImageTab: () => void;
  onExport: () => void;
  isExporting: boolean;
  /** mobile: true이면 하단 패널 스타일 */
  isMobile?: boolean;
}

export function CollagePanel({
  style,
  onStyleChange,
  onUploadPhoto,
  onSelectFromImageTab,
  onExport,
  isExporting,
  isMobile = false,
}: CollagePanelProps) {
  const t = useTranslations('collage');

  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      if (input.files) onUploadPhoto(Array.from(input.files));
    };
    input.click();
  };

  if (isMobile) {
    // 모바일 하단 패널: 간소화된 컨트롤
    return (
      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-border bg-card px-3 py-2">
        {/* 비율 선택 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onStyleChange({ aspectRatio: r })}
              className={`flex-shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
                style.aspectRatio === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {/* gap 슬라이더 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10">{t('styleGap')}</span>
          <input
            type="range"
            min={0}
            max={20}
            value={style.gap}
            onChange={(e) => onStyleChange({ gap: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-8">{style.gap}px</span>
        </div>
        {/* 사진 추가 + 내보내기 */}
        <div className="flex gap-2">
          <button
            onClick={handleFileInput}
            className="flex-1 rounded-md bg-muted py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('uploadPhoto')}
          </button>
          <button
            onClick={onSelectFromImageTab}
            className="flex-1 rounded-md bg-muted py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('fromImageTab')}
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 transition-colors"
          >
            {isExporting ? t('exporting') : t('export')}
          </button>
        </div>
      </div>
    );
  }

  // PC 좌측 패널
  return (
    <aside className="hidden sm:flex w-44 flex-shrink-0 flex-col gap-4 border-r border-border bg-card p-3 overflow-y-auto">
      {/* 비율 */}
      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('aspectRatio')}
        </p>
        <div className="flex flex-wrap gap-1">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onStyleChange({ aspectRatio: r })}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                style.aspectRatio === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* 스타일 */}
      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          스타일
        </p>
        <div className="flex flex-col gap-2">
          <SliderRow
            label={t('styleGap')}
            value={style.gap}
            min={0}
            max={20}
            unit="px"
            onChange={(v) => onStyleChange({ gap: v })}
          />
          <SliderRow
            label={t('styleRadius')}
            value={style.borderRadius}
            min={0}
            max={24}
            unit="px"
            onChange={(v) => onStyleChange({ borderRadius: v })}
          />
          <SliderRow
            label={t('stylePadding')}
            value={style.padding}
            min={0}
            max={40}
            unit="px"
            onChange={(v) => onStyleChange({ padding: v })}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('styleBackground')}</span>
            <input
              type="color"
              value={style.background}
              onChange={(e) => onStyleChange({ background: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
            />
          </div>
        </div>
      </section>

      {/* 사진 추가 */}
      <section>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          사진
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleFileInput}
            className="w-full rounded-md border-2 border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {t('uploadPhoto')}
          </button>
          <button
            onClick={onSelectFromImageTab}
            className="w-full rounded-md bg-muted py-2 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t('fromImageTab')}
          </button>
        </div>
      </section>

      {/* 내보내기 */}
      <div className="mt-auto">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-colors hover:bg-primary/90"
        >
          {isExporting ? t('exporting') : `⬇ ${t('export')}`}
        </button>
      </div>
    </aside>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-8 text-right text-xs text-muted-foreground">
        {value}{unit}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/collage/CollagePanel.tsx
git commit -m "feat(collage): CollagePanel PC/모바일 컨트롤 패널"
```

---

## Task 9: CollageExport.tsx — 내보내기 UI

**Files:**
- Create: `src/components/collage/CollageExport.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollageExport.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ExportFormat, ExportScale } from '@/lib/collageExport';

interface CollageExportProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function CollageExport({ canvasRef }: CollageExportProps) {
  const t = useTranslations('collage');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<ExportScale>(2);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const { exportCollage } = await import('@/lib/collageExport');
      await exportCollage({ format, scale, element: canvasRef.current });
    } finally {
      setIsExporting(false);
    }
  };

  return { format, setFormat, scale, setScale, isExporting, handleExport };
}
```

> `CollageExport`는 UI 렌더링보다는 내보내기 상태를 관리하는 훅처럼 동작한다. 실제 내보내기 버튼 UI는 `CollagePanel`에 포함되며, `handleExport`를 `onExport` prop으로 전달한다. 이를 반영해 파일명은 `useCollageExport.ts`로 변경한다.

- [ ] **Step 2: 파일명 수정 및 내용 교체**

`src/components/collage/CollageExport.tsx`를 삭제하고 `src/hooks/useCollageExport.ts`로 대체:

```typescript
// src/hooks/useCollageExport.ts
'use client';

import { useState } from 'react';
import type { ExportFormat, ExportScale } from '@/lib/collageExport';

export function useCollageExport(canvasRef: React.RefObject<HTMLDivElement>) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<ExportScale>(2);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const { exportCollage } = await import('@/lib/collageExport');
      await exportCollage({ format, scale, element: canvasRef.current });
    } finally {
      setIsExporting(false);
    }
  };

  return { format, setFormat, scale, setScale, isExporting, handleExport };
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useCollageExport.ts
git commit -m "feat(collage): useCollageExport 내보내기 훅"
```

---

## Task 10: CollagePage.tsx — 메인 페이지 조립

**Files:**
- Create: `src/components/collage/CollagePage.tsx`

- [ ] **Step 1: 파일 생성**

```typescript
// src/components/collage/CollagePage.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import { CollageCanvas } from './CollageCanvas';
import { CollagePanel } from './CollagePanel';
import { CellPopover } from './CellPopover';
import { useCollageExport } from '@/hooks/useCollageExport';
import {
  defaultState,
  splitNode,
  mergeNode,
  canMerge,
  updateRatio,
  setImage,
  updateImageTransform,
  makeLeaf,
} from '@/lib/collageTree';
import type { CollageState, CollageStyle } from '@/lib/collageTree';

export function CollagePage() {
  const t = useTranslations('collage');
  const { images } = useAppContext();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const { isExporting, handleExport } = useCollageExport(canvasRef);

  const [state, setState] = useState<CollageState>(defaultState);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const [showImageTabModal, setShowImageTabModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 셀 선택 + 팝오버 위치 계산
  const handleSelectCell = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedId: prev.selectedId === id ? null : id }));
    // 선택된 셀 DOM rect 계산
    setTimeout(() => {
      const el = document.querySelector(`[data-cell-id="${id}"]`);
      if (el) setPopoverRect(el.getBoundingClientRect());
    }, 0);
  }, []);

  const handleClosePopover = useCallback(() => {
    setState((prev) => ({ ...prev, selectedId: null }));
    setPopoverRect(null);
  }, []);

  const handleSplitH = useCallback(() => {
    if (!state.selectedId) return;
    setState((prev) => ({
      ...prev,
      tree: splitNode(prev.tree, prev.selectedId!, 'h'),
      selectedId: null,
    }));
    setPopoverRect(null);
  }, [state.selectedId]);

  const handleSplitV = useCallback(() => {
    if (!state.selectedId) return;
    setState((prev) => ({
      ...prev,
      tree: splitNode(prev.tree, prev.selectedId!, 'v'),
      selectedId: null,
    }));
    setPopoverRect(null);
  }, [state.selectedId]);

  const handleMerge = useCallback(() => {
    if (!state.selectedId) return;
    setState((prev) => ({
      ...prev,
      tree: mergeNode(prev.tree, prev.selectedId!),
      selectedId: null,
    }));
    setPopoverRect(null);
  }, [state.selectedId]);

  const handleReplacePhoto = useCallback(() => {
    if (!state.selectedId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const src = URL.createObjectURL(file);
      setState((prev) => ({
        ...prev,
        tree: setImage(prev.tree, prev.selectedId!, { src, x: 0, y: 0, scale: 1 }),
      }));
    };
    input.click();
    setPopoverRect(null);
  }, [state.selectedId]);

  const handleRemovePhoto = useCallback(() => {
    if (!state.selectedId) return;
    setState((prev) => ({
      ...prev,
      tree: setImage(prev.tree, prev.selectedId!, undefined),
    }));
    setPopoverRect(null);
  }, [state.selectedId]);

  const handleRatioChange = useCallback(
    (firstChildId: string, ratio: number, _isDone: boolean) => {
      setState((prev) => ({
        ...prev,
        tree: updateRatio(prev.tree, firstChildId, ratio),
      }));
    },
    [],
  );

  const handleImageDrag = useCallback((id: string, dx: number, dy: number) => {
    setState((prev) => ({
      ...prev,
      tree: updateImageTransform(prev.tree, id, {
        x: undefined, // updateImageTransform에서 prev.image.x + dx 처리 필요
        y: undefined,
      }),
    }));
    // updateImageTransform은 절대값을 받으므로, 현재 값에 delta를 더하는 래퍼 사용
    setState((prev) => {
      const leaf = findLeaf(prev.tree, id);
      if (!leaf?.image) return prev;
      return {
        ...prev,
        tree: updateImageTransform(prev.tree, id, {
          x: leaf.image.x + dx,
          y: leaf.image.y + dy,
        }),
      };
    });
  }, []);

  const handleDropImage = useCallback((id: string, src: string) => {
    setState((prev) => ({
      ...prev,
      tree: setImage(prev.tree, id, { src, x: 0, y: 0, scale: 1 }),
    }));
  }, []);

  const handleUploadPhoto = useCallback((files: File[]) => {
    // 선택된 셀이 있으면 첫 번째 파일을 배치, 없으면 순서대로 빈 셀에 배치
    files.forEach((file, i) => {
      const src = URL.createObjectURL(file);
      setState((prev) => {
        const targetId = state.selectedId ?? findFirstEmptyLeaf(prev.tree);
        if (!targetId) return prev;
        return { ...prev, tree: setImage(prev.tree, targetId, { src, x: 0, y: 0, scale: 1 }) };
      });
    });
  }, [state.selectedId]);

  // 이미지탭 사진 선택 모달
  const handleSelectFromImageTab = useCallback(() => {
    setShowImageTabModal(true);
    setPopoverRect(null);
  }, []);

  const handleImageTabSelect = useCallback(
    (src: string) => {
      const targetId = state.selectedId ?? findFirstEmptyLeaf(state.tree);
      if (!targetId) return;
      setState((prev) => ({
        ...prev,
        tree: setImage(prev.tree, targetId, { src, x: 0, y: 0, scale: 1 }),
      }));
      setShowImageTabModal(false);
    },
    [state.selectedId, state.tree],
  );

  const handleStyleChange = useCallback((patch: Partial<CollageStyle>) => {
    setState((prev) => ({ ...prev, style: { ...prev.style, ...patch } }));
  }, []);

  const selectedLeaf = state.selectedId
    ? findLeaf(state.tree, state.selectedId)
    : null;

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* PC 좌측 패널 */}
      <CollagePanel
        style={state.style}
        onStyleChange={handleStyleChange}
        onUploadPhoto={handleUploadPhoto}
        onSelectFromImageTab={handleSelectFromImageTab}
        onExport={handleExport}
        isExporting={isExporting}
        isMobile={false}
      />

      {/* 캔버스 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CollageCanvas
          tree={state.tree}
          style={state.style}
          selectedId={state.selectedId}
          onSelectCell={handleSelectCell}
          onRatioChange={handleRatioChange}
          onImageDrag={handleImageDrag}
          onDropImage={handleDropImage}
          canvasRef={canvasRef}
        />

        {/* 모바일 하단 패널 */}
        <div className="sm:hidden">
          <CollagePanel
            style={state.style}
            onStyleChange={handleStyleChange}
            onUploadPhoto={handleUploadPhoto}
            onSelectFromImageTab={handleSelectFromImageTab}
            onExport={handleExport}
            isExporting={isExporting}
            isMobile={true}
          />
        </div>
      </div>

      {/* 팝오버 */}
      {state.selectedId && popoverRect && (
        <CellPopover
          anchorRect={popoverRect}
          canMerge={canMerge(state.tree, state.selectedId)}
          hasImage={!!selectedLeaf?.image}
          isMobile={isMobile}
          onSplitH={handleSplitH}
          onSplitV={handleSplitV}
          onMerge={handleMerge}
          onReplacePhoto={handleReplacePhoto}
          onRemovePhoto={handleRemovePhoto}
          onClose={handleClosePopover}
        />
      )}

      {/* 이미지탭 사진 선택 모달 */}
      {showImageTabModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowImageTabModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-sm font-semibold">{t('selectFromImageTab')}</h3>
            <p className="mb-3 text-xs text-muted-foreground">{t('selectFromImageTabHint')}</p>
            {images.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noImages')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleImageTabSelect(img.previewUrl)}
                    className="aspect-square overflow-hidden rounded-md border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowImageTabModal(false)}
              className="mt-3 w-full rounded-md bg-muted py-2 text-xs text-muted-foreground hover:bg-muted/80"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

import type { CollageNode, LeafNode } from '@/lib/collageTree';

function findLeaf(node: CollageNode, id: string): LeafNode | null {
  if (node.type === 'leaf') return node.id === id ? node : null;
  return findLeaf(node.children[0], id) ?? findLeaf(node.children[1], id);
}

function findFirstEmptyLeaf(node: CollageNode): string | null {
  if (node.type === 'leaf') return node.image ? null : node.id;
  return findFirstEmptyLeaf(node.children[0]) ?? findFirstEmptyLeaf(node.children[1]);
}
```

> **Note:** `handleImageDrag`가 `setState`를 두 번 호출하는 부분이 비효율적이다. Task 1에서 `updateImageTransform`이 delta 방식을 지원하도록 수정하거나, `findLeaf`를 먼저 호출 후 setState를 한 번만 호출하도록 아래처럼 수정한다.

- [ ] **Step 2: handleImageDrag 수정** (위 파일에서 해당 함수를 교체)

```typescript
const handleImageDrag = useCallback((id: string, dx: number, dy: number) => {
  setState((prev) => {
    const leaf = findLeaf(prev.tree, id);
    if (!leaf?.image) return prev;
    return {
      ...prev,
      tree: updateImageTransform(prev.tree, id, {
        x: leaf.image.x + dx,
        y: leaf.image.y + dy,
      }),
    };
  });
}, []);
```

- [ ] **Step 3: data-cell-id 속성 추가**

`CollageCell.tsx`의 루트 `<div>`에 `data-cell-id` 속성 추가:

```typescript
// CollageCell.tsx의 return 문 수정
<div
  data-cell-id={node.id}  // 추가
  className={cn(...)}
  ...
>
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -30
```

Expected: 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add src/components/collage/CollagePage.tsx src/components/collage/CollageCell.tsx
git commit -m "feat(collage): CollagePage 메인 조립 + 이미지탭 연동"
```

---

## Task 11: 통합 검증

- [ ] **Step 1: 개발 서버 실행 + 수동 검증**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기 후 아래 체크리스트 확인:

- [ ] 콜라주 탭 아이콘 표시 (PC 사이드바, 모바일 하단 탭)
- [ ] 콜라주 탭 클릭 시 빈 셀 1개 표시
- [ ] 셀 클릭 → 팝오버 표시 (분할 버튼 2개)
- [ ] 가로 분할 → 2개 셀로 분리
- [ ] 세로 분할 → 2개 셀로 분리
- [ ] 분할된 셀 재분할 → 3개 이상 셀
- [ ] 디바이더 드래그 → 셀 비율 실시간 변경
- [ ] 셀 클릭 → 사진 추가 (파일 피커)
- [ ] 사진 있는 셀 → 팝오버에 "사진 교체" / "사진 제거" 표시
- [ ] 이미지탭에 사진 업로드 후 콜라주로 이동 → "이미지탭에서 가져오기" → 사진 목록 표시 → 선택 → 셀에 배치
- [ ] gap / 모서리 / 배경색 / 패딩 변경 시 실시간 반영
- [ ] 내보내기 버튼 → PNG 파일 다운로드

- [ ] **Step 2: 최종 빌드 확인**

```bash
npm run build 2>&1
```

Expected: 빌드 성공, 에러 없음

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat(collage): Phase 3b 프리폼 콜라주 에디터 완성"
```

---

## 알려진 MVP 제한사항

| 제한 | 내용 |
|------|------|
| 디바이더 중첩 | SplitNode 중첩 시 `updateRatio`의 `firstChildId` 식별 한계. 2단계 분할까지 정상 동작. |
| 핀치줌 | 셀 내 사진 핀치줌 미지원 (Phase 4 예정) |
| Undo/Redo | 미지원 (Feature 17과 함께) |
| html2canvas 한계 | CSS filter, mix-blend-mode 미지원. 복잡한 스타일은 출력 결과가 다를 수 있음. |
