# 프레임 옵션 바텀시트 (모바일) 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일에서 프레임 옵션 패널을 vaul 기반 드래그 가능한 바텀시트로 교체한다.

**Architecture:** `vaul` 라이브러리의 `Drawer`를 사용해 snap points(0.12 / 0.45 / 0.88)를 가진 상시 노출 바텀시트를 구현한다. `FrameOptionsSheet.tsx`를 신규 생성하고, `FramePage.tsx`에서 모바일/데스크탑을 조건부 렌더링으로 분기한다. `FrameOptions.tsx`는 변경하지 않는다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, vaul

---

## 파일 맵

| 액션 | 경로 | 역할 |
|------|------|------|
| 설치 | `vaul` npm 패키지 | 바텀시트 드래그 라이브러리 |
| 신규 | `src/components/frame/FrameOptionsSheet.tsx` | 모바일 전용 바텀시트 래퍼 |
| 수정 | `src/components/frame/FramePage.tsx` | 모바일/데스크탑 조건부 분기 |
| 변경 없음 | `src/components/frame/FrameOptions.tsx` | 기존 옵션 컴포넌트 재사용 |

---

## Task 1: feat 브랜치 생성 및 vaul 설치

**Files:**
- 없음 (브랜치 + 패키지 설치)

- [ ] **Step 1: feat 브랜치 생성**

```bash
git checkout -b feat/frame-options-bottom-sheet
```

Expected: `Switched to a new branch 'feat/frame-options-bottom-sheet'`

- [ ] **Step 2: vaul 설치**

```bash
npm install vaul
```

Expected: `added 1 package` (vaul 설치 완료)

- [ ] **Step 3: 설치 확인**

```bash
node -e "require('vaul'); console.log('vaul ok')"
```

Expected: `vaul ok`

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: vaul 설치 (바텀시트 라이브러리)"
```

---

## Task 2: FrameOptionsSheet 컴포넌트 생성

**Files:**
- Create: `src/components/frame/FrameOptionsSheet.tsx`

- [ ] **Step 1: 파일 생성**

`src/components/frame/FrameOptionsSheet.tsx`를 아래 내용으로 생성한다:

```tsx
'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FrameTemplate, FrameOptionsState } from '@/lib/frameTemplates';
import { FrameOptions } from './FrameOptions';

const SNAP_POINTS = [0.12, 0.45, 0.88] as const;
type SnapPoint = (typeof SNAP_POINTS)[number];

interface FrameOptionsSheetProps {
  template: FrameTemplate;
  options: FrameOptionsState;
  onChange: (opts: FrameOptionsState) => void;
  onPhotoCountChange: (n: number) => void;
  onColsChange: (c: number) => void;
  onMerge: (indexA: number, indexB: number) => void;
  onSplit: (index: number) => void;
  isExporting: boolean;
  onExport: () => void;
}

