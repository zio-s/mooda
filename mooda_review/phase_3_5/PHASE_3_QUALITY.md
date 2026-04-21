# Phase 3 — 품질 수렴 (토큰 잔여물 + Polish)

> **목표**: 디자인 토큰 밖 하드코딩 제거, 작은 UX 홈. **새 기능 없음.**
> **기간**: 1일 (≈ 8시간)
> **PR 전략**: 작업별 커밋 8개. 하나의 PR로 묶어도 OK.

---

## 🎯 DoD (Definition of Done)

Phase 3 끝나면 아래가 모두 통과해야 합니다.

```bash
# 1. 하드코딩 컬러 남은 것 없음 (theme.ts 제외)
git grep -n "#d97706\|#ef4444\|#9ca3af\|#d1d5db\|#fbbf24\|#f59e0b" \
  src/ ':!src/styles/theme.ts'
# 기대: 0건 (또는 주석으로만 남은 것)

# 2. 타입/빌드 통과
pnpm typecheck
pnpm build
```

**수동 체크**:
- [ ] `/profile`, `/profile/favorites`, `/profile/collections` 렌더 시 아이콘 색이 amber-700 통일
- [ ] InstallPrompt가 `/` 와 `/profile` 에서만 노출, `/map`·`/cafes/[id]`에서는 미노출
- [ ] 로그인 페이지 divider 텍스트가 진해져 읽기 쉬움
- [ ] MenuCard 탭 시 `:active` 축소(scale 0.99) 피드백 확인

---

## 🧩 작업 목록 (8개)

### T3-1. 프로필 페이지 하드코딩 색 제거 (30분)

**파일**: `src/app/profile/ProfilePageClient.tsx`

**수정 전 (line 42-49)**:
```tsx
<Heart size={20} color="#ef4444" />
<MenuLabel>즐겨찾기</MenuLabel>
<ChevronRight size={16} color="#9ca3af" />
...
<FolderOpen size={20} color="#d97706" />
<MenuLabel>컬렉션</MenuLabel>
<ChevronRight size={16} color="#9ca3af" />
```

**수정 후**:
```tsx
import { theme } from '@/styles/theme';
...
<Heart size={20} color={theme.colors.err} />
<MenuLabel>즐겨찾기</MenuLabel>
<ChevronRight size={16} color={theme.colors.ink400} />
...
<FolderOpen size={20} color={theme.colors.primary} />
<MenuLabel>컬렉션</MenuLabel>
<ChevronRight size={16} color={theme.colors.ink400} />
```

**커밋**: `fix(profile): theme 토큰으로 아이콘 색 통일 — amber-700 / ink400 / err`

---

### T3-2. Favorites · Collections 페이지 하드코딩 색 제거 (30분)

**파일 1**: `src/app/profile/favorites/page.tsx:36`
```tsx
// before
<Heart size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
// after
<Heart size={40} color={theme.colors.ink300} style={{ margin: '0 auto 12px' }} />
```

**파일 2**: `src/app/profile/collections/CollectionsPageClient.tsx:47, 55, 70, 75`
```tsx
// line 47
<FolderOpen size={40} color={theme.colors.ink400} ... />
// line 55 (컬렉션 카드 border)
border: `1.5px solid ${theme.colors.primary}`,
// line 70
<FolderOpen size={20} color={theme.colors.primary} />
// line 75
<ChevronRight size={16} color={theme.colors.ink400} />
```

**커밋**: `fix(profile): favorites/collections 아이콘 색 theme 토큰화`

---

### T3-3. CafeCard · CafeDetail 잔여 하드코딩 제거 (45분)

**파일 1**: `src/components/cafe/CafeCard.tsx:184-185`
```tsx
// before
fill={isFavorited ? '#ef4444' : 'none'}
color={isFavorited ? '#ef4444' : 'currentColor'}
// after
fill={isFavorited ? theme.colors.err : 'none'}
color={isFavorited ? theme.colors.err : 'currentColor'}
```

