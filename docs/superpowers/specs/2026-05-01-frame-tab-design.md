# Frame Tab — 설계 문서

**날짜**: 2026-05-01  
**담당자**: minjun

---

## 개요

사진을 프레임 템플릿에 배치하고 한 장으로 내보내는 독립 탭을 추가한다.  
인생네컷(2컷/4컷/6컷 그리드)과 소셜 미디어 프리셋(인스타, 유튜브 등)을 통합한다.  
기존 변환 탭의 `SocialPresetTool`은 제거한다.

---

## 변경 범위

| 항목 | 변경 |
|---|---|
| `src/context/UIContext.tsx` | `ActiveTab`에 `'frame'` 추가 |
| `src/lib/types.ts` | `ConvertToolMode`에서 `'social'` 제거 |
| `src/components/layout/DrawerLayout.tsx` | 프레임 탭 아이템 & `frameTab` prop 추가 |
| `src/app/[locale]/page.tsx` | `<FramePage />` 전달 |
| `src/components/convert/ConvertPage.tsx` | `SocialPresetTool` 항목 제거 |
| `src/components/convert/ConvertToolSelector.tsx` | `social` 항목 제거 |
| `src/components/convert/tools/SocialPresetTool.tsx` | 파일 삭제 |
| `src/lib/socialPreset.ts` | 파일 삭제 |
| `src/messages/ko.json`, `en.json` | `frame` 네임스페이스 추가, `convert.social` 제거 |

신규 파일:

```
src/
├── components/frame/
│   ├── FramePage.tsx           — 오케스트레이터
│   ├── FrameTemplateSelector.tsx
│   ├── FrameCanvas.tsx
│   ├── FrameSlot.tsx
│   └── FrameOptions.tsx
└── lib/
    ├── frameTemplates.ts       — 템플릿 데이터
    └── frameExport.ts          — Canvas 합성 & 다운로드
```

---

## 컴포넌트 설계

### FramePage (오케스트레이터)

`useState`로 모든 상태를 관리한다. 별도 Context 없음.

```ts
interface FrameState {
  templateId: string;                  // 선택된 템플릿 ID
  slotImages: (File | null)[];         // 슬롯별 이미지 (null = 비어 있음)
  options: FrameOptions;
}

interface FrameOptions {
  orientation: 'portrait' | 'landscape'; // 가로/세로 방향 (단일 슬롯 템플릿만)
  gapColor: string;                       // 슬롯 사이 여백 색 (hex)
  gapSize: number;                        // 여백 두께 (px, 0–40)
  borderRadius: number;                   // 슬롯 모서리 둥글기 (px, 0–20)
  borderColor: string;                    // 외곽 테두리 색
  borderWidth: number;                    // 외곽 테두리 두께 (px, 0–10)
}
```

레이아웃: `ConvertPage`/`FilePage`와 동일한 `flex h-full flex-col overflow-hidden` 패턴.  
상단에 `FrameTemplateSelector`(가로 스크롤 pill 바), 나머지 영역에 `FrameCanvas` + `FrameOptions`.

### FrameTemplateSelector

`ConvertToolSelector`와 동일한 가로 스크롤 pill 바 패턴.  
카테고리(포토부스 / 소셜)로 묶어 시각적으로 구분한다.

### FrameCanvas

선택된 템플릿의 슬롯을 CSS Grid로 렌더링.  
비율 유지를 위해 `aspect-ratio` CSS 속성 활용.  
각 슬롯은 `FrameSlot`으로 렌더링.

### FrameSlot

- 비어 있으면: 점선 테두리 + "+" 아이콘 + 클릭 시 `<input type="file" accept="image/*">` 트리거
- 채워져 있으면: `object-fit: cover`로 이미지 표시 + 우상단 ✕ 버튼(슬롯 비우기)
- 슬롯끼리 드래그로 순서 교체: HTML Drag and Drop API (마우스 전용 — 모바일은 클릭 교체만)

### FrameOptions

`FrameCanvas` 우측(데스크탑) 또는 하단(모바일)에 배치.  
컨트롤:
- 방향 토글 (단일 슬롯 템플릿만 활성화)
- 여백 색 color picker (간단한 팔레트 + hex 입력)
- 여백 두께 슬라이더
- 슬롯 모서리 둥글기 슬라이더
- 테두리 색 & 두께

---

## 템플릿 데이터 (`frameTemplates.ts`)

```ts
export interface FrameTemplate {
  id: string;
  labelKey: string;            // i18n 키
  category: 'photobooth' | 'social';
  canvasRatio: [number, number]; // [width, height] 비율
  outputWidth: number;           // 내보내기 실제 픽셀 폭
  grid: {
    cols: number;
    rows: number;
  };
  slots: SlotDef[];
}

export interface SlotDef {
  col: number; row: number;
  colSpan: number; rowSpan: number;
}
```

| id | 라벨 | 슬롯 | 캔버스 비율 | outputWidth |
|---|---|---|---|---|
| `pb-2` | 2컷 | 2 (1×2) | 2:3 | 1200px |
| `pb-4` | 4컷 | 4 (1×4) | 2:3 | 1200px |
| `pb-6` | 6컷 | 6 (2×3) | 2:3 | 1200px |
| `social-story` | 인스타 스토리 | 1 | 9:16 | 1080px |
| `social-feed-sq` | 인스타 피드 정사각 | 1 | 1:1 | 1080px |
| `social-feed-port` | 인스타 피드 세로 | 1 | 4:5 | 1080px |
| `social-yt` | 유튜브 썸네일 | 1 | 16:9 | 1280px |
| `social-tw` | 트위터 포스트 | 1 | 16:9 | 1600px |

---

## 내보내기 로직 (`frameExport.ts`)

1. `outputWidth`와 `canvasRatio`로 `outputHeight` 계산
2. `<canvas>` 생성, `gapColor`로 배경 채우기
3. 각 슬롯: `borderRadius` 클리핑 적용 후 이미지를 `center-crop`으로 그리기
4. 외곽 테두리 그리기 (`borderWidth > 0`일 때)
5. `canvas.toBlob()` → PNG 다운로드

---

## 사용자 플로우

```
템플릿 선택 → 사진 업로드(드롭/클릭) → 슬롯 자동 채우기
→ 슬롯 클릭으로 교체 / ✕로 제거 / 드래그로 순서 변경
→ 옵션 조정 (여백색, 테두리 등)
→ [내보내기] 클릭 → PNG 다운로드
```

---

## i18n

`ko.json` / `en.json`에 `"frame"` 네임스페이스 추가:

```json
"frame": {
  "tab": "프레임",
  "categories": { "photobooth": "포토부스", "social": "소셜" },
  "templates": {
    "pb-2": "2컷", "pb-4": "4컷", "pb-6": "6컷",
    "social-story": "스토리", "social-feed-sq": "피드 정사각",
    "social-feed-port": "피드 세로", "social-yt": "유튜브 썸네일",
    "social-tw": "트위터 포스트"
  },
  "slot": { "empty": "사진 추가", "remove": "제거" },
  "options": {
    "orientation": "방향", "portrait": "세로", "landscape": "가로",
    "gapColor": "여백 색", "gapSize": "여백 크기",
    "borderRadius": "모서리 둥글기", "borderColor": "테두리 색",
    "borderWidth": "테두리 두께"
  },
  "export": "내보내기", "exporting": "처리 중...",
  "empty": "템플릿을 선택해주세요"
}
```

`convert.social` 네임스페이스는 제거한다.
