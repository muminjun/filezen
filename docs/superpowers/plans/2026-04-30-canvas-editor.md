# Canvas Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 collage 탭을 React-Konva 기반 자유 배치 캔버스 에디터(이미지·텍스트·도형, Undo/Redo, PNG 내보내기)로 완전 교체한다.

**Architecture:** Konva Stage를 `CanvasStage`가 렌더링하고, `CanvasPage`가 useReducer로 전체 상태를 관리한다. 요소별 컴포넌트(ImageElement, TextElement, ShapeElement)는 Konva 노드를 래핑하고, Transformer는 CanvasStage 레벨에서 선택된 요소에 붙인다. 텍스트 인라인 편집은 DOM textarea 오버레이로 처리한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Konva 9, react-konva 18, Tailwind CSS, shadcn/ui, lucide-react

---

## 파일 맵

| 상태 | 경로 | 역할 |
|------|------|------|
| 생성 | `src/types/canvas.ts` | 모든 캔버스 타입 정의 |
| 생성 | `src/hooks/useCanvasHistory.ts` | Undo/Redo 히스토리 스택 |
| 생성 | `src/hooks/useCanvasExport.ts` | stage.toDataURL() 내보내기 |
| 생성 | `src/components/canvas/elements/ImageElement.tsx` | Konva.Image 래퍼 |
| 생성 | `src/components/canvas/elements/TextElement.tsx` | Konva.Text + DOM textarea |
| 생성 | `src/components/canvas/elements/ShapeElement.tsx` | Konva.Rect / Konva.Circle |
| 생성 | `src/components/canvas/CanvasStage.tsx` | Konva Stage + Layer + Transformer |
| 생성 | `src/components/canvas/CanvasToolbar.tsx` | 좌측 도구 패널 |
| 생성 | `src/components/canvas/CanvasTopbar.tsx` | 상단 바 (비율·Undo·내보내기) |
| 생성 | `src/components/canvas/CanvasProperties.tsx` | 우측 속성 패널 |
| 생성 | `src/components/canvas/CanvasPage.tsx` | 메인 페이지 (상태 오케스트레이터) |
| 수정 | `src/app/[locale]/page.tsx` | CollagePage → CanvasPage |
| 수정 | `src/messages/ko.json` | canvas 번역 키 추가 |
| 수정 | `src/messages/en.json` | canvas 번역 키 추가 |
| 삭제 | `src/components/collage/` | 전체 디렉토리 |
| 삭제 | `src/lib/collageTree.ts` | 기존 트리 로직 |
| 삭제 | `src/lib/collageExport.ts` | 기존 내보내기 |
| 삭제 | `src/hooks/useCollageExport.ts` | 기존 훅 |

---

## Task 1: konva + react-konva 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/minjun/Documents/filezen
npm install konva react-konva
```

Expected output: `added 2 packages` (또는 유사한 성공 메시지)

- [ ] **Step 2: 타입 확인**

```bash
ls node_modules/konva/types/
```

konva는 자체 타입을 포함하므로 `@types/konva`는 불필요.

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "feat: install konva + react-konva"
```

---

## Task 2: 캔버스 타입 정의

**Files:**
- Create: `src/types/canvas.ts`

- [ ] **Step 1: 타입 파일 생성**

`src/types/canvas.ts`를 생성하고 다음 내용 작성:

