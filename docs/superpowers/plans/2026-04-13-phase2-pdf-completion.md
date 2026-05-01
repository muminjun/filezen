# Phase 2 — PDF 탭 완성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PDF 탭에 비밀번호 보호, 워터마크, 전자서명, PDF→이미지 추출 4가지 기능 추가

**Architecture:** 기존 PDF 툴 패턴(`lib/pdf*.ts` + `components/file/tools/*.tsx`) 그대로 따름. 모든 기능은 `pdf-lib`(암호화·콘텐츠 추가) + `pdfjs-dist`(렌더링) 기반 클라이언트사이드. `FileToolMode` 유니온 타입에 4개 모드 추가 후 `FileToolSelector`·`FilePage`에 등록.

**Tech Stack:** `pdf-lib` (^1.17.1, 이미 설치됨), `pdfjs-dist` (^5.6.205, 이미 설치됨), Canvas API, JSZip, next-intl

---

## 파일 구조

**신규 생성:**
- `src/lib/pdfProtect.ts` — PDF 비밀번호 보호 (pdf-lib 암호화)
- `src/lib/pdfWatermark.ts` — PDF 텍스트 워터마크 (pdf-lib 콘텐츠 스트림)
- `src/lib/pdfSign.ts` — 서명 이미지 → PDF 삽입 (pdf-lib)
- `src/lib/pdfToImages.ts` — PDF 페이지 → PNG/JPEG 추출 (pdfjs-dist + Canvas)
- `src/components/file/tools/ProtectTool.tsx` — 비밀번호 보호 UI
- `src/components/file/tools/PdfWatermarkTool.tsx` — 워터마크 UI
- `src/components/file/tools/SignTool.tsx` — 전자서명 UI (Canvas 서명 패드)
- `src/components/file/tools/ExtractTool.tsx` — PDF→이미지 추출 UI

**수정:**
- `src/lib/types.ts` — `FileToolMode`에 4개 모드 추가
- `src/components/file/FileToolSelector.tsx` — 4개 툴 버튼 등록
- `src/components/file/FilePage.tsx` — 4개 툴 컴포넌트 렌더링 등록
- `src/messages/en.json` + `src/messages/ko.json` — 신규 i18n 키 추가

---

## Task 1: FileToolMode 타입 확장 + 네비게이션 등록

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/components/file/FileToolSelector.tsx`
- Modify: `src/components/file/FilePage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

- [ ] **Step 1: types.ts — FileToolMode에 4개 모드 추가**

기존:
```typescript
export type FileToolMode =
  | 'page-manager'
  | 'merge'
  | 'split'
  | 'convert'
  | 'compress'
  | 'unlock';
```
교체:
```typescript
export type FileToolMode =
  | 'page-manager'
  | 'merge'
  | 'split'
  | 'convert'
  | 'compress'
  | 'unlock'
  | 'protect'
  | 'pdf-watermark'
  | 'sign'
  | 'extract';
```

- [ ] **Step 2: FileToolSelector.tsx — 4개 툴 버튼 추가**

현재 파일을 읽어서 `TOOLS` 배열에 다음 항목을 추가:
```typescript
import { Lock, Droplets, PenLine, Images } from 'lucide-react';
```
(기존 import에 추가)

`TOOLS` 배열 마지막에 추가:
```typescript
  { mode: 'protect',       icon: <Lock size={14} />,     key: 'protect' },
  { mode: 'pdf-watermark', icon: <Droplets size={14} />, key: 'pdfWatermark' },
  { mode: 'sign',          icon: <PenLine size={14} />,  key: 'sign' },
  { mode: 'extract',       icon: <Images size={14} />,   key: 'extract' },
```

- [ ] **Step 3: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"file"` → `"tools"` 객체 안에 추가:
```json
"protect": "Protect",
"pdfWatermark": "Watermark",
"sign": "Sign",
"extract": "To Images"
```

- [ ] **Step 4: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"file"` → `"tools"` 객체 안에 추가:
```json
"protect": "보호",
"pdfWatermark": "워터마크",
"sign": "서명",
"extract": "이미지 추출"
```

- [ ] **Step 5: FilePage.tsx — 4개 컴포넌트 조건부 렌더링 추가**

현재 FilePage.tsx의 import에 추가 (아직 파일이 없으니 주석으로 처리하면 안 됨 — 파일을 먼저 생성한 다음 import. 이 Task에서는 import 없이 placeholder 렌더링으로 처리):