export function FrameOptionsSheet({
  template,
  options,
  onChange,
  onPhotoCountChange,
  onColsChange,
  onMerge,
  onSplit,
  isExporting,
  onExport,
}: FrameOptionsSheetProps) {
  const t = useTranslations('frame');
  const [snap, setSnap] = useState<SnapPoint>(0.45);

  return (
    <Drawer.Root
      open
      modal={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={(s) => setSnap(s as SnapPoint)}
      fadeFromIndex={2}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed bottom-14 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-card shadow-lg focus:outline-none"
          style={{ height: 'calc(88vh - 3.5rem)' }}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* 내보내기 버튼 — 항상 노출 */}
          <div className="px-4 pt-2 pb-3 flex-shrink-0">
            <button
              onClick={onExport}
              disabled={isExporting}
              className={cn(
                'w-full rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
                isExporting
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {isExporting ? t('exporting') : t('export')}
            </button>
          </div>

          {/* 옵션 영역 — 스크롤 가능 */}
          <div className="overflow-y-auto flex-1">
            <FrameOptions
              template={template}
              options={options}
              onChange={onChange}
              onPhotoCountChange={onPhotoCountChange}
              onColsChange={onColsChange}
              onMerge={onMerge}
              onSplit={onSplit}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | grep -i "FrameOptionsSheet\|vaul" | head -20
```

Expected: 출력 없음 (에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/components/frame/FrameOptionsSheet.tsx
git commit -m "feat: FrameOptionsSheet 바텀시트 컴포넌트 생성"
```

---

## Task 3: FramePage.tsx — 모바일/데스크탑 조건부 분기

**Files:**
- Modify: `src/components/frame/FramePage.tsx`

현재 `FramePage.tsx`의 하단 사이드바 영역 (line 215–239):

```tsx
<div className="flex flex-shrink-0 flex-col overflow-y-auto border-t border-border sm:w-64 sm:border-l sm:border-t-0">
  <FrameOptions
    template={activeTemplate}
    options={options}
    onChange={setOptions}
    onPhotoCountChange={handlePhotoCountChange}
    onColsChange={handleColsChange}
    onMerge={handleSlotMerge}
    onSplit={handleSlotSplit}
  />
  <div className="px-4 pb-4">
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={cn(
        'w-full rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95',
        isExporting
          ? 'cursor-not-allowed bg-muted text-muted-foreground'
          : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
      )}
    >
      {isExporting ? t('exporting') : t('export')}
    </button>
  </div>
</div>
```

- [ ] **Step 1: import 추가**

파일 상단 import 목록에 `FrameOptionsSheet` import를 추가한다.

기존:
```tsx
import { FrameOptions } from './FrameOptions';
```

변경 후:
```tsx
import { FrameOptions } from './FrameOptions';
import { FrameOptionsSheet } from './FrameOptionsSheet';
```

- [ ] **Step 2: 캔버스 영역에 모바일 하단 여백 추가**

현재 캔버스 감싸는 div (line 198):
```tsx
<div className="flex flex-1 items-center justify-center overflow-hidden p-4">
```

변경 후 (모바일에서 바텀시트가 peek 상태일 때 캔버스가 가리지 않도록 하단 패딩 추가):
```tsx
<div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:pb-4 pb-[46vh]">
```

- [ ] **Step 3: 사이드바 div를 데스크탑 전용으로 변경**

현재:
```tsx
<div className="flex flex-shrink-0 flex-col overflow-y-auto border-t border-border sm:w-64 sm:border-l sm:border-t-0">
```

변경 후:
```tsx
<div className="hidden sm:flex flex-shrink-0 flex-col overflow-y-auto sm:w-64 sm:border-l sm:border-t-0">
```

- [ ] **Step 4: 바텀시트 추가 (모바일 전용)**

사이드바 닫는 `</div>` 태그 바로 뒤에 삽입:

```tsx
{/* 모바일 전용 바텀시트 */}
<div className="sm:hidden">
  <FrameOptionsSheet
    template={activeTemplate}
    options={options}
    onChange={setOptions}
    onPhotoCountChange={handlePhotoCountChange}
    onColsChange={handleColsChange}
    onMerge={handleSlotMerge}
    onSplit={handleSlotSplit}
    isExporting={isExporting}
    onExport={handleExport}
  />
</div>
```

- [ ] **Step 5: TypeScript 전체 오류 확인**

```bash
cd /Users/minjun/Documents/filezen && npx tsc --noEmit 2>&1 | head -30
```

Expected: 출력 없음 (에러 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/components/frame/FramePage.tsx
git commit -m "feat: FramePage 모바일 바텀시트 조건부 렌더링 적용"
```

---

## Task 4: 빌드 검증 및 PR 준비

**Files:**
- 없음

- [ ] **Step 1: 빌드 확인**

```bash
cd /Users/minjun/Documents/filezen && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route (app)` 성공 목록

- [ ] **Step 2: 모바일 UI 수동 확인 체크리스트**

로컬 개발 서버(`npm run dev`)를 실행 후 브라우저 DevTools에서 iPhone 시뮬레이션으로 확인:
- [ ] 프레임 탭 진입 시 바텀시트가 peek(45%) 위치에 표시됨
- [ ] 핸들바를 드래그해서 위로 올리면 88% snap point까지 확장됨
- [ ] 핸들바를 드래그해서 내리면 12% snap point(핸들 + 내보내기 버튼만)까지 축소됨
- [ ] "내보내기" 버튼이 시트 최상단(핸들 아래)에 항상 노출됨
- [ ] 옵션 영역(갭 색상, 갭 크기 등)이 시트 내에서 스크롤됨
- [ ] 데스크탑(sm: 이상)에서 기존 우측 사이드바가 정상 표시됨
- [ ] 데스크탑에서 바텀시트가 표시되지 않음

- [ ] **Step 3: 최종 커밋 및 PR**

```bash
git push -u origin feat/frame-options-bottom-sheet
```

그 후 GitHub에서 PR 생성:
- base: `main`
- title: `feat: 모바일 프레임 옵션 바텀시트 (vaul 드래그 가능)`
