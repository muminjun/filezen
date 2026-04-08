# File / PDF Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete client-side PDF toolkit in the filezen File tab with 6 tools: page manager, merge, split, PDF↔image conversion, compression, and password unlock.

**Architecture:** A minimal `FileContext` (just active tool state) and six self-contained tool components each managing their own local file/processing state. All PDF manipulation uses `pdfjs-dist` (rendering/thumbnails) + `pdf-lib` (creation/modification). No server required.

**Tech Stack:** Next.js 16, React 19, TypeScript, `pdfjs-dist@4`, `pdf-lib@1`, `react-dropzone` (existing), Tailwind CSS, `lucide-react` (existing), `jszip` (existing)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `src/lib/pdfThumbnail.ts` | pdfjs: render pages → thumbnail blob URLs |
| CREATE | `src/lib/pdfPageOps.ts` | pdf-lib: reorder/delete/rotate pages |
| CREATE | `src/lib/pdfMerge.ts` | pdf-lib: merge multiple PDFs |
| CREATE | `src/lib/pdfSplit.ts` | pdf-lib: split by mode (all/selection/range) |
| CREATE | `src/lib/pdfConvert.ts` | pdfjs + pdf-lib: PDF↔image conversion |
| CREATE | `src/lib/pdfCompress.ts` | pdf-lib + pdfjs: metadata strip + rasterize |
| CREATE | `src/lib/pdfUnlock.ts` | pdfjs (verify) + pdf-lib (re-save unlocked) |
| MODIFY | `src/lib/types.ts` | Add `FileToolMode`, `PdfPage`, `FileContextType` |
| MODIFY | `src/lib/constants.ts` | Add PDF upload limits |
| MODIFY | `src/lib/utils.ts` | Add `downloadBytes` helper |
| CREATE | `src/context/FileContext.tsx` | Active tool state only |
| MODIFY | `src/app/[locale]/layout.tsx` | Wrap with `FileProvider` |
| MODIFY | `src/messages/en.json` | Add `file` namespace |
| MODIFY | `src/messages/ko.json` | Add `file` namespace |
| CREATE | `src/components/file/FileUploadStrip.tsx` | PDF drag-drop upload (shared UI) |
| CREATE | `src/components/file/FileToolSelector.tsx` | 6-tab tool switcher |
| MODIFY | `src/components/file/FilePage.tsx` | Replace Coming Soon with real layout |
| CREATE | `src/components/file/tools/PageManager.tsx` | Thumbnail grid, drag reorder, rotate, delete |
| CREATE | `src/components/file/tools/MergeTool.tsx` | Multi-PDF upload, order, merge |
| CREATE | `src/components/file/tools/SplitTool.tsx` | Page selection/range, split download |
| CREATE | `src/components/file/tools/ConvertTool.tsx` | PDF↔image tabs |
| CREATE | `src/components/file/tools/CompressTool.tsx` | 3-level compression |
| CREATE | `src/components/file/tools/UnlockTool.tsx` | Password input, unlock & download |
| MODIFY | `src/components/image/BottomActionBar.tsx` | Add "Export as PDF" button |

---

## Task 1: Feature branch + install dependencies + next.config update

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/file-pdf-toolkit
```

- [ ] **Step 2: Install PDF libraries**

```bash
npm install pdfjs-dist pdf-lib
npm install --save-dev @types/pdfjs-dist
```

Expected: packages installed, `package.json` updated.

- [ ] **Step 3: Update next.config.mjs to alias canvas (prevents pdfjs Node.js canvas import errors)**

Replace the existing `next.config.mjs` with:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Prevent pdfjs-dist from trying to import the Node.js `canvas` module
    config.resolve.alias.canvas = false;

    return config;
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors (new packages may have their own types).

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs package.json package-lock.json
git commit -m "feat: install pdfjs-dist and pdf-lib, configure canvas alias"
```

---

## Task 2: Add types, constants, utils helper, and all i18n strings

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/utils.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: Add PDF types to `src/lib/types.ts`**

Append to the end of the file:

```typescript
// ─── File / PDF Toolkit types ────────────────────────────────────────────────

export type FileToolMode =
  | 'page-manager'
  | 'merge'
  | 'split'
  | 'convert'
  | 'compress'
  | 'unlock';

/** A single PDF page with rendered thumbnail */
export interface PdfPage {
  pageIndex: number;  // 0-based original page index
  thumbnail: string;  // blob URL (must be revoked on cleanup)
  rotation: number;   // additional rotation applied: 0 | 90 | 180 | 270
}

export interface FileContextType {
  activeTool: FileToolMode;
  setActiveTool: (tool: FileToolMode) => void;
}
```

- [ ] **Step 2: Add PDF constants to `src/lib/constants.ts`**

Append to the end of the file:

```typescript
export const MAX_PDF_FILES = 50;
export const MAX_PDF_FILE_SIZE = 200 * 1024 * 1024; // 200MB
export const PDF_THUMBNAIL_SCALE = 0.25;             // render at 25% for speed
```

- [ ] **Step 3: Add `downloadBytes` helper to `src/lib/utils.ts`**

Append to the end of the file:

```typescript
/**
 * Trigger a browser download for a Uint8Array (e.g., a PDF)
 */
export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a browser download for a generic Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Add `file` namespace to `src/messages/en.json`**

Add the following before the final `}` of the JSON object (after the `"seo"` block):

```json
  "file": {
    "upload": {
      "dragDrop": "Drag a PDF here or click to upload",
      "dropHere": "Drop here",
      "formats": "PDF · Up to 50 files · 200MB each",
      "processing": "Loading PDF..."
    },
    "tools": {
      "pageManager": "Page Manager",
      "merge": "Merge",
      "split": "Split",
      "convert": "Convert",
      "compress": "Compress",
      "unlock": "Unlock"
    },
    "pageManager": {
      "empty": "Upload a PDF to manage its pages",
      "selectAll": "Select All",
      "deselectAll": "Deselect All",
      "deleteSelected": "Delete Selected",
      "rotateSelected": "Rotate 90°",
      "save": "Save PDF",
      "saving": "Saving...",
      "pageCount": "{count} pages",
      "selectedCount": "{count} selected"
    },
    "merge": {
      "empty": "Upload 2 or more PDFs to merge",
      "fileCount": "{count} files",
      "merge": "Merge & Download",
      "merging": "Merging...",
      "remove": "Remove"
    },
    "split": {
      "empty": "Upload a PDF to split",
      "modeAll": "Each page as separate PDF",
      "modeSelection": "Extract selected pages",
      "modeRange": "By range",
      "rangePlaceholder": "e.g. 1-3, 5, 7-10",
      "split": "Split & Download",
      "splitting": "Splitting...",
      "selectPages": "Click pages to select",
      "pageCount": "{count} pages"
    },
    "convert": {
      "emptyPdf": "Upload a PDF to convert to images",
      "emptyImages": "Upload images to convert to PDF",
      "tabPdfToImage": "PDF → Images",
      "tabImageToPdf": "Images → PDF",
      "format": "Format",
      "resolution": "Resolution",
      "res72": "72 DPI (Screen)",
      "res150": "150 DPI (Standard)",
      "res300": "300 DPI (Print)",
      "convert": "Convert & Download ZIP",
      "converting": "Converting...",
      "sendToImageTab": "Send to Image Tab",
      "pageSize": "Page Size",
      "sizeA4": "A4",
      "sizeLetter": "Letter",
      "sizeFit": "Fit to image",
      "createPdf": "Create PDF",
      "creating": "Creating..."
    },
    "compress": {
      "empty": "Upload a PDF to compress",
      "level": "Compression Level",
      "levelLow": "Low — metadata only (lossless)",
      "levelMedium": "Medium — rasterize at 75% JPEG",
      "levelHigh": "High — rasterize at 50% JPEG (loses text layer)",
      "originalSize": "Original",
      "compressedSize": "Compressed",
      "compress": "Compress & Download",
      "compressing": "Compressing..."
    },
    "unlock": {
      "empty": "Upload a password-protected PDF",
      "passwordPlaceholder": "Enter PDF password",
      "unlock": "Unlock & Download",
      "unlocking": "Unlocking...",
      "wrongPassword": "Wrong password. Please try again.",
      "notProtected": "This PDF is not password-protected."
    }
  }
