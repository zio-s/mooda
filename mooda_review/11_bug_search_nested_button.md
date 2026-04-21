# 🔴 Critical Bug — `/search` Row 내부 button 중첩 (hydration error)

> **기준 시각**: 2026-04-21, BUG-MAP hotfix 커밋 `5e91180` 직후 콘솔에서 포착
> **영향 범위**: `/search` 최근 본 카페 리스트 (핵심 경로 3/3)
> **심각도**: 🔴 **Critical** — Next.js hydration 에러 + HTML 불법 DOM + a11y 파괴

---

## PART 1 — 증상 & 재현

### Console Error (원문)
```
In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

<button> cannot contain a nested <button>.
```

### 재현
1. `/search` 진입 (최근 본 카페가 1개 이상 있을 때)
2. DevTools Console 열면 즉시 2건의 에러 (hydration + nested button)
3. 브라우저가 DOM 을 정규화하느라 예측 불가한 구조로 뒤틀림 — 최근 카페 리스트 클릭 시 **의도와 다른 순서로 이벤트 발화** 가능성

---

## PART 2 — 원인 진단 (코드 증거)

### 📍 `src/app/search/page.styles.ts:155`
```ts
export const Row = styled.button`
  display: flex;
  ...
`;
```

### 📍 `src/app/search/page.styles.ts:235`
```ts
export const RowRemove = styled.button`
  ...
`;
```

### 📍 `src/app/search/SearchClient.tsx:268-287`
```tsx
<Row key={item.cafeId} onClick={...}>            // ← <button>
  <IconBox>...</IconBox>
  <RowBody>...</RowBody>
  <RowRemove type="button" onClick={...}>        // ← <button> (중첩!)
    <Trash2 size={16} />
  </RowRemove>
</Row>
```

**구조적 결함**: 카드 전체 클릭 영역(Row)을 `<button>` 으로 삼으면서 내부에 삭제 전용 `<button>`(RowRemove)을 넣음. HTML 스펙 상 `<button>` 의 content model 은 [interactive content 금지](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element) — 중첩된 `<button>`·`<a>`·`<input>` 모두 불법.

### 왜 hydration error 가 나는가
- 서버 렌더는 `<button><button/></button>` 문자열 그대로 출력
- 클라이언트가 `DOMParser`/브라우저 파서로 hydrate 할 때 브라우저가 **`<button>` 안의 `<button>` 을 바깥으로 끌어올려 형제로 재배치**
- → React 가 가상 DOM(중첩) 과 실 DOM(형제) 의 불일치 감지 → hydration 경고

---

## PART 3 — 수정 가이드 (Claude Code 실행용)

### T-BUG-SEARCH-01. `Row` 를 `<div role="button">` 로 전환 + 키보드 지원 (40분) — **권장**

구조적으로 "카드 전체 클릭 영역 + 내부 개별 액션" 은 웹에서 매우 흔한 패턴. 네이티브 `<button>` 중첩은 불가하므로 **상위는 `role="button"` 의 `<div>` 로, 내부 액션만 `<button>` 유지**.

#### 파일 1 — `src/app/search/page.styles.ts:155`

```ts
// before
export const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  text-align: left;
  transition: background 0.12s ease;

  &:hover { background: ${theme.colors.ink50}; }
  &:active { background: ${theme.colors.ink100}; }
`;

// after
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s ease;

  &:hover { background: ${theme.colors.ink50}; }
  &:active { background: ${theme.colors.ink100}; }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${theme.colors.primary};
  }
`;
```

**변경 포인트**:
- `styled.button` → `styled.div`
- `text-align: left` 제거 (div 에 불필요)
- `cursor: pointer` + `-webkit-tap-highlight-color: transparent` + `user-select: none` 로 button 감각 복원
- `:focus-visible` inset box-shadow 로 포커스 링 (border-radius 0 에도 안전)

#### 파일 2 — `src/app/search/SearchClient.tsx:269`

```tsx
// before
<Row key={item.cafeId} onClick={() => handleSelectRecent(item)}>

// after
<Row
  key={item.cafeId}
  role="button"
  tabIndex={0}
  onClick={() => handleSelectRecent(item)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectRecent(item);
    }
  }}
>
```

**변경 포인트**:
- `role="button"` — 스크린리더에 버튼으로 인식
- `tabIndex={0}` — Tab 키 포커스 이동 가능
- `onKeyDown` — Enter/Space 키로 활성화. `Space` 는 `preventDefault` 로 스크롤 방지

**동일 처리 필요 여부 확인**: SearchClient 에서 다른 `<Row>` 사용처 전부 동일 패턴 적용.

```bash
grep -n "<Row" src/app/search/SearchClient.tsx
```

#### RowRemove 는 변경 없음
RowRemove 는 그대로 `<button>` 유지 (삭제 버튼은 단일 `<button>` 이 가장 정확).

#### stopPropagation 확인 — 이미 있음 (287 line)
```tsx
onClick={(e) => {
  e.stopPropagation();           // ← OK
  removeRecent(item.cafeId);
}}
```
div(Row) 에서도 onClick 이므로 stopPropagation 여전히 필요. 현 코드 유지.

---

### T-BUG-SEARCH-02. 잠재적 중첩 button 전수 확인 (20분)

본 이슈는 `/search` 에서 포착됐지만, **유사 패턴이 다른 곳에도** 있을 수 있음. 전수 스캔으로 예방.

#### 실행 스크립트
```bash
# styled.button 으로 만든 컴포넌트 전체
grep -rn "styled\.button" src/ --include="*.ts" --include="*.tsx" | head -40

# 해당 컴포넌트 이름을 N 이라고 하면, <N>...<N> 중첩 찾기
# (수동으로 각 컴포넌트별 확인)
```

