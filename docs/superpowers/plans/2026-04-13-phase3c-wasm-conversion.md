# Phase 3c — WASM 기반 변환 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ffmpeg.wasm과 Tesseract.js를 사용해 동영상→GIF/프레임 변환 및 이미지 OCR 기능을 새 "변환" 탭으로 구현한다.

**Architecture:** FilePage/FileToolSelector 패턴을 그대로 복사한 ConvertPage + ConvertToolSelector + 각 Tool 컴포넌트. WASM 로더는 싱글턴 패턴으로 구현해 중복 다운로드를 방지하고 처리 버튼을 누를 때만 lazy load한다.

**Tech Stack:** @ffmpeg/ffmpeg 0.12.x (CDN 로딩), tesseract.js 5.x, react-dropzone (기존 의존성), jszip (기존 의존성), next-intl, Tailwind CSS

---

## 파일 구조 (신규/수정)

| 경로 | 변경 |
|------|------|
| `next.config.mjs` | COOP/COEP 헤더 추가 |
| `src/lib/types.ts` | `ConvertToolMode` 타입 + `ConvertContextType` 추가 |
| `src/context/ConvertContext.tsx` | 신규 — activeConvertTool 상태 |
| `src/components/convert/ConvertUploadStrip.tsx` | 신규 — 범용 업로드 스트립 |
| `src/components/convert/ConvertPage.tsx` | 신규 — 변환 탭 최상위 |
| `src/components/convert/ConvertToolSelector.tsx` | 신규 — 툴 선택 바 |
| `src/components/convert/tools/VideoTool.tsx` | 신규 — Feature 9 |
| `src/components/convert/tools/OcrTool.tsx` | 신규 — Feature 13 |
| `src/lib/ffmpegLoader.ts` | 신규 — ffmpeg.wasm 싱글턴 |
| `src/lib/tesseractLoader.ts` | 신규 — Tesseract 싱글턴 |
| `src/components/layout/DrawerLayout.tsx` | 변환 탭 추가 |
| `src/app/[locale]/layout.tsx` | ConvertProvider 추가 |
| `src/app/[locale]/page.tsx` | convertTab prop 추가 |
| `src/messages/ko.json` | convert.* 키 추가 |
| `src/messages/en.json` | convert.* 키 추가 |

---

## Task 1: Worktree 설정 + 의존성 설치

**Files:**
- 없음 (환경 설정)

- [ ] **Step 1: worktree 생성**

현재 `feat/phase2-pdf-completion` 브랜치에서 실행:
```bash
cd /Users/minjun/Documents/filezen
git worktree add -b feat/phase3c-wasm /Users/minjun/Documents/filezen-phase3c main
```

Expected: `/Users/minjun/Documents/filezen-phase3c` 디렉터리 생성, `feat/phase3c-wasm` 브랜치가 main에서 분기됨

- [ ] **Step 2: 워크트리 디렉터리로 이동 후 의존성 확인**

```bash
cd /Users/minjun/Documents/filezen-phase3c
npm install
```

Expected: node_modules가 설치됨 (기존 lock 파일 기준)

- [ ] **Step 3: WASM 패키지 설치**

```bash
npm install @ffmpeg/ffmpeg@^0.12.10 @ffmpeg/util@^0.12.1 tesseract.js@^5.1.1
```

Expected: package.json에 세 패키지 추가됨

- [ ] **Step 4: 타입 패키지 설치**

```bash
npm install --save-dev @types/tesseract.js
```

Note: tesseract.js 5.x는 자체 타입을 포함하므로 이 단계가 불필요할 수 있음. `npm ls @types/tesseract.js` 로 확인 후 불필요하면 skip.

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: add @ffmpeg/ffmpeg, @ffmpeg/util, tesseract.js dependencies"
```

---

## Task 2: COOP/COEP 헤더 (next.config.mjs)

**Files:**
- Modify: `next.config.mjs`

ffmpeg.wasm 멀티스레딩은 `SharedArrayBuffer`가 필요하고, 이는 COOP/COEP 헤더가 설정된 환경에서만 활성화된다.

- [ ] **Step 1: next.config.mjs 현재 내용 확인**

현재 내용:
```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '50mb' } },
  turbopack: { resolveAlias: { '@': './src' } },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
    config.module.rules.push({ test: /\.wasm$/, type: 'webassembly/async' });
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: COOP/COEP 헤더 추가**

