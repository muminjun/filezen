# Phase 3c — WASM 기반 변환 기능 설계

**작성일**: 2026-04-13  
**담당자**: minjun  
**브랜치**: feat/phase3c-wasm (main에서 분기)  
**워킹 디렉터리**: /Users/minjun/Documents/filezen-phase3c  
**상태**: 확정

---

## 개요

filezen Phase 3c는 WASM 기반 두 가지 변환 기능을 새로운 "변환" 탭으로 구현한다.

- **Feature 9**: 동영상 → GIF / 이미지 프레임 추출 (`ffmpeg.wasm`)
- **Feature 13**: 이미지 OCR 텍스트 추출 (`Tesseract.js`)

모든 처리는 클라이언트사이드에서 이루어지며, 대용량 WASM 바이너리는 사용자가 처리 버튼을 누를 때만 lazy load된다.

---

## 네비게이션 변경

현재 이미지 탭 / 파일 탭 2탭 구조에서 "변환" 탭을 추가한다.

```
이미지 탭 | 파일(PDF) 탭 | 변환 탭
```

- `DrawerLayout`의 `Tab` 타입에 `'convert'` 추가
- 데스크탑 사이드바 + 모바일 하단 바에 아이콘(`Wand2`) 추가
- `src/app/[locale]/page.tsx`에 `convertTab` prop 추가

---

## 파일 구조

```
src/
├── app/[locale]/page.tsx             # convertTab prop 추가
├── components/
│   ├── layout/DrawerLayout.tsx       # 변환 탭 추가
│   └── convert/
│       ├── ConvertPage.tsx           # 최상위 변환 탭 페이지
│       ├── ConvertToolSelector.tsx   # 툴 선택 바 (video-to-gif | ocr)
│       └── tools/
│           ├── VideoTool.tsx         # Feature 9
│           └── OcrTool.tsx           # Feature 13
├── lib/
│   ├── ffmpegLoader.ts               # ffmpeg.wasm 싱글턴 lazy init
│   └── tesseractLoader.ts            # Tesseract.js 싱글턴 lazy init
└── context/
    └── ConvertContext.tsx            # activeConvertTool 상태 관리
next.config.mjs                       # COOP/COEP 헤더 추가
```

ConvertPage는 FilePage와 동일한 패턴을 따른다: ConvertToolSelector + 활성 Tool 컴포넌트.

---

## COOP/COEP 헤더 (next.config.mjs)

`ffmpeg.wasm`은 멀티스레딩을 위해 `SharedArrayBuffer`가 필요하고, 이는 브라우저 격리 정책이 적용된 환경에서만 사용 가능하다.

```js
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  ],
}]
```

기존 `asyncWebAssembly: true` webpack 설정은 유지한다.

---

## WASM 로더

### ffmpegLoader.ts

싱글턴 패턴. FFmpeg 인스턴스를 모듈 스코프에 캐시하여 중복 다운로드를 방지한다.

```ts
let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  ffmpeg = new FFmpeg();
  if (onProgress) ffmpeg.on('progress', ({ progress }) => onProgress(progress));
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}
```

- 번들에 ffmpeg core (~30MB)를 포함하지 않고 CDN에서 로드
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` 두 패키지 필요

### tesseractLoader.ts

언어별 worker 캐시. 언어가 변경될 때만 재초기화.

```ts
let worker: TesseractWorker | null = null;
let currentLang = '';

export async function getTesseractWorker(
  lang: 'kor' | 'eng' | 'kor+eng',
  onProgress?: (p: number) => void
): Promise<TesseractWorker> {
  if (worker && currentLang === lang) return worker;
  if (worker) await worker.terminate();
  const { createWorker } = await import('tesseract.js');
  worker = await createWorker(lang, 1, {
    logger: (m) => { if (m.status === 'recognizing text') onProgress?.(m.progress); }
  });
  currentLang = lang;
  return worker;
}
```

- 최초 로드 시 언어 데이터 ~10MB 다운로드 (언어당)
- 언어 변경 시 기존 worker 종료 후 재생성

---

## Feature 9: VideoTool

### 상태 머신

```
idle → loading-wasm → processing → done
                   ↘             ↗
                      error
