# Phase 4 UX 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 클립보드 붙여넣기, 전체화면 드래그앤드롭, 작업 히스토리 (Undo/Redo), URL 이미지 가져오기 4가지 UX 기능을 구현한다.

**Architecture:** `activeTab` 상태를 신규 `UIContext`로 승격하여 전역 이벤트 핸들러가 탭을 제어할 수 있게 한다. 각 기능은 독립된 커스텀 훅(`useClipboardPaste`, `useGlobalDrop`, `useUndoRedo`)으로 분리하여 `DrawerLayout`에서 호출한다. 토스트 알림을 위한 경량 `ToastProvider`를 신규 추가한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, tw-animate-css, Lucide React. 신규 패키지 없음.

---

## 파일 구조

```
신규:
  src/context/UIContext.tsx               — activeTab + pendingPdfFiles 전역 상태
  src/context/ToastContext.tsx            — 토스트 알림 상태 관리
  src/components/ui/Toast.tsx             — 토스트 UI 컴포넌트
  src/hooks/useToast.ts                   — 토스트 훅 (re-export)
  src/hooks/useUndoRedo.ts                — Ctrl+Z/Y 키보드 리스너
  src/hooks/useClipboardPaste.ts          — 전역 paste 이벤트 리스너
  src/hooks/useGlobalDrop.ts              — 전역 dragover/drop 이벤트 리스너
  src/components/layout/DropOverlay.tsx   — 드래그 중 전체화면 오버레이
  src/lib/fetchImageFromUrl.ts            — URL → File 변환 유틸

수정:
  src/lib/types.ts                        — ImageEditSnapshot 타입, AppContextType 확장
  src/context/AppContext.tsx              — editHistory + undo/redo 추가
  src/app/[locale]/layout.tsx             — UIProvider, ToastProvider 추가
  src/components/layout/DrawerLayout.tsx  — UIContext 사용, 훅 호출, DropOverlay 렌더링
  src/components/image/BottomActionBar.tsx — undo/redo 버튼 추가
  src/components/image/UploadStrip.tsx    — URL 입력 UI 추가
  src/components/file/tools/PageManager.tsx — pendingPdfFiles 소비
  src/messages/ko.json                    — 신규 i18n 키 추가
  src/messages/en.json                    — 신규 i18n 키 추가
```

---

## Task 0: 워크트리 및 브랜치 생성

**Files:**
- N/A (shell commands only)

- [ ] **Step 1: 워크트리 생성**

```bash
cd /Users/minjun/Documents/filezen
git worktree add ../filezen-phase4 -b feat/phase4-ux
```

Expected output:
```
Preparing worktree (new branch 'feat/phase4-ux')
HEAD is now at <hash> ...
```

- [ ] **Step 2: 의존성 설치**

```bash
cd /Users/minjun/Documents/filezen-phase4
npm install
```

- [ ] **Step 3: 개발 서버 실행 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: 빌드 성공 (errors 없음)

---

## Task 1: UIContext 생성