기존 `{activeTool === 'unlock' && <UnlockTool />}` 다음에 추가:
```typescript
        {activeTool === 'protect'       && <ProtectTool />}
        {activeTool === 'pdf-watermark' && <PdfWatermarkTool />}
        {activeTool === 'sign'          && <SignTool />}
        {activeTool === 'extract'       && <ExtractTool />}
```

그리고 import에 추가:
```typescript
import { ProtectTool }      from './tools/ProtectTool';
import { PdfWatermarkTool } from './tools/PdfWatermarkTool';
import { SignTool }         from './tools/SignTool';
import { ExtractTool }      from './tools/ExtractTool';
```

**주의:** FilePage.tsx를 수정하기 전에 Task 2~5에서 실제 컴포넌트를 먼저 생성해야 합니다. 이 Task에서는 types.ts + FileToolSelector.tsx + i18n만 처리하고, FilePage.tsx 수정은 Task 5 마지막에 수행합니다.

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/components/file/FileToolSelector.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(pdf-nav): FileToolMode 4개 추가 (protect/pdf-watermark/sign/extract) + 네비게이션 등록"
```

---

## Task 2: PDF 비밀번호 보호 라이브러리 및 UI

**Files:**
- Create: `src/lib/pdfProtect.ts`
- Create: `src/components/file/tools/ProtectTool.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

**배경 지식:**
- `pdf-lib`의 `PDFDocument.encrypt()` API로 암호화
- 사용자 비밀번호(열기용) + 소유자 비밀번호(편집 제한용) 별도 설정 가능
- 현재 `pdfUnlock.ts`가 `pdf-lib`를 이미 사용 중 — 동일 패턴

- [ ] **Step 1: pdfProtect.ts 작성**

`src/lib/pdfProtect.ts` 생성:

```typescript
import { PDFDocument } from 'pdf-lib';

export interface ProtectOptions {
  userPassword:  string;   // 문서 열기용 비밀번호
  ownerPassword: string;   // 편집·인쇄 제한용 비밀번호 (빈 문자열이면 userPassword 사용)
  allowPrinting: boolean;
  allowCopying:  boolean;
}

/**
 * PDF에 비밀번호 보호를 적용한다.
 * pdf-lib encrypt() 사용 — AES-256 암호화
 */
export async function protectPdf(
  file: File,
  options: ProtectOptions,
): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);

  const ownerPw = options.ownerPassword.trim() || options.userPassword;

  await pdfDoc.encrypt({
    userPassword:  options.userPassword,
    ownerPassword: ownerPw,
    permissions: {
      printing:         options.allowPrinting ? 'highResolution' : undefined,
      copying:          options.allowCopying,
      modifyAnnotations: false,
      modifyContents:   false,
    },
  });

  return pdfDoc.save();
}
```

- [ ] **Step 2: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"file"` 객체 안에 `"protect"` 섹션 추가:
```json
"protect": {
  "title": "Password Protect PDF",
  "userPassword": "Open Password",
  "userPasswordPlaceholder": "Password to open the PDF",
  "ownerPassword": "Owner Password (optional)",
  "ownerPasswordPlaceholder": "Leave empty to use open password",
  "allowPrinting": "Allow printing",
  "allowCopying": "Allow text copying",
  "protect": "Protect & Download",
  "protecting": "Protecting...",
  "success": "PDF protected successfully",
  "privacyNote": "All processing is done locally. Passwords are never sent to any server.",
  "empty": "Upload a PDF to get started"
}
```

- [ ] **Step 3: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"file"` 객체 안에 `"protect"` 섹션 추가:
```json
"protect": {
  "title": "PDF 비밀번호 보호",
  "userPassword": "열기 비밀번호",
  "userPasswordPlaceholder": "PDF를 열 때 사용할 비밀번호",
  "ownerPassword": "소유자 비밀번호 (선택)",
  "ownerPasswordPlaceholder": "비워두면 열기 비밀번호 사용",
  "allowPrinting": "인쇄 허용",
  "allowCopying": "텍스트 복사 허용",
  "protect": "보호 후 다운로드",
  "protecting": "처리 중...",
  "success": "PDF 보호 완료",
  "privacyNote": "모든 처리는 브라우저에서 이루어집니다. 비밀번호는 어디에도 전송되지 않습니다.",
  "empty": "PDF를 업로드하세요"
}
```

