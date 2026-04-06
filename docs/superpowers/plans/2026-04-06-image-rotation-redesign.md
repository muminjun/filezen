# 이미지 회전 UI 전면 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 업로드 → 갤러리 선택 → 회전 미리보기 → ZIP 저장 플로우를 가진 새 UI를 전면 재작성한다.

**Architecture:** 좌측 56px 아이콘 Drawer로 이미지/파일 탭을 분리하고, 메인 영역은 상단 업로드 스트립(64px) + 중앙 이미지 갤러리(Intersection Observer lazy loading) + 하단 액션바(52px) 구조로 구성한다. AppContext를 단순화하여 이미지 회전 플로우에만 집중하고, 기존 `imageRotation.ts`의 Canvas 로직을 ZIP 저장 시 재사용한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl (ko/en), next-themes, react-dropzone, jszip, Intersection Observer API

---

## 파일 맵

### 삭제
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/settings/SettingsSidebar.tsx`
- `src/components/preview/PreviewPanel.tsx`
- `src/components/preview/ComparisonView.tsx`
- `src/components/manager/DownloadManager.tsx`
- `src/components/upload/RotationToolbar.tsx`
- `src/components/upload/FileList.tsx`
- `src/components/upload/ImageGallery.tsx`
- `src/components/upload/UploadZone.tsx`
- `src/hooks/useFavorites.ts`
- `src/hooks/useHistory.ts`
- `src/hooks/usePresets.ts`
- `src/hooks/usePresetNames.ts`
- `src/hooks/useImageProcessor.ts`
- `src/hooks/useFileManagement.ts`
- `src/lib/imageProcessor.ts`
- `src/lib/storage.ts`
- `src/workers/imageWorker.ts`

### 교체 (재작성)
- `src/lib/types.ts` — `ImageFile` + `AppContextType` 만 남김
- `src/lib/constants.ts` — 파일 제한 상수만 남김
- `src/lib/utils.ts` — 죽은 import 1줄 제거
- `src/context/AppContext.tsx` — 단순화된 상태 관리
- `src/app/[locale]/page.tsx` — 새 레이아웃으로 교체
- `src/messages/ko.json` — 새 번역 키로 교체
- `src/messages/en.json` — 새 번역 키로 교체

### 생성
- `src/components/layout/DrawerLayout.tsx`
- `src/components/image/ImagePage.tsx`
- `src/components/image/UploadStrip.tsx`
- `src/components/image/ImageCard.tsx`
- `src/components/image/ImageGallery.tsx`
- `src/components/image/BottomActionBar.tsx`
- `src/components/file/FilePage.tsx`

### 유지 (변경 없음)
- `src/lib/imageRotation.ts`
- `src/i18n.ts`, `middleware.ts`
- `src/app/layout.tsx`, `src/app/page.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/globals.css`
- `src/components/providers/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/ui/*`, `src/components/Button.tsx`

---

### Task 1: Feature branch 생성 + 구 파일 삭제

**Files:**
- Delete: 위 삭제 목록 전체

- [ ] **Step 1: Feature branch 생성**

```bash
git checkout -b feature/image-rotation-redesign
```

Expected: `Switched to a new branch 'feature/image-rotation-redesign'`

- [ ] **Step 2: 구 파일 일괄 삭제**

```bash
rm src/components/layout/MainLayout.tsx \
   src/components/layout/Header.tsx \
   src/components/settings/SettingsSidebar.tsx \
   src/components/preview/PreviewPanel.tsx \
   src/components/preview/ComparisonView.tsx \
   src/components/manager/DownloadManager.tsx \
   src/components/upload/RotationToolbar.tsx \
   src/components/upload/FileList.tsx \
   src/components/upload/ImageGallery.tsx \
   src/components/upload/UploadZone.tsx \
   src/hooks/useFavorites.ts \
   src/hooks/useHistory.ts \
   src/hooks/usePresets.ts \
   src/hooks/usePresetNames.ts \
   src/hooks/useImageProcessor.ts \
   src/hooks/useFileManagement.ts \
   src/lib/imageProcessor.ts \
   src/lib/storage.ts \
   src/workers/imageWorker.ts
```

- [ ] **Step 3: 빈 디렉토리 정리**

```bash
rmdir src/components/settings src/components/preview src/components/manager 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old components for full rewrite"
```

---

### Task 2: types.ts + constants.ts + utils.ts 단순화

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: types.ts 전체 교체**

`src/lib/types.ts` 내용을 아래로 교체:

```typescript
export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string; // ObjectURL (썸네일 표시용, revokeObjectURL 필요)
  rotation: number;   // CSS 미리보기 회전각 (0~359, 누적)
}

export interface AppContextType {
  images: ImageFile[];
  selectedIds: Set<string>;
  isDownloading: boolean;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  toggleSelect: (id: string) => void;
  rangeSelect: (fromId: string, toId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  rotateSelected: (degrees: number) => void;
  downloadAsZip: () => Promise<void>;
}
```

- [ ] **Step 2: constants.ts 전체 교체**

`src/lib/constants.ts` 내용을 아래로 교체:

```typescript
export const MAX_FILES = 500;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_CONCURRENT_PROCESSING = 4;
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
```

- [ ] **Step 3: utils.ts에서 죽은 import 제거**

`src/lib/utils.ts` 3번째 줄의 아래 줄을 삭제:

```typescript
import type { ProcessingFile } from './types';
```

(`ProcessingFile`은 파일 내에서 사용되지 않는 dead import)

- [ ] **Step 4: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep -E "types\.ts|constants\.ts|utils\.ts" | head -20
```

Expected: 세 파일 관련 에러 없음 (다른 파일 에러는 이후 Task에서 해결됨)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts src/lib/utils.ts
git commit -m "refactor: simplify types and constants for rotation-only flow"
```

---

### Task 3: AppContext 재작성

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: AppContext.tsx 전체 교체**

`src/context/AppContext.tsx` 내용을 아래로 교체:

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
import type { ImageFile, AppContextType } from '../lib/types';

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
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const addImages = useCallback((files: File[]) => {
    const next: ImageFile[] = files.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rangeSelect = useCallback((fromId: string, toId: string) => {
    setImages((prev) => {
      const fromIdx = prev.findIndex((img) => img.id === fromId);
      const toIdx = prev.findIndex((img) => img.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const rangeIds = prev.slice(start, end + 1).map((img) => img.id);
      setSelectedIds((prevSel) => new Set([...prevSel, ...rangeIds]));
      return prev;
    });
  }, []);

  const selectAll = useCallback(() => {
    setImages((prev) => {
      setSelectedIds(new Set(prev.map((img) => img.id)));
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const rotateSelected = useCallback(
    (degrees: number) => {
      setImages((prev) =>
        prev.map((img) =>
          selectedIds.has(img.id)
            ? { ...img, rotation: normalizeRotation(img.rotation + degrees) }
            : img
        )
      );
    },
    [selectedIds]
  );

  const downloadAsZip = useCallback(async () => {
    const selected = images.filter((img) => selectedIds.has(img.id));
    if (selected.length === 0) return;

    setIsDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < selected.length; i += MAX_CONCURRENT_PROCESSING) {
        const batch = selected.slice(i, i + MAX_CONCURRENT_PROCESSING);
        await Promise.all(
          batch.map(async (img) => {
            const mimeType = img.file.type || 'image/jpeg';
            const blob =
              img.rotation === 0
                ? img.file
                : await rotateImageBlob(img.previewUrl, img.rotation, mimeType);
            zip.file(img.file.name, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filezen-rotated-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [images, selectedIds]);

  return (
    <AppContext.Provider
      value={{
        images,
        selectedIds,
        isDownloading,
        addImages,
        removeImage,
        toggleSelect,
        rangeSelect,
        selectAll,
        clearSelection,
        rotateSelected,
        downloadAsZip,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

- [ ] **Step 2: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "AppContext" | head -10
```

Expected: AppContext 관련 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: rewrite AppContext with simplified image rotation state"
```

---

### Task 4: i18n 번역 파일 업데이트

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: ko.json 전체 교체**

`src/messages/ko.json` 내용을 아래로 교체:

```json
{
  "app": {
    "title": "FileZen",
    "subtitle": "이미지를 빠르게 회전하고 저장하세요"
  },
  "drawer": {
    "images": "이미지",
    "files": "파일"
  },
  "upload": {
    "dragDrop": "이미지를 드래그하거나 클릭해서 업로드",
    "dropHere": "여기에 놓으세요",
    "formats": "PNG, JPG, WebP, GIF · 최대 500개 · 파일당 50MB"
  },
  "gallery": {
    "noImages": "이미지를 업로드해주세요",
    "selectAll": "전체 선택",
    "deselectAll": "전체 해제",
    "selectedCount": "{count}개 선택됨",
    "totalCount": "총 {count}개",
    "removeImage": "삭제"
  },
  "actionBar": {
    "noneSelected": "이미지를 선택하세요",
    "selectedCount": "{count}개 선택됨",
    "rotate90": "90° 회전",
    "rotate180": "180° 회전",
    "rotate270": "270° 회전",
    "customAngle": "각도 입력",
    "apply": "적용",
    "downloadZip": "ZIP 저장",
    "downloading": "저장 중..."
  },
  "filePage": {
    "title": "파일 변환",
    "comingSoon": "PDF, 동영상 등 파일 변환 기능을 준비 중입니다"
  },
  "language": {
    "ko": "한글",
    "en": "English"
  }
}
```

- [ ] **Step 2: en.json 전체 교체**

`src/messages/en.json` 내용을 아래로 교체:

```json
{
  "app": {
    "title": "FileZen",
    "subtitle": "Rotate and export images fast"
  },
  "drawer": {
    "images": "Images",
    "files": "Files"
  },
  "upload": {
    "dragDrop": "Drag images here or click to upload",
    "dropHere": "Drop here",
    "formats": "PNG, JPG, WebP, GIF · Up to 500 files · 50MB each"
  },
  "gallery": {
    "noImages": "Upload images to get started",
    "selectAll": "Select All",
    "deselectAll": "Deselect All",
    "selectedCount": "{count} selected",
    "totalCount": "{count} total",
    "removeImage": "Remove"
  },
  "actionBar": {
    "noneSelected": "Select images to rotate",
    "selectedCount": "{count} selected",
    "rotate90": "Rotate 90°",
    "rotate180": "Rotate 180°",
    "rotate270": "Rotate 270°",
    "customAngle": "Custom angle",
    "apply": "Apply",
    "downloadZip": "Save as ZIP",
    "downloading": "Saving..."
  },
  "filePage": {
    "title": "File Conversion",
    "comingSoon": "PDF, video, and other file conversion coming soon"
  },
  "language": {
    "ko": "한글",
    "en": "English"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/ko.json src/messages/en.json
git commit -m "feat: update i18n messages for new UI"
```

---

### Task 5: DrawerLayout 컴포넌트

**Files:**
- Create: `src/components/layout/DrawerLayout.tsx`

- [ ] **Step 1: DrawerLayout.tsx 생성**

`src/components/layout/DrawerLayout.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon, FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type Tab = 'image' | 'file';

interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
}

export function DrawerLayout({ imageTab, fileTab }: DrawerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const t = useTranslations('drawer');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Drawer */}
      <aside className="flex w-14 flex-shrink-0 flex-col items-center border-r border-border bg-card py-3 gap-1">
        <span className="mb-2 select-none text-[10px] font-bold tracking-widest text-muted-foreground">
          FZ
        </span>

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

        <div className="mt-auto flex flex-col items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'image' ? imageTab : fileTab}
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
        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 2: LanguageSwitcher 현재 구현 확인**