**Files:**
- Create: `src/context/UIContext.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: UIContext 파일 생성**

`src/context/UIContext.tsx` 를 아래 내용으로 생성:

```tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  activeTab: 'image' | 'file';
  setActiveTab: (tab: 'image' | 'file') => void;
  pendingPdfFiles: File[] | null;
  setPendingPdfFiles: (files: File[] | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUIContext(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUIContext must be used inside UIProvider');
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<'image' | 'file'>('image');
  const [pendingPdfFiles, setPendingPdfFiles] = useState<File[] | null>(null);

  return (
    <UIContext.Provider value={{ activeTab, setActiveTab, pendingPdfFiles, setPendingPdfFiles }}>
      {children}
    </UIContext.Provider>
  );
}
```

- [ ] **Step 2: layout.tsx에 UIProvider 추가**

`src/app/[locale]/layout.tsx` 수정. 기존:
```tsx
import { AppProvider } from '@/context/AppContext';
import { FileProvider } from '@/context/FileContext';
```

변경 후:
```tsx
import { AppProvider } from '@/context/AppContext';
import { FileProvider } from '@/context/FileContext';
import { UIProvider } from '@/context/UIContext';
```

`return` 블록의 Provider 래핑 변경:
```tsx
return (
  <NextIntlClientProvider locale={locale} messages={messages}>
    <UIProvider>
      <AppProvider>
        <FileProvider>
          {children}
        </FileProvider>
      </AppProvider>
    </UIProvider>
  </NextIntlClientProvider>
);
```

- [ ] **Step 3: DrawerLayout에서 UIContext 사용**

`src/components/layout/DrawerLayout.tsx` 수정:

상단 import 추가:
```tsx
import { useUIContext } from '@/context/UIContext';
```

`DrawerLayout` 컴포넌트 내 기존 로컬 상태 제거 후 Context 사용:
```tsx
export function DrawerLayout({ imageTab, fileTab }: DrawerLayoutProps) {
  // 기존: const [activeTab, setActiveTab] = useState<Tab>('image');
  const { activeTab, setActiveTab } = useUIContext();
  const t = useTranslations('drawer');
  const locale = useLocale();
  // ... 나머지 동일
```

파일 상단의 `useState` import에서 `useState` 제거 (사용 안 함):
```tsx
import { /* useState 제거 */ } from 'react';
```
(만약 다른 곳에서 useState를 안 쓴다면 import 줄 자체를 제거)

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen-phase4
npm run build 2>&1 | grep -E "error|Error|✓"
```

Expected: TypeScript 오류 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/minjun/Documents/filezen-phase4
git add src/context/UIContext.tsx src/app/[locale]/layout.tsx src/components/layout/DrawerLayout.tsx
git commit -m "feat: UIContext 도입 — activeTab/pendingPdfFiles 전역 상태"
```

---

## Task 2: 토스트 알림 시스템

**Files:**
- Create: `src/context/ToastContext.tsx`
- Create: `src/components/ui/Toast.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: ToastContext 생성**

`src/context/ToastContext.tsx`:

```tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'error';
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'info' | 'error') => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Toast UI 컴포넌트 생성**

`src/components/ui/Toast.tsx`:

```tsx
'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg pointer-events-auto',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
            toast.type === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-foreground text-background'
          )}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: layout.tsx에 ToastProvider + ToastContainer 추가**

`src/app/[locale]/layout.tsx` 추가 import:
```tsx
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
```

Provider 래핑 업데이트:
```tsx
return (
  <NextIntlClientProvider locale={locale} messages={messages}>
    <UIProvider>
      <AppProvider>
        <FileProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </FileProvider>
      </AppProvider>
    </UIProvider>
  </NextIntlClientProvider>
);
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error|Error|✓"
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/context/ToastContext.tsx src/components/ui/Toast.tsx src/app/[locale]/layout.tsx
git commit -m "feat: 경량 ToastProvider/ToastContainer 추가"
```

---

## Task 3: types.ts — ImageEditSnapshot 및 AppContextType 확장

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: ImageEditSnapshot 타입 및 AppContextType 확장 추가**

`src/lib/types.ts`에서 `ImageFile` 인터페이스 정의 다음에 추가:

```ts
export interface ImageEditSnapshot {
  id:               string;
  rotation:         number;
  flipped:          boolean;
  colorAdjustment?: ColorAdjustment;
  cropData?:        CropData;
  stripExif?:       boolean;
  resizeData?:      ResizeData;
  watermark?:       WatermarkConfig;
}
```

`AppContextType` 인터페이스에 다음 4개 필드 추가:

```ts
export interface AppContextType {
  // ... 기존 필드 유지 ...
  canUndo:  boolean;
  canRedo:  boolean;
  undo:     () => void;
  redo:     () => void;
}
```