- [ ] **Step 4: ProtectTool.tsx 작성**

기존 `UnlockTool.tsx`를 참고해 동일 레이아웃 패턴으로 작성. `src/components/file/tools/ProtectTool.tsx` 생성:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Lock, Info } from 'lucide-react';
import { cn, downloadBytes } from '@/lib/utils';
import { protectPdf } from '@/lib/pdfProtect';
import { FileUploadStrip } from '../FileUploadStrip';

export function ProtectTool() {
  const t = useTranslations('file.protect');

  const [file, setFile]               = useState<File | null>(null);
  const [userPw, setUserPw]           = useState('');
  const [ownerPw, setOwnerPw]         = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying]   = useState(false);
  const [isProtecting, setIsProtecting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleProtect = async () => {
    if (!file || !userPw) return;
    setIsProtecting(true);
    setError(null);
    setDone(false);

    try {
      const bytes = await protectPdf(file, {
        userPassword:  userPw,
        ownerPassword: ownerPw,
        allowPrinting,
        allowCopying,
      });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-protected.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsProtecting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isProtecting} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File info */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* User password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('userPassword')}
            </label>
            <input
              type="password"
              value={userPw}
              onChange={(e) => setUserPw(e.target.value)}
              placeholder={t('userPasswordPlaceholder')}
              disabled={isProtecting}
              className={cn(
                'w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-all',
                'focus:border-primary focus:ring-1 focus:ring-primary/30',
                isProtecting && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>

          {/* Owner password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('ownerPassword')}
            </label>
            <input
              type="password"
              value={ownerPw}
              onChange={(e) => setOwnerPw(e.target.value)}
              placeholder={t('ownerPasswordPlaceholder')}
              disabled={isProtecting}
              className={cn(
                'w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-all',
                'focus:border-primary focus:ring-1 focus:ring-primary/30',
                isProtecting && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>

          {/* Permissions */}
          <div className="flex flex-col gap-2">
            {[
              { label: t('allowPrinting'), value: allowPrinting, set: setAllowPrinting },
              { label: t('allowCopying'),  value: allowCopying,  set: setAllowCopying  },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {done && (
            <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>
          )}

          {/* Protect button */}
          <button
            onClick={handleProtect}
            disabled={isProtecting || !userPw}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer',
              !isProtecting && userPw
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isProtecting ? (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
            ) : (
              <Lock size={14} />
            )}
            {isProtecting ? t('protecting') : t('protect')}
          </button>

          {/* Privacy note */}
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70 mt-auto pt-2">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>{t('privacyNote')}</span>
          </div>
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

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdfProtect.ts src/components/file/tools/ProtectTool.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(ProtectTool): PDF 비밀번호 보호 기능 추가 (pdf-lib AES-256)"
```

---

## Task 3: PDF 워터마크 라이브러리 및 UI

**Files:**
- Create: `src/lib/pdfWatermark.ts`
- Create: `src/components/file/tools/PdfWatermarkTool.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

**배경 지식:**
- `pdf-lib`에서 각 페이지에 텍스트를 그리려면 `page.drawText()` 사용
- 폰트는 `pdfDoc.embedFont(StandardFonts.Helvetica)` 또는 `StandardFonts.HelveticaBold`
- 불투명도는 `drawText`의 `opacity` 옵션
- 대각선 배치는 `rotate` 옵션 (라디안 값)

- [ ] **Step 1: pdfWatermark.ts 작성**

`src/lib/pdfWatermark.ts` 생성:

```typescript
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export type WatermarkPageRange = 'all' | { from: number; to: number };

export interface PdfWatermarkOptions {
  text:       string;
  fontSize:   number;       // 12–120
  opacity:    number;       // 0.0–1.0
  color:      string;       // '#rrggbb'
  angle:      number;       // 도 단위 (0 = 수평, 45 = 대각선)
  repeat:     boolean;      // true: 전체 페이지 타일, false: 페이지 중앙 1회
  pageRange:  WatermarkPageRange;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export async function addPdfWatermark(
  file: File,
  options: PdfWatermarkOptions,
): Promise<Uint8Array> {
  const bytes  = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages  = pdfDoc.getPages();
  const { r, g, b } = hexToRgb(options.color);
  const color = rgb(r, g, b);
  const rad   = degrees(options.angle);

  const targetPages = options.pageRange === 'all'
    ? pages
    : pages.slice(
        Math.max(0, (options.pageRange.from - 1)),
        options.pageRange.to,
      );

  for (const page of targetPages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = options.fontSize;

    if (options.repeat) {
      // 대각선 타일 패턴
      const stepX = textWidth  + options.fontSize * 2;
      const stepY = textHeight + options.fontSize * 2;
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawText(options.text, {
            x,
            y,
            size:    options.fontSize,
            font,
            color,
            opacity: options.opacity,
            rotate:  rad,
          });
        }
      }
    } else {
      // 페이지 중앙 1회 배치
      page.drawText(options.text, {
        x:       (width  - textWidth)  / 2,
        y:       (height - textHeight) / 2,
        size:    options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate:  rad,
      });
    }
  }

  return pdfDoc.save();
}
```

- [ ] **Step 2: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"file"` 객체 안에 `"pdfWatermark"` 섹션 추가:
```json
"pdfWatermark": {
  "title": "Add Watermark to PDF",
  "text": "Watermark text",
  "textPlaceholder": "e.g. CONFIDENTIAL",
  "fontSize": "Font size",
  "opacity": "Opacity",
  "color": "Color",
  "angle": "Angle",
  "repeat": "Repeat across page",
  "pageRange": "Page range",
  "pageRangeAll": "All pages",
  "pageRangeCustom": "Custom range",
  "pageFrom": "From",
  "pageTo": "To",
  "apply": "Apply & Download",
  "applying": "Processing...",
  "success": "Watermark added",
  "empty": "Upload a PDF to get started"
}
```

- [ ] **Step 3: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"file"` 객체 안에 `"pdfWatermark"` 섹션 추가:
```json
"pdfWatermark": {
  "title": "PDF 워터마크 추가",
  "text": "워터마크 텍스트",
  "textPlaceholder": "예: 대외비",
  "fontSize": "글자 크기",
  "opacity": "불투명도",
  "color": "색상",
  "angle": "각도",
  "repeat": "페이지 전체 반복",
  "pageRange": "페이지 범위",
  "pageRangeAll": "전체 페이지",
  "pageRangeCustom": "범위 지정",
  "pageFrom": "시작",
  "pageTo": "끝",
  "apply": "적용 후 다운로드",
  "applying": "처리 중...",
  "success": "워터마크 추가 완료",
  "empty": "PDF를 업로드하세요"
}
```

- [ ] **Step 4: PdfWatermarkTool.tsx 작성**

`src/components/file/tools/PdfWatermarkTool.tsx` 생성:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes } from '@/lib/utils';
import { addPdfWatermark } from '@/lib/pdfWatermark';
import type { PdfWatermarkOptions, WatermarkPageRange } from '@/lib/pdfWatermark';
import { FileUploadStrip } from '../FileUploadStrip';

const DEFAULT: PdfWatermarkOptions = {
  text:      'CONFIDENTIAL',
  fontSize:  48,
  opacity:   0.3,
  color:     '#ff0000',
  angle:     45,
  repeat:    true,
  pageRange: 'all',
};

export function PdfWatermarkTool() {
  const t = useTranslations('file.pdfWatermark');

  const [file, setFile]         = useState<File | null>(null);
  const [opts, setOpts]         = useState<PdfWatermarkOptions>({ ...DEFAULT });
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo]   = useState('1');
  const [isApplying, setIsApplying] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const update = (partial: Partial<PdfWatermarkOptions>) =>
    setOpts((prev) => ({ ...prev, ...partial }));

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleApply = async () => {
    if (!file || !opts.text.trim()) return;
    setIsApplying(true);
    setError(null);
    setDone(false);

    try {
      const pageRange: WatermarkPageRange = opts.pageRange === 'all'
        ? 'all'
        : { from: parseInt(rangeFrom, 10) || 1, to: parseInt(rangeTo, 10) || 1 };

      const bytes = await addPdfWatermark(file, { ...opts, pageRange });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-watermarked.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isApplying} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('text')}
            </label>
            <input
              type="text"
              value={opts.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder={t('textPlaceholder')}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Font size + Color + Angle row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('fontSize')}</label>
              <input
                type="number" min={12} max={120}
                value={opts.fontSize}
                onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) || 48 })}
                className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('color')}</label>
              <input
                type="color" value={opts.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-[30px] w-full cursor-pointer rounded-md border border-border bg-card p-0.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t('angle')}°</label>
              <input
                type="number" min={0} max={360}
                value={opts.angle}
                onChange={(e) => update({ angle: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{t('opacity')}</label>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(opts.opacity * 100)}%
              </span>
            </div>
            <input
              type="range" min={0} max={100}
              value={Math.round(opts.opacity * 100)}
              onChange={(e) => update({ opacity: parseInt(e.target.value, 10) / 100 })}
              className="w-full h-1 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Repeat toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={opts.repeat}
              onChange={(e) => update({ repeat: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">{t('repeat')}</span>
          </label>

          {/* Page range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('pageRange')}
            </label>
            <div className="flex gap-2">
              {(['all', 'custom'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => update({ pageRange: v === 'all' ? 'all' : { from: 1, to: 1 } })}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    (v === 'all' ? opts.pageRange === 'all' : opts.pageRange !== 'all')
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {v === 'all' ? t('pageRangeAll') : t('pageRangeCustom')}
                </button>
              ))}
            </div>
            {opts.pageRange !== 'all' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">{t('pageFrom')}</label>
                <input
                  type="number" min={1} value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
                <label className="text-xs text-muted-foreground">{t('pageTo')}</label>
                <input
                  type="number" min={1} value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}

          <button
            onClick={handleApply}
            disabled={isApplying || !opts.text.trim()}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isApplying && opts.text.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isApplying
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isApplying ? t('applying') : t('apply')}
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

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdfWatermark.ts src/components/file/tools/PdfWatermarkTool.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(PdfWatermarkTool): PDF 텍스트 워터마크 추가 (pdf-lib, 반복 패턴·각도·페이지 범위)"
```

---

## Task 4: 전자서명 라이브러리 및 UI

**Files:**
- Create: `src/lib/pdfSign.ts`
- Create: `src/components/file/tools/SignTool.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

**배경 지식:**
- 서명 캔버스: `<canvas>` + `pointerdown/pointermove/pointerup` 이벤트로 그리기
- 서명 이미지: `canvas.toDataURL('image/png')` → base64 → `pdf-lib`의 `embedPng()`
- 삽입 위치: `page.drawImage(signImage, { x, y, width, height })`

- [ ] **Step 1: pdfSign.ts 작성**

`src/lib/pdfSign.ts` 생성:

```typescript
import { PDFDocument } from 'pdf-lib';

export interface SignOptions {
  signatureDataUrl: string;  // canvas.toDataURL('image/png')
  pageIndex:        number;  // 0-based
  x:                number;  // PDF 좌표 (pt, 좌하단 기준)
  y:                number;
  width:            number;
  height:           number;
}

export async function addSignatureToPdf(
  file: File,
  options: SignOptions,
): Promise<Uint8Array> {
  const bytes  = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const pages  = pdfDoc.getPages();
  const page   = pages[Math.min(options.pageIndex, pages.length - 1)];

  // base64 → Uint8Array
  const base64 = options.signatureDataUrl.replace(/^data:image\/png;base64,/, '');
  const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const signImage = await pdfDoc.embedPng(pngBytes);

  page.drawImage(signImage, {
    x:      options.x,
    y:      options.y,
    width:  options.width,
    height: options.height,
  });

  return pdfDoc.save();
}
```

- [ ] **Step 2: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"file"` 객체 안에 `"sign"` 섹션 추가:
```json
"sign": {
  "title": "Sign PDF",
  "signaturePad": "Draw your signature",
  "clear": "Clear",
  "pageLabel": "Insert on page",
  "sizeLabel": "Signature size",
  "positionLabel": "Position",
  "positionHint": "Distance from bottom-left corner (pt)",
  "x": "X",
  "y": "Y",
  "width": "Width",
  "height": "Height",
  "apply": "Add Signature & Download",
  "applying": "Processing...",
  "success": "Signature added",
  "noSignature": "Please draw your signature first",
  "empty": "Upload a PDF to get started"
}
```

- [ ] **Step 3: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"file"` 객체 안에 `"sign"` 섹션 추가:
```json
"sign": {
  "title": "PDF 서명",
  "signaturePad": "서명을 그려주세요",
  "clear": "지우기",
  "pageLabel": "삽입 페이지",
  "sizeLabel": "서명 크기",
  "positionLabel": "위치",
  "positionHint": "좌하단 기준 거리 (pt)",
  "x": "X",
  "y": "Y",
  "width": "가로",
  "height": "세로",
  "apply": "서명 삽입 후 다운로드",
  "applying": "처리 중...",
  "success": "서명 삽입 완료",
  "noSignature": "서명을 먼저 그려주세요",
  "empty": "PDF를 업로드하세요"
}
```

- [ ] **Step 4: SignTool.tsx 작성**

`src/components/file/tools/SignTool.tsx` 생성:

```typescript
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, downloadBytes } from '@/lib/utils';
import { addSignatureToPdf } from '@/lib/pdfSign';
import { FileUploadStrip } from '../FileUploadStrip';

export function SignTool() {
  const t = useTranslations('file.sign');

  const [file, setFile]         = useState<File | null>(null);
  const [pageIndex, setPageIndex] = useState(1);        // 1-based for UI
  const [sigWidth, setSigWidth] = useState(200);
  const [sigHeight, setSigHeight] = useState(80);
  const [sigX, setSigX]         = useState(50);
  const [sigY, setSigY]         = useState(50);
  const [isApplying, setIsApplying] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [file]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvasRef.current!.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handlePointerUp = () => { isDrawing.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleApply = async () => {
    if (!file || !hasSignature) return;
    setIsApplying(true);
    setError(null);
    setDone(false);

    try {
      const dataUrl = canvasRef.current!.toDataURL('image/png');
      const bytes = await addSignatureToPdf(file, {
        signatureDataUrl: dataUrl,
        pageIndex:  pageIndex - 1,
        x:          sigX,
        y:          sigY,
        width:      sigWidth,
        height:     sigHeight,
      });
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBytes(bytes, `${baseName}-signed.pdf`);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isApplying} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Signature canvas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('signaturePad')}
              </label>
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('clear')}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              className="w-full rounded-md border border-border bg-white cursor-crosshair touch-none"
              style={{ aspectRatio: '400/160' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          </div>

          {/* Page number */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">{t('pageLabel')}</label>
            <input
              type="number" min={1} value={pageIndex}
              onChange={(e) => setPageIndex(parseInt(e.target.value, 10) || 1)}
              className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Size */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('sizeLabel')}
            </label>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">{t('width')}</label>
              <input
                type="number" min={10} max={500} value={sigWidth}
                onChange={(e) => setSigWidth(parseInt(e.target.value, 10) || 200)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
              <label className="text-xs text-muted-foreground">{t('height')}</label>
              <input
                type="number" min={10} max={300} value={sigHeight}
                onChange={(e) => setSigHeight(parseInt(e.target.value, 10) || 80)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('positionLabel')}
            </label>
            <p className="text-[10px] text-muted-foreground/60">{t('positionHint')}</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">{t('x')}</label>
              <input
                type="number" min={0} value={sigX}
                onChange={(e) => setSigX(parseInt(e.target.value, 10) || 0)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
              <label className="text-xs text-muted-foreground">{t('y')}</label>
              <input
                type="number" min={0} value={sigY}
                onChange={(e) => setSigY(parseInt(e.target.value, 10) || 0)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && <p className="text-xs text-green-600 dark:text-green-400">{t('success')}</p>}
          {!hasSignature && (
            <p className="text-xs text-amber-500 dark:text-amber-400">{t('noSignature')}</p>
          )}

          <button
            onClick={handleApply}
            disabled={isApplying || !hasSignature}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isApplying && hasSignature
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isApplying
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isApplying ? t('applying') : t('apply')}
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

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdfSign.ts src/components/file/tools/SignTool.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(SignTool): PDF 전자서명 기능 추가 (Canvas 드로우 패드 + pdf-lib 삽입)"
```

---

## Task 5: PDF → 이미지 추출 라이브러리 및 UI + FilePage 등록

**Files:**
- Create: `src/lib/pdfToImages.ts`
- Create: `src/components/file/tools/ExtractTool.tsx`
- Modify: `src/components/file/FilePage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`

**배경 지식:**
- `generateThumbnails` 패턴 참고: `pdfThumbnail.ts`
- 높은 DPI를 위해 scale 값을 높임 (72dpi=1.0, 150dpi=2.08, 300dpi=4.17)
- 각 페이지를 canvas에 렌더링 → `canvas.toBlob()` → JSZip으로 ZIP 다운로드

- [ ] **Step 1: pdfToImages.ts 작성**

`src/lib/pdfToImages.ts` 생성:

```typescript
import { getPdfjsLib } from './pdfjsLoader';

export type ImageOutputFormat = 'png' | 'jpeg';

export interface ExtractOptions {
  format:    ImageOutputFormat;
  dpi:       72 | 150 | 300;
  pageRange: 'all' | { from: number; to: number };
  onProgress?: (current: number, total: number) => void;
}

const DPI_SCALE: Record<number, number> = { 72: 1.0, 150: 2.08, 300: 4.17 };

export async function extractPdfToImages(
  file: File,
  options: ExtractOptions,
): Promise<{ name: string; blob: Blob }[]> {
  const pdfjsLib = await getPdfjsLib();
  const bytes    = new Uint8Array(await file.arrayBuffer());
  const pdf      = await pdfjsLib.getDocument({ data: bytes }).promise;
  const total    = pdf.numPages;
  const scale    = DPI_SCALE[options.dpi] ?? 1.0;
  const mime     = `image/${options.format}`;
  const quality  = options.format === 'jpeg' ? 0.92 : undefined;
  const baseName = file.name.replace(/\.pdf$/i, '');

  const startPage = options.pageRange === 'all' ? 1 : options.pageRange.from;
  const endPage   = options.pageRange === 'all' ? total : Math.min(options.pageRange.to, total);

  const results: { name: string; blob: Blob }[] = [];

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const page     = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas   = document.createElement('canvas');
    canvas.width   = Math.ceil(viewport.width);
    canvas.height  = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('toBlob failed')),
        mime,
        quality,
      );
    });

    results.push({
      name: `${baseName}-page${String(pageNum).padStart(3, '0')}.${options.format}`,
      blob,
    });

    options.onProgress?.(pageNum - startPage + 1, endPage - startPage + 1);
  }

  return results;
}
```

- [ ] **Step 2: i18n 키 추가 (영문)**

`src/messages/en.json`의 `"file"` 객체 안에 `"extract"` 섹션 추가:
```json
"extract": {
  "title": "PDF to Images",
  "format": "Output format",
  "dpi": "Resolution",
  "dpi72": "72 DPI (screen)",
  "dpi150": "150 DPI (medium)",
  "dpi300": "300 DPI (print)",
  "pageRange": "Page range",
  "pageRangeAll": "All pages",
  "pageRangeCustom": "Custom range",
  "pageFrom": "From",
  "pageTo": "To",
  "extract": "Extract & Download ZIP",
  "extracting": "Extracting... {current}/{total}",
  "success": "Extracted {count} images",
  "empty": "Upload a PDF to get started"
}
```

- [ ] **Step 3: i18n 키 추가 (한국어)**

`src/messages/ko.json`의 `"file"` 객체 안에 `"extract"` 섹션 추가:
```json
"extract": {
  "title": "PDF → 이미지 추출",
  "format": "출력 형식",
  "dpi": "해상도",
  "dpi72": "72 DPI (화면용)",
  "dpi150": "150 DPI (중간)",
  "dpi300": "300 DPI (인쇄용)",
  "pageRange": "페이지 범위",
  "pageRangeAll": "전체 페이지",
  "pageRangeCustom": "범위 지정",
  "pageFrom": "시작",
  "pageTo": "끝",
  "extract": "추출 후 ZIP 다운로드",
  "extracting": "추출 중... {current}/{total}",
  "success": "{count}장 추출 완료",
  "empty": "PDF를 업로드하세요"
}
```

- [ ] **Step 4: ExtractTool.tsx 작성**

`src/components/file/tools/ExtractTool.tsx` 생성:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { extractPdfToImages } from '@/lib/pdfToImages';
import type { ImageOutputFormat, ExtractOptions } from '@/lib/pdfToImages';
import { FileUploadStrip } from '../FileUploadStrip';

export function ExtractTool() {
  const t = useTranslations('file.extract');

  const [file, setFile]           = useState<File | null>(null);
  const [format, setFormat]       = useState<ImageOutputFormat>('png');
  const [dpi, setDpi]             = useState<72 | 150 | 300>(150);
  const [useRange, setUseRange]   = useState(false);
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo]     = useState('1');
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress]   = useState({ current: 0, total: 0 });
  const [done, setDone]           = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setDone(false);
    setError(null);
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError(null);
    setDone(false);
    setProgress({ current: 0, total: 0 });

    try {
      const pageRange: ExtractOptions['pageRange'] = useRange
        ? { from: parseInt(rangeFrom, 10) || 1, to: parseInt(rangeTo, 10) || 1 }
        : 'all';

      const images = await extractPdfToImages(file, {
        format,
        dpi,
        pageRange,
        onProgress: (current, total) => setProgress({ current, total }),
      });

      // ZIP 다운로드
      const JSZip = (await import('jszip')).default;
      const zip   = new JSZip();
      for (const { name, blob } of images) {
        zip.file(name, blob);
      }
      const content  = await zip.generateAsync({ type: 'blob' });
      const url      = URL.createObjectURL(content);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `${file.name.replace(/\.pdf$/i, '')}-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDoneCount(images.length);
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileUploadStrip onFiles={handleFiles} disabled={isExtracting} multiple={false} />

      {file ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* File name */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="truncate text-sm font-medium block">{file.name}</span>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('format')}
            </label>
            <div className="flex gap-2">
              {(['png', 'jpeg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors',
                    format === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* DPI */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('dpi')}
            </label>
            <div className="flex gap-2">
              {([72, 150, 300] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDpi(d)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    dpi === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Page range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('pageRange')}
            </label>
            <div className="flex gap-2">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setUseRange(v)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    useRange === v
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {v ? t('pageRangeCustom') : t('pageRangeAll')}
                </button>
              ))}
            </div>
            {useRange && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">{t('pageFrom')}</label>
                <input
                  type="number" min={1} value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
                <label className="text-xs text-muted-foreground">{t('pageTo')}</label>
                <input
                  type="number" min={1} value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Progress */}
          {isExtracting && progress.total > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {t('extracting', { current: progress.current, total: progress.total })}
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          {done && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('success', { count: doneCount })}
            </p>
          )}

          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
              !isExtracting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
            )}
          >
            {isExtracting
              ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              : null}
            {isExtracting ? '...' : t('extract')}
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

