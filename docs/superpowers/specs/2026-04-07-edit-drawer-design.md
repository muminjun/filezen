# Edit Drawer — 크롭 + 색상 조정 통합 기능

**날짜**: 2026-04-07
**담당**: minjun
**브랜치**: feat/enhanced-features-and-seo (현재 브랜치에 추가)

---

## 개요

기존 filezen UI를 유지한 채, `BottomActionBar`에 **편집** 버튼을 추가한다.
클릭 시 우측에서 `EditDrawer`가 슬라이드인 되며, 선택된 이미지들에 대해 **크롭 설정**과 **색상 조정**을 한 화면에서 동시에 처리한다.
완료 시 각 `ImageFile`에 메타값으로 저장되며, 다운로드(ZIP) 시 Canvas API로 실제 반영된다.

---

## 기존 코드 변경 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/types.ts` | `ImageFile`에 `colorAdjustment?`, `cropData?` 추가. 관련 타입 추가. |
| `src/context/AppContext.tsx` | `applyEditToSelected()`, `savedAdjustments`, `recentAdjustments` 추가 |
| `src/lib/imageRotation.ts` | `colorAdjustment`, `cropData` 파라미터 추가 |
| `src/components/image/BottomActionBar.tsx` | **편집** 버튼 추가, `EditDrawer` 연결 |
| `src/messages/en.json`, `ko.json` | 편집 관련 i18n 키 추가 |

**신규 파일:**
- `src/components/image/EditDrawer.tsx` — 드로어 컨테이너
- `src/components/image/editor/CropSection.tsx` — 크롭 UI
- `src/components/image/editor/AdjustSection.tsx` — 색상 조정 UI
- `src/hooks/useEditDrawer.ts` — 드로어 열기/닫기 상태
- `src/hooks/useSavedAdjustments.ts` — localStorage + 쿠키 저장/불러오기
- `src/lib/colorAdjustment.ts` — CSS filter 문자열 계산 유틸

---

## 데이터 모델

```typescript
// 색상 조정 14개 파라미터 (iOS Photos 동일)
export interface ColorAdjustment {
  exposure:   number; // -100 ~ 100
  brilliance: number; // -100 ~ 100
  highlights: number; // -100 ~ 0
  shadows:    number; //    0 ~ 100
  contrast:   number; // -100 ~ 100
  brightness: number; // -100 ~ 100
  blackpoint: number; //    0 ~ 100
  saturation: number; // -100 ~ 100
  vibrance:   number; // -100 ~ 100
  warmth:     number; // -100 ~ 100
  tint:       number; // -100 ~ 100
  sharpness:  number; //    0 ~ 100
  noise:      number; //    0 ~ 100
  vignette:   number; //    0 ~ 100
}

export interface CropData {
  x: number;       // 0.0 ~ 1.0 (비율)
  y: number;
  width: number;
  height: number;
  rotation: number; // 미세 각도 (-45 ~ 45)
  aspectRatio: string | null; // '4:3', '16:9', null(자유)
}

export interface SavedAdjustment {
  id: string;
  name: string;
  adjustment: ColorAdjustment;
  createdAt: number;
}

// ImageFile 에 추가
// colorAdjustment?: ColorAdjustment;
// cropData?: CropData;
```

---

## UI 구조

```
BottomActionBar
  └── [✏️ 편집] 버튼 (선택된 이미지 없으면 비활성)

EditDrawer (우측 슬라이드인, width: 380px)
  ├── Header: [✕] | 편집 / N장에 동일 적용 | [완료]
  ├── Bulk thumbnail strip (선택된 이미지 썸네일)
  ├── ScrollableBody
  │   ├── 이미지 미리보기 (크롭 핸들 + 색상 동시 표시)
  │   ├── 각도 룰러 (드래그로 미세 각도 조정, -45° ~ 45°)
  │   ├── 크롭 컨트롤 행: [↺ 회전] [⇄ 반전] [리셋]  +  비율 프리셋
  │   ├── ── 색상 조정 ── (섹션 구분선)
  │   ├── 선택된 파라미터 이름 + 현재 값 (큰 숫자)
  │   ├── Big Slider (선택된 파라미터 조정)
  │   ├── 아이콘 스트립 (14개, 가로 스크롤)
  │   └── 즐겨찾기 저장 / 최근 사용 / 즐겨찾기 목록
  └── Footer: [이 이미지에만 적용] [선택된 N장 모두에 적용]

backdrop (클릭 시 드로어 닫힘)
```