```bash
head -5 src/components/LanguageSwitcher.tsx
```

이 파일이 존재하면 다음 단계로. 존재하지 않으면 DrawerLayout에서 `LanguageSwitcher` import를 제거하고 drawer 하단에 ThemeToggle만 남긴다.

- [ ] **Step 3: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "DrawerLayout" | head -10
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/DrawerLayout.tsx
git commit -m "feat: add DrawerLayout with image/file tab navigation"
```

---

### Task 6: UploadStrip 컴포넌트

**Files:**
- Create: `src/components/image/UploadStrip.tsx`

- [ ] **Step 1: image, file 디렉토리 생성**

```bash
mkdir -p src/components/image src/components/file
```

- [ ] **Step 2: UploadStrip.tsx 생성**

`src/components/image/UploadStrip.tsx`:

```typescript
'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { MAX_FILES } from '@/lib/constants';

export function UploadStrip() {
  const t = useTranslations('upload');
  const { addImages } = useAppContext();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) addImages(acceptedFiles);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: MAX_FILES,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex h-16 flex-shrink-0 cursor-pointer items-center gap-3 border-b border-border px-4 transition-colors',
        isDragActive
          ? 'bg-primary/10 border-primary'
          : 'bg-card hover:bg-muted/50'
      )}
    >
      <input {...getInputProps()} />
      <Upload size={18} className="flex-shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-xs text-muted-foreground">{t('formats')}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "UploadStrip" | head -10
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/image/UploadStrip.tsx
git commit -m "feat: add compact UploadStrip with drag-and-drop"
```

---

### Task 7: ImageCard (lazy loading)

**Files:**
- Create: `src/components/image/ImageCard.tsx`

- [ ] **Step 1: ImageCard.tsx 생성**

`src/components/image/ImageCard.tsx`:

```typescript
'use client';