- [ ] **Step 2: 빌드 확인 (타입 오류 예상)**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: `AppContext.tsx`에서 `canUndo`, `canRedo`, `undo`, `redo` 누락 오류 발생. 다음 Task에서 해결.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: ImageEditSnapshot 타입 및 AppContextType undo/redo 인터페이스 추가"
```

---

## Task 4: AppContext — 편집 히스토리 구현

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: AppContext.tsx import 수정**

파일 상단 import에 `useRef` 추가:
```tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
```

`types.ts` import에 `ImageEditSnapshot` 추가:
```tsx
import type { ImageFile, AppContextType, ColorAdjustment, CropData, OutputFormat, ResizeData, WatermarkConfig, ImageEditSnapshot } from '../lib/types';
```

- [ ] **Step 2: 히스토리 상태 추가**

`AppProvider` 함수 내 기존 `useState` 선언들 다음에 추가:

```tsx
const [editHistory, setEditHistory] = useState<ImageEditSnapshot[][]>([]);
const historyIndexRef = useRef<number>(-1);
```

- [ ] **Step 3: pushHistory 헬퍼 추가**

`AppProvider` 내 `addImages` 위에 추가:

```tsx
const pushHistory = useCallback((currentImages: ImageFile[]) => {
  const snapshot: ImageEditSnapshot[] = currentImages.map((img) => ({
    id:               img.id,
    rotation:         img.rotation,
    flipped:          img.flipped,
    colorAdjustment:  img.colorAdjustment,
    cropData:         img.cropData,
    stripExif:        img.stripExif,
    resizeData:       img.resizeData,
    watermark:        img.watermark,
  }));
  setEditHistory((prev) => {
    const trimmed = prev.slice(0, historyIndexRef.current + 1);
    const next = [...trimmed, snapshot].slice(-20);
    historyIndexRef.current = next.length - 1;
    return next;
  });
}, []);
```

- [ ] **Step 4: undo / redo 함수 추가**

`pushHistory` 바로 아래에 추가:

```tsx
const undo = useCallback(() => {
  if (historyIndexRef.current < 0) return;
  const snapshot = editHistory[historyIndexRef.current];
  historyIndexRef.current -= 1;
  setImages((prev) =>
    prev.map((img) => {
      const s = snapshot.find((s) => s.id === img.id);
      if (!s) return img;
      return {
        ...img,
        rotation:        s.rotation,
        flipped:         s.flipped,
        colorAdjustment: s.colorAdjustment,
        cropData:        s.cropData,
        stripExif:       s.stripExif,
        resizeData:      s.resizeData,
        watermark:       s.watermark,
      };
    })
  );
  // React re-render를 위해 editHistory state 터치
  setEditHistory((prev) => [...prev]);
}, [editHistory]);

const redo = useCallback(() => {
  if (historyIndexRef.current >= editHistory.length - 1) return;
  historyIndexRef.current += 1;
  const snapshot = editHistory[historyIndexRef.current];
  setImages((prev) =>
    prev.map((img) => {
      const s = snapshot.find((s) => s.id === img.id);
      if (!s) return img;
      return {
        ...img,
        rotation:        s.rotation,
        flipped:         s.flipped,
        colorAdjustment: s.colorAdjustment,
        cropData:        s.cropData,
        stripExif:       s.stripExif,
        resizeData:      s.resizeData,
        watermark:       s.watermark,
      };
    })
  );
  setEditHistory((prev) => [...prev]);
}, [editHistory]);
```

- [ ] **Step 5: 편집 액션에 pushHistory 삽입**

각 편집 액션 함수 첫 줄에 `setImages` 호출 **직전** `pushHistory(images)` 삽입.

대상 함수 5개: `rotateSelected`, `flipSelected`, `applyEditToSelected`, `applyResizeToSelected`, `applyWatermarkToSelected`, `toggleStripExifOnSelected`

예시 — `rotateSelected`:
```tsx
const rotateSelected = useCallback((degrees: number) => {
  pushHistory(images);   // ← 이 줄 추가
  setImages((prev) =>
    prev.map((img) =>
      selectedIds.has(img.id)
        ? { ...img, rotation: normalizeRotation(img.rotation + degrees) }
        : img
    )
  );
}, [selectedIds, pushHistory, images]);
```

나머지 5개 함수도 동일하게 첫 줄에 `pushHistory(images);` 추가. 각 `useCallback` deps 배열에 `pushHistory`, `images` 추가.

- [ ] **Step 6: canUndo / canRedo 계산값 추가**

`return` 바로 위에 추가:
```tsx
const canUndo = historyIndexRef.current >= 0;
const canRedo = historyIndexRef.current < editHistory.length - 1;
```

- [ ] **Step 7: Context.Provider value에 추가**

`<AppContext.Provider value={{ ... }}>` 안에 추가:
```tsx
canUndo,
canRedo,
undo,
redo,
```

- [ ] **Step 8: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: TypeScript 오류 없음

- [ ] **Step 9: 커밋**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: AppContext에 편집 히스토리 (undo/redo) 추가"
```

---

## Task 5: useUndoRedo 훅 + BottomActionBar 버튼

**Files:**
- Create: `src/hooks/useUndoRedo.ts`
- Modify: `src/components/image/BottomActionBar.tsx`