`next.config.mjs`를 다음으로 교체:
```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'require-corp' },
        ],
      },
    ];
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
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: 빌드 검증**

```bash
npm run build 2>&1 | tail -5
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add next.config.mjs
git commit -m "config: add COOP/COEP headers for SharedArrayBuffer (ffmpeg.wasm)"
```

---

## Task 3: types.ts 확장 + ConvertContext

**Files:**
- Modify: `src/lib/types.ts` (끝에 추가)
- Create: `src/context/ConvertContext.tsx`

- [ ] **Step 1: types.ts에 ConvertToolMode + ConvertContextType 추가**

`src/lib/types.ts` 파일 끝(125번 줄 이후)에 추가:
```ts
// ─── Convert Toolkit types ────────────────────────────────────────────────────

export type ConvertToolMode = 'video-to-gif' | 'ocr';

export interface ConvertContextType {
  activeTool: ConvertToolMode;
  setActiveTool: (tool: ConvertToolMode) => void;
}
```

- [ ] **Step 2: ConvertContext 생성**

`src/context/ConvertContext.tsx` 신규 생성:
```tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ConvertContextType, ConvertToolMode } from '../lib/types';

const ConvertContext = createContext<ConvertContextType | undefined>(undefined);

export function useConvertContext(): ConvertContextType {
  const ctx = useContext(ConvertContext);
  if (!ctx) throw new Error('useConvertContext must be used inside ConvertProvider');
  return ctx;
}

export function ConvertProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ConvertToolMode>('video-to-gif');

  return (
    <ConvertContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </ConvertContext.Provider>
  );
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/lib/types.ts src/context/ConvertContext.tsx
git commit -m "feat(convert): ConvertToolMode + ConvertContext"
```

---

## Task 4: ConvertUploadStrip + ConvertPage + ConvertToolSelector

**Files:**
- Create: `src/components/convert/ConvertUploadStrip.tsx`
- Create: `src/components/convert/ConvertPage.tsx`
- Create: `src/components/convert/ConvertToolSelector.tsx`

- [ ] **Step 1: ConvertUploadStrip 생성**

`src/components/convert/ConvertUploadStrip.tsx` 신규:
```tsx
'use client';

import { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onFiles: (files: File[]) => void;
  accept: Accept;
  formatHint: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function ConvertUploadStrip({
  onFiles,
  accept,
  formatHint,
  multiple = false,
  disabled = false,
}: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? 10 : 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex h-14 sm:h-20 flex-shrink-0 cursor-pointer items-center gap-3 sm:gap-4 border-b-2 border-dashed border-border px-4 sm:px-6 transition-all duration-200',
        isDragActive
          ? 'bg-primary/10 border-primary shadow-inner'
          : 'bg-card hover:bg-muted/60 hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all group-hover:bg-primary/10 group-hover:text-primary',
          isDragActive && 'bg-primary text-primary-foreground',
        )}
      >
        <Upload
          size={20}
          className={cn(
            'transition-transform group-hover:-translate-y-0.5',
            isDragActive && 'animate-bounce',
          )}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'truncate text-sm font-semibold transition-colors group-hover:text-primary',
            isDragActive && 'text-primary',
          )}
        >
          {isDragActive ? '여기에 놓으세요' : '파일을 드래그하거나 클릭해서 업로드'}
        </span>
        <span className="truncate text-[11px] text-muted-foreground/80 font-medium">
          {formatHint}
        </span>
      </div>
    </div>
  );
}
```

Note: 텍스트는 Task 10에서 i18n 키로 교체한다. 지금은 하드코딩으로 진행.

- [ ] **Step 2: ConvertToolSelector 생성**

`src/components/convert/ConvertToolSelector.tsx` 신규:
```tsx
'use client';

import React from 'react';
import { Clapperboard, ScanText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConvertContext } from '@/context/ConvertContext';
import type { ConvertToolMode } from '@/lib/types';