```

- [ ] **Step 5: Add `file` namespace to `src/messages/ko.json`**

Add the following before the final `}` of the JSON object (after the `"seo"` block):

```json
  "file": {
    "upload": {
      "dragDrop": "PDF를 드래그하거나 클릭해서 업로드",
      "dropHere": "여기에 놓으세요",
      "formats": "PDF · 최대 50개 · 파일당 200MB",
      "processing": "PDF 로딩 중..."
    },
    "tools": {
      "pageManager": "페이지 관리",
      "merge": "PDF 병합",
      "split": "PDF 분리",
      "convert": "변환",
      "compress": "압축",
      "unlock": "비밀번호 해제"
    },
    "pageManager": {
      "empty": "PDF를 업로드하여 페이지를 관리하세요",
      "selectAll": "전체 선택",
      "deselectAll": "전체 해제",
      "deleteSelected": "선택 삭제",
      "rotateSelected": "90° 회전",
      "save": "PDF 저장",
      "saving": "저장 중...",
      "pageCount": "{count}페이지",
      "selectedCount": "{count}개 선택됨"
    },
    "merge": {
      "empty": "병합할 PDF를 2개 이상 업로드하세요",
      "fileCount": "{count}개 파일",
      "merge": "병합 & 다운로드",
      "merging": "병합 중...",
      "remove": "제거"
    },
    "split": {
      "empty": "분리할 PDF를 업로드하세요",
      "modeAll": "각 페이지를 별도 PDF로",
      "modeSelection": "선택한 페이지 추출",
      "modeRange": "범위로 분리",
      "rangePlaceholder": "예: 1-3, 5, 7-10",
      "split": "분리 & 다운로드",
      "splitting": "분리 중...",
      "selectPages": "페이지를 클릭해서 선택하세요",
      "pageCount": "{count}페이지"
    },
    "convert": {
      "emptyPdf": "이미지로 변환할 PDF를 업로드하세요",
      "emptyImages": "PDF로 변환할 이미지를 업로드하세요",
      "tabPdfToImage": "PDF → 이미지",
      "tabImageToPdf": "이미지 → PDF",
      "format": "포맷",
      "resolution": "해상도",
      "res72": "72 DPI (화면)",
      "res150": "150 DPI (표준)",
      "res300": "300 DPI (인쇄)",
      "convert": "변환 & ZIP 다운로드",
      "converting": "변환 중...",
      "sendToImageTab": "이미지 탭으로 보내기",
      "pageSize": "페이지 크기",
      "sizeA4": "A4",
      "sizeLetter": "Letter",
      "sizeFit": "이미지 크기에 맞춤",
      "createPdf": "PDF 생성",
      "creating": "생성 중..."
    },
    "compress": {
      "empty": "압축할 PDF를 업로드하세요",
      "level": "압축 레벨",
      "levelLow": "낮음 — 메타데이터만 제거 (무손실)",
      "levelMedium": "중간 — JPEG 75% 래스터화",
      "levelHigh": "높음 — JPEG 50% 래스터화 (텍스트 레이어 손실)",
      "originalSize": "원본",
      "compressedSize": "압축 후",
      "compress": "압축 & 다운로드",
      "compressing": "압축 중..."
    },
    "unlock": {
      "empty": "비밀번호가 설정된 PDF를 업로드하세요",
      "passwordPlaceholder": "PDF 비밀번호 입력",
      "unlock": "잠금 해제 & 다운로드",
      "unlocking": "해제 중...",
      "wrongPassword": "비밀번호가 틀렸습니다. 다시 시도해주세요.",
      "notProtected": "이 PDF는 비밀번호가 설정되어 있지 않습니다."
    }
  }
```

- [ ] **Step 6: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts src/lib/utils.ts src/messages/en.json src/messages/ko.json
git commit -m "feat: add PDF types, constants, download helpers, and i18n strings"
```

---

## Task 3: Create `pdfThumbnail.ts`

**Files:**
- Create: `src/lib/pdfThumbnail.ts`

Renders PDF pages to canvas and returns blob URL thumbnails. Uses dynamic import so pdfjs-dist never runs on the server.

- [ ] **Step 1: Create `src/lib/pdfThumbnail.ts`**

```typescript
import type { PdfPage } from './types';
import { PDF_THUMBNAIL_SCALE } from './constants';

/** Lazily load pdfjs-dist and configure worker (browser only) */
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

export type ThumbnailResult =
  | { success: true; pages: PdfPage[]; pageCount: number }
  | { success: false; requiresPassword: true };

/**
 * Generate thumbnails for all pages of a PDF file.
 * Returns { success: false, requiresPassword: true } if password-protected.
 */
export async function generateThumbnails(
  file: File,
  scale = PDF_THUMBNAIL_SCALE
): Promise<ThumbnailResult> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pages = await renderAllPages(pdf, scale);
    return { success: true, pages, pageCount: pdf.numPages };
  } catch (err: unknown) {
    if (isPasswordError(err)) {
      return { success: false, requiresPassword: true };
    }
    throw err;
  }
}

/**
 * Generate thumbnails with a password for protected PDFs.
 * Throws if password is wrong.
 */
export async function generateThumbnailsWithPassword(
  file: File,
  password: string,
  scale = PDF_THUMBNAIL_SCALE
): Promise<{ pages: PdfPage[]; pageCount: number }> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password,
  });
  const pdf = await loadingTask.promise;
  const pages = await renderAllPages(pdf, scale);
  return { pages, pageCount: pdf.numPages };
}

/**
 * Render a PDF at a given scale and return an array of images (blob URLs).
 * Used by pdfToImages in pdfConvert.ts.
 */
export async function renderPdfToBlobs(
  file: File,
  scale: number,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<Blob[]> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const blobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, mimeType, quality);
    blobs.push(blob);
  }

  return blobs;
}

// ── Internals ──────────────────────────────────────────────────────────────

async function renderAllPages(
  pdf: import('pdfjs-dist').PDFDocumentProxy,
  scale: number
): Promise<PdfPage[]> {
  const pages: PdfPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.7);
    pages.push({ pageIndex: i - 1, thumbnail: URL.createObjectURL(blob), rotation: 0 });
  }
  return pages;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mimeType,
      quality
    );
  });
}

function isPasswordError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'PasswordException'
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors. (pdfjs-dist types may need `@types/pdfjs-dist` — already installed in Task 1.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdfThumbnail.ts
git commit -m "feat: add pdfThumbnail utility for PDF page rendering"
```