- [ ] **Step 1: useUndoRedo.ts 생성**

`src/hooks/useUndoRedo.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useAppContext();
  const { activeTab } = useUIContext();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (activeTab !== 'image') return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // 텍스트 입력 필드에서는 기본 동작 유지
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      if (e.key === 'z' && !e.shiftKey) {
        if (canUndo) { e.preventDefault(); undo(); }
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (canRedo) { e.preventDefault(); redo(); }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeTab, undo, redo, canUndo, canRedo]);
}
```

- [ ] **Step 2: DrawerLayout에서 useUndoRedo 호출**

`src/components/layout/DrawerLayout.tsx` 수정:

import 추가:
```tsx
import { useUndoRedo } from '@/hooks/useUndoRedo';
```

`DrawerLayout` 함수 내 다른 훅 호출 바로 아래에 추가:
```tsx
useUndoRedo();
```

- [ ] **Step 3: BottomActionBar에 undo/redo 버튼 추가**

`src/components/image/BottomActionBar.tsx`:

import 추가 (Lucide):
```tsx
import { RotateCw, Download, FlipHorizontal, Pencil, FileText, Wand2, Undo2, Redo2 } from 'lucide-react';
```

`useAppContext()` destructuring에 추가:
```tsx
const {
  // ... 기존 ...
  canUndo,
  canRedo,
  undo,
  redo,
} = useAppContext();
```

**모바일 툴바** (`sm:hidden` div)에 Flip 버튼 앞에 삽입:
```tsx
{/* Undo */}
<button
  onClick={undo}
  disabled={!canUndo}
  title="실행 취소 (Ctrl+Z)"
  className={cn(
    'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
    canUndo
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'opacity-35 text-muted-foreground cursor-not-allowed'
  )}
>
  <Undo2 size={14} />
</button>

{/* Redo */}
<button
  onClick={redo}
  disabled={!canRedo}
  title="다시 실행 (Ctrl+Shift+Z)"
  className={cn(
    'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all active:scale-95',
    canRedo
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'opacity-35 text-muted-foreground cursor-not-allowed'
  )}
>
  <Redo2 size={14} />
</button>
```

**데스크톱 툴바** (`hidden sm:flex` div)에도 동일하게 추가. 첫 번째 `<div className="h-5 w-px..."/>` 구분선 앞에:
```tsx
<div className="flex flex-shrink-0 items-center gap-1">
  <button
    onClick={undo}
    disabled={!canUndo}
    title="실행 취소 (Ctrl+Z)"
    className={cn(
      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
      canUndo
        ? 'bg-muted hover:bg-muted/80 text-foreground'
        : 'cursor-not-allowed text-muted-foreground opacity-40'
    )}
  >
    <Undo2 size={12} />
  </button>
  <button
    onClick={redo}
    disabled={!canRedo}
    title="다시 실행 (Ctrl+Shift+Z)"
    className={cn(
      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
      canRedo
        ? 'bg-muted hover:bg-muted/80 text-foreground'
        : 'cursor-not-allowed text-muted-foreground opacity-40'
    )}
  >
    <Redo2 size={12} />
  </button>
</div>

<div className="h-5 w-px flex-shrink-0 bg-border" />
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: 오류 없음

- [ ] **Step 5: 수동 검증**

`npm run dev` 실행 후:
1. 이미지 탭에서 이미지 추가
2. 이미지 선택 후 90° 회전
3. `Ctrl+Z` (또는 `⌘+Z`) → 회전 되돌아감 확인
4. `Ctrl+Shift+Z` → 회전 다시 적용 확인
5. BottomActionBar에 Undo/Redo 버튼 표시 확인

- [ ] **Step 6: 커밋**

```bash
git add src/hooks/useUndoRedo.ts src/components/image/BottomActionBar.tsx src/components/layout/DrawerLayout.tsx
git commit -m "feat: Undo/Redo 기능 구현 (Ctrl+Z/Shift+Z + 버튼)"
```

---

## Task 6: useClipboardPaste 훅

**Files:**
- Create: `src/hooks/useClipboardPaste.ts`
- Modify: `src/components/layout/DrawerLayout.tsx`

- [ ] **Step 1: useClipboardPaste.ts 생성**

`src/hooks/useClipboardPaste.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';
import { useToast } from '@/context/ToastContext';