- [ ] **Step 5: FilePage.tsx 수정 — 4개 컴포넌트 등록**

`src/components/file/FilePage.tsx`를 읽고 수정:

import에 추가:
```typescript
import { ProtectTool }      from './tools/ProtectTool';
import { PdfWatermarkTool } from './tools/PdfWatermarkTool';
import { SignTool }         from './tools/SignTool';
import { ExtractTool }      from './tools/ExtractTool';
```

`{activeTool === 'unlock' && <UnlockTool />}` 다음에 추가:
```typescript
        {activeTool === 'protect'       && <ProtectTool />}
        {activeTool === 'pdf-watermark' && <PdfWatermarkTool />}
        {activeTool === 'sign'          && <SignTool />}
        {activeTool === 'extract'       && <ExtractTool />}
```

- [ ] **Step 6: 최종 빌드 확인**

```bash
npm run build 2>&1 | tail -15
```

Expected: 빌드 성공

- [ ] **Step 7: Commit**

```bash
git add src/lib/pdfToImages.ts src/components/file/tools/ExtractTool.tsx src/components/file/FilePage.tsx src/messages/en.json src/messages/ko.json
git commit -m "feat(ExtractTool): PDF→이미지 추출 (pdfjs-dist + Canvas + ZIP 다운로드)"
```

---

## 최종 검증 체크리스트

| 기능 | 확인 방법 | 예상 결과 |
|------|---------|---------|
| PDF 비밀번호 보호 | PDF 업로드 → 비밀번호 입력 → Protect → Adobe Reader 열기 | 비밀번호 요구됨 |
| PDF 워터마크 | PDF 업로드 → 텍스트 입력 → Apply → PDF 열기 | 워터마크 표시됨 |
| 전자서명 | PDF 업로드 → 서명 그리기 → Apply → PDF 열기 | 서명 삽입됨 |
| PDF→이미지 PNG | PDF 업로드 → PNG → 150DPI → Extract → ZIP | 페이지당 PNG 파일 |
| PDF→이미지 범위 | 1페이지만 선택 → Extract | 1개 파일만 추출 |