const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; label: string }> = [
  { mode: 'video-to-gif', icon: <Clapperboard size={14} />, label: '동영상 변환' },
  { mode: 'ocr',          icon: <ScanText size={14} />,     label: '텍스트 추출' },
];

export function ConvertToolSelector() {
  const { activeTool, setActiveTool } = useConvertContext();

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeTool === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
```

Note: label 하드코딩은 Task 10에서 i18n으로 교체.

- [ ] **Step 3: ConvertPage 생성 (툴 스텁 포함)**

`src/components/convert/ConvertPage.tsx` 신규:
```tsx
'use client';

import { useConvertContext } from '@/context/ConvertContext';
import { ConvertToolSelector } from './ConvertToolSelector';
import { VideoTool } from './tools/VideoTool';
import { OcrTool } from './tools/OcrTool';

export function ConvertPage() {
  const { activeTool } = useConvertContext();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTool === 'video-to-gif' && <VideoTool />}
        {activeTool === 'ocr'          && <OcrTool />}
      </div>
      <ConvertToolSelector />
    </div>
  );
}
```

- [ ] **Step 4: 툴 스텁 파일 생성 (빌드를 통과시키기 위해)**

`src/components/convert/tools/VideoTool.tsx` 신규:
```tsx
'use client';

export function VideoTool() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      VideoTool — 구현 예정
    </div>
  );
}
```

`src/components/convert/tools/OcrTool.tsx` 신규:
```tsx
'use client';

export function OcrTool() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      OcrTool — 구현 예정
    </div>
  );
}
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/components/convert/
git commit -m "feat(convert): ConvertPage + ConvertToolSelector + ConvertUploadStrip + tool stubs"
```

---

## Task 5: DrawerLayout + layout.tsx + page.tsx 연결 + i18n 탭 키

**Files:**
- Modify: `src/components/layout/DrawerLayout.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: DrawerLayout.tsx — Tab 타입 + props + 렌더링 추가**

`src/components/layout/DrawerLayout.tsx` 수정:

`type Tab = 'image' | 'file';` →
```tsx
type Tab = 'image' | 'file' | 'convert';
```

`interface DrawerLayoutProps` 수정:
```tsx
interface DrawerLayoutProps {
  imageTab: React.ReactNode;
  fileTab: React.ReactNode;
  convertTab: React.ReactNode;
}
```

함수 시그니처:
```tsx
export function DrawerLayout({ imageTab, fileTab, convertTab }: DrawerLayoutProps) {
```

import에 `Wand2` 추가:
```tsx
import { ImageIcon, FolderIcon, Wand2 } from 'lucide-react';
```

데스크탑 사이드바에 DrawerItem 추가 (FolderIcon DrawerItem 바로 아래):
```tsx
<DrawerItem
  icon={<Wand2 size={20} />}
  label={t('convert')}
  active={activeTab === 'convert'}
  onClick={() => setActiveTab('convert')}
/>
```

메인 컨텐츠 렌더링 교체:
```tsx
{/* Page content */}
<div className="flex flex-1 flex-col overflow-hidden">
  {activeTab === 'image'   ? imageTab   :
   activeTab === 'file'    ? fileTab    :
                             convertTab}
</div>
```

모바일 하단 nav에 MobileNavItem 추가 (FolderIcon MobileNavItem 바로 아래):
```tsx
<MobileNavItem
  icon={<Wand2 size={22} />}
  label={t('convert')}
  active={activeTab === 'convert'}
  onClick={() => setActiveTab('convert')}
/>
```

- [ ] **Step 2: i18n에 drawer.convert 키 추가**

`src/messages/ko.json` — `"drawer"` 섹션에 추가:
```json
"drawer": {
  "images": "이미지",
  "files": "파일",
  "convert": "변환"
},
```

`src/messages/en.json` — `"drawer"` 섹션에 추가:
```json
"drawer": {
  "images": "Images",
  "files": "Files",
  "convert": "Convert"
},
```

- [ ] **Step 3: layout.tsx — ConvertProvider 추가**

`src/app/[locale]/layout.tsx` import에 추가:
```tsx
import { ConvertProvider } from '@/context/ConvertContext';
```