import { useRef, useEffect, useState, memo } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageFile } from '@/lib/types';

interface ImageCardProps {
  image: ImageFile;
  isSelected: boolean;
  onToggle: (id: string, event: React.MouseEvent) => void;
  onRemove: (id: string) => void;
}

export const ImageCard = memo(function ImageCard({
  image,
  isSelected,
  onToggle,
  onRemove,
}: ImageCardProps) {
  const t = useTranslations('gallery');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer: 뷰포트 200px 전에 미리 렌더링
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 90/270도 회전 시 이미지가 컨테이너를 벗어나지 않도록 scale 조정
  const needsScale = image.rotation === 90 || image.rotation === 270;

  return (
    <div
      ref={containerRef}
      onClick={(e) => onToggle(image.id, e)}
      className={cn(
        'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'border-transparent hover:border-muted-foreground/40'
      )}
    >
      {/* 선택 체크 아이콘 */}
      {isSelected && (
        <div className="absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* 삭제 버튼 (hover 시 표시) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        title={t('removeImage')}
        className="absolute right-1.5 top-1.5 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100"
      >
        <X size={12} />
      </button>

      {/* 이미지 (lazy) or placeholder */}
      {isVisible ? (
        <img
          src={image.previewUrl}
          alt={image.file.name}
          draggable={false}
          style={{
            transform: `rotate(${image.rotation}deg) ${needsScale ? 'scale(0.71)' : ''}`,
          }}
          className="h-full w-full object-cover transition-transform duration-200"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </div>
  );
});
```

- [ ] **Step 2: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "ImageCard" | head -10
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/components/image/ImageCard.tsx
git commit -m "feat: add ImageCard with Intersection Observer lazy loading"
```

---

### Task 8: ImageGallery (다중 선택)

**Files:**
- Create: `src/components/image/ImageGallery.tsx`

- [ ] **Step 1: ImageGallery.tsx 생성**

`src/components/image/ImageGallery.tsx`:

```typescript
'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import { ImageCard } from './ImageCard';

export function ImageGallery() {
  const t = useTranslations('gallery');
  const {
    images,
    selectedIds,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    removeImage,
  } = useAppContext();

  // Shift+클릭 범위 선택을 위한 마지막 클릭 id 추적
  const lastClickedId = useRef<string | null>(null);

  const handleToggle = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedId.current) {
      rangeSelect(lastClickedId.current, id);
    } else {
      toggleSelect(id);
    }
    lastClickedId.current = id;
  };

  const allSelected = images.length > 0 && selectedIds.size === images.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 갤러리 헤더 */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <button
          onClick={allSelected ? clearSelection : selectAll}
          disabled={images.length === 0}
          className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {allSelected ? t('deselectAll') : t('selectAll')}
        </button>

        {selectedIds.size > 0 && (
          <span className="text-xs font-medium text-primary">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {t('totalCount', { count: images.length })}
        </span>
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('noImages')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isSelected={selectedIds.has(image.id)}
                onToggle={handleToggle}
                onRemove={removeImage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "ImageGallery\|ImageCard" | head -10
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/components/image/ImageGallery.tsx
git commit -m "feat: add ImageGallery with multi-select and shift-click range"
```

---

### Task 9: BottomActionBar

**Files:**
- Create: `src/components/image/BottomActionBar.tsx`

- [ ] **Step 1: BottomActionBar.tsx 생성**

`src/components/image/BottomActionBar.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

const PRESET_DEGREES = [90, 180, 270] as const;
const ROTATION_LABEL_KEYS = {
  90: 'rotate90',
  180: 'rotate180',
  270: 'rotate270',
} as const;

export function BottomActionBar() {
  const t = useTranslations('actionBar');
  const { selectedIds, rotateSelected, downloadAsZip, isDownloading } = useAppContext();
  const [customAngle, setCustomAngle] = useState('');

  const hasSelection = selectedIds.size > 0;

  const handleApplyCustom = () => {
    const deg = parseInt(customAngle, 10);
    if (isNaN(deg) || !hasSelection) return;
    rotateSelected(deg);
    setCustomAngle('');
  };

  return (
    <div className="flex h-[52px] flex-shrink-0 items-center gap-2 border-t border-border bg-card px-4">
      {/* 선택 수 표시 */}
      <span className="min-w-[90px] text-xs text-muted-foreground">
        {hasSelection
          ? t('selectedCount', { count: selectedIds.size })
          : t('noneSelected')}
      </span>

      <div className="h-5 w-px bg-border" />

      {/* 프리셋 회전 버튼 */}
      {PRESET_DEGREES.map((deg) => (
        <button
          key={deg}
          onClick={() => hasSelection && rotateSelected(deg)}
          disabled={!hasSelection}
          title={t(ROTATION_LABEL_KEYS[deg])}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            hasSelection
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          <RotateCw size={12} />
          {deg}°
        </button>
      ))}

      <div className="h-5 w-px bg-border" />

      {/* 직접 입력 */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={customAngle}
          onChange={(e) => setCustomAngle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCustom()}
          disabled={!hasSelection}
          placeholder={t('customAngle')}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
        />
        <span className="text-xs text-muted-foreground">°</span>
        <button
          onClick={handleApplyCustom}
          disabled={!hasSelection || customAngle === ''}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium transition-colors',
            hasSelection && customAngle !== ''
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'cursor-not-allowed text-muted-foreground opacity-40'
          )}
        >
          {t('apply')}
        </button>
      </div>

      {/* ZIP 저장 버튼 */}
      <button
        onClick={downloadAsZip}
        disabled={!hasSelection || isDownloading}
        className={cn(
          'ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          hasSelection && !isDownloading
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
        )}
      >
        <Download size={14} />
        {isDownloading ? t('downloading') : t('downloadZip')}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "BottomActionBar" | head -10
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/components/image/BottomActionBar.tsx
git commit -m "feat: add BottomActionBar with rotation presets, custom input, ZIP download"
```

---

### Task 10: ImagePage + FilePage 조립

**Files:**
- Create: `src/components/image/ImagePage.tsx`
- Create: `src/components/file/FilePage.tsx`

- [ ] **Step 1: ImagePage.tsx 생성**

`src/components/image/ImagePage.tsx`:

```typescript
import { UploadStrip } from './UploadStrip';
import { ImageGallery } from './ImageGallery';
import { BottomActionBar } from './BottomActionBar';

export function ImagePage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <UploadStrip />
      <ImageGallery />
      <BottomActionBar />
    </div>
  );
}
```

- [ ] **Step 2: FilePage.tsx 생성**

`src/components/file/FilePage.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { FolderOpen } from 'lucide-react';

export function FilePage() {
  const t = useTranslations('filePage');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <FolderOpen size={48} className="text-muted-foreground/40" />
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 검증**

```bash
npx tsc --noEmit 2>&1 | grep "ImagePage\|FilePage" | head -10
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/image/ImagePage.tsx src/components/file/FilePage.tsx
git commit -m "feat: add ImagePage assembly and FilePage placeholder"
```

---

### Task 11: page.tsx 교체 + 최종 빌드 검증

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: page.tsx 전체 교체**

`src/app/[locale]/page.tsx` 내용을 아래로 교체:

```typescript
import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage } from '@/components/image/ImagePage';
import { FilePage } from '@/components/file/FilePage';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DrawerLayout
      imageTab={<ImagePage />}
      fileTab={<FilePage />}
    />
  );
}
```

- [ ] **Step 2: TypeScript 전체 검증 — 에러 0개 확인**

```bash
npx tsc --noEmit 2>&1
```

Expected: 출력 없음 (에러 0개). 에러 있으면 해당 파일 수정 후 재검증.

- [ ] **Step 3: ESLint 검증**

```bash
npm run lint 2>&1 | tail -10
```

Expected: `✓` 또는 warning만. error 없음.

- [ ] **Step 4: 프로덕션 빌드 검증**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 포함. error 없음.

- [ ] **Step 5: 개발 서버 수동 검증**

```bash
npm run dev
```

`http://localhost:3000` 접속 후 아래 항목 확인:

- [ ] 좌측 drawer에 이미지(🖼️), 파일(📁) 아이콘 표시
- [ ] 이미지 탭: 상단 64px 업로드 스트립, 중앙 갤러리, 하단 52px 액션바 구조
- [ ] 업로드 스트립에 이미지 드래그 앤 드롭으로 추가됨
- [ ] 갤러리에서 이미지 클릭 → 파란 테두리 + 체크 아이콘
- [ ] Shift+클릭으로 범위 선택
- [ ] "전체 선택" 버튼 작동
- [ ] 90°/180°/270° 버튼 클릭 시 갤러리에서 즉시 회전 미리보기
- [ ] 직접 각도 입력 후 "적용" 또는 Enter 시 회전 미리보기
- [ ] "ZIP 저장" 버튼 클릭 시 `.zip` 파일 다운로드
- [ ] 파일 탭 클릭 시 "준비 중" 메시지 표시
- [ ] 다크/라이트 모드 토글 작동
- [ ] 한국어/영어 전환 작동
- [ ] 100개 이상 이미지 업로드 시 스크롤 시 lazy loading (뷰포트 밖 이미지는 회색 placeholder)

- [ ] **Step 6: Final commit**

```bash
git add src/app/\[locale\]/page.tsx
git commit -m "feat: wire up DrawerLayout — image rotation redesign complete"
```