export function useClipboardPaste() {
  const { addImages } = useAppContext();
  const { activeTab } = useUIContext();
  const { showToast } = useToast();

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      // 텍스트 입력 필드에서는 기본 동작 유지
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith('image/'));

      if (imageItems.length === 0) return;

      if (activeTab !== 'image') {
        showToast('이미지 탭에서 붙여넣어 주세요', 'info');
        return;
      }

      e.preventDefault();
      const files = imageItems
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);

      if (files.length > 0) {
        await addImages(files);
      }
    }

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [addImages, activeTab, showToast]);
}
```

- [ ] **Step 2: DrawerLayout에서 useClipboardPaste 호출**

`src/components/layout/DrawerLayout.tsx`:

import 추가:
```tsx
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
```

`DrawerLayout` 함수 내 `useUndoRedo()` 다음에 추가:
```tsx
useClipboardPaste();
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 4: 수동 검증**

1. 브라우저에서 이미지 복사 (우클릭 → 이미지 복사)
2. 앱 이미지 탭에 포커스
3. `Ctrl+V` / `⌘+V` → 이미지가 갤러리에 추가됨 확인
4. 스크린샷 캡처 후 붙여넣기 → 추가됨 확인
5. 파일 탭으로 전환 후 이미지 붙여넣기 시도 → 토스트 메시지 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useClipboardPaste.ts src/components/layout/DrawerLayout.tsx
git commit -m "feat: 클립보드 붙여넣기 (Ctrl+V) 이미지 추가 기능"
```

---

## Task 7: DropOverlay 컴포넌트

**Files:**
- Create: `src/components/layout/DropOverlay.tsx`

- [ ] **Step 1: DropOverlay.tsx 생성**

`src/components/layout/DropOverlay.tsx`:

```tsx
'use client';

import { ImageIcon, FolderIcon, LayersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropOverlayProps {
  visible: boolean;
  fileType: 'image' | 'pdf' | 'mixed' | null;
}

export function DropOverlay({ visible, fileType }: DropOverlayProps) {
  if (!visible) return null;

  const icon =
    fileType === 'pdf' ? <FolderIcon size={48} />
    : fileType === 'mixed' ? <LayersIcon size={48} />
    : <ImageIcon size={48} />;

  const label =
    fileType === 'pdf' ? '여기에 PDF를 놓으세요'
    : fileType === 'mixed' ? '여기에 파일을 놓으세요'
    : '여기에 이미지를 놓으세요';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9998] flex items-center justify-center',
        'bg-primary/10 backdrop-blur-sm',
        'pointer-events-none',
        'animate-in fade-in duration-150'
      )}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary bg-background/80 px-12 py-10 shadow-2xl">
        <div className="text-primary">{icon}</div>
        <p className="text-base font-semibold text-primary">{label}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/DropOverlay.tsx
git commit -m "feat: 전체화면 드래그 오버레이 컴포넌트"
```

---

## Task 8: useGlobalDrop 훅 + DrawerLayout 연결

**Files:**
- Create: `src/hooks/useGlobalDrop.ts`
- Modify: `src/components/layout/DrawerLayout.tsx`
- Modify: `src/components/file/tools/PageManager.tsx`

- [ ] **Step 1: useGlobalDrop.ts 생성**

`src/hooks/useGlobalDrop.ts`:

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';

type DropFileType = 'image' | 'pdf' | 'mixed' | null;

interface GlobalDropState {
  isDragging: boolean;
  fileType: DropFileType;
}

function classifyItems(items: DataTransferItemList): DropFileType {
  const types = Array.from(items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.type);

  const hasImage = types.some((t) => t.startsWith('image/') || t === '');
  const hasPdf   = types.some((t) => t === 'application/pdf');

  if (hasImage && hasPdf) return 'mixed';
  if (hasPdf) return 'pdf';
  if (hasImage) return 'image';
  return null;
}

function classifyFiles(files: File[]): { images: File[]; pdfs: File[] } {
  return {
    images: files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)),
    pdfs:   files.filter((f) => f.type === 'application/pdf'),
  };
}

export function useGlobalDrop() {
  const [state, setState] = useState<GlobalDropState>({ isDragging: false, fileType: null });
  const { addImages } = useAppContext();
  const { setActiveTab, setPendingPdfFiles } = useUIContext();

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!e.dataTransfer) return;
    const fileType = classifyItems(e.dataTransfer.items);
    if (!fileType) return;
    e.preventDefault();
    setState({ isDragging: true, fileType });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    // relatedTarget이 null이면 브라우저 밖으로 나간 것
    if (e.relatedTarget === null) {
      setState({ isDragging: false, fileType: null });
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setState({ isDragging: false, fileType: null });

    if (!e.dataTransfer) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const { images, pdfs } = classifyFiles(files);

    if (images.length > 0 && pdfs.length === 0) {
      setActiveTab('image');
      await addImages(images);
    } else if (pdfs.length > 0 && images.length === 0) {
      setActiveTab('file');
      setPendingPdfFiles(pdfs);
    } else if (images.length > 0 && pdfs.length > 0) {
      // 더 많은 쪽 탭으로 전환
      if (images.length >= pdfs.length) {
        setActiveTab('image');
        await addImages(images);
        setPendingPdfFiles(pdfs);
      } else {
        setActiveTab('file');
        setPendingPdfFiles(pdfs);
        await addImages(images);
      }
    }
  }, [addImages, setActiveTab, setPendingPdfFiles]);

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover',  handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop',      handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover',  handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop',      handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return state;
}
```

