# Image Gallery Multi-Select & Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수백 장의 이미지를 썸네일 그리드로 표시하고, 단일/다중 선택 후 선택된 이미지들에 일괄 회전(90°/180°/270°/리셋)을 적용한다.

**Architecture:** `AppContext`에 `selectedFileIds: string[]` 다중 선택 상태와 `rotateSelectedFiles` 액션을 추가한다. 기존 `selectedFileId`(미리보기용 단일 선택)는 유지하여 `PreviewPanel`/`ComparisonView`/`DownloadManager`의 수정을 최소화한다. `FileList`를 `ImageGallery`(썸네일 그리드 + 체크박스)로 교체하고, 선택 시 `RotationToolbar`를 표시한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, `@base-ui/react` (Checkbox), `lucide-react`, `shadcn` 패턴

> **주의:** 사용자 요청의 "90, 120, 270, 360"에서 120은 오타로 판단하여 **90, 180, 270, 360(리셋)** 으로 구현합니다.

---

## 파일 구조

| 파일 | 변경 유형 | 책임 |
|------|-----------|------|
| `src/lib/types.ts` | 수정 | `ProcessingFile.rotation` 필드, `AppContextType` 다중 선택 액션 추가 |
| `src/lib/constants.ts` | 수정 | `MAX_FILES` 500으로 증가 |
| `src/context/AppContext.tsx` | 수정 | `selectedFileIds` 상태, `toggleFileSelection`, `selectAllFiles`, `clearSelection`, `rotateSelectedFiles` 추가 |
| `src/components/ui/checkbox.tsx` | 생성 | `@base-ui/react/checkbox` 기반 shadcn 패턴 체크박스 |
| `src/components/upload/ImageGallery.tsx` | 생성 | 썸네일 그리드 + 체크박스 + shift/ctrl 선택 |
| `src/components/upload/RotationToolbar.tsx` | 생성 | 선택 카운트 + 회전 버튼 4개 + 전체/해제 버튼 |
| `src/components/upload/FileList.tsx` | 수정 | `selectedFileIds` 사용으로 업데이트 (기존 list view 유지 가능) |
| `src/app/[locale]/page.tsx` | 수정 | `FileList` → `ImageGallery` + `RotationToolbar` 추가 |
| `src/messages/ko.json` | 수정 | 갤러리/회전 i18n 문자열 추가 |
| `src/messages/en.json` | 수정 | 갤러리/회전 i18n 문자열 추가 |

---

### Task 1: 브랜치 생성

**Files:**
- (git 명령만)

- [ ] **Step 1: feature 브랜치 생성 및 체크아웃**

```bash
git checkout -b feature/image-selection-rotation
```

Expected: `Switched to a new branch 'feature/image-selection-rotation'`

- [ ] **Step 2: 브랜치 확인**

```bash
git branch
```

Expected: `* feature/image-selection-rotation` 가 현재 브랜치로 표시됨

---

### Task 2: `src/lib/types.ts` — `rotation` 필드 및 다중 선택 타입 추가

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: `ProcessingFile`에 `rotation` 추가, `AppContextType`에 다중 선택 타입 추가**

`src/lib/types.ts` 전체를 다음으로 교체:

```typescript
// Enums
export type ImageFormat = 'png' | 'jpg' | 'webp';
export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'crop';
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';
export type RotationDegrees = 0 | 90 | 180 | 270;

// Interfaces
export interface ConversionSettings {
  format: ImageFormat;
  width: number;
  height: number;
  resizeMode: ResizeMode;
  jpgQuality: number; // 50-100
  pngCompressionLevel: number; // 0-9
  webpQuality: number; // 50-100
  removeMetadata: boolean;
}

export interface ProcessingFile {
  id: string;
  file: File;
  originalUrl: string; // ObjectURL of original
  processedUrl: string; // ObjectURL of processed image
  status: FileStatus;
  progress: number; // 0-100
  error?: string;
  processedFile?: Blob;
  settings?: ConversionSettings;
  rotation: RotationDegrees; // CSS 회전 각도
}

export interface ProcessingRecord {
  id: string;
  timestamp: number;
  originalFileName: string;
  format: ImageFormat;
  width: number;
  height: number;
  resizeMode: ResizeMode;
}

export interface PresetConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  resizeMode: ResizeMode;
  format: ImageFormat;
}

export interface FavoriteSettings {
  id: string;
  name: string;
  settings: ConversionSettings;
  createdAt: number;
}

export interface AppContextType {
  files: ProcessingFile[];
  selectedFileId: string | null;   // 미리보기용 단일 선택 (PreviewPanel 호환)
  selectedFileIds: string[];        // 일괄 작업용 다중 선택
  settings: ConversionSettings;
  history: ProcessingRecord[];
  presets: PresetConfig[];
  favorites: FavoriteSettings[];
  isProcessing: boolean;

  // Actions (dispatch functions)
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  selectFile: (fileId: string) => void;          // 단일 선택 (selectedFileId + selectedFileIds 모두 업데이트)
  toggleFileSelection: (fileId: string) => void; // selectedFileIds 토글 (체크박스용)
  selectAllFiles: () => void;
  clearSelection: () => void;
  rotateSelectedFiles: (degrees: 90 | 180 | 270 | 360) => void;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
  processFiles: () => Promise<void>;
  addToHistory: (record: ProcessingRecord) => void;
  clearHistory: () => void;
  addPreset: (preset: PresetConfig) => void;
  removePreset: (presetId: string) => void;
  addFavorite: (favorite: FavoriteSettings) => void;
  removeFavorite: (favoriteId: string) => void;
  downloadFile: (fileId: string) => void;
  downloadAllAsZip: () => void;
}

export interface SquooshOptions {
  png?: {
    level?: number; // 0-9
  };
  jpeg?: {
    quality?: number; // 0-100
  };
  webp?: {
    quality?: number; // 0-100
  };
}
```

- [ ] **Step 2: TypeScript 오류 없음 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