**파일 2**: `src/app/cafes/[id]/CafeDetailClient.tsx` (여러 지점)
- line 378: `fill={isFav ? theme.colors.err : 'none'}`
- line 480, 485, 490, 501: `color={theme.colors.ink400}` (지금 `#9ca3af`)
- line 566, 665: `color={i < review.rating ? theme.colors.warn : theme.colors.ink300}` (별점) — **주의**: `#fbbf24`는 amber-400이라 `theme.colors.warn`(#b45309)와 톤 다름. **새 토큰 추가 권장**:

**파일 3**: `src/styles/theme.ts` — star 색 토큰 추가
```ts
// colors 안에
star: '#f59e0b',        // amber-500 (별점 전용 — 본문 warn과 구분)
starEmpty: '#e7e5e4',   // = ink200
```

그 다음 CafeDetailClient:
```tsx
color={i < review.rating ? theme.colors.star : theme.colors.starEmpty}
```

**파일 4**: `src/app/cafes/[id]/CafeDetailClient.tsx:650` — 리뷰 카드 placeholder
```tsx
// before
fontSize: 14, color: '#9ca3af', background: '#f3f4f6',
// after
fontSize: 14, color: theme.colors.ink400, background: theme.colors.ink100,
```

**파일 5**: `src/app/cafes/[id]/CafeDetail.styles.ts:101`
```ts
// before
color: ${({ $active }) => ($active ? '#ef4444' : theme.colors.ink900)};
// after
color: ${({ $active }) => ($active ? theme.colors.err : theme.colors.ink900)};
```

**커밋**: `fix(cafe): CafeCard/CafeDetail 아이콘·별점 토큰화 + star 토큰 추가`

---

### T3-4. StarRatingInput + RouteDetail 토큰화 (15분)

**파일 1**: `src/components/ui/StarRatingInput.tsx:48`
```ts
// before
color: ${({ $filled }) => ($filled ? '#fbbf24' : '#d1d5db')};
// after
color: ${({ $filled }) => ($filled ? theme.colors.star : theme.colors.starEmpty)};
```

**파일 2**: `src/components/map/RouteDetail.tsx:152`
```tsx
<StepIcon $color={theme.colors.ink400}>
```

**커밋**: `fix(ui): StarRatingInput + RouteDetail 토큰화`

---

### T3-5. InstallPrompt 그라데이션 + 경로별 노출 (30분)

**파일**: `src/components/pwa/InstallPrompt.tsx`

**(a) 그라데이션 토큰화** (line 142):
```ts
// before
background: linear-gradient(135deg, #d97706, #f59e0b);
// after
background: linear-gradient(135deg, ${theme.colors.primary}, #d97706);
```

**(b) 경로별 노출 제한** — `InstallPrompt` 컴포넌트 상단에 pathname 체크:
```tsx
'use client';
import { usePathname } from 'next/navigation';
...
export function InstallPrompt() {
  const pathname = usePathname();
  const allowedPaths = ['/', '/profile'];
  const isAllowed = allowedPaths.includes(pathname);
  ...
  // 기존 조건 앞에
  if (!isAllowed) return null;
  if (dismissed) return null;
  ...
}
```

**(c) BannerIcon 이모지 → 브랜드 아이콘** (line 65, 91):
```tsx
// before
<BannerIcon>☕</BannerIcon>
// after
<BannerIcon>
  <Coffee size={22} color={theme.colors.white} />
</BannerIcon>
```
`BannerIcon` styled 수정:
```ts
const BannerIcon = styled.span`
  ...
  background: linear-gradient(135deg, ${theme.colors.primary}, #d97706);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
```

**커밋**: `fix(pwa): InstallPrompt 토큰화 + 경로 제한 + Coffee 아이콘`

---

### T3-6. page.styles.ts + error.tsx 전역 잔여물 (15분)

**파일 1**: `src/app/page.styles.ts:76`
```ts
// before
background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
// after
background: linear-gradient(135deg, ${theme.colors.primary} 0%, #d97706 100%);
```

**파일 2**: `src/app/error.tsx:25`, `src/app/cafes/[id]/error.tsx:28`
```ts
// before
background: '#d97706', color: 'white', border: 'none',
// after
background: theme.colors.primary, color: theme.colors.white, border: 'none',
```

**파일 3**: `src/app/admin/AdminPageClient.tsx:24`
```ts
// before
cafe: '#d97706',
// after
cafe: '#b45309',   // = theme.colors.primary. (styled-components 아님이면 하드코딩 허용)
```
→ 만약 `theme` import 가능하면 토큰 사용.

**커밋**: `fix(a11y): 홈/에러/관리자 잔여 하드코딩 토큰화`

---

### T3-7. MenuCard active 상태 + Divider 대비 (30분)

**파일 1**: `src/app/profile/page.styles.ts` — `MenuCard`에 `:active` 추가
```ts
export const MenuCard = styled(Link)`
  ...
  transition: box-shadow 0.2s ease, transform 0.1s ease, background 0.1s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }

  &:active {
    transform: scale(0.99);
    background: ${theme.colors.ink50};
  }
`;
```

**파일 2**: `src/app/(auth)/login/page.styles.ts` — `Divider` 텍스트 색 진하게
```ts
export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${theme.colors.ink700};  // ← was textMuted (ink500)
  font-size: ${theme.fontSize.xs};
  ...
```

**파일 3**: `src/app/(auth)/signup/page.styles.ts` — 같은 수정 적용 (동일한 divider 있는지 확인 후)

**커밋**: `fix(ui): MenuCard active 피드백 + Divider 대비 개선 (WCAG AA)`

---

### T3-8. QA v2 백로그 처리 — N8 autocomplete + N15/N16 (30분)

**N8 ReviewForm autocomplete**:
파일: `src/components/review/ReviewForm.tsx`
```tsx
<Textarea
  id="review-content"
  {...register('content')}
  autoComplete="off"
  autoCorrect="off"
  spellCheck={false}
  ...
/>
```

**N15 Separator margin** — 화면 보고 너무 바짝 붙은 곳 있으면 margin 조정. `grep "Separator" src/app/cafes/[id]` 결과 확인 후 판단.

**N16 OptionalText 대비** — `grep OptionalText` 해서 현 색이 `ink400`(#a8a29e)면 `ink500`(#78716c)로 상향.
파일: `src/components/review/ReviewForm.styles.ts` + `src/components/collection/CreateCollectionDialog.styles.ts`

**커밋**: `fix(form): autocomplete off + OptionalText 대비 개선`

---

## 🔍 Phase 3 검증 스크립트

작업 완료 후 루트에서:

```bash
# 1. 하드코딩 컬러 확인
git grep -nE "#(d97706|ef4444|9ca3af|d1d5db|fbbf24|f59e0b|f3f4f6)" \
  src/ ':!src/styles/theme.ts' ':!*/_*'

# 2. 빌드
pnpm typecheck && pnpm build

# 3. 개발 서버 띄우고 수동 QA
pnpm dev
# → 위 DoD 체크리스트 수행
```

**남아도 되는 것**:
- `#d97706` — theme.ts 주석(`// was #d97706`), InstallPrompt/page.styles.ts/BannerIcon 그라데이션 2번째 색(정상 디자인 의도)

---

## 🤔 판단 필요 시

- **T3-3 별점 색**: `#fbbf24`(amber-400)가 기존 느낌 유지 vs `theme.colors.warn`(amber-700)으로 완전 통일 중 선택. → **권장**: 별점 전용 `star` 토큰 추가 (본 가이드 기준)
- **T3-5 InstallPrompt 노출 경로**: `/`, `/profile` 외에 `/profile/*` 도 포함할지 → **권장**: `pathname === '/' || pathname.startsWith('/profile')`
- **T3-7 Divider**: signup에 Divider 없으면 스킵

---

**Phase 3 종료 조건**: DoD 전부 체크 + 커밋 8개 push + 빌드 통과 → Phase 4로.