`<FileProvider>` 아래에 `<ConvertProvider>` 래핑:
```tsx
<AppProvider>
  <FileProvider>
    <ConvertProvider>
      {children}
    </ConvertProvider>
  </FileProvider>
</AppProvider>
```

- [ ] **Step 4: page.tsx — convertTab prop 추가**

`src/app/[locale]/page.tsx` 수정:
```tsx
import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage }    from '@/components/image/ImagePage';
import { FilePage }     from '@/components/file/FilePage';
import { ConvertPage }  from '@/components/convert/ConvertPage';

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

- [ ] **Step 5: 빌드 검증**

```bash
npm run build 2>&1 | tail -10
```

Expected: 에러 없이 빌드 성공. 이 시점에서 브라우저에서 변환 탭이 보이고 "VideoTool — 구현 예정" 텍스트가 표시되어야 한다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/layout/DrawerLayout.tsx \
        src/app/[locale]/layout.tsx \
        src/app/[locale]/page.tsx \
        src/messages/ko.json \
        src/messages/en.json
git commit -m "feat(convert): 변환 탭 DrawerLayout 등록 + ConvertProvider 추가"
```

---

## Task 6: ffmpegLoader.ts

**Files:**
- Create: `src/lib/ffmpegLoader.ts`

- [ ] **Step 1: ffmpegLoader.ts 생성**

`src/lib/ffmpegLoader.ts` 신규:
```ts
import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
// progress 핸들러 참조를 캐시해야 off()로 제거 가능
let progressHandler: ((e: { progress: number }) => void) | null = null;

/**
 * ffmpeg.wasm 싱글턴 로더.
 * 최초 호출 시 CDN에서 core (~30MB)를 다운로드한다.
 * onProgress: 0.0 ~ 1.0 (exec 실행 중에만 발화, load 중에는 발화 안 함)
 */
export async function getFFmpeg(
  onProgress?: (ratio: number) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    // 기존 핸들러 제거 후 새 핸들러 등록
    if (progressHandler) {
      ffmpegInstance.off('progress', progressHandler);
    }
    progressHandler = onProgress ? ({ progress }) => onProgress(progress) : null;
    if (progressHandler) {
      ffmpegInstance.on('progress', progressHandler);
    }
    return ffmpegInstance;
  }

  const { FFmpeg }    = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  ffmpegInstance = new FFmpeg();

  progressHandler = onProgress ? ({ progress }) => onProgress(progress) : null;
  if (progressHandler) {
    ffmpegInstance.on('progress', progressHandler);
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpegInstance;
}

/** 현재 ffmpeg 인스턴스가 로드되어 있는지 확인 */
export function isFFmpegLoaded(): boolean {
  return ffmpegInstance?.loaded ?? false;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/ffmpegLoader.ts
git commit -m "feat(convert): ffmpegLoader — ffmpeg.wasm 싱글턴 lazy init"
```

---

## Task 7: VideoTool.tsx (Feature 9)

**Files:**
- Modify: `src/components/convert/tools/VideoTool.tsx` (스텁 교체)

- [ ] **Step 1: VideoTool 전체 구현**

