# Phase 3a — 변환 탭 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** filezen에 변환 탭(아이콘/파비콘 생성기, 소셜 미디어 사이즈 프리셋, 색상 팔레트 추출)을 추가한다.

**Architecture:** 기존 이미지/파일 탭에 변환 탭을 추가. DrawerLayout에 Zap 아이콘 탭 추가, ConvertPage/ConvertToolSelector로 3개 Tool 전환. 각 Tool은 독립 `useState`로 완전 무상태 구조.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, jszip(기존), react-dropzone(기존), color-thief-browser(신규), Canvas API

---

## 파일 맵

| 상태 | 파일 | 역할 |
|------|------|------|
| 수정 | `src/lib/types.ts` | `ConvertToolMode` 타입 추가 |
| 수정 | `src/components/layout/DrawerLayout.tsx` | 변환 탭 추가 |
| 수정 | `src/app/[locale]/page.tsx` | ConvertPage 연결 |
| 수정 | `src/messages/ko.json` | 번역 키 추가 |
| 수정 | `src/messages/en.json` | 번역 키 추가 |
| 생성 | `src/components/convert/ConvertPage.tsx` | 변환 탭 컨테이너 |
| 생성 | `src/components/convert/ConvertToolSelector.tsx` | 상단 탭 UI |
| 생성 | `src/components/convert/ConvertUploadStrip.tsx` | 이미지 업로드 공용 컴포넌트 |
| 생성 | `src/components/convert/tools/IconTool.tsx` | 아이콘/파비콘 생성기 UI |
| 생성 | `src/components/convert/tools/SocialPresetTool.tsx` | 소셜 프리셋 UI |
| 생성 | `src/components/convert/tools/ColorPaletteTool.tsx` | 색상 팔레트 추출 UI |
| 생성 | `src/lib/iconGenerator.ts` | Canvas 리사이즈 + ICO 바이너리 인코딩 |
| 생성 | `src/lib/socialPreset.ts` | 프리셋 상수 + center-crop/letter-box 로직 |
| 생성 | `src/lib/colorPalette.ts` | color-thief 래퍼 + HEX/RGB/HSL 변환 |

---

## Task 0: 워크트리 설정 및 의존성 설치

**Files:**
- 없음 (git + npm 작업)

- [ ] **Step 1: main 브랜치에서 워크트리 생성**

현재 filezen 레포 루트(`/Users/minjun/Documents/filezen`)에서 실행:

```bash
git worktree add -b feat/phase3a-social-canvas /Users/minjun/Documents/filezen-phase3a main
```

Expected: `Preparing worktree (new branch 'feat/phase3a-social-canvas')`

- [ ] **Step 2: 워크트리로 이동 후 의존성 확인**

```bash
cd /Users/minjun/Documents/filezen-phase3a && npm install color-thief-browser
```

Expected: `added 1 package` (또는 유사한 성공 메시지)

- [ ] **Step 3: TypeScript 타입 설치 확인**

```bash
ls node_modules/color-thief-browser
```

Expected: 디렉터리 내용 출력 (설치 확인)

---

## Task 1: 타입 정의 추가

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: ConvertToolMode 타입 추가**

`src/lib/types.ts` 파일의 맨 끝 (line 125 이후)에 추가:

```typescript
// ─── Convert Toolkit types ──────────────────────────────────────────────────

export type ConvertToolMode = 'icon' | 'social' | 'palette';
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음 (또는 이미 있던 에러만)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat(convert): ConvertToolMode 타입 추가"
```

---

## Task 2: 번역 키 추가

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: ko.json에 번역 키 추가**

`src/messages/ko.json`의 `"drawer"` 섹션을 다음으로 교체:

```json
"drawer": {
  "images": "이미지",
  "files": "파일",
  "convert": "변환"
},
```

그리고 파일 끝 `}` 직전 (현재 `"file": { ... }` 블록 뒤)에 추가:

```json
,
"convert": {
  "tools": {
    "icon": "아이콘 생성기",
    "social": "소셜 프리셋",
    "palette": "색상 팔레트"
  },
  "upload": {
    "dragDrop": "이미지를 드래그하거나 클릭해서 업로드",
    "dropHere": "여기에 놓으세요",
    "formats": "PNG, JPG, WebP · 파일당 50MB"
  },
  "icon": {
    "empty": "아이콘으로 만들 이미지를 업로드하세요",
    "bgLabel": "배경색",
    "bgTransparent": "투명",
    "bgSolid": "단색",
    "outputLabel": "출력 파일 선택",
    "download": "아이콘 세트 ZIP 다운로드",
    "downloading": "생성 중...",
    "selectAll": "전체 선택",
    "deselectAll": "전체 해제"
  },
  "social": {
    "empty": "변환할 이미지를 업로드하세요",
    "platformLabel": "플랫폼",
    "cropMode": "크롭 방식",
    "centerCrop": "Center Crop",
    "letterBox": "Letter Box",
    "download": "ZIP 다운로드",
    "downloading": "처리 중...",
    "selectAll": "전체 선택",
    "deselectAll": "전체 해제"
  },
  "palette": {
    "empty": "색상을 추출할 이미지를 업로드하세요",
    "countLabel": "추출 색상 수",
    "extract": "색상 추출",
    "extracting": "추출 중...",
    "copied": "복사됨!",
    "copyJson": "JSON 복사",
    "copyCss": "CSS 변수 복사",
    "format": "표시 형식"
  }
}
```

- [ ] **Step 2: en.json에 번역 키 추가**

`src/messages/en.json`의 `"drawer"` 섹션을 다음으로 교체:

```json
"drawer": {
  "images": "Images",
  "files": "Files",
  "convert": "Convert"
},
```

그리고 파일 끝 `}` 직전에 추가:

```json
,
"convert": {
  "tools": {
    "icon": "Icon Generator",
    "social": "Social Presets",
    "palette": "Color Palette"
  },
  "upload": {
    "dragDrop": "Drag images here or click to upload",
    "dropHere": "Drop here",
    "formats": "PNG, JPG, WebP · 50MB each"
  },
  "icon": {
    "empty": "Upload an image to generate icons",
    "bgLabel": "Background",
    "bgTransparent": "Transparent",
    "bgSolid": "Solid color",
    "outputLabel": "Select output files",
    "download": "Download Icon Set ZIP",
    "downloading": "Generating...",
    "selectAll": "Select All",
    "deselectAll": "Deselect All"
  },
  "social": {
    "empty": "Upload images to resize",
    "platformLabel": "Platform",
    "cropMode": "Crop mode",
    "centerCrop": "Center Crop",
    "letterBox": "Letter Box",
    "download": "Download ZIP",
    "downloading": "Processing...",
    "selectAll": "Select All",
    "deselectAll": "Deselect All"
  },
  "palette": {
    "empty": "Upload an image to extract colors",
    "countLabel": "Color count",
    "extract": "Extract Colors",
    "extracting": "Extracting...",
    "copied": "Copied!",
    "copyJson": "Copy JSON",
    "copyCss": "Copy CSS vars",
    "format": "Format"
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/messages/ko.json src/messages/en.json
git commit -m "feat(convert): 번역 키 추가 (ko/en)"
```

---

## Task 3: DrawerLayout 네비게이션 확장

**Files:**
- Modify: `src/components/layout/DrawerLayout.tsx`

- [ ] **Step 1: DrawerLayout.tsx 전체 교체**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageIcon, FolderIcon, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type Tab = 'image' | 'file' | 'convert';

interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
  convertTab: React.ReactNode;
}

export function DrawerLayout({ imageTab, fileTab, convertTab }: DrawerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const t = useTranslations('drawer');
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
          icon={<Zap size={20} />}
          label={t('convert')}
          active={activeTab === 'convert'}
          onClick={() => setActiveTab('convert')}
        />

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top-right controls (desktop only — language switcher) */}
        <div className="hidden sm:flex absolute top-4 right-6 z-50 items-center gap-2">
          <LanguageSwitcher />
        </div>

        {/* Mobile top bar */}
        <div className="sm:hidden flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2"
          >
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
          {activeTab === 'convert' && convertTab}
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
            icon={<Zap size={22} />}
            label={t('convert')}
            active={activeTab === 'convert'}
            onClick={() => setActiveTab('convert')}
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

