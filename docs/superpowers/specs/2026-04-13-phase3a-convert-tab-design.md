# Phase 3a — 변환 탭 설계 문서

**작성일**: 2026-04-13  
**담당자**: minjun  
**브랜치**: feat/phase3a-social-canvas (main에서 분기)  
**워킹 디렉터리**: /Users/minjun/Documents/filezen-phase3a  
**상태**: 확정

---

## 개요

기존 이미지 탭 / 파일(PDF) 탭 2개 구조에 **변환 탭**을 추가한다. 변환 탭은 아이콘/파비콘 생성기, 소셜 미디어 사이즈 프리셋, 색상 팔레트 추출 3개 기능을 포함한다. 모든 처리는 클라이언트사이드로 수행한다.

---

## 1. 네비게이션 구조 변경

### 변경 내용

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 탭 수 | 2개 (이미지, 파일) | 3개 (이미지, 파일, 변환) |
| 사이드바 아이콘 | ImageIcon, FolderIcon | + Zap (lucide-react) |
| 모바일 하단 네비 | 2개 항목 | 3개 항목 |

### 수정 파일

- **`src/components/layout/DrawerLayout.tsx`**
  - `Tab` 타입에 `'convert'` 추가
  - `DrawerLayoutProps`에 `convertTab: React.ReactNode` prop 추가
  - 사이드바 및 모바일 네비에 Zap 아이콘 + 변환 탭 항목 추가
  - 메인 콘텐츠 영역에 `activeTab === 'convert'` 분기 추가

- **`src/app/[locale]/page.tsx`**
  - `<ConvertPage />` 임포트 후 DrawerLayout에 `convertTab` prop으로 전달

- **`src/messages/ko.json`, `src/messages/en.json`**
  - `drawer.convert` 번역 키 추가 (한: "변환", 영: "Convert")

---

## 2. ConvertPage 구조

### 아키텍처 결정

- **완전 무상태**: Context 없음. 각 Tool이 `useState`로 자체 상태 관리
- **탭 전환 시 unmount**: 탭 변경 시 컴포넌트 unmount → state 자동 리셋 → 기능별 독립 업로드 보장
- **FilePage 패턴 준수**: ConvertToolSelector는 FileToolSelector와 동일 구조

### ConvertToolMode 타입

```ts
type ConvertToolMode = 'icon' | 'social' | 'palette'
```

### 신규 파일 목록

```
src/components/convert/
├── ConvertPage.tsx           — 탭 전환 컨테이너 (ConvertToolMode state 보유)
├── ConvertToolSelector.tsx   — 상단 탭 UI (아이콘 생성기 | 소셜 프리셋 | 색상 팔레트)
└── tools/
    ├── IconTool.tsx          — 아이콘/파비콘 생성기
    ├── SocialPresetTool.tsx  — 소셜 미디어 사이즈 프리셋
    └── ColorPaletteTool.tsx  — 색상 팔레트 추출

src/lib/
├── iconGenerator.ts   — Canvas 리사이즈 + ICO 바이너리 인코딩
├── socialPreset.ts    — Canvas center-crop / letter-box 로직 + 프리셋 상수
└── colorPalette.ts    — color-thief 래퍼 + HEX/RGB/HSL 변환 유틸
```

---

## 3. Feature 10 — 아이콘/파비콘 생성기

### UI 흐름

1. 이미지 1장 업로드 (드롭 또는 클릭)
2. 배경색 선택: 투명 | 단색 (컬러피커)
3. 출력 파일 체크박스 선택 (기본 전체 선택)
4. ZIP 다운로드 버튼

### 출력 파일 세트

| 파일명 | 크기 | 포맷 |
|--------|------|------|
| `favicon.ico` | 16/32/48px 멀티사이즈 | ICO |
| `favicon-32x32.png` | 32×32 | PNG |
| `favicon-16x16.png` | 16×16 | PNG |
| `apple-touch-icon.png` | 180×180 | PNG |
| `android-192.png` | 192×192 | PNG |
| `android-512.png` | 512×512 | PNG |
| `og-image.png` | 1200×630 | PNG |
| `windows-tile.png` | 150×150 | PNG |

### iconGenerator.ts 핵심 로직

