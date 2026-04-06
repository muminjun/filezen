# 이미지 회전 및 UI 전면 재설계 스펙

**날짜**: 2026-04-06
**담당자**: minjun
**브랜치**: feature/image-rotation-redesign

---

## 1. 개요

현재 filezen 앱의 UI/UX를 전면 재작성한다. 핵심 목표는:

1. **이미지 회전 → ZIP 저장** 플로우를 직관적으로 만든다 (Figma export 느낌)
2. 좌측 drawer로 이미지/파일 기능을 분리한다
3. 갤러리 영역을 최대화하고 업로드 영역을 최소화한다
4. 많은 이미지를 대비해 lazy loading으로 성능을 확보한다

---

## 2. 레이아웃 아키텍처

### 전체 구조

```
┌──────────────────────────────────────────────┐
│  [Drawer 56px] │  [메인 콘텐츠 영역]            │
│                │                              │
│  🖼️ 이미지     │  ┌─────────────────────────┐  │
│  📁 파일       │  │  업로드 스트립 (64px)     │  │
│                │  ├─────────────────────────┤  │
│                │  │                         │  │
│                │  │  이미지 갤러리 (대형)    │  │
│                │  │  lazy loading 적용      │  │
│                │  │                         │  │
│                │  ├─────────────────────────┤  │
│                │  │  하단 액션바 (52px)      │  │
└──────────────────────────────────────────────┘
```

### DrawerLayout 컴포넌트

- 너비: 56px (아이콘 전용, 호버 시 툴팁)
- 항목: 이미지(🖼️), 파일(📁)
- 활성 탭은 파란 배경으로 강조
- 현재 활성 탭 상태를 URL 파라미터 또는 내부 상태로 관리

---

## 3. 이미지 탭 (ImagePage)

### 3-1. 업로드 스트립

- 높이: 64px, 상단 고정
- 드래그 앤 드롭 + 클릭 업로드
- 지원 포맷: PNG, JPEG, WebP, GIF
- 최대 500개 파일, 파일당 최대 50MB
- 파일 추가 시 갤러리에 즉시 반영

### 3-2. ImageGallery

- 메인 콘텐츠 영역 대부분을 차지 (업로드 스트립과 액션바 제외 전체)
- 그리드 레이아웃: 반응형 (기본 4열, 좁은 화면 2열)
- **Lazy loading**: `Intersection Observer` API 사용
  - 뷰포트 진입 시점에 이미지 렌더링
  - 뷰포트 밖 이미지는 placeholder (회색 블록) 표시
  - `rootMargin: "200px"` 으로 약간 미리 로드
- **다중 선택**:
  - 클릭: 단일 선택/해제
  - Shift+클릭: 범위 선택
  - Ctrl/Cmd+클릭: 추가 선택
  - 헤더의 "전체 선택" 체크박스
- 선택된 이미지에 파란 테두리 + 체크 아이콘 표시
- 회전 적용 시 CSS `transform: rotate(Ndeg)` 로 즉시 미리보기
- 각 이미지 카드에 개별 삭제 버튼 (호버 시 표시)

### 3-3. BottomActionBar

하단 고정 바 (높이 52px):

```
[ N개 선택됨 ] | [ ↻ 90° ] [ ↻ 180° ] [ ↻ 270° ] | [ 입력창 °] [적용] | (margin-left: auto) [ ⬇ ZIP 저장 ]
```

- **프리셋 버튼** (90°, 180°, 270°): 클릭 시 선택된 이미지에 즉시 회전 미리보기 적용
- **직접 입력**: 숫자 입력 후 "적용" 버튼 → 미리보기 적용 (0~359 정규화)
- **ZIP 저장 버튼**:
  - 선택된 이미지가 없으면 비활성화
  - 클릭 시 Canvas API로 실제 회전 처리 후 jszip으로 묶어 다운로드
  - 처리 중 로딩 상태 표시 (버튼 스피너)
- 선택된 이미지가 없으면 프리셋 버튼, 직접 입력, ZIP 저장 모두 비활성화

---

## 4. 파일 탭 (FilePage)

