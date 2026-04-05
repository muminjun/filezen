# filezen - 이미지 변환 플랫폼

## 프로젝트 개요
- **목적**: 이미지 일괄 변환, 최적화 및 포맷 변경 서비스
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS, Vercel
- **현재 단계**: Phase 1 - UI 컴포넌트 및 기본 기능 개발

## 하네스 프로그래밍 (Harness Programming) 구조

### 1. 에이전트 시스템
- **Planning Agent**: 기능 설계 및 아키텍처 검토
- **Code Review Agent**: PR 검수 및 품질 확인
- **Testing Agent**: 테스트 작성 및 검증
- **Documentation Agent**: 문서화

### 2. 자동화 Hooks
- **push**: 커밋 전 자동 lint/format 검사
- **task-completion**: 작업 완료 시 검증 프로세스
- **branch-creation**: 새 브랜치 생성 시 메모리 업데이트
- **pr-ready**: PR 생성 전 최종 체크리스트

### 3. 핵심 원칙
- **설정 > 아키텍처**: 필요한 것만 선택적으로 활성화
- **Task-driven**: 모든 작업을 TaskCreate로 추적
- **Memory-first**: 프로젝트 컨텍스트를 메모리에 저장
- **Quality-before-speed**: 검증 > 커밋

## 프로젝트 구조

```
filezen/
├── src/
│   ├── app/              # Next.js 앱 라우터
│   ├── components/       # React 컴포넌트
│   ├── hooks/           # 커스텀 훅
│   ├── context/         # AppContext 등
│   ├── styles/          # 전역 스타일
│   └── utils/           # 유틸리티 함수
├── public/              # 정적 자산
├── .claude/             # 메모리 및 설정
└── package.json
```

## 코딩 규칙

### 파일 및 폴더 네이밍
- 폴더: kebab-case (예: `image-processor`, `ui-components`)
- 컴포넌트: PascalCase (예: `ImageUploader.tsx`)
- 유틸/훅: camelCase (예: `useImageConversion.ts`)

### 컴포넌트 구조
- 함수형 컴포넌트 (React 19)
- Server Components 활용 (가능한 경우)
- TypeScript로 모든 props 타이핑
- 접근성 고려 (ARIA labels, semantic HTML)

### 상태 관리
- AppContext로 전역 상태 관리
- 로컬 상태는 useState 사용
- Custom hooks로 로직 분리

## 개발 워크플로우

### Phase 1 (현재)
1. ✅ UI 컴포넌트 빌드
2. ✅ AppContext 구성
3. ✅ 커스텀 훅 개발
4. 🔄 API 라우트 구현
5. 🔄 이미지 처리 로직
6. 🔄 테스트 및 최적화

### 커밋 전 체크리스트
- [ ] 모든 변경사항 테스트됨
- [ ] TypeScript 에러 없음
- [ ] 불필요한 console.log 제거
- [ ] 함수/컴포넌트 문서화 (필요시)

---

**마지막 업데이트**: 2026-04-05
**담당자**: minjun