- [ ] **Step 2: DrawerLayout에 useGlobalDrop + DropOverlay 연결**

`src/components/layout/DrawerLayout.tsx`:

import 추가:
```tsx
import { useGlobalDrop } from '@/hooks/useGlobalDrop';
import { DropOverlay } from '@/components/layout/DropOverlay';
```

`DrawerLayout` 함수 내 훅 추가:
```tsx
const { isDragging, fileType } = useGlobalDrop();
```

`return` JSX 내 최상위 `<div>` 안에 `DropOverlay` 추가 (자식 마지막):
```tsx
<div className="flex h-screen w-full overflow-hidden bg-background">
  {/* ... 기존 내용 ... */}
  <DropOverlay visible={isDragging} fileType={fileType} />
</div>
```

- [ ] **Step 3: PageManager에서 pendingPdfFiles 소비**

`src/components/file/tools/PageManager.tsx`:

import 추가:
```tsx
import { useUIContext } from '@/context/UIContext';
```

`PageManager` 함수 내 기존 `useState` 아래에 추가:
```tsx
const { pendingPdfFiles, setPendingPdfFiles } = useUIContext();
```

`handleFiles` 다음에 `useEffect` 추가:
```tsx
useEffect(() => {
  if (pendingPdfFiles && pendingPdfFiles.length > 0) {
    handleFiles(pendingPdfFiles);
    setPendingPdfFiles(null);
  }
}, [pendingPdfFiles, setPendingPdfFiles, handleFiles]);
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: 오류 없음

- [ ] **Step 5: 수동 검증**

1. 이미지 파일을 브라우저 창으로 드래그 → 오버레이 표시 + 이미지 아이콘 확인
2. 드롭 → 이미지 탭으로 전환되며 이미지 추가 확인
3. PDF 파일 드래그 → 오버레이 표시 + 폴더 아이콘 확인
4. 드롭 → 파일 탭으로 전환되며 PageManager에 PDF 로드 확인
5. 브라우저 밖으로 마우스 이동 → 오버레이 사라짐 확인
6. 모바일 시뮬레이터(DevTools)에서도 드래그앤드롭 UI 정상 표시 확인

- [ ] **Step 6: 커밋**

```bash
git add src/hooks/useGlobalDrop.ts src/components/layout/DrawerLayout.tsx src/components/file/tools/PageManager.tsx
git commit -m "feat: 전체화면 드래그앤드롭 — 자동 탭 전환 및 파일 분류"
```

---

## Task 9: fetchImageFromUrl 유틸

**Files:**
- Create: `src/lib/fetchImageFromUrl.ts`

- [ ] **Step 1: fetchImageFromUrl.ts 생성**

`src/lib/fetchImageFromUrl.ts`:

```ts
export type FetchImageError = 'FETCH_FAILED' | 'NOT_IMAGE' | 'CORS';

export class FetchImageUrlError extends Error {
  constructor(public readonly code: FetchImageError) {
    super(code);
  }
}