- 이번 구현 범위: **플레이스홀더 UI**
- 중앙에 "PDF, 동영상 등 파일 변환 기능 준비 중" 안내 메시지
- 빈 상태 일러스트레이션 또는 아이콘

---

## 5. 상태 관리 (AppContext 재설계)

기존 AppContext를 단순화하여 이미지 회전 플로우에 집중한다.

### 핵심 타입

```typescript
interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;    // ObjectURL (썸네일용)
  rotation: number;      // CSS 미리보기용 누적 회전각 (0~359)
}

interface AppState {
  images: ImageFile[];
  selectedIds: Set<string>;
}
```

### 제공 액션

- `addImages(files: File[])` — 업로드, ObjectURL 생성
- `removeImage(id: string)` — 개별 삭제
- `toggleSelect(id: string)` — 단일 선택 토글
- `rangeSelect(fromId, toId)` — Shift+클릭 범위 선택
- `selectAll()` / `clearSelection()`
- `rotateSelected(degrees: number)` — CSS 미리보기 회전 적용
- `downloadAsZip()` — Canvas 회전 처리 + ZIP 다운로드

---

## 6. 이미지 처리 전략

### 미리보기 (즉시)
- CSS `transform: rotate(Ndeg)` 만 사용
- Canvas 연산 없음 → 즉각적인 반응

### ZIP 저장 시 실제 회전
- 기존 `imageRotation.ts`의 `rotateImageBlob()` 재사용
- Canvas API로 실제 픽셀 회전
- 회전각 0인 이미지는 원본 파일 그대로 포함 (처리 생략)
- 병렬 처리: `Promise.all()` 로 동시 처리 (최대 4개 제한)
- ZIP 파일명: `filezen-rotated-{timestamp}.zip`

---

## 7. 성능 고려사항

- **Lazy loading**: Intersection Observer, rootMargin 200px
- **ObjectURL 관리**: 컴포넌트 언마운트 또는 파일 제거 시 `URL.revokeObjectURL()` 호출
- **ZIP 처리 중 UI 블로킹 방지**: `setTimeout` 또는 마이크로태스크로 처리 분산 (Web Worker는 추후 고려)
- **대용량 파일 경고**: 50MB 초과 파일 업로드 시 에러 표시

---

## 8. 재사용 vs 재작성 범위

| 항목 | 처리 |
|------|------|
| `imageRotation.ts` | **재사용** — Canvas 회전 로직 그대로 |
| `jszip` | **재사용** |
| `next-intl` 설정 | **재사용** — `[locale]` 라우팅 유지 |
| `next-themes` | **재사용** |
| `MainLayout`, `SettingsSidebar` | **제거** |
| `PreviewPanel`, `DownloadManager` | **제거** |
| `usePresets`, `useFavorites`, `useHistory` | **제거** |
| `AppContext` | **재작성** — 단순화 |
| `ImageGallery` | **재작성** — lazy loading 추가 |
| `RotationToolbar` | **제거** → `BottomActionBar`로 대체 |

---

## 9. 컴포넌트 트리

```
app/[locale]/page.tsx
└── DrawerLayout
    ├── Drawer (아이콘 네비게이션)
    └── 활성 탭 콘텐츠
        ├── ImagePage
        │   ├── UploadStrip
        │   ├── ImageGallery
        │   │   └── ImageCard (× N, lazy)
        │   └── BottomActionBar
        └── FilePage (플레이스홀더)
```

---

## 10. 다국어 (i18n)

- next-intl 유지, `[locale]` 라우팅 유지
- 지원 언어: 한국어(ko), 영어(en)
- 새로 추가될 번역 키: 갤러리, 액션바, 파일탭 관련 텍스트
- 기존 번역 파일(`messages/ko.json`, `messages/en.json`) 업데이트

---

## 11. 구현 제외 범위 (이번 feature 브랜치)

- 이미지 포맷 변환 (PNG → WebP 등)
- 리사이즈
- 메타데이터 제거
- Web Worker 기반 병렬 처리
- 파일 탭 실제 기능 (PDF/동영상)
- 서버사이드 처리 (API 라우트)