```

### UI

```
┌─────────────────────────────────────┐
│  [GIF 변환]  [프레임 추출]            │
├─────────────────────────────────────┤
│      드래그 앤 드롭 / 파일 선택        │
│      (MP4, MOV, WebM)               │
├─────────────────────────────────────┤
│  GIF 모드:                           │
│  시작 [00:00] 끝 [00:05]            │
│  FPS [10] 크기 [480px]              │
│                                     │
│  프레임 추출 모드:                    │
│  출력 포맷 [PNG / JPEG]              │
│  구간 [00:00] ~ [00:05]             │
│  간격 [1초마다 1장]                  │
├─────────────────────────────────────┤
│  [변환 시작]                         │
│  ████████░░░░ 67%  처리 중...        │
└─────────────────────────────────────┘
```

### 처리 로직

**GIF 변환:**
```
ffmpeg -i input.mp4 -ss {start} -t {duration} \
  -vf "fps={fps},scale={width}:-1:flags=lanczos" \
  -loop 0 output.gif
```

**프레임 추출:**
```
ffmpeg -i input.mp4 -ss {start} -t {duration} \
  -vf "fps=1/{interval}" frame_%04d.{ext}
```

결과 처리:
- GIF: 단일 파일 직접 다운로드
- 프레임: JSZip으로 묶어 ZIP 다운로드 (ExtractTool 패턴 재사용)

파일 드롭 후 `<video>` 태그로 duration 읽기 + 첫 프레임 썸네일 프리뷰 표시.

---

## Feature 13: OcrTool

### 상태 머신

```
idle → loading-wasm → recognizing → done
                   ↘              ↗
                       error
```

### UI (데스크탑: 좌우 분할 / 모바일: 상하)

```
┌──────────────────┬──────────────────┐
│  이미지 + 오버레이  │  텍스트 결과 패널  │
│                  │                  │
│  [바운딩 박스들]   │  인식된 텍스트...  │
│                  │                  │
│  언어: [한국어▼]  │  [전체 복사]       │
│  [텍스트 추출]    │                  │
│  ████░░ 로딩중    │                  │
└──────────────────┴──────────────────┘
```

### 처리 로직

1. 이미지 드롭 → `<img>` 프리뷰 + Canvas 오버레이 레이어 준비 (절대 위치로 이미지 위에 겹침)
2. 추출 버튼 → `getTesseractWorker(lang)` (최초 다운로드 포함, 프로그레스 표시)
3. `worker.recognize(imageFile)` → `{ data: { text, words } }` 반환
4. `words[]`의 `bbox` (left/top/width/height) → Canvas에 반투명 파란색 박스 렌더링
5. `text` → 우측 패널에 표시, 클립보드 복사 버튼

바운딩 박스 Canvas는 `<img>` 위에 `position: absolute`로 겹쳐서 이미지 크기에 맞게 좌표를 스케일링한다.

---

## 의존성 추가

| 패키지 | 용도 | 번들 영향 |
|--------|------|---------|
| `@ffmpeg/ffmpeg` | ffmpeg.wasm 래퍼 | ~0 (core는 CDN) |
| `@ffmpeg/util` | fetchFile, toBlobURL | 소형 |
| `tesseract.js` | OCR WASM 래퍼 | ~10MB/언어 (lazy) |

기존 `jszip`은 이미 사용 중 — 프레임 추출 ZIP에 재사용.

---

## 구현 순서

1. `next.config.mjs` COOP/COEP 헤더 추가
2. `ConvertContext` + `ConvertPage` + `ConvertToolSelector` 뼈대
3. `DrawerLayout` 변환 탭 추가 + `page.tsx` 연결
4. `ffmpegLoader.ts` + `VideoTool.tsx` (GIF 모드 → 프레임 추출 모드 순)
5. `tesseractLoader.ts` + `OcrTool.tsx`
6. i18n 키 추가 (ko/en)
7. 전체 동작 검증