`src/components/convert/tools/VideoTool.tsx`를 다음으로 교체:
```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getFFmpeg } from '@/lib/ffmpegLoader';

type VideoMode   = 'gif' | 'frames';
type VideoStatus = 'idle' | 'loading-wasm' | 'processing' | 'done' | 'error';

export function VideoTool() {
  const [file,         setFile]         = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [duration,     setDuration]     = useState(0);
  const [mode,         setMode]         = useState<VideoMode>('gif');
  // 공통
  const [start,        setStart]        = useState(0);
  const [end,          setEnd]          = useState(5);
  // GIF 설정
  const [fps,          setFps]          = useState(10);
  const [width,        setWidth]        = useState(480);
  // 프레임 설정
  const [frameInterval, setFrameInterval] = useState(1);
  const [frameFormat,  setFrameFormat]  = useState<'png' | 'jpeg'>('png');
  // 상태
  const [status,       setStatus]       = useState<VideoStatus>('idle');
  const [progress,     setProgress]     = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setStatus('idle');
    setError(null);
    setProgress(0);
    // duration은 video onLoadedMetadata에서 설정
  }, [previewUrl]);

  const handleMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = Math.floor(video.duration);
    setDuration(dur);
    setEnd(Math.min(5, dur));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleConvert = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);

    try {
      setStatus('loading-wasm');
      const ffmpeg = await getFFmpeg((p) => setProgress(p));
      setStatus('processing');

      const { fetchFile } = await import('@ffmpeg/util');
      const inputName = 'input.' + file.name.split('.').pop();
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const duration = end - start;

      if (mode === 'gif') {
        // GIF 변환
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(start),
          '-t',  String(duration),
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-loop', '0',
          'output.gif',
        ]);

        const data = await ffmpeg.readFile('output.gif') as Uint8Array;
        const blob = new Blob([data], { type: 'image/gif' });
        downloadBlob(blob, file.name.replace(/\.[^.]+$/, '.gif'));
        await ffmpeg.deleteFile('output.gif');
      } else {
        // 프레임 추출
        const ext = frameFormat;
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(start),
          '-t',  String(duration),
          '-vf', `fps=1/${frameInterval}`,
          `frame_%04d.${ext}`,
        ]);

        // 생성된 프레임 파일 수집
        const dir = await ffmpeg.listDir('/');
        const frameFiles = dir
          .filter((e) => !e.isDir && e.name.startsWith('frame_') && e.name.endsWith(`.${ext}`))
          .map((e) => e.name)
          .sort();

        const JSZip = (await import('jszip')).default;
        const zip   = new JSZip();
        for (const name of frameFiles) {
          const data = await ffmpeg.readFile(name) as Uint8Array;
          zip.file(name, data);
          await ffmpeg.deleteFile(name);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, file.name.replace(/\.[^.]+$/, '-frames.zip'));
      }

      await ffmpeg.deleteFile(inputName);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isProcessing = status === 'loading-wasm' || status === 'processing';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{ 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'] }}
        formatHint="MP4, MOV, WebM · 파일당 최대 500MB"
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* 비디오 프리뷰 */}
          {previewUrl && (
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full max-h-40 rounded-lg object-contain bg-black"
              onLoadedMetadata={handleMetadata}
              muted
              playsInline
            />
          )}

          {/* 파일명 */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
            {duration > 0 && (
              <span className="text-xs text-muted-foreground">길이: {formatTime(duration)}</span>
            )}
          </div>

          {/* 모드 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              출력 형식
            </label>
            <div className="flex gap-2">
              {(['gif', 'frames'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {m === 'gif' ? 'GIF 변환' : '프레임 추출'}
                </button>
              ))}
            </div>
          </div>

          {/* 시간 범위 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                시작 (초)
              </label>
              <input
                type="number" min={0} max={Math.max(0, end - 1)} step={1}
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                끝 (초)
              </label>
              <input
                type="number" min={start + 1} max={duration || 9999} step={1}
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 모드별 설정 */}
          {mode === 'gif' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">FPS</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {[5, 10, 15, 24, 30].map((v) => (
                    <option key={v} value={v}>{v} fps</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  너비 (px)
                </label>
                <select
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {[240, 320, 480, 640, 800].map((v) => (
                    <option key={v} value={v}>{v}px</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  간격 (초마다 1장)
                </label>
                <select
                  value={frameInterval}
                  onChange={(e) => setFrameInterval(Number(e.target.value))}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {[1, 2, 5, 10].map((v) => (
                    <option key={v} value={v}>{v}초마다</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  포맷
                </label>
                <div className="flex gap-2">
                  {(['png', 'jpeg'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFrameFormat(f)}
                      className={cn(
                        'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                        frameFormat === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 진행 상태 */}
          {status === 'loading-wasm' && (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
              <span className="text-xs text-muted-foreground">ffmpeg.wasm 로딩 중... (~30MB)</span>
            </div>
          )}
          {status === 'processing' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                변환 중... {Math.round(progress * 100)}%
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
          {status === 'done' && (
            <p className="text-xs text-green-600 dark:text-green-400">
              변환 완료! 파일이 다운로드되었습니다.
            </p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* 변환 버튼 */}
          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isProcessing && (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
            )}
            {isProcessing ? '처리 중...' : mode === 'gif' ? 'GIF 변환' : '프레임 추출'}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">MP4, MOV, WebM 파일을 업로드하세요</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -10
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/convert/tools/VideoTool.tsx src/lib/ffmpegLoader.ts
git commit -m "feat(convert): VideoTool — GIF 변환 + 프레임 추출 (ffmpeg.wasm)"
```