- [ ] **Step 2: 빌드 타입 체크**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: `page.tsx` 관련 에러 1개 (convertTab prop 없음) — Task 11에서 수정. 다른 에러 없어야 함.

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/DrawerLayout.tsx
git commit -m "feat(convert): DrawerLayout에 변환 탭 추가 (Zap 아이콘)"
```

---

## Task 4: ConvertUploadStrip + ConvertPage + ConvertToolSelector

**Files:**
- Create: `src/components/convert/ConvertUploadStrip.tsx`
- Create: `src/components/convert/ConvertPage.tsx`
- Create: `src/components/convert/ConvertToolSelector.tsx`

- [ ] **Step 1: ConvertUploadStrip.tsx 생성**

```typescript
'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function ConvertUploadStrip({ onFiles, disabled = false, multiple = false }: Props) {
  const t = useTranslations('convert.upload');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: multiple ? 50 : 1,
    maxSize: 50 * 1024 * 1024,
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
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary',
          isDragActive && 'bg-primary text-primary-foreground'
        )}
      >
        <Upload
          size={20}
          className={cn(
            'transition-transform duration-300 group-hover:-translate-y-0.5',
            isDragActive && 'animate-bounce'
          )}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'truncate text-sm font-semibold transition-colors group-hover:text-primary',
            isDragActive && 'text-primary'
          )}
        >
          {isDragActive ? t('dropHere') : t('dragDrop')}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {t('formats')}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ConvertToolSelector.tsx 생성**

```typescript
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Layers, MonitorSmartphone, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConvertToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; key: string }> = [
  { mode: 'icon',    icon: <Layers size={14} />,           key: 'icon' },
  { mode: 'social',  icon: <MonitorSmartphone size={14} />, key: 'social' },
  { mode: 'palette', icon: <Palette size={14} />,           key: 'palette' },
];

interface Props {
  activeMode: ConvertToolMode;
  onModeChange: (mode: ConvertToolMode) => void;
}

export function ConvertToolSelector({ activeMode, onModeChange }: Props) {
  const t = useTranslations('convert.tools');

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, key }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeMode === mode
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

- [ ] **Step 3: ConvertPage.tsx 생성**

```typescript
'use client';

import { useState } from 'react';
import { ConvertToolSelector } from './ConvertToolSelector';
import { IconTool } from './tools/IconTool';
import { SocialPresetTool } from './tools/SocialPresetTool';
import { ColorPaletteTool } from './tools/ColorPaletteTool';
import type { ConvertToolMode } from '@/lib/types';