Expected: `types.ts` 관련 오류 없음 (다른 파일들은 아직 업데이트 안 됐으므로 오류가 있을 수 있음)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: add rotation field and multi-selection types"
```

---

### Task 3: `src/lib/constants.ts` — MAX_FILES 증가

**Files:**
- Modify: `src/lib/constants.ts:4`

- [ ] **Step 1: MAX_FILES 100 → 500으로 변경**

`src/lib/constants.ts` 4번째 줄 변경:

```typescript
export const MAX_FILES = 500;
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/constants.ts
git commit -m "feat: increase MAX_FILES limit to 500"
```

---

### Task 4: `src/context/AppContext.tsx` — 다중 선택 및 회전 로직 추가

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: AppContext 전체를 다음으로 교체**

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_PRESETS } from '../lib/constants';
import { StorageManager } from '../lib/storage';
import { generateFileId } from '../lib/utils';
import type {
  ProcessingFile,
  ConversionSettings,
  ProcessingRecord,
  PresetConfig,
  FavoriteSettings,
  AppContextType,
  RotationDegrees,
} from '../lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [settings, setSettingsState] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<ProcessingRecord[]>([]);
  const [presets, setPresets] = useState<PresetConfig[]>(DEFAULT_PRESETS);
  const [favorites, setFavorites] = useState<FavoriteSettings[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    setSettingsState(StorageManager.getSettings(DEFAULT_SETTINGS));
    setHistory(StorageManager.getHistory());
    const saved = StorageManager.getPresets();
    setPresets(saved.length > 0 ? saved : DEFAULT_PRESETS);
    setFavorites(StorageManager.getFavorites());
    setIsHydrated(true);
  }, []);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const processingFiles: ProcessingFile[] = newFiles.map((file) => {
      const id = generateFileId();
      const originalUrl = URL.createObjectURL(file);
      return {
        id,
        file,
        originalUrl,
        processedUrl: '',
        status: 'pending' as const,
        progress: 0,
        rotation: 0 as RotationDegrees,
      };
    });

    setFiles((prev) => [...prev, ...processingFiles]);
    if (processingFiles.length > 0) {
      setSelectedFileId(processingFiles[0].id);
      setSelectedFileIds([processingFiles[0].id]);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (selectedFileId === fileId && updated.length > 0) {
        setSelectedFileId(updated[0].id);
      }
      return updated;
    });
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
  }, [selectedFileId]);

  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setSelectedFileIds([fileId]);
  }, []);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      }
      return [...prev, fileId];
    });
    setSelectedFileId(fileId);
  }, []);

  const selectAllFiles = useCallback(() => {
    setFiles((prev) => {
      const allIds = prev.map((f) => f.id);
      setSelectedFileIds(allIds);
      if (allIds.length > 0) setSelectedFileId(allIds[0]);
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  const rotateSelectedFiles = useCallback((degrees: 90 | 180 | 270 | 360) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (!selectedFileIds.includes(f.id)) return f;
        if (degrees === 360) return { ...f, rotation: 0 as RotationDegrees };
        const newRotation = ((f.rotation + degrees) % 360) as RotationDegrees;
        return { ...f, rotation: newRotation };
      })
    );
  }, [selectedFileIds]);

  const updateSettings = useCallback((newSettings: Partial<ConversionSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      StorageManager.saveSettings(updated);
      return updated;
    });
  }, []);

  const processFiles = useCallback(async () => {
    setIsProcessing(true);
    // This will be implemented in useImageProcessor hook
  }, []);

  const addToHistory = useCallback((record: ProcessingRecord) => {
    StorageManager.saveHistory(record);
    setHistory((prev) => [record, ...prev].slice(0, 5));
  }, []);

  const clearHistory = useCallback(() => {
    StorageManager.clearHistory();
    setHistory([]);
  }, []);

  const addPreset = useCallback((preset: PresetConfig) => {
    StorageManager.savePreset(preset);
    setPresets((prev) => {
      const index = prev.findIndex((p) => p.id === preset.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = preset;
        return updated;
      }
      return [...prev, preset];
    });
  }, []);

  const removePreset = useCallback((presetId: string) => {
    StorageManager.deletePreset(presetId);
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  }, []);

  const addFavorite = useCallback((favorite: FavoriteSettings) => {
    StorageManager.saveFavorite(favorite);
    setFavorites((prev) => [...prev, favorite]);
  }, []);

  const removeFavorite = useCallback((favoriteId: string) => {
    StorageManager.deleteFavorite(favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  }, []);

  const downloadFile = useCallback((fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file?.processedFile) return;

    const url = URL.createObjectURL(file.processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${file.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const downloadAllAsZip = useCallback(async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    files.forEach((file) => {
      if (file.processedFile) {
        zip.file(`converted_${file.file.name}`, file.processedFile);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filezen_converted.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const value: AppContextType = {
    files,
    selectedFileId,
    selectedFileIds,
    settings,
    history,
    presets,
    favorites,
    isProcessing,
    addFiles,
    removeFile,
    selectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    rotateSelectedFiles,
    updateSettings,
    processFiles,
    addToHistory,
    clearHistory,
    addPreset,
    removePreset,
    addFavorite,
    removeFavorite,
    downloadFile,
    downloadAllAsZip,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | grep "AppContext" | head -20
```

Expected: AppContext 관련 타입 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: add multi-selection and rotation to AppContext"
```

---

### Task 5: `src/components/ui/checkbox.tsx` — Checkbox 컴포넌트 생성

**Files:**
- Create: `src/components/ui/checkbox.tsx`

- [ ] **Step 1: `@base-ui/react/checkbox` 기반 Checkbox 컴포넌트 생성**

```typescript
'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-input shadow-sm transition-all outline-none',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[checked]:bg-primary data-[checked]:border-primary data-[checked]:text-primary-foreground',
        'data-[indeterminate]:bg-primary data-[indeterminate]:border-primary data-[indeterminate]:text-primary-foreground',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