export async function fetchImageFromUrl(url: string): Promise<File> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    // fetch 자체 실패 → 대부분 CORS 또는 네트워크 오류
    throw new FetchImageUrlError('CORS');
  }

  if (!response.ok) {
    throw new FetchImageUrlError('FETCH_FAILED');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new FetchImageUrlError('NOT_IMAGE');
  }

  // URL에서 파일명 추출, 실패 시 fallback
  const pathname = new URL(url).pathname;
  const filename = pathname.split('/').pop()?.split('?')[0] || 'image';
  const ext = filename.includes('.') ? '' : `.${blob.type.split('/')[1] || 'jpg'}`;

  return new File([blob], `${filename}${ext}`, { type: blob.type });
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/fetchImageFromUrl.ts
git commit -m "feat: fetchImageFromUrl 유틸 — URL에서 이미지 File 객체 변환"
```

---

## Task 10: UploadStrip URL 입력 UI

**Files:**
- Modify: `src/components/image/UploadStrip.tsx`
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: i18n 키 추가**

`src/messages/ko.json` — `upload` 객체에 추가:
```json
"urlButton": "URL로 가져오기",
"urlPlaceholder": "이미지 URL을 입력하세요",
"urlFetching": "가져오는 중...",
"urlErrorCors": "CORS 정책으로 이미지를 가져올 수 없습니다.",
"urlErrorNotImage": "URL이 이미지를 가리키지 않습니다.",
"urlErrorFailed": "이미지를 가져올 수 없습니다."
```

`src/messages/en.json` — `upload` 객체에 추가:
```json
"urlButton": "Import from URL",
"urlPlaceholder": "Paste image URL here",
"urlFetching": "Fetching...",
"urlErrorCors": "Cannot fetch image due to CORS policy.",
"urlErrorNotImage": "URL does not point to an image.",
"urlErrorFailed": "Failed to fetch image."
```

- [ ] **Step 2: UploadStrip.tsx 수정**

`src/components/image/UploadStrip.tsx` 전체 교체:

```tsx
'use client';

