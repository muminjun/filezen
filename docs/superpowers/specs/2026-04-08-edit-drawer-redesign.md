# Edit Drawer Redesign — Design Spec

**Date:** 2026-04-08
**Status:** Approved (mockup confirmed)

---

## 목표

기존 EditDrawer의 UX를 개선한다:
1. 미리보기 중복 제거 → 단일 통합 미리보기
2. 탭 제거 → 비율 + 색상 조정을 단일 스크롤로 통합
3. 크롭 실제 동작 구현 (react-image-crop)
4. 드로어 너비 확장 (화면의 40~45%)
5. 모바일 하단 시트 UX
6. X 버튼 → 변경 사항 폐기 모달

---

## 아키텍처

### 컴포넌트 구조 변경

```
EditDrawer (container)
├── DrawerHeader          ← X버튼(폐기모달), 완료버튼
├── ThumbStrip            ← 선택된 이미지 썸네일
├── PreviewArea           ← 통합 미리보기 (크롭 + 색상필터 동시)
│   └── ReactCrop         ← react-image-crop
└── ControlsScroll        ← 단일 스크롤 영역
    ├── RatioPresets       ← 자유/1:1/3:4/4:3/16:9/9:16
    ├── SectionDivider     ← "색상 조정" 구분선
    ├── AdjustSlider       ← 선택된 파라미터 + 슬라이더
    ├── ParamIconStrip     ← 15개 iOS 순서 아이콘
    └── PresetSection      ← 즐겨찾기 저장/최근 사용
```

**제거:** CropSection 내 미리보기, AdjustSection 내 미리보기, 탭(Tab) UI

---

## 레이아웃

### 데스크탑
- 드로어 너비: `clamp(380px, 45vw, 560px)` (화면의 40~45%)
- 우측에서 슬라이드인 (`translateX`)
- 미리보기 높이: 드로어 높이의 ~44%

### 모바일 (≤ 680px)
- 하단 시트: `position: fixed; bottom: 0; left: 0; right: 0; height: 78vh`
- 상단 드래그 핸들 표시
- 크롭 핸들 크기 확대 (터치 타겟 최소 44px)
- 미리보기 높이: 시트 높이의 ~38%

---

## 기능 상세

### 1. 통합 미리보기
- `<ReactCrop>` 컴포넌트로 이미지 감싸기
- `<img style={{ filter: cssFilter }}>` — 색상 필터와 크롭 오버레이 동시 표시
- 크롭 박스: 8방향 핸들 (4코너 + 4엣지), 마우스/터치 드래그

### 2. 비율 프리셋 (6개)
| 버튼 | aspect |
|------|--------|
| 자유 | null (드래그 자유) |
| 1:1 | 1 |
| 3:4 | 0.75 |
| 4:3 | 1.333 |
| 16:9 | 1.778 |
| 9:16 | 0.5625 |

비율 선택 시: `ReactCrop`의 `aspect` prop 업데이트 + 현재 이미지 중앙 기준 최대 크기로 crop 자동 계산

### 3. 색상 조정 (15개 파라미터, iOS 순서)
노출 → 브릴리언스 → 하이라이트 → 어두운 영역 → 대비 → 밝기 → 검정점 → 채도 → 활기 → 따뜻함 → 색조 → 선명도 → 디테일 → 노이즈 감소 → 비네팅

- 아이콘 스트립 가로 스크롤
- 탭하면 위쪽 대형 슬라이더로 조작
- 값이 0이 아닌 파라미터: 아이콘 우상단에 파란 점 표시

### 4. 변경 사항 폐기 모달
- X 버튼 클릭 시: 변경사항 있으면 모달 표시, 없으면 즉시 닫힘
- 모달 버튼:
  - **변경 사항 폐기** (빨간색) → 초기화 후 드로어 닫힘
  - **계속 편집** → 모달 닫힘, 드로어 유지
- "완료" 버튼: 변경사항 적용 후 닫힘

### 5. 적용 범위 (푸터)
- **이 이미지에만 적용**: 첫 번째 선택 이미지에만
- **N장 모두에 적용**: 선택된 전체 이미지에 동일 적용

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/image/EditDrawer.tsx` | 전체 재구성 — 단일 스크롤, ReactCrop 통합, 모달 |
| `src/components/image/editor/CropSection.tsx` | 미리보기 제거, 비율 버튼만 |
| `src/components/image/editor/AdjustSection.tsx` | 미리보기 제거, 15개 파라미터 (디테일 추가) |
| `src/lib/types.ts` | `ColorAdjustment`에 `definition` 필드 추가 |
| `src/lib/colorAdjustment.ts` | `DEFAULT_ADJUSTMENT`에 `definition: 0` 추가 |
| `src/messages/en.json` | `definition` i18n 키 추가 |
| `src/messages/ko.json` | `definition` i18n 키 추가 |
| `package.json` | `react-image-crop` 추가 |

---

## 스타일

- 드로어 배경: `#1c1c1e`
- 구분선: `#161618` 배경에 `#2a2a2c` 보더
- 모달: `#2c2c2e` 배경, `border-radius: 14px`
- 모바일 시트: `border-radius: 16px 16px 0 0`
- 모든 전환 애니메이션: `cubic-bezier(0.4, 0, 0.2, 1) 300ms`
