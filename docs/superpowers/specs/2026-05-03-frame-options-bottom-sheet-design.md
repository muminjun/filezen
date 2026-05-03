# 프레임 옵션 바텀시트 (모바일) 디자인 스펙

**날짜**: 2026-05-03
**담당자**: minjun

---

## 개요

모바일 UI에서 프레임 탭의 옵션 패널(`FrameOptions`)을 드래그로 높이 조절 가능한 바텀시트로 교체한다. 데스크탑(sm: 이상)은 기존 우측 사이드바를 유지한다.

---

## 아키텍처

### 레이아웃 변화

**모바일 (`< sm`)**
```
[FrameTemplateSelector]   ← 변경 없음
[FrameCanvas]             ← 캔버스, 바텀시트 높이만큼 bottom padding
[FrameOptionsSheet]       ← 신규: vaul Drawer (바텀시트)
```

**데스크탑 (`sm:`)**
```
[FrameTemplateSelector]   ← 변경 없음
[FrameCanvas] | [FrameOptions sidebar + 내보내기 버튼]  ← 변경 없음
```

### 조건부 렌더링

`FramePage.tsx`에서 `useIsMobile()` 훅 또는 CSS 조건(hidden/block)으로 분기:
- 모바일: `<FrameOptionsSheet>` 렌더링
- 데스크탑: 기존 사이드바 `div` 유지

---

## 신규 컴포넌트: `FrameOptionsSheet`

**경로**: `src/components/frame/FrameOptionsSheet.tsx`

### Snap Points

| 이름 | 비율 | 설명 |
|------|------|------|
| 닫힘 | `0.12` | 핸들바 + 내보내기 버튼만 노출 |
| Peek (기본) | `0.45` | 갭 색상, 갭 크기 등 주요 옵션 절반 노출 |
| 전체 | `0.88` | 전체 옵션 스크롤 가능 |

- `defaultSnap`: `0.45`
- `snapPoints`: `[0.12, 0.45, 0.88]`

### 구조

```
<Drawer.Root snapPoints fadeFromIndex>
  <Drawer.Portal>
    <Drawer.Overlay />          ← 반투명 backdrop (선택적)
    <Drawer.Content>
      <div handle-bar />        ← 드래그 핸들 (가로 바)
      <내보내기 버튼 />          ← 항상 상단에 고정 노출
      <ScrollArea>
        <FrameOptions ... />    ← 기존 컴포넌트 그대로 재사용
      </ScrollArea>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### Props

`FrameOptions`의 모든 props를 그대로 pass-through + `isExporting`, `onExport` 추가:

```ts
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
```

---

## FramePage.tsx 변경사항

1. `FrameOptionsSheet` import 추가
2. 내보내기 버튼 렌더링 로직을 `isExporting` / `handleExport` 그대로 유지, sheet에 전달
3. 사이드바 div에 `hidden sm:flex` 적용 (데스크탑 전용)
4. 바텀시트 div에 `sm:hidden` 적용 (모바일 전용)
5. 캔버스 영역 — 바텀시트가 peek 상태일 때 가려지지 않도록 `pb-[45vh]` 또는 `pb-safe` 처리

---

## 의존성 추가

```bash
npm install vaul
```

- `vaul`: ~20KB, shadcn/ui 공식 drawer 라이브러리

---

## 스타일 & UX

- 핸들바: `w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-2`
- 시트 배경: `bg-card` (기존 사이드바와 동일)
- 내보내기 버튼: 핸들 바로 아래, 시트 상단에 `px-4 pt-2 pb-3` 고정
- `FrameOptions` 영역: 내보내기 버튼 아래 overflow-y-auto 스크롤 가능

---

## 변경되지 않는 것

- `FrameOptions.tsx` — 변경 없음
- `GridEditor.tsx` — 변경 없음
- `FrameCanvas.tsx` — 변경 없음
- 데스크탑 레이아웃 — 변경 없음

---

## 구현 범위

- feat 브랜치에서 작업
- 모바일(`< sm`) 전용
- vaul 라이브러리 설치
- `FrameOptionsSheet.tsx` 신규 생성
- `FramePage.tsx` 조건부 분기 수정