import { useCallback, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload, Link, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { fetchImageFromUrl, FetchImageUrlError } from '@/lib/fetchImageFromUrl';
import { MAX_FILES } from '@/lib/constants';

export function UploadStrip() {
  const t = useTranslations('upload');
  const { addImages } = useAppContext();
  const { showToast } = useToast();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) addImages(acceptedFiles);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png':  ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif':  ['.gif'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxFiles: MAX_FILES,
  });

  const openUrlInput = useCallback(() => {
    setShowUrlInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeUrlInput = useCallback(() => {
    setShowUrlInput(false);
    setUrlValue('');
  }, []);

  const handleUrlSubmit = useCallback(async () => {
    const url = urlValue.trim();
    if (!url) return;
    setIsFetching(true);
    try {
      const file = await fetchImageFromUrl(url);
      await addImages([file]);
      closeUrlInput();
    } catch (err) {
      if (err instanceof FetchImageUrlError) {
        const msg =
          err.code === 'CORS'     ? t('urlErrorCors')
          : err.code === 'NOT_IMAGE' ? t('urlErrorNotImage')
          : t('urlErrorFailed');
        showToast(msg, 'error');
      } else {
        showToast(t('urlErrorFailed'), 'error');
      }
    } finally {
      setIsFetching(false);
    }
  }, [urlValue, addImages, closeUrlInput, showToast, t]);

  if (showUrlInput) {
    return (
      <div className="flex h-14 sm:h-20 flex-shrink-0 items-center gap-2 border-b-2 border-dashed border-primary bg-primary/5 px-4 sm:px-6">
        <Link size={18} className="flex-shrink-0 text-primary" />
        <input
          ref={inputRef}
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUrlSubmit();
            if (e.key === 'Escape') closeUrlInput();
          }}
          placeholder={t('urlPlaceholder')}
          disabled={isFetching}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {isFetching ? (
          <Loader2 size={16} className="flex-shrink-0 animate-spin text-primary" />
        ) : (
          <>
            <button
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                urlValue.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
              )}
            >
              {t('urlButton')}
            </button>
            <button onClick={closeUrlInput} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-14 sm:h-20 flex-shrink-0 border-b-2 border-dashed border-border">
      <div
        {...getRootProps()}
        className={cn(
          'group flex flex-1 cursor-pointer items-center gap-3 sm:gap-4 px-4 sm:px-6 transition-all duration-200 ease-in-out',
          isDragActive
            ? 'bg-primary/10 border-primary shadow-inner'
            : 'bg-card hover:bg-muted/60 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary',
          isDragActive && 'bg-primary text-primary-foreground'
        )}>
          <Upload size={20} className={cn(
            'transition-transform duration-300 group-hover:-translate-y-0.5',
            isDragActive && 'animate-bounce'
          )} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={cn(
            'truncate text-sm font-semibold transition-colors group-hover:text-primary',
            isDragActive && 'text-primary scale-105 origin-left'
          )}>
            {isDragActive ? t('dropHere') : t('dragDrop')}
          </span>
          <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
            {t('formats')}
          </span>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
      </div>

      {/* URL 가져오기 버튼 */}
      <button
        onClick={openUrlInput}
        title={t('urlButton')}
        className="flex h-full flex-shrink-0 items-center gap-1.5 border-l border-border px-3 sm:px-4 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Link size={14} />
        <span className="hidden sm:inline">{t('urlButton')}</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | grep "error TS"
```

Expected: 오류 없음

- [ ] **Step 4: 수동 검증**

1. UploadStrip 우측에 "URL로 가져오기" 버튼 확인
2. 버튼 클릭 → 인라인 URL 입력 UI로 전환 확인
3. 공개 이미지 URL 입력 후 Enter → 이미지 갤러리에 추가 확인
4. CORS 차단 URL 입력 → 에러 토스트 표시 확인
5. Escape 키 → 입력 폼 닫힘 확인
6. 모바일 화면: 버튼 아이콘만 표시, 탭 시 URL 폼 활성화 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/image/UploadStrip.tsx src/messages/ko.json src/messages/en.json
git commit -m "feat: URL로 이미지 가져오기 — UploadStrip 인라인 UI"
```

---

## Task 11: 최종 빌드 검증 및 PR

**Files:**
- N/A

- [ ] **Step 1: 전체 빌드**

```bash
cd /Users/minjun/Documents/filezen-phase4
npm run build
```

Expected: `✓ Compiled successfully` 또는 `Route (app) ...` 출력, 오류 없음

- [ ] **Step 2: TypeScript strict 체크**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 출력 없음 (오류 없음)

- [ ] **Step 3: 구현 기능 최종 체크리스트**

수동으로 각 기능 검증:
- [ ] F15: `⌘+V` / `Ctrl+V`로 클립보드 이미지 추가
- [ ] F15: 스크린샷 붙여넣기
- [ ] F15: 파일 탭 활성 상태에서 붙여넣기 시 토스트
- [ ] F16: 이미지 드래그 → 오버레이 표시 → 드롭 → 이미지 탭에 추가
- [ ] F16: PDF 드래그 → 오버레이 표시 → 드롭 → 파일 탭으로 전환 + PageManager에 로드
- [ ] F16: 브라우저 밖으로 드래그 → 오버레이 사라짐
- [ ] F17: 이미지 회전 후 `Ctrl+Z` → 되돌아감
- [ ] F17: BottomActionBar undo/redo 버튼 클릭 동작
- [ ] F17: 최대 20단계 (21번째 액션 시 가장 오래된 것 제거)
- [ ] F18: URL 버튼 → 입력 폼 → 이미지 추가
- [ ] F18: CORS 차단 URL → 에러 토스트

- [ ] **Step 4: PR 생성**

```bash
cd /Users/minjun/Documents/filezen-phase4
git push -u origin feat/phase4-ux
```

```bash
gh pr create \
  --title "feat: Phase 4 UX 개선 (클립보드·전체화면DnD·히스토리·URL가져오기)" \
  --body "$(cat <<'EOF'
## Summary
- Feature 15: Ctrl+V / ⌘+V 클립보드 이미지 붙여넣기 (스크린샷 포함)
- Feature 16: 전체화면 드래그앤드롭 — 파일 타입 자동 분류 + 탭 전환
- Feature 17: 편집 히스토리 Undo/Redo (Ctrl+Z, 최대 20단계)
- Feature 18: URL로 이미지 가져오기 — UploadStrip 인라인 UI

## Architecture
UIContext 도입으로 activeTab 전역 공유. 각 기능은 독립 커스텀 훅으로 분리.
신규 패키지 없음 — 기존 스택만 사용.

## Test plan
- [ ] 각 Feature 수동 검증 (Task 11 체크리스트 참조)
- [ ] 모바일 뷰포트 확인 (DevTools)
- [ ] TypeScript strict 빌드 통과

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
