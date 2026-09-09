# CLAUDE.md

이 리포에서 작업하는 Claude Code(로컬/클라우드 모두)가 따라야 할 규칙.

## 브랜치 네이밍

```
<type>/<kebab-설명>
```

- `type`은 아래 커밋 타입과 동일한 어휘 사용 (`feat`, `fix`, `refactor`, `chore`, `docs`, `build`)
- 설명은 영문 kebab-case, 무엇을 건드리는지 짧고 명확하게
- `claude/` 프리픽스나 랜덤 suffix(`-gsgl0y` 같은) 금지 — 실무 리포처럼 브랜치명만 보고 작업 내용이 파악되게

예시: `fix/map-tab-resize-bug`, `feat/hero-photo-carousel`, `chore/claude-md-conventions`

## 커밋 메시지

```
type(scope): 한글 요약

(선택) 본문 — 왜 이렇게 바꿨는지, 무엇을 검증했는지
```

- `type`: `feat`(신규 기능) / `fix`(버그·미흡한 동작 수정) / `refactor` / `chore` / `docs` / `build`
- `scope`: 건드리는 영역 (`map`, `cafe-detail`, `api`, `db`, `script`, `a11y` 등) — 기존 커밋 로그의 스코프와 일관되게 유지
- 요약은 한글, 명령형보다는 "무엇을 했는지" 서술
- 본문이 필요할 만큼 복잡한 변경이면 배경/이유를 적되, 코드가 이미 설명하는 내용(무엇을 했는지)은 반복하지 않음

### AI가 쓴 느낌 없이 — 사람 개발자 문체로

- "이번 변경에서는", "~를 수행합니다", "~하였습니다" 같은 번역체/보고체 금지. 실제 개발자가 터미널에서
  빠르게 타이핑한 것처럼: 짧고, 구어체에 가깝고, 결론부터
- 매 커밋마다 배경 → 원인 → 해결 → 검증을 기계적으로 다 채우지 않기. 자명한 변경은 요약 한 줄로 끝내고,
  본문은 진짜 설명이 필요할 때만
- "타입체크/린트 확인했음" 같은 검증 사실은 실제로 확인한 경우에만, 매 커밋 반복 문구로 붙이지 않기
- 과도한 격식·완벽한 문장 구조 대신 기존 커밋 로그 톤(간결한 기술 서술, 축약어, 화살표 `→`, 대시 나열)을 따라감 —
  `git log --oneline`으로 최근 커밋 몇 개를 먼저 훑고 그 문체를 맞출 것
- 이모지, 과장된 수식어("완벽하게", "대폭") 금지

## Attribution

- `.claude/settings.json`에 attribution 비활성화 설정이 있음 — 커밋/PR에 Claude 관련 트레일러를 붙이지 않는 게 이 프로젝트의 방침
- **저자(author) 필드도 마찬가지로 취급.** 클라우드 세션은 현재 커밋 author를 사용자 identity로
  설정할 방법이 없어(Claude Code 자체 기능 공백) `Claude <noreply@anthropic.com>`로 찍힌 채 push됨
- **클라우드 브랜치를 main에 merge하기 전에 반드시 확인**: `git log origin/main..<브랜치> --format="%an <%ae>"`로
  author가 Claude/Anthropic이면, merge 전에 커밋을 재작성해서 author를 지울 것
  - 방법: `origin/main`에서 새 로컬 브랜치를 따서 각 커밋을 `cherry-pick --no-commit` → 기존 커밋 메시지
    그대로 `git commit`(로컬 git config의 사용자 identity로 author/committer가 자동 설정됨) → 반복
  - 재작성 후 원본 클라우드 브랜치에 force-push(또는 동일 커밋으로 main에 fast-forward merge 후 원본
    브랜치 삭제)로 정리
  - 커밋 메시지 본문에 `Claude-Session:` URL이나 `Co-Authored-By: Claude` 같은 줄이 남아있다면 이때 같이 제거