```typescript
export interface BaseEl {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface ImageEl extends BaseEl {
  type: 'image';
  src: string;
}

export interface TextEl extends BaseEl {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

export interface ShapeEl extends BaseEl {
  type: 'shape';
  shape: 'rect' | 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export type CanvasElement = ImageEl | TextEl | ShapeEl;

export type CanvasBackground =
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string; direction: 'horizontal' | 'vertical' }
  | { type: 'image'; src: string };

export interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

export interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  background: CanvasBackground;
  canvasSize: CanvasSize;
}

export type ToolType = 'select' | 'text' | 'shape-rect' | 'shape-circle' | 'image' | 'background';

export const CANVAS_PRESETS: CanvasSize[] = [
  { width: 800, height: 800, label: '1:1' },
  { width: 800, height: 1000, label: '4:5' },
  { width: 675, height: 1200, label: '9:16' },
  { width: 1280, height: 720, label: '16:9' },
  { width: 800, height: 600, label: 'Free' },
];

export const DEFAULT_CANVAS_STATE: CanvasState = {
  elements: [],
  selectedId: null,
  background: { type: 'color', color: '#ffffff' },
  canvasSize: CANVAS_PRESETS[0],
};
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음 (또는 기존 에러만)

- [ ] **Step 3: 커밋**

```bash
git add src/types/canvas.ts
git commit -m "feat: canvas 타입 정의 추가"
```

---

## Task 3: useCanvasHistory 훅

**Files:**
- Create: `src/hooks/useCanvasHistory.ts`

- [ ] **Step 1: 훅 생성**

`src/hooks/useCanvasHistory.ts` 생성:

```typescript
import { useCallback, useRef, useState } from 'react';
import type { CanvasState } from '@/types/canvas';
import { DEFAULT_CANVAS_STATE } from '@/types/canvas';

const MAX_HISTORY = 50;

export function useCanvasHistory() {
  const [state, setState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const past = useRef<CanvasState[]>([]);
  const future = useRef<CanvasState[]>([]);

  const push = useCallback((next: CanvasState) => {
    past.current = [...past.current.slice(-MAX_HISTORY + 1), state];
    future.current = [];
    setState(next);
  }, [state]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [state, ...future.current];
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, state];
    setState(next);
  }, [state]);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return { state, push, undo, redo, canUndo, canRedo };
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useCanvasHistory.ts
git commit -m "feat: useCanvasHistory Undo/Redo 훅 추가"
```

---

## Task 4: useCanvasExport 훅

**Files:**
- Create: `src/hooks/useCanvasExport.ts`

- [ ] **Step 1: 훅 생성**

`src/hooks/useCanvasExport.ts` 생성:

```typescript
import { useCallback, useState } from 'react';
import type Konva from 'konva';

export function useCanvasExport(stageRef: React.RefObject<Konva.Stage | null>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!stageRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      const link = document.createElement('a');
      link.download = `canvas-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [stageRef]);

  return { isExporting, handleExport };
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useCanvasExport.ts
git commit -m "feat: useCanvasExport PNG 내보내기 훅 추가"
```

---

## Task 5: ImageElement 컴포넌트

**Files:**
- Create: `src/components/canvas/elements/ImageElement.tsx`

- [ ] **Step 1: 디렉토리 생성 확인**

```bash
mkdir -p /Users/minjun/Documents/filezen/src/components/canvas/elements
```

- [ ] **Step 2: ImageElement 생성**

`src/components/canvas/elements/ImageElement.tsx` 생성:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ImageEl } from '@/types/canvas';

interface ImageElementProps {
  el: ImageEl;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageEl>) => void;
}