---

## 색상 조정 → CSS filter 변환

미리보기(실시간)와 실제 export(Canvas) 모두 동일한 CSS filter 문자열 사용.
Canvas 2D API는 `ctx.filter = cssString`을 지원하므로 미리보기 = 출력 결과 보장.

```typescript
// src/lib/colorAdjustment.ts
export function buildCssFilter(adj: ColorAdjustment): string {
  const brightness = 1 + (adj.exposure + adj.brightness) / 100;
  const contrast   = 1 + adj.contrast / 100;
  const saturate   = 1 + (adj.saturation + adj.vibrance * 0.4) / 100;
  const hueRotate  = adj.warmth * 0.3; // warmth → hue-rotate 근사
  const parts = [
    `brightness(${clamp(brightness, 0.05, 3).toFixed(2)})`,
    `contrast(${clamp(contrast, 0.1, 3).toFixed(2)})`,
    `saturate(${clamp(saturate, 0, 3).toFixed(2)})`,
    hueRotate !== 0 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
```

> **참고**: highlights, shadows, blackpoint, sharpness, noise, vignette, tint, brilliance는
> CSS filter만으로 정확히 표현이 불가능하다. Phase 1에서는 CSS 근사값으로 처리하고,
> 추후 Canvas PixelData 조작으로 개선한다.

---

## 저장 전략

### 최근 사용 (자동)
- 적용 시 자동 저장
- `localStorage` key: `filezen_recent_adjustments`
- 최대 5개, 초과 시 가장 오래된 항목 제거
- 쿠키 미사용 (용량 제한)

### 즐겨찾기 (수동)
- 사용자가 이름 입력 후 저장
- `localStorage` key: `filezen_saved_adjustments`
- 쿠키 key: `filezen_saved_adj_ids` (id 목록만, 30일 만료)
  - 쿠키는 다른 기기 동기화 기준값으로 활용, 실제 데이터는 localStorage

### 불러오기
- 앱 초기화 시 `useSavedAdjustments` 훅이 localStorage에서 로드
- 즐겨찾기 칩 클릭 → `ColorAdjustment` 객체를 드로어에 적용

---

## 크롭 데이터 처리

### 미리보기
- CSS `transform: scale / translate`로 크롭 영역 시각화
- 실제 픽셀 처리 없음 (빠른 UX)

### 다운로드 시
- 기존 `rotateImageBlob()` 함수 확장
- `cropData` 존재 시 Canvas에서 `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` 로 크롭 적용
- `colorAdjustment` 존재 시 `ctx.filter = cssFilter` 적용 후 drawImage

### 적용 순서
1. `ctx.filter` 설정 (색상 조정)
2. 회전 변환 (기존 rotation)
3. 크롭 (drawImage source 범위 지정)

---

## AppContext 추가 사항

```typescript
// 새로 추가
applyEditToSelected: (edit: { colorAdjustment?: ColorAdjustment; cropData?: CropData }) => void;
savedAdjustments: SavedAdjustment[];
recentAdjustments: ColorAdjustment[];
saveAdjustment: (name: string, adj: ColorAdjustment) => void;
```

---

## 에러 처리

- 드로어는 선택된 이미지가 없으면 열리지 않음 (버튼 disabled)
- 미리보기 이미지는 첫 번째 선택 이미지 사용, 없으면 placeholder
- Canvas export 실패 시 원본 파일 그대로 ZIP에 포함 (silent fallback)

---

## 범위 외 (이번 스펙 미포함)

- 실제 크롭 핸들 드래그 인터랙션 (Phase 2)
- highlights/shadows/sharpness 등 CSS 미지원 파라미터의 PixelData 처리 (Phase 2)
- 서버 사이드 이미지 처리