```

- [ ] **Step 2: `@base-ui/react/checkbox` 패키지 확인**

```bash
cd /Users/minjun/Documents/filezen && node -e "require('@base-ui/react/checkbox')" 2>&1
```

Expected: 오류 없음 (빈 출력). 오류 발생 시 → `npm install @base-ui/react` 재실행

- [ ] **Step 3: TypeScript 타입 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | grep "checkbox" | head -10
```

Expected: checkbox 관련 타입 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/checkbox.tsx
git commit -m "feat: add Checkbox UI component using @base-ui/react"
```

---

### Task 6: `src/components/upload/ImageGallery.tsx` — 썸네일 그리드 + 다중 선택

**Files:**
- Create: `src/components/upload/ImageGallery.tsx`

- [ ] **Step 1: ImageGallery 컴포넌트 생성**

```typescript
'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useAppContext } from '../../context/AppContext';

export function ImageGallery() {
  const t = useTranslations('gallery');
  const {
    files,
    selectedFileId,
    selectedFileIds,
    selectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    removeFile,
  } = useAppContext();

  const lastClickedIndexRef = useRef<number>(-1);

  const handleThumbnailClick = useCallback(
    (e: React.MouseEvent, fileId: string, index: number) => {
      if (e.shiftKey && lastClickedIndexRef.current >= 0) {
        // Shift+클릭: 범위 선택
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const rangeIds = files.slice(start, end + 1).map((f) => f.id);
        // 기존 selectedFileIds + 범위 합집합
        const merged = Array.from(new Set([...selectedFileIds, ...rangeIds]));
        // AppContext에 직접 setSelectedFileIds가 없으므로 toggleFileSelection 대신
        // clearSelection 후 rangeIds로 재구성
        clearSelection();
        rangeIds.forEach((id) => toggleFileSelection(id));
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+클릭: 개별 토글
        toggleFileSelection(fileId);
      } else {
        // 일반 클릭: 단일 선택
        selectFile(fileId);
      }
      lastClickedIndexRef.current = index;
    },
    [files, selectedFileIds, selectFile, toggleFileSelection, clearSelection]
  );

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-muted-foreground/25 p-4 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">{t('noFiles')}</p>
      </div>
    );
  }

  const allSelected = files.length > 0 && selectedFileIds.length === files.length;

  return (
    <div className="space-y-3">
      {/* 선택 컨트롤 바 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {t('fileCount', { count: files.length })}
          {selectedFileIds.length > 0 && (
            <span className="ml-2 text-primary font-medium">
              {t('selectedCount', { count: selectedFileIds.length })}
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={allSelected ? clearSelection : selectAllFiles}
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </Button>
          {selectedFileIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t('clearSelection')}
            </Button>
          )}
        </div>
      </div>

      {/* 썸네일 그리드 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {files.map((file, index) => {
          const isSelected = selectedFileIds.includes(file.id);
          const isPrimary = selectedFileId === file.id;

          return (
            <div
              key={file.id}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                isPrimary
                  ? 'border-primary shadow-md'
                  : isSelected
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={(e) => handleThumbnailClick(e, file.id, index)}
            >
              {/* 썸네일 이미지 */}
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={file.originalUrl}
                  alt={file.file.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `rotate(${file.rotation}deg)`,
                  }}
                />
              </div>

              {/* 체크박스 (좌상단) */}
              <div
                className="absolute top-1 left-1 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFileSelection(file.id);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  className="bg-white/80 backdrop-blur-sm shadow-sm"
                />
              </div>

              {/* 삭제 버튼 (우상단, hover 시 표시) */}
              <button
                className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                aria-label={t('removeFile')}
              >
                <X className="h-3 w-3" />
              </button>

              {/* 회전 각도 표시 (rotation > 0 인 경우) */}
              {file.rotation > 0 && (
                <div className="absolute bottom-1 right-1 z-10 bg-primary text-primary-foreground text-[10px] font-bold rounded px-1 py-0.5">
                  {file.rotation}°
                </div>
              )}

              {/* 파일명 (하단, hover 시 표시) */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {file.file.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | grep "ImageGallery" | head -10
```

Expected: ImageGallery 관련 타입 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/upload/ImageGallery.tsx
git commit -m "feat: add ImageGallery component with thumbnail grid and multi-select"
```

---

### Task 7: `src/components/upload/RotationToolbar.tsx` — 회전 툴바 생성

**Files:**
- Create: `src/components/upload/RotationToolbar.tsx`

- [ ] **Step 1: RotationToolbar 컴포넌트 생성**

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../context/AppContext';

const ROTATION_OPTIONS: Array<{ degrees: 90 | 180 | 270 | 360; label: string }> = [
  { degrees: 90, label: '90°' },
  { degrees: 180, label: '180°' },
  { degrees: 270, label: '270°' },
  { degrees: 360, label: '↺' },
];

export function RotationToolbar() {
  const t = useTranslations('gallery');
  const { selectedFileIds, rotateSelectedFiles } = useAppContext();

  if (selectedFileIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-primary font-medium">
        <RotateCw className="h-4 w-4" />
        <span>{t('rotateSelected', { count: selectedFileIds.length })}</span>
      </div>

      <div className="flex gap-1">
        {ROTATION_OPTIONS.map(({ degrees, label }) => (
          <Button
            key={degrees}
            variant={degrees === 360 ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => rotateSelectedFiles(degrees)}
            title={
              degrees === 360
                ? t('rotationReset')
                : t('rotationApply', { degrees })
            }
          >
            {label}
          </Button>
        ))}
      </div>

      <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
        {t('rotationHint')}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | grep "RotationToolbar" | head -10
```

Expected: 타입 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/upload/RotationToolbar.tsx
git commit -m "feat: add RotationToolbar component for batch rotation"
```

---

### Task 8: i18n 문자열 추가

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: `ko.json`에 `gallery` 섹션 추가**

`src/messages/ko.json`의 마지막 `}` 앞에 다음을 추가 (즉, `"language": {...}` 뒤):

```json
  "gallery": {
    "noFiles": "업로드된 파일이 없습니다",
    "fileCount": "{count}개 파일",
    "selectedCount": "{count}개 선택됨",
    "selectAll": "전체 선택",
    "deselectAll": "전체 해제",
    "clearSelection": "선택 해제",
    "removeFile": "파일 삭제",
    "rotateSelected": "{count}개 선택 — 회전",
    "rotationApply": "{degrees}° 회전",
    "rotationReset": "원본 방향으로 리셋",
    "rotationHint": "Ctrl+클릭: 개별 선택 | Shift+클릭: 범위 선택"
  }
```

완성된 `ko.json`:

```json
{
  "app": {
    "title": "FileZen",
    "subtitle": "이미지를 즉시 변환하고 리사이징하세요"
  },
  "header": {
    "title": "FileZen",
    "description": "이미지를 즉시 변환하고 리사이징하세요. 클라이언트 사이드 처리, 업로드 없음."
  },
  "pages": {
    "uploadSection": "이미지 업로드",
    "filesSection": "파일",
    "downloadSection": "다운로드"
  },
  "upload": {
    "title": "이미지 업로드",
    "dragDrop": "이미지를 여기에 드래그&드롭하세요",
    "dropHere": "파일을 여기에 놓으세요",
    "selectFiles": "파일 선택",
    "orClick": "또는 클릭하여 최대 {count}개 파일 선택 (최대 50MB 각)",
    "maxFiles": "최대 {{count}}개 파일 선택 가능 (최대 50MB)",
    "supportedFormats": "지원 형식",
    "formats": "PNG, JPG, WebP, GIF"
  },
  "files": {
    "title": "파일",
    "noFiles": "업로드된 파일이 없습니다",
    "status": {
      "pending": "대기중",
      "processing": "처리중",
      "completed": "완료",
      "error": "오류"
    }
  },
  "preview": {
    "title": "미리보기",
    "selectFile": "미리보기할 파일을 선택하세요",
    "comparison": "비교 (원본 vs 변환)",
    "process": "비교할 파일을 처리하세요",
    "original": "원본",
    "processed": "변환됨"
  },
  "settings": {
    "title": "설정",
    "format": "형식",
    "dimensions": "크기",
    "width": "너비",
    "height": "높이",
    "resizeMode": "리사이즈 모드",
    "contain": "내부에 맞추기 (Contain)",
    "cover": "영역 덮기 (Cover)",
    "stretch": "늘이기 (Stretch)",
    "crop": "수동 자르기 (Crop)",
    "quality": "품질",
    "jpgQuality": "JPG 품질",
    "webpQuality": "WebP 품질",
    "pngCompression": "압축",
    "presets": "빠른 프리셋",
    "metadata": "메타데이터 제거 (EXIF)",
    "formatLabels": {
      "png": "PNG (손실 없음)",
      "jpg": "JPG (손실)",
      "webp": "WebP (현대식)"
    },
    "resizeLabels": {
      "contain": "내부에 맞추기 (Contain)",
      "cover": "영역 덮기 (Cover)",
      "stretch": "늘이기 (Stretch)",
      "crop": "수동 자르기 (Crop)"
    }
  },
  "presets": {
    "thumbnail": "썸네일 (200x200)",
    "square": "정사각형 (500x500)",
    "instagram_feed": "인스타그램 피드 (1080x1350)",
    "instagram_story": "인스타그램 스토리 (1080x1920)",
    "twitter_header": "트위터 헤더 (1500x500)",
    "linkedin": "LinkedIn 커버 (1200x627)",
    "facebook": "페이스북 (1200x630)",
    "youtube": "유튜브 썸네일 (1280x720)",
    "web_small": "웹 소형 (640x480)",
    "web_large": "웹 대형 (1920x1080)",
    "preset-1": "썸네일 (200x200)",
    "preset-2": "정사각형 (500x500)",
    "preset-3": "인스타그램 피드 (1080x1350)",
    "preset-4": "인스타그램 스토리 (1080x1920)",
    "preset-5": "트위터 헤더 (1500x500)",
    "preset-6": "LinkedIn 커버 (1200x627)",
    "preset-7": "페이스북 (1200x630)",
    "preset-8": "유튜브 썸네일 (1280x720)",
    "preset-9": "웹 소형 (640x480)",
    "preset-10": "웹 대형 (1920x1080)"
  },
  "download": {
    "title": "다운로드",
    "downloadSelected": "선택한 파일 다운로드",
    "downloadZip": "ZIP으로 다운로드",
    "processFiles": "다운로드할 파일을 처리하세요"
  },
  "formats": {
    "png": "PNG (손실 없음)",
    "jpg": "JPG (손실)",
    "webp": "WebP (현대식)"
  },
  "language": {
    "ko": "한글",
    "en": "English"
  },
  "gallery": {
    "noFiles": "업로드된 파일이 없습니다",
    "fileCount": "{count}개 파일",
    "selectedCount": "{count}개 선택됨",
    "selectAll": "전체 선택",
    "deselectAll": "전체 해제",
    "clearSelection": "선택 해제",
    "removeFile": "파일 삭제",
    "rotateSelected": "{count}개 선택 — 회전",
    "rotationApply": "{degrees}° 회전",
    "rotationReset": "원본 방향으로 리셋",
    "rotationHint": "Ctrl+클릭: 개별 선택 | Shift+클릭: 범위 선택"
  }
}
```

- [ ] **Step 2: `en.json`에 `gallery` 섹션 추가**

`src/messages/en.json`의 마지막 `}` 앞에 추가:

```json
{
  "app": {
    "title": "FileZen",
    "subtitle": "Convert and resize images instantly"
  },
  "header": {
    "title": "FileZen",
    "description": "Convert and resize images instantly. Client-side processing, no uploads."
  },
  "pages": {
    "uploadSection": "Upload Images",
    "filesSection": "Files",
    "downloadSection": "Download"
  },
  "upload": {
    "title": "Upload Images",
    "dragDrop": "Drag & drop images here",
    "dropHere": "Drop files here",
    "selectFiles": "Select Files",
    "orClick": "or click to select up to {count} files (max 50MB each)",
    "maxFiles": "Select up to {{count}} files (max 50MB each)",
    "supportedFormats": "Supported formats",
    "formats": "PNG, JPG, WebP, GIF"
  },
  "files": {
    "title": "Files",
    "noFiles": "No files uploaded yet",
    "status": {
      "pending": "Pending",
      "processing": "Processing",
      "completed": "Completed",
      "error": "Error"
    }
  },
  "preview": {
    "title": "Preview",
    "selectFile": "Select a file to preview",
    "comparison": "Comparison (Original vs Converted)",
    "process": "Process a file to compare",
    "original": "Original",
    "processed": "Processed"
  },
  "settings": {
    "title": "Settings",
    "format": "Format",
    "dimensions": "Dimensions",
    "width": "Width",
    "height": "Height",
    "resizeMode": "Resize Mode",
    "contain": "Fit Inside (Contain)",
    "cover": "Cover (Auto Crop)",
    "stretch": "Stretch to Fit",
    "crop": "Manual Crop",
    "quality": "Quality",
    "jpgQuality": "JPG Quality",
    "webpQuality": "WebP Quality",
    "pngCompression": "Compression",
    "presets": "Quick Presets",
    "metadata": "Remove Metadata (EXIF)",
    "formatLabels": {
      "png": "PNG (Lossless)",
      "jpg": "JPG (Lossy)",
      "webp": "WebP (Modern)"
    },
    "resizeLabels": {
      "contain": "Fit Inside (Contain)",
      "cover": "Cover (Auto Crop)",
      "stretch": "Stretch to Fit",
      "crop": "Manual Crop"
    }
  },
  "presets": {
    "thumbnail": "Thumbnail (200x200)",
    "square": "Square (500x500)",
    "instagram_feed": "Instagram Feed (1080x1350)",
    "instagram_story": "Instagram Story (1080x1920)",
    "twitter_header": "Twitter Header (1500x500)",
    "linkedin": "LinkedIn Cover (1200x627)",
    "facebook": "Facebook (1200x630)",
    "youtube": "YouTube Thumbnail (1280x720)",
    "web_small": "Web Small (640x480)",
    "web_large": "Web Large (1920x1080)",
    "preset-1": "Thumbnail (200x200)",
    "preset-2": "Square (500x500)",
    "preset-3": "Instagram Feed (1080x1350)",
    "preset-4": "Instagram Story (1080x1920)",
    "preset-5": "Twitter Header (1500x500)",
    "preset-6": "LinkedIn Cover (1200x627)",
    "preset-7": "Facebook (1200x630)",
    "preset-8": "YouTube Thumbnail (1280x720)",
    "preset-9": "Web Small (640x480)",
    "preset-10": "Web Large (1920x1080)"
  },
  "download": {
    "title": "Download",
    "downloadSelected": "Download Selected",
    "downloadZip": "Download as ZIP",
    "processFiles": "Process files to download"
  },
  "formats": {
    "png": "PNG (Lossless)",
    "jpg": "JPG (Lossy)",
    "webp": "WebP (Modern)"
  },
  "language": {
    "ko": "한글",
    "en": "English"
  },
  "gallery": {
    "noFiles": "No files uploaded yet",
    "fileCount": "{count} files",
    "selectedCount": "{count} selected",
    "selectAll": "Select All",
    "deselectAll": "Deselect All",
    "clearSelection": "Clear Selection",
    "removeFile": "Remove file",
    "rotateSelected": "{count} selected — Rotate",
    "rotationApply": "Rotate {degrees}°",
    "rotationReset": "Reset to original orientation",
    "rotationHint": "Ctrl+click: toggle | Shift+click: range select"
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/messages/ko.json src/messages/en.json
git commit -m "feat: add gallery and rotation i18n strings"
```

---

### Task 9: `src/app/[locale]/page.tsx` — FileList → ImageGallery + RotationToolbar로 교체

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: page.tsx 수정**

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/layout/MainLayout';
import { UploadZone } from '@/components/upload/UploadZone';
import { ImageGallery } from '@/components/upload/ImageGallery';
import { RotationToolbar } from '@/components/upload/RotationToolbar';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { ComparisonView } from '@/components/preview/ComparisonView';
import { DownloadManager } from '@/components/manager/DownloadManager';

export const dynamic = 'force-dynamic';

export default function Home() {
  const t = useTranslations('pages');

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Upload Section */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('uploadSection')}</h2>
          <UploadZone />
        </section>

        {/* Gallery Section */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('filesSection')}</h2>
          <div className="space-y-2">
            <RotationToolbar />
            <ImageGallery />
          </div>
        </section>

        {/* Preview Section */}
        <section>
          <PreviewPanel />
        </section>

        {/* Comparison Section */}
        <section>
          <ComparisonView />
        </section>

        {/* Download Section */}
        <section className="sticky bottom-0 bg-background border-t border-muted-foreground/25 p-3 sm:p-4 -m-4 sm:-m-6 mb-0">
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('downloadSection')}</h2>
          <DownloadManager />
        </section>
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -40
```

Expected: 타입 오류 없음 또는 `Found 0 errors.`

- [ ] **Step 3: 커밋**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: replace FileList with ImageGallery and add RotationToolbar to page"
```

---

### Task 10: 전체 빌드 검증 및 최종 커밋

**Files:**
- (검증만)

- [ ] **Step 1: 전체 TypeScript 타입 체크**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1
```

Expected: `Found 0 errors.` 또는 기존 비관련 오류만

- [ ] **Step 2: Next.js 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route ... rendered` 성공 메시지

- [ ] **Step 3: 빌드 오류 발생 시 진단**

빌드 오류가 있는 경우, 오류 메시지를 확인하고:
- `Property 'selectedFileIds' does not exist` → AppContext에서 value 객체에 추가됐는지 확인
- `Property 'rotation' does not exist on type 'ProcessingFile'` → types.ts에 `rotation: RotationDegrees` 추가됐는지 확인
- `Cannot find module '@base-ui/react/checkbox'` → `npx tsc --noEmit`으로 확인하거나 checkbox.tsx에서 import 경로 수정

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git status
git commit -m "feat: complete image gallery multi-select and rotation feature"
```

---

## 검증 체크리스트

구현 완료 후 브라우저에서 다음을 수동으로 확인:

1. **파일 업로드**: 100개 이상 이미지 업로드 → 그리드에 썸네일 표시됨
2. **단일 선택**: 썸네일 클릭 → 체크박스 + 테두리 활성화, RotationToolbar 표시
3. **다중 선택 - Ctrl+클릭**: 여러 이미지를 개별 토글 선택
4. **다중 선택 - Shift+클릭**: 범위 선택 동작
5. **전체 선택/해제**: 상단 버튼으로 전체 선택/해제
6. **회전 90°**: 선택된 이미지들이 모두 90° 회전됨 (썸네일에 CSS transform 적용)
7. **회전 누적**: 90° 두 번 클릭 → 180° 표시, 세 번 → 270°, 네 번 → 0°
8. **리셋(360°/↺)**: 선택된 이미지들이 모두 0°로 리셋
9. **회전 각도 배지**: rotation > 0인 이미지 우하단에 각도 숫자 표시
10. **미리보기 연동**: 클릭한 이미지가 PreviewPanel에 계속 표시됨

---

## 알려진 제한 사항

- **CSS 회전만 적용**: 이 구현에서 회전은 **표시용(CSS transform)**이며, 실제 파일 변환 시 회전이 반영되려면 `useImageProcessor` 훅에 추가 작업 필요 (Phase 2 범위)
- **Shift+클릭 구현**: `clearSelection` 후 재선택하는 방식으로, 기존 선택과 새 범위의 합집합 대신 새 범위로 교체됨 (UX 단순화 결정)