export function ImageElement({ el, isSelected, onSelect, onChange }: ImageElementProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const ref = useRef<any>(null);

  useEffect(() => {
    const image = new window.Image();
    image.src = el.src;
    image.onload = () => setImg(image);
  }, [el.src]);

  return (
    <KonvaImage
      ref={ref}
      id={el.id}
      image={img ?? undefined}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * node.scaleX()),
          height: Math.max(10, node.height() * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/canvas/elements/ImageElement.tsx
git commit -m "feat: ImageElement Konva 이미지 요소 추가"
```

---

## Task 6: ShapeElement 컴포넌트

**Files:**
- Create: `src/components/canvas/elements/ShapeElement.tsx`

- [ ] **Step 1: ShapeElement 생성**

`src/components/canvas/elements/ShapeElement.tsx` 생성:

```typescript
'use client';

import { Rect, Circle } from 'react-konva';
import type { ShapeEl } from '@/types/canvas';

interface ShapeElementProps {
  el: ShapeEl;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ShapeEl>) => void;
}

export function ShapeElement({ el, isSelected, onSelect, onChange }: ShapeElementProps) {
  const common = {
    id: el.id,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    opacity: el.opacity,
    fill: el.fill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: any) => onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: any) => {
      const node = e.target;
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * node.scaleX()),
        height: Math.max(10, node.height() * node.scaleY()),
        rotation: node.rotation(),
      });
      node.scaleX(1);
      node.scaleY(1);
    },
  };

  if (el.shape === 'circle') {
    return <Circle {...common} radiusX={el.width / 2} radiusY={el.height / 2} x={el.x + el.width / 2} y={el.y + el.height / 2} />;
  }

  return <Rect {...common} cornerRadius={4} />;
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/elements/ShapeElement.tsx
git commit -m "feat: ShapeElement Konva 도형 요소 추가"
```

---

## Task 7: TextElement 컴포넌트

**Files:**
- Create: `src/components/canvas/elements/TextElement.tsx`

- [ ] **Step 1: TextElement 생성**

`src/components/canvas/elements/TextElement.tsx` 생성:

```typescript
'use client';

import { useRef, useState } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextEl } from '@/types/canvas';

interface TextElementProps {
  el: TextEl;
  stageRef: React.RefObject<Konva.Stage | null>;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextEl>) => void;
}