---

## Task 4: Create `FileContext.tsx` + wrap layout

**Files:**
- Create: `src/context/FileContext.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create `src/context/FileContext.tsx`**

```typescript
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { FileContextType, FileToolMode } from '../lib/types';

const FileContext = createContext<FileContextType | undefined>(undefined);

export function useFileContext(): FileContextType {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFileContext must be used inside FileProvider');
  return ctx;
}

export function FileProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<FileToolMode>('page-manager');

  return (
    <FileContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </FileContext.Provider>
  );
}
```

- [ ] **Step 2: Modify `src/app/[locale]/layout.tsx` to add `FileProvider`**

```typescript
import { AppProvider } from '@/context/AppContext';
import { FileProvider } from '@/context/FileContext';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ko: '/ko',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://filezen.app/${locale}`,
      siteName: 'FileZen',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    messages = (await import('@/messages/en.json')).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProvider>
        <FileProvider>
          {children}
        </FileProvider>
      </AppProvider>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/context/FileContext.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add FileContext and wrap locale layout with FileProvider"
```

---

## Task 5: FileUploadStrip + FileToolSelector + FilePage scaffold

**Files:**
- Create: `src/components/file/FileUploadStrip.tsx`
- Create: `src/components/file/FileToolSelector.tsx`
- Modify: `src/components/file/FilePage.tsx`

Note: FilePage at this stage will show placeholder divs for each tool — real tools are wired in later tasks.

- [ ] **Step 1: Create `src/components/file/FileUploadStrip.tsx`**

This component is owned by each tool independently (the tool passes `onFiles` callback). This reusable strip accepts PDFs via react-dropzone.

```typescript
'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_PDF_FILES, MAX_PDF_FILE_SIZE } from '@/lib/constants';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function FileUploadStrip({ onFiles, disabled = false, multiple = false }: Props) {
  const t = useTranslations('file.upload');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: multiple ? MAX_PDF_FILES : 1,
    maxSize: MAX_PDF_FILE_SIZE,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200 ease-in-out',
        isDragActive
          ? 'bg-primary/10 border-primary shadow-inner'
          : 'bg-card hover:bg-muted/60 hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-60'
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
          isDragActive && 'text-primary'
        )}>
          {disabled ? t('processing') : isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {t('formats')}
        </span>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/file/FileToolSelector.tsx`**

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { LayoutGrid, Merge, Scissors, RefreshCw, Archive, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileContext } from '@/context/FileContext';
import type { FileToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: FileToolMode; icon: React.ReactNode; key: string }> = [
  { mode: 'page-manager', icon: <LayoutGrid size={14} />, key: 'pageManager' },
  { mode: 'merge',        icon: <Merge size={14} />,      key: 'merge' },
  { mode: 'split',        icon: <Scissors size={14} />,   key: 'split' },
  { mode: 'convert',      icon: <RefreshCw size={14} />,  key: 'convert' },
  { mode: 'compress',     icon: <Archive size={14} />,    key: 'compress' },
  { mode: 'unlock',       icon: <Unlock size={14} />,     key: 'unlock' },
];

export function FileToolSelector() {
  const t = useTranslations('file.tools');
  const { activeTool, setActiveTool } = useFileContext();

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, key }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeTool === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {icon}
          {t(key)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/components/file/FilePage.tsx`**

```typescript
'use client';

import { useFileContext } from '@/context/FileContext';
import { FileToolSelector } from './FileToolSelector';

// Tool components (implemented in Tasks 6–12)
import { PageManager } from './tools/PageManager';
import { MergeTool } from './tools/MergeTool';
import { SplitTool } from './tools/SplitTool';
import { ConvertTool } from './tools/ConvertTool';
import { CompressTool } from './tools/CompressTool';
import { UnlockTool } from './tools/UnlockTool';

export function FilePage() {
  const { activeTool } = useFileContext();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FileToolSelector />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTool === 'page-manager' && <PageManager />}
        {activeTool === 'merge'        && <MergeTool />}
        {activeTool === 'split'        && <SplitTool />}
        {activeTool === 'convert'      && <ConvertTool />}
        {activeTool === 'compress'     && <CompressTool />}
        {activeTool === 'unlock'       && <UnlockTool />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create stub tool files so `FilePage.tsx` compiles**

Create `src/components/file/tools/PageManager.tsx`:

```typescript
'use client';
export function PageManager() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Page Manager — coming soon</div>;
}
```

Create `src/components/file/tools/MergeTool.tsx`:

```typescript
'use client';
export function MergeTool() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Merge — coming soon</div>;
}
```

Create `src/components/file/tools/SplitTool.tsx`:

```typescript
'use client';
export function SplitTool() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Split — coming soon</div>;
}
```

Create `src/components/file/tools/ConvertTool.tsx`:

```typescript
'use client';
export function ConvertTool() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Convert — coming soon</div>;
}
```

Create `src/components/file/tools/CompressTool.tsx`:

```typescript
'use client';
export function CompressTool() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Compress — coming soon</div>;
}
```

Create `src/components/file/tools/UnlockTool.tsx`:

```typescript
'use client';
export function UnlockTool() {
  return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Unlock — coming soon</div>;
}
```

- [ ] **Step 5: Run dev server and verify File tab renders tool selector**

```bash
npm run dev
```

Open browser → navigate to localhost:3000 → click Files tab → see tool selector with 6 tabs, each showing "coming soon" content.

- [ ] **Step 6: Commit**

```bash
git add src/components/file/
git commit -m "feat: scaffold FilePage with tool selector and stub tool components"
```

---

## Task 6: `pdfPageOps.ts` + `PageManager.tsx`

**Files:**
- Create: `src/lib/pdfPageOps.ts`
- Replace: `src/components/file/tools/PageManager.tsx`

- [ ] **Step 1: Create `src/lib/pdfPageOps.ts`**

```typescript
import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Build a new PDF from a subset/reordering/rotation of the original pages.
 * @param file  Original PDF file
 * @param pages Array of { originalIndex, rotation } in desired output order.
 *              Pages not included are deleted. rotation is additional degrees (0/90/180/270).
 */