- `resizeToCanvas(img, w, h, bgColor)` — Canvas API로 리사이즈. `bgColor`가 `null`이면 투명 배경
- `canvasToBlob(canvas, type)` — PNG Blob 반환
- `encodeIco(blobs: Blob[])` — ICO 바이너리 직접 조립
  - ICO 헤더(6 bytes) + 디렉터리 엔트리(16 bytes × n) + PNG 데이터
  - 외부 라이브러리 없이 `ArrayBuffer` + `DataView`로 구현
- `generateIconSet(file, options)` — 전체 세트 생성 후 `{ filename, blob }[]` 반환

### 다운로드

`jszip` 라이브러리로 ZIP 생성. 이미 `package.json`에 포함되어 있음 (`^3.10.1`).

---

## 4. Feature 11 — 소셜 미디어 사이즈 프리셋

### 프리셋 상수 (socialPreset.ts)

```ts
type SocialPreset = { label: string; width: number; height: number }
type Platform = { name: string; presets: SocialPreset[] }

const PLATFORMS: Platform[] = [
  { name: 'Instagram', presets: [
    { label: '피드 정사각형', width: 1080, height: 1080 },
    { label: '피드 세로',     width: 1080, height: 1350 },
    { label: '스토리/릴스',  width: 1080, height: 1920 },
  ]},
  { name: 'Twitter/X', presets: [
    { label: '포스트',   width: 1600, height: 900  },
    { label: '프로필',   width: 400,  height: 400  },
    { label: '헤더',     width: 1500, height: 500  },
  ]},
  { name: 'YouTube', presets: [
    { label: '썸네일',    width: 1280, height: 720  },
    { label: '채널 아트', width: 2560, height: 1440 },
  ]},
  { name: 'LinkedIn', presets: [
    { label: '포스트', width: 1200, height: 628 },
    { label: '커버',   width: 1584, height: 396 },
  ]},
]
```

### UI 흐름

1. 이미지 1장 이상 업로드
2. 플랫폼 선택 (다중 선택 가능)
3. 선택된 플랫폼의 규격 체크박스 표시 (기본 전체 선택)
4. 크롭 방식 선택: `center-crop` | `letter-box`
5. ZIP 다운로드 (파일명: `{원본명}_{플랫폼}_{규격}.{ext}`)

### applyPreset 로직

- **center-crop**: 목표 비율로 소스 이미지를 center-align 후 crop
- **letter-box**: 이미지를 목표 크기 내에 fit 후 빈 영역 흰색 패딩 (기본값)

---

## 5. Feature 14 — 색상 팔레트 추출

### UI 흐름

1. 이미지 1장 업로드
2. 추출 색상 수 선택 (5~10, 기본 8)
3. 이미지 썸네일 + 추출된 색상 스와치 표시
4. 색상 스와치 클릭 → HEX 클립보드 복사
5. 색상 표시 형식 토글: HEX | RGB | HSL
6. 전체 팔레트 일괄 복사: JSON | CSS 변수

### colorPalette.ts

```ts
// color-thief 동적 임포트 (SSR 회피)
async function getPalette(imgEl: HTMLImageElement, count: number): Promise<number[][]>

// 변환 유틸
function rgbToHex(rgb: number[]): string
function rgbToHsl(rgb: number[]): { h: number; s: number; l: number }

// 복사 포맷 생성
function toCssVars(palette: number[][]): string
// --color-1: #e63946; --color-2: #457b9d; ...

function toJson(palette: number[][]): string
// [{ hex: "#e63946", rgb: [230,57,70], hsl: { h:356, s:78, l:56 } }, ...]
```

### color-thief 의존성

`color-thief-browser` 패키지 사용 (SSR-safe 버전). 없으면 `npm install color-thief-browser`.

---

## 6. 기술 의존성

| 항목 | 라이브러리 | 신규 추가 여부 |
|------|-----------|--------------|
| ZIP 생성 | `jszip` | 기존 포함 (^3.10.1) |
| 색상 팔레트 | `color-thief-browser` | 신규 추가 |
| ICO 인코딩 | Canvas API + ArrayBuffer | 없음 (직접 구현) |
| Canvas 리사이즈/크롭 | Canvas API | 없음 |

---

## 7. 워크트리 작업 방식

- **워킹 디렉터리**: `/Users/minjun/Documents/filezen-phase3a`
- **브랜치**: `feat/phase3a-social-canvas` (main에서 분기)
- main 브랜치에서 git worktree 생성 후 독립 작업