export function TextElement({ el, stageRef, isSelected, onSelect, onChange }: TextElementProps) {
  const textRef = useRef<Konva.Text>(null);
  const [editing, setEditing] = useState(false);

  const handleDblClick = () => {
    if (!textRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const textNode = textRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    const absPos = textNode.getAbsolutePosition();
    const scale = stage.scaleX();

    const textarea = document.createElement('textarea');
    textarea.value = el.text;
    textarea.style.cssText = `
      position: fixed;
      top: ${stageBox.top + absPos.y * scale}px;
      left: ${stageBox.left + absPos.x * scale}px;
      width: ${el.width * scale}px;
      font-size: ${el.fontSize * scale}px;
      font-weight: ${el.bold ? 'bold' : 'normal'};
      font-style: ${el.italic ? 'italic' : 'normal'};
      color: ${el.color};
      background: transparent;
      border: 1px dashed #6366f1;
      outline: none;
      resize: none;
      padding: 2px;
      z-index: 9999;
      line-height: 1.2;
      overflow: hidden;
      transform: rotate(${el.rotation}deg);
      transform-origin: top left;
    `;
    document.body.appendChild(textarea);
    textarea.focus();
    setEditing(true);

    const finish = () => {
      onChange({ text: textarea.value });
      document.body.removeChild(textarea);
      setEditing(false);
    };

    textarea.addEventListener('blur', finish, { once: true });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') textarea.blur();
    });
  };

  return (
    <Text
      ref={textRef}
      id={el.id}
      text={el.text}
      x={el.x}
      y={el.y}
      width={el.width}
      fontSize={el.fontSize}
      fill={el.color}
      fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
      align={el.align}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={!editing}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * node.scaleX()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/elements/TextElement.tsx
git commit -m "feat: TextElement Konva 텍스트 요소 + 인라인 편집 추가"
```

---

## Task 8: CanvasStage 컴포넌트

**Files:**
- Create: `src/components/canvas/CanvasStage.tsx`

- [ ] **Step 1: CanvasStage 생성**

`src/components/canvas/CanvasStage.tsx` 생성:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Image as KonvaImage } from 'react-konva';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { CanvasState, CanvasElement, ImageEl, TextEl, ShapeEl } from '@/types/canvas';
import { ImageElement } from './elements/ImageElement';
import { TextElement } from './elements/TextElement';
import { ShapeElement } from './elements/ShapeElement';

interface CanvasStageProps {
  state: CanvasState;
  stageRef: React.RefObject<Konva.Stage | null>;
  onSelectElement: (id: string | null) => void;
  onChange: (id: string, patch: Partial<CanvasElement>) => void;
  scale: number;
}

export function CanvasStage({ state, stageRef, onSelectElement, onChange, scale }: CanvasStageProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    if (state.selectedId) {
      const node = stage.findOne(`#${state.selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [state.selectedId, stageRef]);

  const { width, height } = state.canvasSize;

  const renderBackground = () => {
    const bg = state.background;
    if (bg.type === 'color') {
      return <Rect x={0} y={0} width={width} height={height} fill={bg.color} listening={false} />;
    }
    if (bg.type === 'gradient') {
      const isH = bg.direction === 'horizontal';
      return (
        <Rect
          x={0} y={0} width={width} height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: isH ? width : 0, y: isH ? 0 : height }}
          fillLinearGradientColorStops={[0, bg.from, 1, bg.to]}
          listening={false}
        />
      );
    }
    return null;
  };

  return (
    <div
      className="flex flex-1 items-center justify-center bg-muted/20 overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onClick={(e) => { if (e.target === e.target.getStage()) onSelectElement(null); }}
          onTap={(e) => { if (e.target === e.target.getStage()) onSelectElement(null); }}
        >
          <Layer>
            {renderBackground()}
            {state.elements.map((el) => {
              if (el.type === 'image') {
                return (
                  <ImageElement
                    key={el.id}
                    el={el as ImageEl}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              if (el.type === 'text') {
                return (
                  <TextElement
                    key={el.id}
                    el={el as TextEl}
                    stageRef={stageRef}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              if (el.type === 'shape') {
                return (
                  <ShapeElement
                    key={el.id}
                    el={el as ShapeEl}
                    isSelected={state.selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={(patch) => onChange(el.id, patch)}
                  />
                );
              }
              return null;
            })}
            <Transformer
              ref={transformerRef}
              anchorFill="#6366f1"
              anchorStroke="#6366f1"
              anchorSize={8}
              anchorCornerRadius={4}
              borderStroke="#6366f1"
              borderDash={[4, 4]}
              rotateAnchorOffset={20}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/CanvasStage.tsx
git commit -m "feat: CanvasStage Konva Stage + Transformer 추가"
```

---

## Task 9: CanvasToolbar 컴포넌트

**Files:**
- Create: `src/components/canvas/CanvasToolbar.tsx`

- [ ] **Step 1: CanvasToolbar 생성**

`src/components/canvas/CanvasToolbar.tsx` 생성:

```typescript
'use client';

import { MousePointer2, Type, Shapes, ImageIcon, Palette, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolType } from '@/types/canvas';

interface CanvasToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onImageUpload: (file: File) => void;
}

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <MousePointer2 size={20} />, label: '선택' },
  { id: 'text', icon: <Type size={20} />, label: '텍스트' },
  { id: 'shape-rect', icon: <Square size={20} />, label: '사각형' },
  { id: 'shape-circle', icon: <Circle size={20} />, label: '원' },
  { id: 'image', icon: <ImageIcon size={20} />, label: '이미지' },
  { id: 'background', icon: <Palette size={20} />, label: '배경' },
];

export function CanvasToolbar({ activeTool, onToolChange, onImageUpload }: CanvasToolbarProps) {
  const handleToolClick = (tool: ToolType) => {
    if (tool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) onImageUpload(file);
      };
      input.click();
      return;
    }
    onToolChange(tool);
  };

  return (
    <aside className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center border-r border-border bg-card py-4 gap-1">
      {TOOLS.map(({ id, icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => handleToolClick(id)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
            activeTool === id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {icon}
        </button>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/CanvasToolbar.tsx
git commit -m "feat: CanvasToolbar 좌측 도구 패널 추가"
```

---

## Task 10: CanvasTopbar 컴포넌트

**Files:**
- Create: `src/components/canvas/CanvasTopbar.tsx`

- [ ] **Step 1: CanvasTopbar 생성**

`src/components/canvas/CanvasTopbar.tsx` 생성:

```typescript
'use client';

import { Undo2, Redo2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CANVAS_PRESETS } from '@/types/canvas';
import type { CanvasSize } from '@/types/canvas';

interface CanvasTopbarProps {
  canvasSize: CanvasSize;
  onSizeChange: (size: CanvasSize) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isExporting: boolean;
  onExport: () => void;
}

export function CanvasTopbar({
  canvasSize,
  onSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isExporting,
  onExport,
}: CanvasTopbarProps) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 gap-4">
      {/* 비율 프리셋 */}
      <div className="flex items-center gap-1">
        {CANVAS_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSizeChange(preset)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              canvasSize.label === preset.label
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Undo / Redo / Export */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="실행취소 (Cmd+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="다시실행 (Cmd+Shift+Z)"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="ml-2 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download size={14} />
          {isExporting ? '내보내는 중...' : '내보내기'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/CanvasTopbar.tsx
git commit -m "feat: CanvasTopbar 상단 바 추가"
```

---

## Task 11: CanvasProperties 컴포넌트

**Files:**
- Create: `src/components/canvas/CanvasProperties.tsx`

- [ ] **Step 1: CanvasProperties 생성**

`src/components/canvas/CanvasProperties.tsx` 생성:

```typescript
'use client';

import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { CanvasElement, ImageEl, TextEl, ShapeEl, CanvasBackground } from '@/types/canvas';

interface CanvasPropertiesProps {
  selected: CanvasElement | null;
  background: CanvasBackground;
  showBackground: boolean;
  onChangeElement: (patch: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
  onMoveLayer: (direction: 'up' | 'down') => void;
  onChangeBackground: (bg: CanvasBackground) => void;
}

export function CanvasProperties({
  selected,
  background,
  showBackground,
  onChangeElement,
  onDeleteElement,
  onMoveLayer,
  onChangeBackground,
}: CanvasPropertiesProps) {
  if (!selected && !showBackground) return null;

  return (
    <aside className="hidden sm:flex w-56 flex-shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
      <div className="p-3 space-y-4">
        {showBackground && !selected && (
          <BackgroundPanel bg={background} onChange={onChangeBackground} />
        )}

        {selected && selected.type === 'image' && (
          <ImagePanel el={selected as ImageEl} onChange={onChangeElement} />
        )}
        {selected && selected.type === 'text' && (
          <TextPanel el={selected as TextEl} onChange={onChangeElement} />
        )}
        {selected && selected.type === 'shape' && (
          <ShapePanel el={selected as ShapeEl} onChange={onChangeElement} />
        )}

        {selected && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">레이어</p>
            <div className="flex gap-1">
              <button onClick={() => onMoveLayer('up')} className="flex-1 flex items-center justify-center gap-1 rounded border border-border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                <ChevronUp size={14} /> 앞으로
              </button>
              <button onClick={() => onMoveLayer('down')} className="flex-1 flex items-center justify-center gap-1 rounded border border-border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                <ChevronDown size={14} /> 뒤로
              </button>
            </div>
            <button onClick={onDeleteElement} className="w-full flex items-center justify-center gap-1.5 rounded border border-red-500/30 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1">{children}</p>;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5" />
      <span className="text-xs text-muted-foreground font-mono">{value.toUpperCase()}</span>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">{Math.round(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
    </div>
  );
}

function ImagePanel({ el, onChange }: { el: ImageEl; onChange: (p: Partial<ImageEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">이미지</p>
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function TextPanel({ el, onChange }: { el: TextEl; onChange: (p: Partial<TextEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">텍스트</p>
      <SliderRow label="폰트 크기" value={el.fontSize} min={8} max={200}
        onChange={(v) => onChange({ fontSize: v })} />
      <div>
        <Label>색상</Label>
        <ColorInput value={el.color} onChange={(v) => onChange({ color: v })} />
      </div>
      <div className="flex gap-1">
        <button onClick={() => onChange({ bold: !el.bold })}
          className={`flex-1 rounded border py-1 text-xs font-bold transition-colors ${el.bold ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>B</button>
        <button onClick={() => onChange({ italic: !el.italic })}
          className={`flex-1 rounded border py-1 text-xs italic transition-colors ${el.italic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>I</button>
      </div>
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} onClick={() => onChange({ align: a })}
            className={`flex-1 rounded border py-1 text-xs transition-colors ${el.align === a ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
          </button>
        ))}
      </div>
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function ShapePanel({ el, onChange }: { el: ShapeEl; onChange: (p: Partial<ShapeEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">도형</p>
      <div>
        <Label>채우기</Label>
        <ColorInput value={el.fill} onChange={(v) => onChange({ fill: v })} />
      </div>
      <div>
        <Label>테두리 색</Label>
        <ColorInput value={el.stroke} onChange={(v) => onChange({ stroke: v })} />
      </div>
      <SliderRow label="테두리 두께" value={el.strokeWidth} min={0} max={20}
        onChange={(v) => onChange({ strokeWidth: v })} />
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function BackgroundPanel({ bg, onChange }: { bg: CanvasBackground; onChange: (b: CanvasBackground) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">배경</p>
      <div className="flex gap-1">
        {(['color', 'gradient'] as const).map((t) => (
          <button key={t} onClick={() => onChange(t === 'color' ? { type: 'color', color: '#ffffff' } : { type: 'gradient', from: '#6366f1', to: '#818cf8', direction: 'horizontal' })}
            className={`flex-1 rounded border py-1 text-xs transition-colors ${bg.type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {t === 'color' ? '단색' : '그라디언트'}
          </button>
        ))}
      </div>
      {bg.type === 'color' && (
        <div>
          <Label>색상</Label>
          <ColorInput value={bg.color} onChange={(v) => onChange({ ...bg, color: v })} />
        </div>
      )}
      {bg.type === 'gradient' && (
        <>
          <div><Label>시작 색</Label><ColorInput value={bg.from} onChange={(v) => onChange({ ...bg, from: v })} /></div>
          <div><Label>끝 색</Label><ColorInput value={bg.to} onChange={(v) => onChange({ ...bg, to: v })} /></div>
          <div className="flex gap-1">
            {(['horizontal', 'vertical'] as const).map((d) => (
              <button key={d} onClick={() => onChange({ ...bg, direction: d })}
                className={`flex-1 rounded border py-1 text-xs transition-colors ${bg.direction === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                {d === 'horizontal' ? '가로' : '세로'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/CanvasProperties.tsx
git commit -m "feat: CanvasProperties 우측 속성 패널 추가"
```

---

## Task 12: CanvasPage 메인 컴포넌트

**Files:**
- Create: `src/components/canvas/CanvasPage.tsx`

- [ ] **Step 1: CanvasPage 생성**

`src/components/canvas/CanvasPage.tsx` 생성:

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type Konva from 'konva';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasExport } from '@/hooks/useCanvasExport';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasTopbar } from './CanvasTopbar';
import { CanvasProperties } from './CanvasProperties';
import type {
  CanvasElement, CanvasBackground, CanvasSize, ToolType,
  ImageEl, TextEl, ShapeEl,
} from '@/types/canvas';
import { CANVAS_PRESETS } from '@/types/canvas';

const CanvasStage = dynamic(() => import('./CanvasStage').then((m) => m.CanvasStage), { ssr: false });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function computeScale(containerW: number, containerH: number, canvasW: number, canvasH: number) {
  const scaleX = (containerW - 64) / canvasW;
  const scaleY = (containerH - 32) / canvasH;
  return Math.min(scaleX, scaleY, 1);
}

export function CanvasPage() {
  const { state, push, undo, redo, canUndo, canRedo } = useCanvasHistory();
  const stageRef = useRef<Konva.Stage>(null);
  const { isExporting, handleExport } = useCanvasExport(stageRef);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [showBackground, setShowBackground] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;
      setScale(computeScale(offsetWidth, offsetHeight, state.canvasSize.width, state.canvasSize.height));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [state.canvasSize]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
        push({ ...state, elements: state.elements.filter((el) => el.id !== state.selectedId), selectedId: null });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, push, undo, redo]);

  const handleSelectElement = useCallback((id: string | null) => {
    setShowBackground(false);
    push({ ...state, selectedId: id });
  }, [state, push]);

  const handleChangeElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    push({
      ...state,
      elements: state.elements.map((el) => el.id === id ? { ...el, ...patch } as CanvasElement : el),
    });
  }, [state, push]);

  const handleDeleteElement = useCallback(() => {
    if (!state.selectedId) return;
    push({ ...state, elements: state.elements.filter((el) => el.id !== state.selectedId), selectedId: null });
  }, [state, push]);

  const handleMoveLayer = useCallback((direction: 'up' | 'down') => {
    if (!state.selectedId) return;
    const idx = state.elements.findIndex((el) => el.id === state.selectedId);
    if (idx === -1) return;
    const next = [...state.elements];
    if (direction === 'up' && idx < next.length - 1) {
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    } else if (direction === 'down' && idx > 0) {
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    }
    push({ ...state, elements: next });
  }, [state, push]);

  const handleChangeBackground = useCallback((bg: CanvasBackground) => {
    push({ ...state, background: bg });
  }, [state, push]);

  const handleSizeChange = useCallback((size: CanvasSize) => {
    push({ ...state, canvasSize: size });
  }, [state, push]);

  const handleImageUpload = useCallback((file: File) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxW = state.canvasSize.width * 0.6;
      const maxH = state.canvasSize.height * 0.6;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const el: ImageEl = {
        id: uid(), type: 'image', src,
        x: (state.canvasSize.width - w) / 2, y: (state.canvasSize.height - h) / 2,
        width: w, height: h, rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
    };
    img.src = src;
    setActiveTool('select');
  }, [state, push]);

  const handleStageClick = useCallback(() => {
    if (activeTool === 'text') {
      const el: TextEl = {
        id: uid(), type: 'text', text: '텍스트를 입력하세요',
        x: state.canvasSize.width / 2 - 100, y: state.canvasSize.height / 2 - 20,
        width: 200, height: 40, fontSize: 32, color: '#111827',
        bold: false, italic: false, align: 'center', rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
      setActiveTool('select');
    } else if (activeTool === 'shape-rect' || activeTool === 'shape-circle') {
      const el: ShapeEl = {
        id: uid(), type: 'shape',
        shape: activeTool === 'shape-rect' ? 'rect' : 'circle',
        x: state.canvasSize.width / 2 - 75, y: state.canvasSize.height / 2 - 75,
        width: 150, height: 150,
        fill: '#6366f1', stroke: '#4f46e5', strokeWidth: 0,
        rotation: 0, opacity: 1,
      };
      push({ ...state, elements: [...state.elements, el], selectedId: el.id });
      setActiveTool('select');
    }
  }, [activeTool, state, push]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'background') {
      setShowBackground(true);
      push({ ...state, selectedId: null });
    } else {
      setShowBackground(false);
    }
  };

  const selectedEl = state.selectedId ? state.elements.find((el) => el.id === state.selectedId) ?? null : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CanvasTopbar
        canvasSize={state.canvasSize}
        onSizeChange={handleSizeChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isExporting={isExporting}
        onExport={handleExport}
      />
      <div className="flex flex-1 overflow-hidden">
        <CanvasToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onImageUpload={handleImageUpload}
        />
        <div ref={containerRef} className="flex flex-1 overflow-hidden" onClick={handleStageClick}>
          <CanvasStage
            state={state}
            stageRef={stageRef}
            onSelectElement={handleSelectElement}
            onChange={handleChangeElement}
            scale={scale}
          />
        </div>
        <CanvasProperties
          selected={selectedEl ?? null}
          background={state.background}
          showBackground={showBackground}
          onChangeElement={(patch) => { if (state.selectedId) handleChangeElement(state.selectedId, patch); }}
          onDeleteElement={handleDeleteElement}
          onMoveLayer={handleMoveLayer}
          onChangeBackground={handleChangeBackground}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/canvas/CanvasPage.tsx
git commit -m "feat: CanvasPage 메인 오케스트레이터 추가"
```

---

## Task 13: 진입점 연결 및 번역 업데이트

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: page.tsx 수정**

`src/app/[locale]/page.tsx`를 다음으로 교체:

```typescript
import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage } from '@/components/image/ImagePage';
import { FilePage } from '@/components/file/FilePage';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import { ConvertPage } from '@/components/convert/ConvertPage';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DrawerLayout
      imageTab={<ImagePage />}
      fileTab={<FilePage />}
      collageTab={<CanvasPage />}
      convertTab={<ConvertPage />}
    />
  );
}
```

- [ ] **Step 2: ko.json collage 키 유지 확인**

`DrawerLayout.tsx`가 `tc('tab')` (collage.tab)을 사용하므로 번역 키는 그대로 유지. 필요시 값만 업데이트:

`src/messages/ko.json`의 `"collage"` 섹션에서 `"tab"` 값 확인:
```json
"collage": {
  "tab": "캔버스"
}
```

`src/messages/en.json`의 `"collage"` 섹션:
```json
"collage": {
  "tab": "Canvas"
}
```

(나머지 collage 키들은 더 이상 사용되지 않지만 에러를 방지하기 위해 남겨둔다)

- [ ] **Step 3: 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/\[locale\]/page.tsx src/messages/ko.json src/messages/en.json
git commit -m "feat: CanvasPage를 캔버스 탭 진입점으로 연결"
```

---

## Task 14: 기존 collage 파일 삭제

**Files:**
- Delete: `src/components/collage/` (전체)
- Delete: `src/lib/collageTree.ts`
- Delete: `src/lib/collageExport.ts`
- Delete: `src/hooks/useCollageExport.ts`

- [ ] **Step 1: collage 관련 파일 삭제**

```bash
rm -rf /Users/minjun/Documents/filezen/src/components/collage
rm -f /Users/minjun/Documents/filezen/src/lib/collageTree.ts
rm -f /Users/minjun/Documents/filezen/src/lib/collageExport.ts
rm -f /Users/minjun/Documents/filezen/src/hooks/useCollageExport.ts
```

- [ ] **Step 2: 컴파일 확인 (삭제 후 남은 참조 없는지)**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

Expected: collage 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore: 기존 collage 컴포넌트 및 라이브러리 삭제"
```

---

## Task 15: 개발 서버에서 스모크 테스트

**Files:**
- 없음 (검증만)

- [ ] **Step 1: 개발 서버 실행**

```bash
cd /Users/minjun/Documents/filezen && npm run dev
```

- [ ] **Step 2: 브라우저에서 확인할 항목**

1. 캔버스 탭 클릭 → 흰 캔버스가 중앙에 보임 (검정 화면 아님)
2. 사각형 도구 선택 → 캔버스 클릭 → 보라색 사각형 추가됨
3. 사각형 클릭 → Transformer 핸들 표시됨
4. 드래그로 이동됨
5. 텍스트 도구 → 캔버스 클릭 → 텍스트 요소 추가됨
6. 텍스트 더블클릭 → textarea 오버레이로 편집 가능
7. 이미지 도구 → 파일 선택 → 이미지 요소 추가됨
8. 속성 패널에서 색상/투명도 변경됨
9. Cmd+Z → 실행취소 동작
10. 내보내기 → PNG 다운로드됨
11. 1:1 / 16:9 등 비율 변경 → 캔버스 크기 변경됨

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat: Canvas Editor Phase A 완료 — React-Konva 기반 자유 배치 에디터"
```