---

## Task 8: tesseractLoader.ts

**Files:**
- Create: `src/lib/tesseractLoader.ts`

- [ ] **Step 1: tesseractLoader.ts 생성**

`src/lib/tesseractLoader.ts` 신규:
```ts
import type { Worker as TesseractWorker } from 'tesseract.js';

let workerInstance: TesseractWorker | null = null;
let currentLang = '';

export type OcrLang = 'kor' | 'eng' | 'kor+eng';

/**
 * Tesseract.js worker 싱글턴.
 * 언어가 변경될 때만 worker를 재생성한다.
 * onProgress: 0.0 ~ 1.0 (인식 중에만 발화)
 */
export async function getTesseractWorker(
  lang: OcrLang,
  onProgress?: (ratio: number) => void,
): Promise<TesseractWorker> {
  if (workerInstance && currentLang === lang) {
    return workerInstance;
  }

  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }

  const { createWorker } = await import('tesseract.js');

  workerInstance = await createWorker(lang, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  currentLang = lang;
  return workerInstance;
}

/** 현재 worker 언어 반환 */
export function getCurrentOcrLang(): string {
  return currentLang;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/tesseractLoader.ts
git commit -m "feat(convert): tesseractLoader — Tesseract.js worker 싱글턴 lazy init"
```

---

## Task 9: OcrTool.tsx (Feature 13)

**Files:**
- Modify: `src/components/convert/tools/OcrTool.tsx` (스텁 교체)

- [ ] **Step 1: OcrTool 전체 구현**

