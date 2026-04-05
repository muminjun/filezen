# filezen 개발 워크플로우 가이드

## 📖 목차
1. [상황별 워크플로우](#상황별-워크플로우)
2. [매 작업 기본 흐름](#매-작업-기본-흐름)
3. [Skills 사용 가이드](#skills-사용-가이드)
4. [팁 & 트러블슈팅](#팁--트러블슈팅)

---

## 상황별 워크플로우

### 1. 새 기능 만들 때 ✨

```
시작
  ↓
/superpowers:brainstorming
  • 아이디어, 요구사항, 기술 검토
  • 사용자와 함께 디자인 결정
  ↓
/superpowers:writing-plans
  • 구현 계획 문서 작성
  • 단계별 작업 나열
  ↓
TaskCreate
  • 구현 작업 목록 생성
  • 각 작업에 대한 설명 작성
  ↓
코드 구현
  • 파일 작성/수정
  • hooks가 자동으로 ESLint 실행
  ↓
npm run build && npm run lint
  • 최종 빌드 확인
  • 타입스크립트 에러 확인
  ↓
TaskUpdate (status: completed)
  • 구현 작업 완료 표시
  ↓
/superpowers:verification-before-completion
  • 기능이 제대로 작동하는지 검증
  • 테스트 실행 (있으면)
  ↓
git commit → git push
  • 변경사항 커밋
  • feature 브랜치에 push
  ↓
/superpowers:requesting-code-review
  • PR 생성 요청
  • 코드 리뷰 시작
  ↓
완료 ✅
```

**예시: 이미지 미리보기 기능 추가**
```bash
1. /superpowers:brainstorming
   "Canvas API vs 라이브러리? 최적화 방법?"

2. /superpowers:writing-plans
   "Step 1: ImagePreview 컴포넌트 생성
    Step 2: 이미지 로드 처리
    Step 3: 크기 조정 로직
    Step 4: 에러 처리"

3. TaskCreate
   작업 1: ImagePreview 컴포넌트 생성
   작업 2: 이미지 로드 & 최적화
   작업 3: 에러 핸들링

4. 코딩...

5. /superpowers:verification-before-completion

6. git commit -m "feat: 이미지 미리보기 기능 추가"
```

---

### 2. 버그 수정할 때 🐛

```
버그 발견
  ↓
/superpowers:systematic-debugging
  • 버그 원인 파악
  • 어디서 발생하는지 찾기
  • 로그/콘솔 분석
  ↓
코드 수정 (빠르게!)
  • 버그 수정
  • 최소한의 변경
  ↓
npm run build && npm run lint
  • 빌드 확인
  ↓
/superpowers:verification-before-completion
  • 버그가 정말 고쳐졌는지 확인
  • 같은 버그가 다른 곳에도 있는지 확인
  ↓
git commit -m "fix: [버그 설명]"
  ↓
git push
  ↓
완료 ✅
```

**예시: 이미지 업로드 실패 버그**
```bash
1. /superpowers:systematic-debugging
   "파일 업로드가 50MB 이상일 때 실패"
   → API 타임아웃? 파일 크기 제한?

2. 코드 수정
   "validateFileSize() 함수 추가"

3. /superpowers:verification-before-completion
   "100MB 파일로 테스트 → 작동 확인"

4. git commit -m "fix: 대용량 파일 업로드 타임아웃 해결"
```

---

### 3. 코드 리팩토링할 때 🔧

```
리팩토링 필요 발견
  ↓
/superpowers:writing-plans
  • 리팩토링 범위 정의
  • 변경될 부분 명확히
  • 영향받는 파일 나열
  ↓
TaskCreate
  • 리팩토링 작업 분해
  • 각 파일별 작업
  ↓
/superpowers:executing-plans
  • 계획에 따라 실행
  ↓
npm run build && npm run lint
  • 기능 유지 확인
  ↓
/superpowers:code-reviewer
  • 코드 품질 검토
  • 성능, 가독성 개선 확인
  ↓
git commit -m "refactor: [설명]"
  ↓
완료 ✅
```

**예시: ImageProcessor 함수 분리**
```bash
1. /superpowers:writing-plans
   "Step 1: validateImage 분리
    Step 2: compressImage 분리
    Step 3: 테스트 추가"

2. TaskCreate
   작업 1: 함수 분리
   작업 2: 타입 정의
   작업 3: 테스트

3. 리팩토링...

4. /superpowers:code-reviewer

5. git commit -m "refactor: 이미지 처리 함수 분리"
```

---

### 4. PR 리뷰받을 때 👀

```
PR 피드백 받음
  ↓
/superpowers:receiving-code-review
  • 피드백 분석
  • 기술적 문제 vs 스타일 문제 구분
  ↓
수정 작업 진행
  • 피드백에 따라 코드 수정
  • 설명 추가
  ↓
git commit -m "refactor: PR 피드백 반영"
  ↓
git push
  ↓
PR 업데이트됨
  ↓
완료 ✅
```

---

### 5. 배포할 때 🚀

```
main 브랜치로 merge
  ↓
/vercel:deploy
  (또는 /vercel:deploy prod)
  • 배포 실행
  • 미리보기 URL 생성
  ↓
테스트 (미리보기)
  • 미리보기 환경에서 확인
  • 문제 없으면 프로덕션으로
  ↓
/vercel:status
  • 배포 상태 확인
  • 완료됨 표시
  ↓
완료 🎉
```

---

## 매 작업 기본 흐름

### 🔴 시작할 때

```bash
# 1. 새 브랜치 생성
git checkout -b feature/기능-이름
# 또는
git checkout -b fix/버그-이름

# 2. 작업 목록 생성
/superpowers:brainstorming  (필요시)
/superpowers:writing-plans  (필요시)
TaskCreate                  (항상)

# 3. status 변경
TaskUpdate (status: in_progress)
```

### 🟡 진행할 때

```bash
# 1. 코드 작성
(파일 수정/생성)

# 2. hooks가 자동으로 도움
(PostToolUse 자동 실행 → ESLint 체크)

# 3. 수시로 검증
npm run build
npm run lint
```

### 🟢 끝낼 때

```bash
# 1. 최종 검증
/superpowers:verification-before-completion

# 2. 작업 완료 표시
TaskUpdate (status: completed)

# 3. 커밋
git commit -m "type: 설명"

# 4. Push
git push -u origin feature/xxx

# 5. PR 또는 merge
/superpowers:requesting-code-review
또는
git checkout main && git merge feature/xxx
```

---

## Skills 사용 가이드

### 각 Skill이 뭘 하는가?

| Skill | 언제 써요? | 결과 |
|-------|----------|------|
| `/superpowers:brainstorming` | 새 기능을 어떻게 구현할지 모를 때 | 아이디어, 기술 검토, 디자인 |
| `/superpowers:writing-plans` | 구현 계획을 문서화하고 싶을 때 | 단계별 계획 문서 |
| `/superpowers:executing-plans` | 계획을 실제로 코드로 작성할 때 | 코드 구현 |
| `/superpowers:verification-before-completion` | 작업이 제대로 됐는지 확인하고 싶을 때 | 검증 결과, 테스트 실행 |
| `/superpowers:requesting-code-review` | 코드 리뷰를 받고 싶을 때 | PR 생성, 코드 리뷰 시작 |
| `/superpowers:receiving-code-review` | 리뷰 피드백을 받았을 때 | 피드백 분석, 수정 가이드 |
| `/superpowers:systematic-debugging` | 버그를 찾기 어려울 때 | 버그 원인 파악 |
| `/superpowers:code-reviewer` | 코드 품질을 체크하고 싶을 때 | 코드 리뷰 결과 |

### 자주 쓰는 Skill 조합

#### 새 기능 (풀버전)
```
brainstorming → writing-plans → executing-plans → verification-before-completion
```

#### 새 기능 (간단한)
```
writing-plans → executing-plans → verification-before-completion
```

#### 버그 수정
```
systematic-debugging → (코딩) → verification-before-completion
```

#### 리팩토링
```
writing-plans → executing-plans → code-reviewer
```

---

## 팁 & 트러블슈팅

### 💡 빠른 팁

**Tip 1: hooks가 있으니 Code 저장 후 자동 ESLint 실행**
- 별도로 `npm run lint` 할 필요 없음
- 하지만 빌드 확인은 해야 함

**Tip 2: TaskCreate/TaskUpdate로 진행 상황 추적**
- PR 만들 때 "어떤 작업했는지" 명확함
- 미래의 나를 위해 기록 남기기

**Tip 3: /superpowers:verification-before-completion은 필수**
- 커밋 전에 항상 검증
- 테스트, 빌드, 기능 확인

**Tip 4: 큰 리팩토링은 writing-plans 필수**
- 계획 없이 시작하면 길을 잃음
- 영향받는 파일 먼저 정리

**Tip 5: git commit 메시지는 type 포함**
```
feat: 기능 설명
fix: 버그 설명
refactor: 리팩토링 설명
test: 테스트 추가
docs: 문서화
```

### ❓ FAQ

**Q: 작은 버그는 brainstorming 스킵해도 돼?**
```
A: 네! 버그 수정은:
   systematic-debugging → 수정 → verification
   이렇게 3단계로 빠르게 진행
```

**Q: verification-before-completion은 뭐해?**
```
A: 최종 검증이에요:
   1. npm run build (빌드 성공?)
   2. npm run lint (에러 없음?)
   3. 기능 테스트 (정말 작동?)
   4. 회귀 테스트 (다른 기능 깨뜨림?)
```

**Q: PR을 안 만들고 main으로 바로 merge해도 돼?**
```
A: filezen은 개인 프로젝트니까 괜찮지만,
   PR 만드는 게 좋은 이유:
   - requesting-code-review로 한번 더 확인
   - git history에 기록 남음
   - PR description으로 변경사항 정리
```

**Q: hooks가 안 작동해요**
```
A: 다시 로드해보세요:
   /hooks 메뉴 클릭
   또는 Claude Code 재시작
```

**Q: ESLint 에러가 너무 많아요**
```
A: 한번에 모두 고치려고 하지 말고:
   1. 현재 수정하는 파일만 고치기
   2. 나머지는 별도 리팩토링으로
```

---

## 체크리스트

### 새 기능 만들 때 ✅

- [ ] `/superpowers:brainstorming` 실행
- [ ] `/superpowers:writing-plans` 실행
- [ ] `TaskCreate` 작업 목록 생성
- [ ] `TaskUpdate (in_progress)`
- [ ] 코드 작성
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] `/superpowers:verification-before-completion` 실행
- [ ] `TaskUpdate (completed)`
- [ ] `git commit & git push`
- [ ] `/superpowers:requesting-code-review` (또는 수동 PR)

### 버그 수정할 때 ✅

- [ ] `/superpowers:systematic-debugging` 원인 파악
- [ ] 코드 수정
- [ ] `npm run build` 성공
- [ ] `/superpowers:verification-before-completion` 버그 확인
- [ ] `git commit & git push`

### 배포할 때 ✅

- [ ] main 브랜치 merge
- [ ] `/vercel:deploy` 실행
- [ ] 미리보기 환경에서 테스트
- [ ] 프로덕션 배포
- [ ] `/vercel:status` 확인

---

## 다음 단계

이 문서를 이해했다면:

1. **지금 바로 시작하세요:**
   ```bash
   git checkout -b feature/first-task
   TaskCreate
   /superpowers:brainstorming
   ```

2. **메모리도 함께 읽으세요:**
   - `~/.claude/projects/.../memory/MEMORY.md`
   - 프로젝트 컨텍스트 이해

3. **필요할 때 이 문서 참조:**
   - 새로운 상황? → 상황별 워크플로우 보기
   - Skills 잊음? → Skills 사용 가이드 보기
   - 뭔가 막힘? → FAQ 보기

---

**마지막 조언:**
이 워크플로우는 가이드일 뿐입니다. 필요에 따라 조정해도 됩니다.
하지만 **항상 verification-before-completion은 하세요!** 🚀

---

*작성: 2026-04-05*
*프로젝트: filezen (이미지 변환 플랫폼)*