export async function buildModifiedPdf(
  file: File,
  pages: Array<{ originalIndex: number; rotation: number }>
): Promise<Uint8Array> {
  const srcBytes = new Uint8Array(await file.arrayBuffer());
  const srcDoc = await PDFDocument.load(srcBytes);
  const newDoc = await PDFDocument.create();

  for (const { originalIndex, rotation } of pages) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [originalIndex]);
    if (rotation !== 0) {
      const current = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((current + rotation) % 360));
    }
    newDoc.addPage(copiedPage);
  }

  return newDoc.save();
}
```

- [ ] **Step 2: Replace `src/components/file/tools/PageManager.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, Trash2, Download } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { generateThumbnails } from '@/lib/pdfThumbnail';
import { buildModifiedPdf } from '@/lib/pdfPageOps';
import { FileUploadStrip } from '../FileUploadStrip';
import type { PdfPage } from '@/lib/types';

interface PageItem extends PdfPage {
  // PdfPage already has: pageIndex (original), thumbnail, rotation
}

export function PageManager() {
  const t = useTranslations('file.pageManager');

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set()); // indices into pages[]
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setIsLoading(true);
    setSelectedIndices(new Set());
    try {
      const result = await generateThumbnails(f);
      if (!result.success) {
        alert('This PDF is password-protected. Use the Unlock tool first.');
        return;
      }
      setFile(f);
      setPages(result.pages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedIndices(new Set(pages.map((_, i) => i)));
  const deselectAll = () => setSelectedIndices(new Set());

  const deleteSelected = () => {
    setPages((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const rotateSelected = () => {
    setPages((prev) =>
      prev.map((p, i) =>
        selectedIndices.has(i) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  // Drag-and-drop reorder (same pattern as ImageGallery)
  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setPages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setIsSaving(true);
    try {
      const bytes = await buildModifiedPdf(
        file,
        pages.map((p) => ({ originalIndex: p.pageIndex, rotation: p.rotation }))
      );
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-edited.pdf`);
    } finally {
      setIsSaving(false);
    }
  };

  const allSelected = pages.length > 0 && selectedIndices.size === pages.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isLoading} multiple={false} />

      {pages.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap cursor-pointer"
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </button>

          <button
            onClick={deleteSelected}
            disabled={selectedIndices.size === 0}
            className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {t('deleteSelected')}
          </button>

          <button
            onClick={rotateSelected}
            disabled={selectedIndices.size === 0}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            <RotateCw size={12} />
            {t('rotateSelected')}
          </button>

          {selectedIndices.size > 0 && (
            <span className="text-xs font-medium text-primary whitespace-nowrap">
              {t('selectedCount', { count: selectedIndices.size })}
            </span>
          )}

          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {t('pageCount', { count: pages.length })}
          </span>

          <button
            onClick={handleSave}
            disabled={isSaving || pages.length === 0}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 whitespace-nowrap cursor-pointer',
              !isSaving
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Download size={12} />
            {isSaving ? t('saving') : t('save')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">{t('pageCount', { count: 0 })}</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
            {pages.map((page, idx) => (
              <div
                key={`${page.pageIndex}-${idx}`}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                onClick={() => toggleSelect(idx)}
                className={cn(
                  'relative aspect-[3/4] cursor-pointer rounded-md border-2 overflow-hidden transition-all select-none',
                  selectedIndices.has(idx)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50',
                  draggedIdx === idx && 'opacity-30'
                )}
              >
                <img
                  src={page.thumbnail}
                  alt={`Page ${page.pageIndex + 1}`}
                  className="h-full w-full object-cover"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center">
                  <span className="text-[10px] text-white font-medium">{page.pageIndex + 1}</span>
                </div>
                {selectedIndices.has(idx) && (
                  <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Test in browser**

Run `npm run dev`, go to Files tab → Page Manager. Upload a multi-page PDF. Verify:
- Thumbnails load
- Can click to select pages (blue border)
- Can drag to reorder
- "Rotate Selected" rotates the thumbnail
- "Delete Selected" removes pages
- "Save PDF" downloads a modified PDF

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdfPageOps.ts src/components/file/tools/PageManager.tsx
git commit -m "feat: implement PDF page manager (reorder, delete, rotate pages)"
```

---

## Task 7: `pdfMerge.ts` + `MergeTool.tsx`

**Files:**
- Create: `src/lib/pdfMerge.ts`
- Replace: `src/components/file/tools/MergeTool.tsx`

- [ ] **Step 1: Create `src/lib/pdfMerge.ts`**

```typescript
import { PDFDocument } from 'pdf-lib';

/**
 * Merge multiple PDF files into one, in the given order.
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const srcDoc = await PDFDocument.load(bytes);
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return mergedDoc.save();
}
```

- [ ] **Step 2: Replace `src/components/file/tools/MergeTool.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, GripVertical, Download } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { mergePdfs } from '@/lib/pdfMerge';
import { FileUploadStrip } from '../FileUploadStrip';

interface PdfEntry {
  id: string;
  file: File;
}

export function MergeTool() {
  const t = useTranslations('file.merge');
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleFiles = (files: File[]) => {
    const next: PdfEntry[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
    }));
    setEntries((prev) => [...prev, ...next]);
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setEntries((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  const handleMerge = async () => {
    if (entries.length < 2) return;
    setIsMerging(true);
    try {
      const bytes = await mergePdfs(entries.map((e) => e.file));
      downloadBytes(bytes, `merged-${Date.now()}.pdf`);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isMerging} multiple />

      {entries.length > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            {t('fileCount', { count: entries.length })}
          </span>
          <button
            onClick={handleMerge}
            disabled={entries.length < 2 || isMerging}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
              entries.length >= 2 && !isMerging
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Download size={12} />
            {isMerging ? t('merging') : t('merge')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-opacity',
                  draggedIdx === idx && 'opacity-30'
                )}
              >
                <GripVertical size={16} className="flex-shrink-0 cursor-move text-muted-foreground" />
                <span className="flex-1 truncate text-sm font-medium">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title={t('remove')}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Open browser → Files → Merge. Upload 2+ PDFs, drag to reorder, click Merge. Verify the downloaded PDF contains all pages.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfMerge.ts src/components/file/tools/MergeTool.tsx
git commit -m "feat: implement PDF merge tool"
```

---

## Task 8: `pdfSplit.ts` + `SplitTool.tsx`

**Files:**
- Create: `src/lib/pdfSplit.ts`
- Replace: `src/components/file/tools/SplitTool.tsx`

- [ ] **Step 1: Create `src/lib/pdfSplit.ts`**

```typescript
import { PDFDocument } from 'pdf-lib';

/**
 * Extract one page as a new PDF.
 */
async function extractPages(srcDoc: PDFDocument, pageIndices: number[]): Promise<Uint8Array> {
  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  copied.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

/**
 * Split every page into its own PDF. Returns one Uint8Array per page.
 */
export async function splitPdfAll(file: File): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  const results: Uint8Array[] = [];
  for (let i = 0; i < srcDoc.getPageCount(); i++) {
    results.push(await extractPages(srcDoc, [i]));
  }
  return results;
}

/**
 * Extract only the given page indices (0-based) into a single PDF.
 */
export async function splitPdfSelection(file: File, pageIndices: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  return extractPages(srcDoc, pageIndices);
}

/**
 * Parse a range string like "1-3, 5, 7-10" into groups of 0-based indices.
 * Pages out of range [1..maxPages] are ignored.
 * Each comma-separated segment becomes one output PDF.
 */
export function parseRangeString(rangeStr: string, maxPages: number): number[][] {
  return rangeStr
    .split(',')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const match = seg.match(/^(\d+)(?:-(\d+))?$/);
      if (!match) return [];
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : start;
      const indices: number[] = [];
      for (let p = Math.max(1, start); p <= Math.min(end, maxPages); p++) {
        indices.push(p - 1); // convert to 0-based
      }
      return indices;
    })
    .filter((group) => group.length > 0);
}

/**
 * Split by range string. Returns one PDF per range group.
 */
export async function splitPdfByRange(
  file: File,
  rangeStr: string
): Promise<Array<{ pages: number[]; bytes: Uint8Array }>> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  const groups = parseRangeString(rangeStr, srcDoc.getPageCount());
  const results: Array<{ pages: number[]; bytes: Uint8Array }> = [];
  for (const group of groups) {
    results.push({ pages: group, bytes: await extractPages(srcDoc, group) });
  }
  return results;
}
```

- [ ] **Step 2: Replace `src/components/file/tools/SplitTool.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes, downloadBlob } from '@/lib/utils';
import { generateThumbnails } from '@/lib/pdfThumbnail';
import { splitPdfAll, splitPdfSelection, splitPdfByRange } from '@/lib/pdfSplit';
import { FileUploadStrip } from '../FileUploadStrip';
import type { PdfPage } from '@/lib/types';

type SplitMode = 'all' | 'selection' | 'range';

export function SplitTool() {
  const t = useTranslations('file.split');

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<SplitMode>('all');
  const [rangeStr, setRangeStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setIsLoading(true);
    setSelectedIndices(new Set());
    try {
      const result = await generateThumbnails(f);
      if (!result.success) {
        alert('This PDF is password-protected. Use the Unlock tool first.');
        return;
      }
      setFile(f);
      setPages(result.pages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePage = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsSplitting(true);
    try {
      const JSZip = (await import('jszip')).default;

      if (mode === 'all') {
        const results = await splitPdfAll(file);
        if (results.length === 1) {
          downloadBytes(results[0], `page-1.pdf`);
        } else {
          const zip = new JSZip();
          results.forEach((bytes, i) => zip.file(`page-${i + 1}.pdf`, bytes));
          const content = await zip.generateAsync({ type: 'blob' });
          downloadBlob(content, `split-${file.name.replace(/\.pdf$/i, '')}.zip`);
        }
      } else if (mode === 'selection') {
        const indices = Array.from(selectedIndices).sort((a, b) => a - b);
        const bytes = await splitPdfSelection(file, indices);
        downloadBytes(bytes, `extracted-${file.name}`);
      } else {
        const results = await splitPdfByRange(file, rangeStr);
        if (results.length === 1) {
          downloadBytes(results[0].bytes, `split-1.pdf`);
        } else {
          const zip = new JSZip();
          results.forEach((r, i) => {
            const label = r.pages.map((p) => p + 1).join('-');
            zip.file(`pages-${label}.pdf`, r.bytes);
          });
          const content = await zip.generateAsync({ type: 'blob' });
          downloadBlob(content, `split-${file.name.replace(/\.pdf$/i, '')}.zip`);
        }
      }
    } finally {
      setIsSplitting(false);
    }
  };

  const canSplit =
    file &&
    !isSplitting &&
    (mode === 'all' ||
      (mode === 'selection' && selectedIndices.size > 0) ||
      (mode === 'range' && rangeStr.trim().length > 0));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isLoading || isSplitting} multiple={false} />

      {file && (
        <>
          {/* Mode selector */}
          <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'selection', 'range'] as SplitMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`mode${m.charAt(0).toUpperCase() + m.slice(1)}` as 'modeAll' | 'modeSelection' | 'modeRange')}
                </button>
              ))}
            </div>

            {mode === 'range' && (
              <input
                type="text"
                value={rangeStr}
                onChange={(e) => setRangeStr(e.target.value)}
                placeholder={t('rangePlaceholder')}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            )}
            {mode === 'selection' && (
              <p className="text-[11px] text-muted-foreground">{t('selectPages')}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('pageCount', { count: pages.length })}
              </span>
              <button
                onClick={handleSplit}
                disabled={!canSplit}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
                  canSplit
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                {isSplitting ? t('splitting') : t('split')}
              </button>
            </div>
          </div>

          {/* Page grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {pages.map((page, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={page.pageIndex}
                    onClick={() => mode === 'selection' && togglePage(idx)}
                    className={cn(
                      'relative aspect-[3/4] rounded-md border-2 overflow-hidden transition-all',
                      mode === 'selection' ? 'cursor-pointer' : 'cursor-default',
                      isSelected && mode === 'selection'
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border'
                    )}
                  >
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center">
                      <span className="text-[10px] text-white font-medium">{page.pageIndex + 1}</span>
                    </div>
                    {isSelected && mode === 'selection' && (
                      <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!file && !isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Test: Upload a multi-page PDF → try each mode (All / Selection / Range) → download and verify pages.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfSplit.ts src/components/file/tools/SplitTool.tsx
git commit -m "feat: implement PDF split tool (all pages / selection / range)"
```

---

## Task 9: `pdfConvert.ts` + `ConvertTool.tsx`

**Files:**
- Create: `src/lib/pdfConvert.ts`
- Replace: `src/components/file/tools/ConvertTool.tsx`

- [ ] **Step 1: Create `src/lib/pdfConvert.ts`**

```typescript
import { PDFDocument } from 'pdf-lib';
import { renderPdfToBlobs } from './pdfThumbnail';

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type PdfResolution = 72 | 150 | 300;

/** DPI → scale factor for pdfjs (default viewport is 96dpi, 1 unit ≈ 1/72 inch) */
function dpiToScale(dpi: PdfResolution): number {
  return dpi / 72;
}

/**
 * Convert each page of a PDF to image blobs.
 */
export async function pdfToImages(
  file: File,
  format: ImageFormat,
  dpi: PdfResolution
): Promise<Blob[]> {
  const mimeType =
    format === 'png' ? 'image/png' :
    format === 'webp' ? 'image/webp' :
    'image/jpeg';
  const quality = format === 'png' ? 1.0 : 0.92;
  return renderPdfToBlobs(file, dpiToScale(dpi), mimeType, quality);
}

export type PageSize = 'a4' | 'letter' | 'fit';

// Standard page sizes in PDF points (1 pt = 1/72 inch)
const PAGE_SIZES = {
  a4:     { width: 595.28, height: 841.89 },
  letter: { width: 612,    height: 792 },
};

/**
 * Convert image files to a PDF.
 * WebP images are converted to PNG via canvas before embedding.
 */
export async function imagesToPdf(
  images: File[],
  pageSize: PageSize
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imgFile of images) {
    const arrayBuffer = await imgFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let embeddedImage;
    const type = imgFile.type;

    if (type === 'image/jpeg') {
      embeddedImage = await pdfDoc.embedJpg(bytes);
    } else if (type === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(bytes);
    } else {
      // WebP or GIF — convert to PNG via canvas
      const pngBytes = await convertToPng(imgFile);
      embeddedImage = await pdfDoc.embedPng(pngBytes);
    }

    const imgDims = embeddedImage.scale(1);

    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === 'fit') {
      pageWidth = imgDims.width;
      pageHeight = imgDims.height;
    } else {
      const size = PAGE_SIZES[pageSize];
      // Fit image within page preserving aspect ratio
      const scale = Math.min(size.width / imgDims.width, size.height / imgDims.height);
      pageWidth = size.width;
      pageHeight = size.height;
      imgDims.width *= scale;
      imgDims.height *= scale;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const x = (pageWidth - imgDims.width) / 2;
    const y = (pageHeight - imgDims.height) / 2;
    page.drawImage(embeddedImage, { x, y, width: imgDims.width, height: imgDims.height });
  }

  return pdfDoc.save();
}

async function convertToPng(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error('toBlob failed')); return; }
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        },
        'image/png'
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
```

- [ ] **Step 2: Replace `src/components/file/tools/ConvertTool.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn, downloadBlob, downloadBytes } from '@/lib/utils';
import { pdfToImages, imagesToPdf } from '@/lib/pdfConvert';
import { useAppContext } from '@/context/AppContext';
import { FileUploadStrip } from '../FileUploadStrip';
import type { ImageFormat, PdfResolution, PageSize } from '@/lib/pdfConvert';

type ConvertTab = 'pdf-to-image' | 'image-to-pdf';

export function ConvertTool() {
  const t = useTranslations('file.convert');
  const { addImages } = useAppContext();

  const [tab, setTab] = useState<ConvertTab>('pdf-to-image');

  // PDF → Image state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imgFormat, setImgFormat] = useState<ImageFormat>('png');
  const [dpi, setDpi] = useState<PdfResolution>(150);
  const [isConverting, setIsConverting] = useState(false);

  // Image → PDF state
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [isCreating, setIsCreating] = useState(false);

  const handlePdfDrop = useCallback((files: File[]) => setPdfFile(files[0]), []);

  const handleImgDrop = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    setImgFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const handleConvertPdfToImages = async () => {
    if (!pdfFile) return;
    setIsConverting(true);
    try {
      const blobs = await pdfToImages(pdfFile, imgFormat, dpi);
      const ext = imgFormat === 'jpeg' ? 'jpg' : imgFormat;
      if (blobs.length === 1) {
        downloadBlob(blobs[0], `page-1.${ext}`);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        blobs.forEach((b, i) => zip.file(`page-${i + 1}.${ext}`, b));
        const content = await zip.generateAsync({ type: 'blob' });
        const baseName = pdfFile.name.replace(/\.pdf$/i, '');
        downloadBlob(content, `${baseName}-images.zip`);
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleSendToImageTab = async () => {
    if (!pdfFile) return;
    setIsConverting(true);
    try {
      const blobs = await pdfToImages(pdfFile, 'png', 150);
      const ext = 'png';
      const files = blobs.map(
        (blob, i) => new File([blob], `${pdfFile.name.replace(/\.pdf$/i, '')}-page-${i + 1}.${ext}`, { type: 'image/png' })
      );
      addImages(files);
      alert('Pages added to Image tab.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCreatePdf = async () => {
    if (imgFiles.length === 0) return;
    setIsCreating(true);
    try {
      const bytes = await imagesToPdf(imgFiles, pageSize);
      downloadBytes(bytes, `images-to-pdf-${Date.now()}.pdf`);
    } finally {
      setIsCreating(false);
    }
  };

  const removeImgFile = (idx: number) =>
    setImgFiles((prev) => prev.filter((_, i) => i !== idx));

  const onImgDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedImgIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onImgDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedImgIdx === null || draggedImgIdx === idx) return;
    setImgFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedImgIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDraggedImgIdx(idx);
  };
  const onImgDragEnd = () => setDraggedImgIdx(null);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sub-tab switcher */}
      <div className="flex flex-shrink-0 gap-1 border-b border-border px-4 py-2">
        {(['pdf-to-image', 'image-to-pdf'] as ConvertTab[]).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              tab === t_
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {t_ === 'pdf-to-image' ? t('tabPdfToImage') : t('tabImageToPdf')}
          </button>
        ))}
      </div>

      {tab === 'pdf-to-image' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <FileUploadStrip onFiles={handlePdfDrop} disabled={isConverting} multiple={false} />
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {pdfFile ? (
              <>
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>

                {/* Format */}
                <div className="flex items-center gap-3">
                  <span className="w-24 flex-shrink-0 text-xs text-muted-foreground">{t('format')}</span>
                  <div className="flex gap-1">
                    {(['png', 'jpeg', 'webp'] as ImageFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setImgFormat(f)}
                        className={cn(
                          'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                          imgFormat === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div className="flex items-center gap-3">
                  <span className="w-24 flex-shrink-0 text-xs text-muted-foreground">{t('resolution')}</span>
                  <div className="flex flex-wrap gap-1">
                    {([72, 150, 300] as PdfResolution[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDpi(d)}
                        className={cn(
                          'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                          dpi === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {t(`res${d}` as 'res72' | 'res150' | 'res300')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleConvertPdfToImages}
                    disabled={isConverting}
                    className={cn(
                      'rounded-md px-4 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                      !isConverting ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isConverting ? t('converting') : t('convert')}
                  </button>
                  <button
                    onClick={handleSendToImageTab}
                    disabled={isConverting}
                    className={cn(
                      'rounded-md border border-border px-4 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                      !isConverting ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {t('sendToImageTab')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('emptyPdf')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'image-to-pdf' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Image upload area via dropzone directly */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
              if (files.length) handleImgDrop(files);
            }}
            className="flex-shrink-0 flex h-14 sm:h-20 cursor-pointer items-center gap-4 border-b-2 border-dashed border-border bg-card px-4 sm:px-6 hover:bg-muted/60 hover:border-primary/50 transition-all"
          >
            <label className="flex w-full cursor-pointer items-center gap-4">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) handleImgDrop(files);
                }}
              />
              <span className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {t('emptyImages')}
              </span>
            </label>
          </div>

          {imgFiles.length > 0 && (
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-2">
              {/* Page size */}
              <span className="text-xs text-muted-foreground flex-shrink-0">{t('pageSize')}</span>
              <div className="flex gap-1">
                {(['a4', 'letter', 'fit'] as PageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPageSize(s)}
                    className={cn(
                      'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                      pageSize === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`size${s.charAt(0).toUpperCase() + s.slice(1)}` as 'sizeA4' | 'sizeLetter' | 'sizeFit')}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreatePdf}
                disabled={isCreating}
                className={cn(
                  'ml-auto rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer',
                  !isCreating ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                )}
              >
                {isCreating ? t('creating') : t('createPdf')}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {imgFiles.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('emptyImages')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {imgFiles.map((f, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => onImgDragStart(e, idx)}
                    onDragOver={(e) => onImgDragOver(e, idx)}
                    onDragEnd={onImgDragEnd}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-opacity',
                      draggedImgIdx === idx && 'opacity-30'
                    )}
                  >
                    <span className="flex-1 truncate text-sm">{f.name}</span>
                    <button onClick={() => removeImgFile(idx)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Test PDF→Images and Images→PDF flows. Verify downloaded files open correctly.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfConvert.ts src/components/file/tools/ConvertTool.tsx
git commit -m "feat: implement PDF↔image conversion tool"
```

---

## Task 10: Update `BottomActionBar.tsx` — add "Export as PDF" button

**Files:**
- Modify: `src/components/image/BottomActionBar.tsx`
- Modify: `src/messages/en.json` (add `actionBar.exportPdf`)
- Modify: `src/messages/ko.json` (add `actionBar.exportPdf`)

- [ ] **Step 1: Add translation key**

In `src/messages/en.json`, inside `"actionBar"`, add:
```json
"exportPdf": "Export as PDF"
```

In `src/messages/ko.json`, inside `"actionBar"`, add:
```json
"exportPdf": "PDF로 내보내기"
```

- [ ] **Step 2: Modify `src/components/image/BottomActionBar.tsx`**

Add this import near the top (after existing imports):
```typescript
import { imagesToPdf } from '@/lib/pdfConvert';
import { downloadBytes } from '@/lib/utils';
```

Add this handler inside the `BottomActionBar` component (after `handleApplyCustom`):
```typescript
const handleExportPdf = async () => {
  const selected = images.filter((img) => selectedIds.has(img.id));
  if (selected.length === 0) return;
  const bytes = await imagesToPdf(selected.map((img) => img.file), 'a4');
  downloadBytes(bytes, `filezen-export-${Date.now()}.pdf`);
};
```

Note: The `images` array is not currently in `useAppContext()` destructuring in BottomActionBar — add it:
```typescript
const {
  images,          // ← add this
  selectedIds,
  rotateSelected,
  ...
} = useAppContext();
```

Add the button in the **desktop toolbar** after the Edit button divider:

```tsx
<div className="h-5 w-px flex-shrink-0 bg-border" />

<button
  onClick={handleExportPdf}
  disabled={!hasSelection}
  title={t('exportPdf')}
  className={cn(
    'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap',
    hasSelection
      ? 'bg-muted hover:bg-muted/80 text-foreground'
      : 'cursor-not-allowed text-muted-foreground opacity-40'
  )}
>
  PDF
</button>
```

Add the same button in the **mobile toolbar** after the Edit button:

```tsx
<button
  onClick={handleExportPdf}
  disabled={!hasSelection}
  title={t('exportPdf')}
  className={cn(
    'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95',
    hasSelection
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : 'opacity-35 text-muted-foreground cursor-not-allowed'
  )}
>
  PDF
</button>
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Select images in the image tab → click PDF button → verify downloaded PDF contains the selected images.

- [ ] **Step 4: Commit**

```bash
git add src/components/image/BottomActionBar.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat: add Export as PDF button to image tab toolbar"
```

---

## Task 11: `pdfCompress.ts` + `CompressTool.tsx`

**Files:**
- Create: `src/lib/pdfCompress.ts`
- Replace: `src/components/file/tools/CompressTool.tsx`

**Note on compression levels:**
- **Low**: Strip metadata using pdf-lib re-save (lossless, no text layer impact)
- **Medium**: Rasterize each page to canvas at 150dpi JPEG 75% (loses text layer, significant size reduction)
- **High**: Rasterize at 72dpi JPEG 50% (loses text layer, maximum size reduction)

- [ ] **Step 1: Create `src/lib/pdfCompress.ts`**

```typescript
import { PDFDocument } from 'pdf-lib';
import { renderPdfToBlobs } from './pdfThumbnail';

export type CompressLevel = 'low' | 'medium' | 'high';

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compress a PDF.
 * Low: metadata removal only (lossless).
 * Medium: rasterize pages at 150dpi JPEG 75%.
 * High: rasterize pages at 72dpi JPEG 50%.
 */
export async function compressPdf(
  file: File,
  level: CompressLevel
): Promise<CompressResult> {
  const originalSize = file.size;

  if (level === 'low') {
    const bytes = await stripMetadata(file);
    return { bytes, originalSize, compressedSize: bytes.byteLength };
  }

  // Medium / High: rasterize pages
  const scale = level === 'medium' ? 150 / 72 : 72 / 72; // 150dpi or 72dpi
  const quality = level === 'medium' ? 0.75 : 0.5;

  const blobs = await renderPdfToBlobs(file, scale, 'image/jpeg', quality);
  const pdfDoc = await PDFDocument.create();

  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const embeddedImage = await pdfDoc.embedJpg(new Uint8Array(arrayBuffer));
    const { width, height } = embeddedImage.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, { x: 0, y: 0, width, height });
  }

  const bytes = await pdfDoc.save();
  return { bytes, originalSize, compressedSize: bytes.byteLength };
}

async function stripMetadata(file: File): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  srcDoc.setTitle('');
  srcDoc.setAuthor('');
  srcDoc.setSubject('');
  srcDoc.setKeywords([]);
  srcDoc.setProducer('');
  srcDoc.setCreator('');
  return srcDoc.save();
}
```

- [ ] **Step 2: Replace `src/components/file/tools/CompressTool.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn, formatFileSize, downloadBytes } from '@/lib/utils';
import { compressPdf } from '@/lib/pdfCompress';
import { FileUploadStrip } from '../FileUploadStrip';
import type { CompressLevel } from '@/lib/pdfCompress';

export function CompressTool() {
  const t = useTranslations('file.compress');

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressLevel>('low');
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);
    try {
      const { bytes, originalSize, compressedSize } = await compressPdf(file, level);
      setResult({ originalSize, compressedSize });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-compressed.pdf`);
    } finally {
      setIsCompressing(false);
    }
  };

  const savings =
    result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isCompressing} multiple={false} />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {file ? (
          <>
            <p className="text-sm font-medium truncate">{file.name}</p>

            {/* Level selector */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t('level')}</span>
              {(['low', 'medium', 'high'] as CompressLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLevel(l); setResult(null); }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                    level === l
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {t(`level${l.charAt(0).toUpperCase() + l.slice(1)}` as 'levelLow' | 'levelMedium' | 'levelHigh')}
                </button>
              ))}
            </div>

            {/* Size comparison */}
            {result && (
              <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">{t('originalSize')}</p>
                  <p className="text-sm font-semibold">{formatFileSize(result.originalSize)}</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">{t('compressedSize')}</p>
                  <p className="text-sm font-semibold text-primary">{formatFileSize(result.compressedSize)}</p>
                </div>
                {savings !== null && (
                  <div className="ml-auto">
                    <span className={cn(
                      'text-sm font-bold',
                      savings > 0 ? 'text-green-500' : 'text-muted-foreground'
                    )}>
                      {savings > 0 ? `-${savings}%` : '~0%'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className={cn(
                'w-full rounded-md py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                !isCompressing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              )}
            >
              {isCompressing ? t('compressing') : t('compress')}
            </button>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Upload a PDF → try each level → verify size comparison shows reduction.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfCompress.ts src/components/file/tools/CompressTool.tsx
git commit -m "feat: implement PDF compression tool (low/medium/high levels)"
```

---

## Task 12: `pdfUnlock.ts` + `UnlockTool.tsx`

**Files:**
- Create: `src/lib/pdfUnlock.ts`
- Replace: `src/components/file/tools/UnlockTool.tsx`

- [ ] **Step 1: Create `src/lib/pdfUnlock.ts`**

```typescript
import { PDFDocument } from 'pdf-lib';

/**
 * Unlock a password-protected PDF by loading it with pdfjs (verify password)
 * then re-saving with pdf-lib without encryption.
 *
 * @throws Error with message 'wrong_password' if password is incorrect
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  // Step 1: Verify password with pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  try {
    // Verify the password is correct by loading with pdfjs
    await pdfjsLib.getDocument({ data: bytes, password }).promise;
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'PasswordException'
    ) {
      throw new Error('wrong_password');
    }
    throw err;
  }

  // Step 2: Load with pdf-lib using password and re-save without encryption
  const srcDoc = await PDFDocument.load(bytes, { password });
  return srcDoc.save(); // saved without encryption
}

/**
 * Check if a PDF file is password-protected.
 * Returns true if protected, false if not.
 */
export async function isPdfPasswordProtected(file: File): Promise<boolean> {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    await pdfjsLib.getDocument({ data: bytes }).promise;
    return false;
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'PasswordException'
    ) {
      return true;
    }
    return false;
  }
}
```

- [ ] **Step 2: Replace `src/components/file/tools/UnlockTool.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Unlock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { unlockPdf, isPdfPasswordProtected } from '@/lib/pdfUnlock';
import { FileUploadStrip } from '../FileUploadStrip';

type FileStatus = 'protected' | 'not-protected' | 'unknown';

export function UnlockTool() {
  const t = useTranslations('file.unlock');

  const [file, setFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>('unknown');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setPassword('');
    setError('');
    setIsChecking(true);
    try {
      const protected_ = await isPdfPasswordProtected(f);
      setFileStatus(protected_ ? 'protected' : 'not-protected');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleUnlock = async () => {
    if (!file || !password) return;
    setError('');
    setIsUnlocking(true);
    try {
      const bytes = await unlockPdf(file, password);
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-unlocked.pdf`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'wrong_password') {
        setError(t('wrongPassword'));
      } else {
        setError(String(err));
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isChecking || isUnlocking} multiple={false} />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {!file && !isChecking ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : isChecking ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Checking...</p>
          </div>
        ) : file && fileStatus === 'not-protected' ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{t('notProtected')}</p>
            </div>
          </div>
        ) : file && fileStatus === 'protected' ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <Unlock size={18} className="text-primary flex-shrink-0" />
              <p className="text-sm font-medium truncate">{file.name}</p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder={t('passwordPlaceholder')}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleUnlock}
              disabled={!password || isUnlocking}
              className={cn(
                'w-full rounded-md py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
                password && !isUnlocking
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              )}
            >
              {isUnlocking ? t('unlocking') : t('unlock')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + browser test**

```bash
npx tsc --noEmit
```

Test with a password-protected PDF:
- Upload the protected PDF → password input appears
- Enter wrong password → error message shown
- Enter correct password → unlocked PDF downloaded

Test with a non-protected PDF:
- Upload it → "not password-protected" message shown

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfUnlock.ts src/components/file/tools/UnlockTool.tsx
git commit -m "feat: implement PDF password unlock tool"
```

---

## Task 13: Final verification + PR

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds with no errors. (Warnings are OK.)

- [ ] **Step 3: Manual QA checklist**

Open `npm run dev` and verify each tool:

- [ ] Page Manager: upload PDF → thumbnails load → reorder (drag) → rotate → delete → Save PDF downloads correct PDF
- [ ] Merge: upload 2+ PDFs → reorder → Merge downloads single PDF with all pages
- [ ] Split (All): downloads ZIP of individual page PDFs
- [ ] Split (Selection): click pages → Extract downloads only selected pages
- [ ] Split (Range): enter "1-2, 4" → downloads ZIP with 2 PDFs
- [ ] Convert PDF→Images: PNG at 150dpi → downloads ZIP of images
- [ ] Convert Images→PDF: upload images → Create PDF downloads
- [ ] Convert "Send to Image Tab": pages appear in Image tab
- [ ] Image tab "Export as PDF": selected images exported as PDF
- [ ] Compress (Low): downloads smaller PDF, shows size reduction
- [ ] Compress (Medium/High): downloads rasterized PDF
- [ ] Unlock (not protected): shows correct message
- [ ] Unlock (protected + wrong password): shows error
- [ ] Unlock (protected + correct password): downloads unlocked PDF
- [ ] Mobile: all tools usable on narrow viewport

- [ ] **Step 4: Push branch and create PR**

```bash
git push origin feat/file-pdf-toolkit
```

Then create a PR: `feat/file-pdf-toolkit → main` with title "feat: PDF toolkit for File tab"