`src/components/convert/tools/OcrTool.tsx`를 다음으로 교체:
```tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConvertUploadStrip } from '../ConvertUploadStrip';
import { getTesseractWorker, type OcrLang } from '@/lib/tesseractLoader';

type OcrStatus = 'idle' | 'loading-wasm' | 'recognizing' | 'done' | 'error';

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export function OcrTool() {
  const [file,       setFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lang,       setLang]       = useState<OcrLang>('kor+eng');
  const [status,     setStatus]     = useState<OcrStatus>('idle');
  const [progress,   setProgress]   = useState(0);
  const [text,       setText]       = useState('');
  const [words,      setWords]      = useState<OcrWord[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setStatus('idle');
    setText('');
    setWords([]);
    setError(null);
  }, [previewUrl]);

  // 인식 결과가 바뀔 때마다 캔버스에 바운딩 박스 그리기
  useEffect(() => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || words.length === 0) return;

    const scaleX = img.clientWidth  / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
    ctx.fillStyle   = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth   = 1.5;

    for (const w of words) {
      const { x0, y0, x1, y1 } = w.bbox;
      const rx = x0 * scaleX;
      const ry = y0 * scaleY;
      const rw = (x1 - x0) * scaleX;
      const rh = (y1 - y0) * scaleY;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [words]);

  const handleRecognize = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setText('');
    setWords([]);

    try {
      setStatus('loading-wasm');
      const worker = await getTesseractWorker(lang, (p) => {
        setStatus('recognizing');
        setProgress(p);
      });
      setStatus('recognizing');

      const result = await worker.recognize(file);
      const { text: recognizedText, words: recognizedWords } = result.data;

      setText(recognizedText.trim());
      setWords(
        recognizedWords
          .filter((w) => w.confidence > 30)
          .map((w) => ({
            text: w.text,
            bbox: {
              x0: w.bbox.x0,
              y0: w.bbox.y0,
              x1: w.bbox.x1,
              y1: w.bbox.y1,
            },
          })),
      );
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProcessing = status === 'loading-wasm' || status === 'recognizing';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ConvertUploadStrip
        onFiles={handleFiles}
        accept={{
          'image/png':  ['.png'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/webp': ['.webp'],
        }}
        formatHint="PNG, JPG, WebP"
        disabled={isProcessing}
      />

      {file ? (
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* 왼쪽: 이미지 + 바운딩 박스 */}
          <div className="flex flex-col gap-3 p-4 md:w-1/2 md:border-r border-border overflow-y-auto">
            <div className="relative inline-block">
              {previewUrl && (
                <>
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="OCR 대상 이미지"
                    className="w-full rounded-lg object-contain max-h-80"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </>
              )}
            </div>

            {/* 언어 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                언어
              </label>
              <div className="flex gap-2">
                {([
                  { value: 'kor',     label: '한국어' },
                  { value: 'eng',     label: '영어' },
                  { value: 'kor+eng', label: '자동 감지' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLang(value)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      lang === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 진행 상태 */}
            {status === 'loading-wasm' && (
              <div className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
                <span className="text-xs text-muted-foreground">언어 데이터 로딩 중... (~10MB)</span>
              </div>
            )}
            {status === 'recognizing' && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  인식 중... {Math.round(progress * 100)}%
                </p>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleRecognize}
              disabled={isProcessing}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                !isProcessing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
              )}
            >
              {isProcessing && (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              )}
              {isProcessing ? '처리 중...' : '텍스트 추출'}
            </button>
          </div>

          {/* 오른쪽: 텍스트 결과 */}
          <div className="flex flex-col gap-3 p-4 md:w-1/2 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                인식 결과
              </span>
              {text && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-primary hover:underline"
                >
                  {copied ? '복사됨 ✓' : '전체 복사'}
                </button>
              )}
            </div>
            {status === 'done' && !text && (
              <p className="text-xs text-muted-foreground">인식된 텍스트가 없습니다.</p>
            )}
            {text ? (
              <textarea
                readOnly
                value={text}
                className="flex-1 min-h-40 w-full rounded-lg border border-border bg-muted/30 p-3 text-sm font-mono resize-none outline-none"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground">
                  텍스트 추출 버튼을 누르면 결과가 여기에 표시됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">이미지 파일을 업로드하세요 (PNG, JPG, WebP)</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -10
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/convert/tools/OcrTool.tsx src/lib/tesseractLoader.ts
git commit -m "feat(convert): OcrTool — Tesseract.js OCR + 바운딩 박스 오버레이"
```

---

## Task 10: i18n 완성 + ConvertToolSelector/ConvertUploadStrip 텍스트 교체

