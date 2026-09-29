# CLAUDE.md

이 리포의 브랜치·커밋 컨벤션.

## 브랜치 네이밍

```
<type>/<kebab-설명>
```

- `type`은 아래 커밋 타입과 동일한 어휘 사용 (`feat`, `fix`, `refactor`, `chore`, `docs`, `build`)
- 설명은 영문 kebab-case, 무엇을 건드리는지 짧고 명확하게
- 랜덤 suffix(`-gsgl0y` 같은) 금지 — 브랜치명만 보고 작업 내용이 파악되게

예시: `fix/map-tab-resize-bug`, `feat/hero-photo-carousel`

## 커밋 메시지

```
type(scope): 한글 요약

(선택) 본문 — 왜 이렇게 바꿨는지, 무엇을 검증했는지
```

- `type`: `feat`(신규 기능) / `fix`(버그·미흡한 동작 수정) / `refactor` / `chore` / `docs` / `build`
- `scope`: 건드리는 영역 (`map`, `cafe-detail`, `api`, `db`, `script`, `a11y` 등) — 기존 커밋 로그의 스코프와 일관되게 유지
- 요약은 한글, 명령형보다는 "무엇을 했는지" 서술
- 본문이 필요할 만큼 복잡한 변경이면 배경/이유를 적되, 코드가 이미 설명하는 내용(무엇을 했는지)은 반복하지 않음