export function ConvertPage() {
  const [mode, setMode] = useState<ConvertToolMode>('icon');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ConvertToolSelector activeMode={mode} onModeChange={setMode} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {mode === 'icon'    && <IconTool />}
        {mode === 'social'  && <SocialPresetTool />}
        {mode === 'palette' && <ColorPaletteTool />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/convert/
git commit -m "feat(convert): ConvertPage/ToolSelector/UploadStrip 골격 생성"
```

---

## Task 5: iconGenerator.ts

**Files:**
- Create: `src/lib/iconGenerator.ts`

- [ ] **Step 1: iconGenerator.ts 생성**

```typescript
/**
 * Canvas 기반 아이콘 리사이즈 + ICO 바이너리 인코딩
 * 외부 라이브러리 없이 ArrayBuffer + DataView로 ICO 포맷 직접 조립
 */

export interface IconOutputSpec {
  filename: string;
  width: number;
  height: number;
  format: 'png' | 'ico';
}

export const ICON_OUTPUT_SPECS: IconOutputSpec[] = [
  { filename: 'favicon.ico',          width: 48,   height: 48,   format: 'ico' },
  { filename: 'favicon-32x32.png',    width: 32,   height: 32,   format: 'png' },
  { filename: 'favicon-16x16.png',    width: 16,   height: 16,   format: 'png' },
  { filename: 'apple-touch-icon.png', width: 180,  height: 180,  format: 'png' },
  { filename: 'android-192.png',      width: 192,  height: 192,  format: 'png' },
  { filename: 'android-512.png',      width: 512,  height: 512,  format: 'png' },
  { filename: 'og-image.png',         width: 1200, height: 630,  format: 'png' },
  { filename: 'windows-tile.png',     width: 150,  height: 150,  format: 'png' },
];

/**
 * 이미지를 지정 크기로 리사이즈한 Canvas 반환
 * bgColor: null이면 투명, '#rrggbb' 문자열이면 단색 배경
 */
function resizeToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  bgColor: string | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  // cover-fit: 비율 유지하며 꽉 채우기 (center crop)
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = width / height;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > dstRatio) {
    sw = Math.round(img.naturalHeight * dstRatio);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / dstRatio);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

/** Canvas → PNG Blob */
function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

/**
 * ICO 바이너리 인코딩
 * ICO 포맷: 헤더(6B) + 디렉터리 엔트리(16B × n) + PNG 데이터
 * 16/32/48px 3가지 사이즈를 하나의 ICO 파일에 묶음
 */
async function encodeIco(
  img: HTMLImageElement,
  bgColor: string | null
): Promise<Blob> {
  const sizes = [16, 32, 48];
  const pngBlobs: Blob[] = [];

  for (const size of sizes) {
    const canvas = resizeToCanvas(img, size, size, bgColor);
    const blob = await canvasToPngBlob(canvas);
    pngBlobs.push(blob);
  }

  const pngBuffers = await Promise.all(pngBlobs.map((b) => b.arrayBuffer()));

  const n = sizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * n;
  const dataOffset = headerSize + dirSize;

  // 총 버퍼 크기
  let totalSize = dataOffset;
  for (const buf of pngBuffers) totalSize += buf.byteLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // ICO 헤더
  view.setUint16(0, 0, true);       // reserved
  view.setUint16(2, 1, true);       // type: 1 = ICO
  view.setUint16(4, n, true);       // count

  // 디렉터리 엔트리
  let dataPos = dataOffset;
  for (let i = 0; i < n; i++) {
    const size = sizes[i];
    const bufLen = pngBuffers[i].byteLength;
    const base = headerSize + dirEntrySize * i;

    view.setUint8(base + 0, size === 256 ? 0 : size); // width (0 = 256)
    view.setUint8(base + 1, size === 256 ? 0 : size); // height
    view.setUint8(base + 2, 0);                        // color count
    view.setUint8(base + 3, 0);                        // reserved
    view.setUint16(base + 4, 1, true);                 // planes
    view.setUint16(base + 6, 32, true);                // bit count
    view.setUint32(base + 8, bufLen, true);            // data size
    view.setUint32(base + 12, dataPos, true);          // data offset

    // PNG 데이터 복사
    uint8.set(new Uint8Array(pngBuffers[i]), dataPos);
    dataPos += bufLen;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

export interface IconGeneratorOptions {
  bgColor: string | null; // null = 투명, '#rrggbb' = 단색
  selectedSpecs: IconOutputSpec[];
}

export interface IconOutputFile {
  filename: string;
  blob: Blob;
}

/**
 * 이미지 File로부터 선택된 아이콘 세트 생성
 */
export async function generateIconSet(
  file: File,
  options: IconGeneratorOptions
): Promise<IconOutputFile[]> {
  const img = await loadImage(file);
  const results: IconOutputFile[] = [];

  for (const spec of options.selectedSpecs) {
    if (spec.format === 'ico') {
      const blob = await encodeIco(img, options.bgColor);
      results.push({ filename: spec.filename, blob });
    } else {
      const canvas = resizeToCanvas(img, spec.width, spec.height, options.bgColor);
      const blob = await canvasToPngBlob(canvas);
      results.push({ filename: spec.filename, blob });
    }
  }

  return results;
}

/** File → HTMLImageElement 로드 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "iconGenerator" | head -10
```

Expected: 출력 없음 (에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/iconGenerator.ts
git commit -m "feat(convert): iconGenerator - Canvas 리사이즈 + ICO 바이너리 인코딩"
```

---

## Task 6: IconTool.tsx

**Files:**
- Create: `src/components/convert/tools/IconTool.tsx`

- [ ] **Step 1: IconTool.tsx 생성**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  generateIconSet,
  ICON_OUTPUT_SPECS,
  type IconOutputSpec,
} from '@/lib/iconGenerator';
import JSZip from 'jszip';
import { downloadBlob } from '@/lib/utils';

export function IconTool() {
  const t = useTranslations('convert.icon');

  const [file, setFile] = useState<File | null>(null);
  const [bgMode, setBgMode] = useState<'transparent' | 'solid'>('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedSpecs, setSelectedSpecs] = useState<IconOutputSpec[]>(ICON_OUTPUT_SPECS);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files[0]) setFile(files[0]);
  };

  const toggleSpec = (spec: IconOutputSpec) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const isAllSelected = selectedSpecs.length === ICON_OUTPUT_SPECS.length;

  const toggleAll = () => {
    setSelectedSpecs(isAllSelected ? [] : [...ICON_OUTPUT_SPECS]);
  };

  const handleGenerate = async () => {
    if (!file || selectedSpecs.length === 0) return;
    setIsGenerating(true);
    try {
      const outputFiles = await generateIconSet(file, {
        bgColor: bgMode === 'transparent' ? null : bgColor,
        selectedSpecs,
      });
      const zip = new JSZip();
      for (const { filename, blob } of outputFiles) {
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'icon-set.zip');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} disabled={isGenerating} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 파일 정보 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* 배경색 설정 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('bgLabel')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBgMode('transparent')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                  bgMode === 'transparent'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:bg-muted/60'
                )}
              >
                {t('bgTransparent')}
              </button>
              <button
                onClick={() => setBgMode('solid')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                  bgMode === 'solid'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-card text-foreground hover:bg-muted/60'
                )}
              >
                {t('bgSolid')}
              </button>
              {bgMode === 'solid' && (
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border p-0.5"
                />
              )}
            </div>
          </div>

          {/* 출력 파일 선택 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('outputLabel')}
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {isAllSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {ICON_OUTPUT_SPECS.map((spec) => {
                const isSelected = selectedSpecs.includes(spec);
                return (
                  <button
                    key={spec.filename}
                    onClick={() => toggleSpec(spec)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-card text-foreground hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn(
                        'h-3 w-3 flex-shrink-0 rounded border-2',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}
                    />
                    <span className="flex-1">{spec.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      {spec.width}×{spec.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedSpecs.length === 0}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isGenerating && selectedSpecs.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isGenerating ? t('downloading') : t('download')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "IconTool\|iconGenerator" | head -10
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/convert/tools/IconTool.tsx
git commit -m "feat(convert): IconTool UI 구현"
```

---

## Task 7: socialPreset.ts

**Files:**
- Create: `src/lib/socialPreset.ts`

- [ ] **Step 1: socialPreset.ts 생성**

```typescript
/**
 * 소셜 미디어 사이즈 프리셋 상수 및 Canvas 크롭 로직
 */

export interface SocialPreset {
  label: string;
  width: number;
  height: number;
}

export interface Platform {
  name: string;
  key: string;
  presets: SocialPreset[];
}

export const PLATFORMS: Platform[] = [
  {
    name: 'Instagram',
    key: 'instagram',
    presets: [
      { label: '피드 정사각형', width: 1080, height: 1080 },
      { label: '피드 세로',     width: 1080, height: 1350 },
      { label: '스토리/릴스',   width: 1080, height: 1920 },
    ],
  },
  {
    name: 'Twitter/X',
    key: 'twitter',
    presets: [
      { label: '포스트',   width: 1600, height: 900 },
      { label: '프로필',   width: 400,  height: 400 },
      { label: '헤더',     width: 1500, height: 500 },
    ],
  },
  {
    name: 'YouTube',
    key: 'youtube',
    presets: [
      { label: '썸네일',    width: 1280, height: 720  },
      { label: '채널 아트', width: 2560, height: 1440 },
    ],
  },
  {
    name: 'LinkedIn',
    key: 'linkedin',
    presets: [
      { label: '포스트', width: 1200, height: 628 },
      { label: '커버',   width: 1584, height: 396 },
    ],
  },
];

export type CropMode = 'center-crop' | 'letter-box';

/** File → HTMLImageElement 로드 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * center-crop: 목표 비율로 이미지를 중앙 정렬 후 크롭
 */
function applyCenterCrop(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = width / height;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > dstRatio) {
    sw = Math.round(img.naturalHeight * dstRatio);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / dstRatio);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

/**
 * letter-box: 이미지를 비율 유지하며 목표 크기 내에 fit, 빈 영역은 흰색
 */
function applyLetterBox(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 흰색 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = width / height;

  let drawW: number, drawH: number;
  if (srcRatio > dstRatio) {
    drawW = width;
    drawH = Math.round(width / srcRatio);
  } else {
    drawH = height;
    drawW = Math.round(height * srcRatio);
  }

  const dx = Math.round((width - drawW) / 2);
  const dy = Math.round((height - drawH) / 2);

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, drawW, drawH);
  return canvas;
}

/** Canvas → PNG Blob */
function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

export interface PresetOutputFile {
  filename: string;
  blob: Blob;
}

/**
 * 단일 파일 + 단일 프리셋 → PNG Blob
 * 파일명: {원본명}_{platformKey}_{width}x{height}.png
 */
export async function applyPreset(
  file: File,
  platformKey: string,
  preset: SocialPreset,
  mode: CropMode
): Promise<PresetOutputFile> {
  const img = await loadImage(file);
  const canvas =
    mode === 'center-crop'
      ? applyCenterCrop(img, preset.width, preset.height)
      : applyLetterBox(img, preset.width, preset.height);

  const blob = await canvasToPngBlob(canvas);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${baseName}_${platformKey}_${preset.width}x${preset.height}.png`;

  return { filename, blob };
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "socialPreset" | head -10
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/socialPreset.ts
git commit -m "feat(convert): socialPreset - center-crop/letter-box 로직 + 플랫폼 프리셋"
```

---

## Task 8: SocialPresetTool.tsx

**Files:**
- Create: `src/components/convert/tools/SocialPresetTool.tsx`

- [ ] **Step 1: SocialPresetTool.tsx 생성**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBlob } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  PLATFORMS,
  applyPreset,
  type CropMode,
  type SocialPreset,
} from '@/lib/socialPreset';
import JSZip from 'jszip';

interface SelectedPreset {
  platformKey: string;
  preset: SocialPreset;
}

export function SocialPresetTool() {
  const t = useTranslations('convert.social');

  const [files, setFiles] = useState<File[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<SelectedPreset[]>(() =>
    PLATFORMS.flatMap((p) => p.presets.map((preset) => ({ platformKey: p.key, preset })))
  );
  const [cropMode, setCropMode] = useState<CropMode>('center-crop');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))];
    });
  };

  const togglePreset = (platformKey: string, preset: SocialPreset) => {
    setSelectedPresets((prev) => {
      const exists = prev.some(
        (s) => s.platformKey === platformKey && s.preset === preset
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.platformKey === platformKey && s.preset === preset)
        );
      }
      return [...prev, { platformKey, preset }];
    });
  };

  const allPresets = PLATFORMS.flatMap((p) =>
    p.presets.map((preset) => ({ platformKey: p.key, preset }))
  );
  const isAllSelected = selectedPresets.length === allPresets.length;

  const toggleAll = () => {
    setSelectedPresets(isAllSelected ? [] : allPresets);
  };

  const handleDownload = async () => {
    if (files.length === 0 || selectedPresets.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      for (const file of files) {
        for (const { platformKey, preset } of selectedPresets) {
          const output = await applyPreset(file, platformKey, preset, cropMode);
          zip.file(output.filename, output.blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'social-presets.zip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} disabled={isProcessing} multiple />

      {files.length > 0 ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 업로드된 파일 목록 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex flex-col gap-1">
            {files.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{f.name}</span>
                <button
                  onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                  className="text-xs text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 크롭 방식 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('cropMode')}
            </span>
            <div className="flex gap-2">
              {(['center-crop', 'letter-box'] as CropMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCropMode(mode)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer',
                    cropMode === mode
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-card text-foreground hover:bg-muted/60'
                  )}
                >
                  {mode === 'center-crop' ? t('centerCrop') : t('letterBox')}
                </button>
              ))}
            </div>
          </div>

          {/* 플랫폼 & 프리셋 선택 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('platformLabel')}
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {isAllSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>

            {PLATFORMS.map((platform) => (
              <div key={platform.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground">{platform.name}</span>
                {platform.presets.map((preset) => {
                  const isSelected = selectedPresets.some(
                    (s) => s.platformKey === platform.key && s.preset === preset
                  );
                  return (
                    <button
                      key={preset.label}
                      onClick={() => togglePreset(platform.key, preset)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-card text-foreground hover:bg-muted/60'
                      )}
                    >
                      <span
                        className={cn(
                          'h-3 w-3 flex-shrink-0 rounded border-2',
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                        )}
                      />
                      <span className="flex-1">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={isProcessing || selectedPresets.length === 0}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isProcessing && selectedPresets.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? t('downloading') : t('download')}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "SocialPresetTool\|socialPreset" | head -10
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/convert/tools/SocialPresetTool.tsx
git commit -m "feat(convert): SocialPresetTool UI 구현"
```

---

## Task 9: colorPalette.ts

**Files:**
- Create: `src/lib/colorPalette.ts`

- [ ] **Step 1: colorPalette.ts 생성**

```typescript
/**
 * color-thief-browser 래퍼 + HEX/RGB/HSL 변환 유틸
 * color-thief는 HTMLImageElement를 요구하므로 동적 임포트 사용 (SSR 회피)
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface PaletteColor {
  rgb: RgbColor;
  hex: string;
  hsl: HslColor;
}

/** File → HTMLImageElement 로드 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** RGB → HEX */
function rgbToHex({ r, g, b }: RgbColor): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** RGB → HSL */
function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 이미지에서 팔레트 추출
 * color-thief-browser 동적 임포트 (SSR 안전)
 */
export async function extractPalette(
  file: File,
  count: number
): Promise<PaletteColor[]> {
  const ColorThief = (await import('color-thief-browser')).default;
  const img = await loadImage(file);
  const colorThief = new ColorThief();
  const rawPalette: number[][] = colorThief.getPalette(img, count);

  return rawPalette.map(([r, g, b]) => {
    const rgb: RgbColor = { r, g, b };
    return {
      rgb,
      hex: rgbToHex(rgb),
      hsl: rgbToHsl(rgb),
    };
  });
}

/** 팔레트 → CSS 변수 문자열 */
export function toCssVars(palette: PaletteColor[]): string {
  return palette
    .map((c, i) => `--color-${i + 1}: ${c.hex};`)
    .join('\n');
}

/** 팔레트 → JSON 문자열 */
export function toJson(palette: PaletteColor[]): string {
  return JSON.stringify(
    palette.map((c) => ({
      hex: c.hex,
      rgb: [c.rgb.r, c.rgb.g, c.rgb.b],
      hsl: { h: c.hsl.h, s: c.hsl.s, l: c.hsl.l },
    })),
    null,
    2
  );
}
```

- [ ] **Step 2: color-thief-browser 타입 선언 추가**

`color-thief-browser`는 TypeScript 타입이 없을 수 있음. 타입 에러 발생 시 `src/types/color-thief-browser.d.ts` 파일을 생성:

```typescript
declare module 'color-thief-browser' {
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): [number, number, number];
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): [number, number, number][];
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "colorPalette" | head -10
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/colorPalette.ts
# 타입 선언 파일이 생성된 경우 함께 추가
git add src/types/color-thief-browser.d.ts 2>/dev/null || true
git commit -m "feat(convert): colorPalette - color-thief 래퍼 + HEX/RGB/HSL 변환"
```

---

## Task 10: ColorPaletteTool.tsx

**Files:**
- Create: `src/components/convert/tools/ColorPaletteTool.tsx`

- [ ] **Step 1: ColorPaletteTool.tsx 생성**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import {
  extractPalette,
  toCssVars,
  toJson,
  type PaletteColor,
} from '@/lib/colorPalette';

type ColorFormat = 'hex' | 'rgb' | 'hsl';

function formatColor(color: PaletteColor, format: ColorFormat): string {
  if (format === 'hex') return color.hex;
  if (format === 'rgb') return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
  return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
}

export function ColorPaletteTool() {
  const t = useTranslations('convert.palette');

  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(8);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedBulk, setCopiedBulk] = useState<'json' | 'css' | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    if (files[0]) {
      setFile(files[0]);
      setPalette([]);
    }
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setPalette([]);
    try {
      const result = await extractPalette(file, count);
      setPalette(result);
    } finally {
      setIsExtracting(false);
    }
  };

  const copyColor = async (color: PaletteColor, idx: number) => {
    await navigator.clipboard.writeText(formatColor(color, format));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyBulk = async (type: 'json' | 'css') => {
    const text = type === 'json' ? toJson(palette) : toCssVars(palette);
    await navigator.clipboard.writeText(text);
    setCopiedBulk(type);
    setTimeout(() => setCopiedBulk(null), 1500);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip onFiles={handleFiles} disabled={isExtracting} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 파일 정보 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* 색상 수 슬라이더 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('countLabel')}
              </span>
              <span className="text-sm font-semibold">{count}</span>
            </div>
            <input
              type="range"
              min={5}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          {/* 추출 버튼 */}
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isExtracting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            {isExtracting ? t('extracting') : t('extract')}
          </button>

          {/* 팔레트 결과 */}
          {palette.length > 0 && (
            <>
              {/* 색상 표시 형식 토글 */}
              <div className="flex gap-1">
                {(['hex', 'rgb', 'hsl'] as ColorFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      format === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* 색상 스와치 */}
              <div className="flex flex-col gap-1.5">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyColor(color, idx)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-all hover:bg-muted/60 active:scale-95 cursor-pointer"
                  >
                    <div
                      className="h-8 w-8 flex-shrink-0 rounded-md border border-border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="flex-1 text-sm font-mono text-foreground">
                      {formatColor(color, format)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {copiedIdx === idx ? t('copied') : '복사'}
                    </span>
                  </button>
                ))}
              </div>

              {/* 일괄 복사 */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyBulk('json')}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-all cursor-pointer"
                >
                  {copiedBulk === 'json' ? t('copied') : t('copyJson')}
                </button>
                <button
                  onClick={() => copyBulk('css')}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-all cursor-pointer"
                >
                  {copiedBulk === 'css' ? t('copied') : t('copyCss')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep "ColorPaletteTool\|colorPalette" | head -10
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/convert/tools/ColorPaletteTool.tsx
git commit -m "feat(convert): ColorPaletteTool UI 구현"
```

---

## Task 11: page.tsx 연결 및 최종 검증

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: page.tsx 수정**

```typescript
import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage } from '@/components/image/ImagePage';
import { FilePage } from '@/components/file/FilePage';
import { ConvertPage } from '@/components/convert/ConvertPage';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DrawerLayout
      imageTab={<ImagePage />}
      fileTab={<FilePage />}
      convertTab={<ConvertPage />}
    />
  );
}
```

- [ ] **Step 2: 전체 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 3: 빌드 검증**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route (app)` 목록 정상 출력

- [ ] **Step 4: 개발 서버로 수동 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후:
1. 사이드바에 Zap(⚡) 아이콘 탭 확인
2. 변환 탭 클릭 → "아이콘 생성기 | 소셜 프리셋 | 색상 팔레트" 탭 확인
3. 각 탭 클릭 시 업로드 영역 + empty state 메시지 확인
4. 이미지 업로드 후 각 기능 작동 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat(convert): ConvertPage를 DrawerLayout에 연결 — Phase 3a 완료"
```

---

## 완료 체크리스트

- [ ] `git log --oneline -10` 으로 커밋 히스토리 확인
- [ ] 브라우저에서 변환 탭 3개 기능 수동 테스트
- [ ] `npm run build` 클린 빌드 확인