**Files:**
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`
- Modify: `src/components/convert/ConvertToolSelector.tsx`
- Modify: `src/components/convert/ConvertUploadStrip.tsx`

지금까지 하드코딩된 텍스트를 i18n 키로 교체한다.

- [ ] **Step 1: ko.json에 convert 섹션 추가**

`src/messages/ko.json` — 마지막 `}` 바로 앞에 추가 (기존 마지막 키인 `"file": {...}` 뒤):
```json
"convert": {
  "upload": {
    "dragDrop": "파일을 드래그하거나 클릭해서 업로드",
    "dropHere": "여기에 놓으세요"
  },
  "tools": {
    "videoToGif": "동영상 변환",
    "ocr":        "텍스트 추출"
  }
}
```

- [ ] **Step 2: en.json에 convert 섹션 추가**

`src/messages/en.json` — 동일 위치에 추가:
```json
"convert": {
  "upload": {
    "dragDrop": "Drag file here or click to upload",
    "dropHere": "Drop here"
  },
  "tools": {
    "videoToGif": "Video Converter",
    "ocr":        "Text Extraction"
  }
}
```

- [ ] **Step 3: ConvertToolSelector i18n 적용**

`src/components/convert/ConvertToolSelector.tsx` 수정:

import에 `useTranslations` 추가:
```tsx
import { useTranslations } from 'next-intl';
```

`TOOLS` 배열에서 하드코딩 label 제거하고 key 사용:
```tsx
const TOOLS: Array<{ mode: ConvertToolMode; icon: React.ReactNode; labelKey: string }> = [
  { mode: 'video-to-gif', icon: <Clapperboard size={14} />, labelKey: 'videoToGif' },
  { mode: 'ocr',          icon: <ScanText size={14} />,     labelKey: 'ocr' },
];
```

컴포넌트 내부:
```tsx
export function ConvertToolSelector() {
  const { activeTool, setActiveTool } = useConvertContext();
  const t = useTranslations('convert.tools');

  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-border bg-card px-4 py-2 overflow-x-auto no-scrollbar">
      {TOOLS.map(({ mode, icon, labelKey }) => (
        <button
          key={mode}
          onClick={() => setActiveTool(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
            activeTool === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {icon}
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: ConvertUploadStrip i18n 적용**

`src/components/convert/ConvertUploadStrip.tsx`에 `useTranslations` 추가:
```tsx
import { useTranslations } from 'next-intl';
```

컴포넌트 내부 하드코딩 텍스트 교체:
```tsx
export function ConvertUploadStrip({ ... }: Props) {
  const t = useTranslations('convert.upload');
  // ...
  // 기존 하드코딩 '파일을 드래그하거나 클릭해서 업로드' → t('dragDrop')
  // 기존 하드코딩 '여기에 놓으세요' → t('dropHere')
  {isDragActive ? t('dropHere') : t('dragDrop')}
}
```

각 Tool에서 하드코딩된 formatHint 문자열은 그대로 유지 (도구별 설명이라 중앙 번역이 부자연스러움).

- [ ] **Step 5: 빌드 최종 검증**

```bash
npm run build 2>&1 | tail -10
```

Expected: 빌드 성공, 에러/경고 없음

- [ ] **Step 6: lint 확인**

```bash
npm run lint 2>&1 | tail -10
```

Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/messages/ko.json src/messages/en.json \
        src/components/convert/ConvertToolSelector.tsx
git commit -m "feat(convert): i18n 키 완성 — convert.tools.*, drawer.convert"
```

---

## 최종 검증 체크리스트

수동 브라우저 테스트 (로컬 dev 서버 `npm run dev`):

- [ ] 데스크탑 사이드바에 "변환" 탭(Wand2 아이콘) 표시 확인
- [ ] 모바일 하단 바에 "변환" 탭 표시 확인
- [ ] ConvertToolSelector에 "동영상 변환", "텍스트 추출" 버튼 표시 확인
- [ ] VideoTool: MP4 파일 드롭 → 프리뷰 + duration 표시 확인
- [ ] VideoTool: GIF 변환 버튼 클릭 → "ffmpeg.wasm 로딩 중" 표시 → 완료 후 .gif 다운로드
- [ ] VideoTool: 프레임 추출 모드 → 변환 버튼 클릭 → .zip 다운로드
- [ ] OcrTool: 이미지 드롭 → 프리뷰 표시
- [ ] OcrTool: 텍스트 추출 클릭 → "언어 데이터 로딩 중" → 결과 텍스트 + 바운딩 박스 표시
- [ ] OcrTool: "전체 복사" 클릭 → 클립보드에 텍스트 복사 확인
- [ ] 한국어/영어 언어 전환 시 탭 레이블 변경 확인

---

## 트러블슈팅

**SharedArrayBuffer is not defined 에러:**
- COOP/COEP 헤더가 적용되었는지 확인: 브라우저 개발자도구 Network 탭에서 응답 헤더 확인
- `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` 둘 다 있어야 함

**ffmpeg.wasm CDN 로딩 실패:**
- `baseURL`이 `https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd` 인지 확인
- unpkg 접속 문제 시 `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd` 로 대체

**Tesseract 언어 데이터 로딩 실패:**
- tesseract.js 5.x는 기본적으로 jsDelivr CDN에서 언어 데이터를 받음
- 네트워크 차단 환경에서는 `workerPath`, `corePath` 옵션으로 로컬 경로 설정 필요

**`ffmpeg.listDir` 타입 에러:**
- `@ffmpeg/ffmpeg` 0.12.x에서 `listDir` 반환 타입은 `FSNode[]`
- `FSNode` 타입이 없으면 `as { name: string; isDir: boolean }[]` 타입 단언 사용