#### 특히 확인해야 할 후보
- `src/components/cafe/CafeCard.tsx` — `CardLink`(Link/button?) 안에 `FavoriteBtn`(button). **Link(a) 안 button 은 스펙상 불법이지만 브라우저가 허용해서 hydration 에러는 없음** — 본 이슈와 분리된 a11y 채무. 이번 범위 밖.
- `src/components/map/BottomSheet.tsx` — CTA 영역 중첩
- `src/components/filter/MoodFilterSheet.tsx` — TagCell(button) 내부에 Check 아이콘 span. OK (span 은 inline)

확인 결과가 **본 이슈와 동급(button in button)** 이 없다면 T-BUG-SEARCH-02 는 보고서 한 줄 ("0 건 확인") 로 종료.

---

## PART 4 — Definition of Done

### 코드 체크
- [ ] `Row = styled.div` 로 전환, `cursor: pointer` + `:focus-visible` box-shadow 추가
- [ ] SearchClient `<Row>` 에 `role="button"` + `tabIndex={0}` + `onKeyDown` 추가
- [ ] `RowRemove` 는 그대로 `<button>` 유지 (수정 금지)
- [ ] `grep -rn "styled\.button" src/` 로 전수 스캔 + 중첩 button 0 건 확인
- [ ] `pnpm typecheck && pnpm build` 통과

### 수동 QA
- [ ] `/search` 진입 → DevTools Console 에 hydration / nested button 에러 **0 건**
- [ ] 최근 본 카페 Row 클릭 → 상세 이동 동작 정상
- [ ] 최근 본 카페의 Trash 아이콘(RowRemove) 클릭 → **삭제만 동작** (상세 이동 없음) — stopPropagation 유효 확인
- [ ] Tab 키로 Row 포커스 → primary 색 inset outline 표시
- [ ] 포커스된 Row 에서 Enter / Space 키 → 상세 이동
- [ ] 포커스된 Row 에서 Tab → 다음 RowRemove 로 이동 가능
- [ ] iOS Safari 에서 Row tap 시 회색 깜빡임(webkit tap highlight) 없음

### a11y 체크
- [ ] Voice Over / TalkBack 로 Row 탐색 → "버튼, 카페 이름" 형태로 읽힘
- [ ] Row 가 클릭 가능한 영역임을 스크린리더가 인식 (role="button")

---

## PART 5 — 리스크 & 엣지 케이스

### 리스크
1. **Space 키 스크롤 충돌**: div 는 기본적으로 Space 키 누르면 페이지 스크롤. `e.preventDefault()` 로 차단했지만 **Row 밖 focus 상태 에서는 스크롤 정상 동작** 확인 필요
2. **모바일 long-press**: div 는 `<button>` 과 달리 long-press 시 텍스트 선택 메뉴 유발 가능. `user-select: none` 으로 차단
3. **폼 내부 사용 시 submit 회피**: button 이 아니므로 form submit 트리거 안 함 (원래 의도대로)

### 엣지 케이스
- **Row 를 감싸는 부모가 또 button/link 인 경우**: 현재 SearchClient 구조상 Body(div) → Row 로 직접. 문제없음.
- **drag / long-press 로 메뉴 표출 로직 추가 시**: 본 수정과 무관. 추후 별도 PR.

---

## PART 6 — 대안 검토 (참고용, 채택 안 함)

### 대안 A — RowRemove 를 Row 의 형제로 배치
```tsx
<RowWrapper>
  <Row>...</Row>
  <RowRemove>...</RowRemove>
</RowWrapper>
```
- 장점: 양쪽 다 native `<button>`
- 단점: CSS overlay 복잡. RowRemove 가 Row 위에 떠야 하는데 z-index/absolute/pointer-events 복잡 — 유지보수 비용 증가

### 대안 B — RowRemove 를 `<span role="button">` 로
- 단점: button 포커스/스페이스 처리 직접 구현 필요. Row 보다 작은 영역이라 접근성 민감. 비권장

**→ Row 만 div 로 전환하는 방식(PART 3)이 가장 단순**하고 브라우저 기본 동작 보존.

---

## PART 7 — 연관 이슈 · 참고

- BUG-MAP (`10_bug_map_resize.md`) — 독립 이슈. 둘 다 Critical. 순차 처리.
- `06_responsive_qa.md` L6 `:focus-visible` box-shadow 로 교체 — 이미 커밋 `f637075` 에서 전역 적용됨. 본 Row 수정도 같은 패턴 준수.
- Phase 6 범위 밖이었음 — 이모지 제거 작업과 무관한 구조적 HTML 결함. 후속 품질 QA 에서 발견된 건.

---

## 결론 & 권장

- **즉시 처리**. hydration 에러는 production 에서도 Console 로 드러나고, a11y/이벤트 순서 리스크 포함.
- **단일 PR · 2 커밋** 권장:
  1. `fix(search): Row 를 div role=button 으로 전환 — button 중첩 해소 (BUG-SEARCH-01)`
  2. `chore(a11y): styled.button 중첩 전수 스캔 0건 확인 (BUG-SEARCH-02)` — 발견 시 별도 커밋 분리
- **예상 시간**: 1 시간 (테스트 포함).
- **BUG-MAP 과 순서**: BUG-MAP 코드 수정 이미 완료(`5e91180`). 본 BUG-SEARCH 바로 착수 가능.

### README 라우팅
본 문서 작성 직후 `mooda_review/README.md` 의 "🎯 다음 작업" 섹션에서:
- 이전 1순위(BUG-MAP) 완료 처리
- **신규 1순위 (BUG-SEARCH)** 로 이 문서 지시
- 기존 2순위(P7-A) 는 3순위로 강등
