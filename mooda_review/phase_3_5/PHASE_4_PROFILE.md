# Phase 4 — 프로필 리디자인 + 통계 API + Header 조정

> **목표**: 프로필을 "내 카페 허브"로 재설계. Header를 경로별로 조건부화.
> **기간**: 1.5일 (≈ 12시간)
> **선행**: Phase 3 완료 (토큰 클린 상태)

---

## 🎯 DoD (Definition of Done)

- [ ] `/api/users/me/stats` 200 OK, `{ reviewCount, favoriteCount, collectionCount }` 응답
- [ ] `/profile` 렌더 시 3-칸 통계 카드 표시, 각 카드 탭 시 해당 경로로 이동
- [ ] 통계 0일 때 `-` 표시 (아이콘·배경은 유지)
- [ ] Header: `/map`, `/search`, `/cafes/[id]` 경로에서 미렌더
- [ ] Header: 모바일에서 검색 아이콘 버튼 표시, 탭 시 `/search`
- [ ] `pnpm typecheck && pnpm build` 통과

---

## 🧩 작업 목록 (4개)

### T4-1. `/api/users/me/stats` 신설 (2시간)

**파일**: `src/app/api/users/me/stats/route.ts` (신규)

```ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // 3 count 쿼리 병렬
  const [reviewCount, favoriteCount, collectionCount] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  return NextResponse.json(
    { reviewCount, favoriteCount, collectionCount },
    {
      headers: {
        // 캐시 전략: 300초(5분) 동안 CDN 캐시 + revalidate
        'Cache-Control': 'private, max-age=0, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
```

**스키마 확인 필요**:
```bash
grep -E "model (Review|Favorite|Collection)" mooda/prisma/schema.prisma
```
모델명이 다르면 쿼리 조정.

**RTK Query 엔드포인트 추가** — `src/store/api/cafesApi.ts` 또는 신규 `usersApi.ts`:
```ts
getMyStats: builder.query<
  { reviewCount: number; favoriteCount: number; collectionCount: number },
  void
>({
  query: () => '/users/me/stats',
  providesTags: ['MyStats'],
}),
```
`tagTypes`에 `'MyStats'` 추가. 리뷰/즐겨찾기/컬렉션 mutation에 `invalidatesTags: ['MyStats']` 연결.

**커밋**: `feat(api): /api/users/me/stats — 리뷰/즐찾/컬렉션 카운트`

---

### T4-2. ProfilePageClient 재작성 (3시간)

**파일 1**: `src/app/profile/ProfilePageClient.tsx`

**신규 구조**:
```tsx
'use client';

import { Heart, FolderOpen, MessageSquare, ChevronRight, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMyStatsQuery } from '@/store/api/cafesApi'; // or usersApi
import { PATHS } from '@/constants/paths';
import { theme } from '@/styles/theme';
import {
  PageContainer,
  ProfileHeader,
  ProfileIdentity,
  ProfileName,
  ProfileEmail,
  StatsRow,
  StatCard,
  StatValue,
  StatLabel,
  MenuList,
  MenuCard,
  MenuIconBox,
  MenuLabel,
  MenuCount,
  Divider,
  DangerButton,
} from './page.styles';

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function ProfilePageClient({ user }: Props) {
  const { data: stats, isLoading } = useGetMyStatsQuery();

  return (
    <PageContainer>
      <ProfileHeader>
        <Avatar size={72}>
          <AvatarImage src={user.image ?? ''} />
          <AvatarFallback>
            {user.name?.charAt(0) ?? user.email?.charAt(0) ?? 'M'}
          </AvatarFallback>
        </Avatar>
        <ProfileIdentity>
          <ProfileName>{user.name ?? '사용자'}</ProfileName>
          <ProfileEmail>{user.email}</ProfileEmail>
        </ProfileIdentity>
      </ProfileHeader>

      <StatsRow>
        <StatCardLink href={PATHS.Favorites}>
          <StatValue>{isLoading ? <Skeleton style={{ width: 24, height: 20 }} /> : stats?.favoriteCount ?? 0}</StatValue>
          <StatLabel>즐겨찾기</StatLabel>
        </StatCardLink>
        <StatCardLink href={PATHS.Collections}>
          <StatValue>{isLoading ? <Skeleton style={{ width: 24, height: 20 }} /> : stats?.collectionCount ?? 0}</StatValue>
          <StatLabel>컬렉션</StatLabel>
        </StatCardLink>
        <StatCard>
          <StatValue>{isLoading ? <Skeleton style={{ width: 24, height: 20 }} /> : stats?.reviewCount ?? 0}</StatValue>
          <StatLabel>내 리뷰</StatLabel>
        </StatCard>
      </StatsRow>

      <MenuList>
        <MenuCard href={PATHS.Favorites}>
          <MenuIconBox $variant="err"><Heart size={18} /></MenuIconBox>
          <MenuLabel>즐겨찾기</MenuLabel>
          <MenuCount>{stats?.favoriteCount ?? 0}</MenuCount>
          <ChevronRight size={16} color={theme.colors.ink400} />
        </MenuCard>
        <MenuCard href={PATHS.Collections}>
          <MenuIconBox $variant="primary"><FolderOpen size={18} /></MenuIconBox>
          <MenuLabel>컬렉션</MenuLabel>
          <MenuCount>{stats?.collectionCount ?? 0}</MenuCount>
          <ChevronRight size={16} color={theme.colors.ink400} />
        </MenuCard>
      </MenuList>

      <Divider />

      <DangerButton onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut size={16} />
        로그아웃
      </DangerButton>
    </PageContainer>
  );
}
```

**파일 2**: `src/app/profile/page.styles.ts` — 스타일 확장

(StatsRow / StatCard / StatCardLink / StatValue / StatLabel / MenuIconBox / MenuCount / DangerButton 추가)

```ts
// 핵심 추가 분만 요약
export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.space[2]};
  margin-bottom: ${theme.space[6]};
`;

export const StatCardBase = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${theme.space[4]} ${theme.space[2]};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  text-decoration: none;
  transition: transform 0.1s ease, box-shadow 0.15s ease;

  &:hover { box-shadow: ${theme.shadows.sm}; }
  &:active { transform: scale(0.98); }
`;

export const StatCard = styled.div` ${StatCardBase} `;
export const StatCardLink = styled(Link)` ${StatCardBase} `;

export const StatValue = styled.span`
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
`;
export const StatLabel = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.ink500};
`;

export const MenuIconBox = styled.span<{ $variant: 'primary' | 'err' }>`
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $variant }) =>
    $variant === 'err' ? theme.colors.errBg : theme.colors.primaryLight};
  color: ${({ $variant }) =>
    $variant === 'err' ? theme.colors.err : theme.colors.primary};
`;

export const MenuCount = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
  font-variant-numeric: tabular-nums;
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${theme.colors.border};
  margin: ${theme.space[5]} 0;
`;

export const DangerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.err};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};

  &:hover { background: ${theme.colors.errBg}; }
`;
```

**수동 QA**:
- 로그인 상태에서 `/profile` 접근 → 3-칸 통계 카드 렌더
- 카카오 사용자(이미지 있음) 아바타 정상
- 신규 계정(스탯 0) → "0" 표시
- 즐겨찾기 추가 → 다시 프로필 돌아오면 `favoriteCount` +1 (RTK invalidate 동작)

**커밋**: `feat(profile): 통계 허브 리디자인 + StatCard + DangerButton`

---

### T4-3. Header 경로별 숨김 + 모바일 검색 진입점 (2시간)

**파일**: `src/components/layout/Header.tsx`

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { Search, Map, Coffee } from 'lucide-react';
...

// Header가 숨겨져야 하는 경로
const IMMERSIVE_PATHS = ['/map', '/search'];

function shouldHideHeader(pathname: string): boolean {
  if (IMMERSIVE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // 카페 상세도 자체 뒤로가기 헤더 있음
  if (pathname.startsWith('/cafes/')) return true;
  return false;
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (shouldHideHeader(pathname)) return null;

  return (
    <HeaderWrapper>
      <HeaderInner>
        <Logo href={PATHS.Home}>
          <Coffee size={18} />
          Mooda
        </Logo>

        <Nav>
          <NavLink href={PATHS.Map} $active={pathname.startsWith('/map')}>
            <Map size={15} />
            <span>지도 검색</span>
          </NavLink>
        </Nav>

        <HeaderRight>
          {/* 모바일 검색 아이콘 */}
          <SearchIconLink href={PATHS.Search} aria-label="검색">
            <Search size={18} />
          </SearchIconLink>

          {session ? ( ...기존... ) : ( ...기존... )}
        </HeaderRight>
      </HeaderInner>
    </HeaderWrapper>
  );
}
```

**파일 2**: `src/components/layout/Header.styles.ts` — 신규 스타일
```ts
export const SearchIconLink = styled(Link)`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.ink700};

  &:hover {
    background: ${theme.colors.ink100};
  }

  /* 데스크톱: Nav에 이미 "지도 검색" 있고 /search는 검색 전용 페이지 —
     아이콘은 mobile에서만 노출 */
  @media (min-width: ${theme.breakpoints.sm}) {
    display: none;
  }
`;
```

**파일 3**: `src/constants/paths.ts` — PATHS에 Search 없으면 추가
```ts
export const PATHS = {
  ...
  Search: '/search',
  ...
};
```

**수동 QA**:
- `/` 홈 → Header 보임 (검색 아이콘 mobile에서만)
- `/map` → Header 사라짐 (MapClient 내부 툴바만)
- `/search` → Header 사라짐
- `/cafes/abc` → Header 사라짐
- `/profile` → Header 보임
- 데스크톱: 검색 아이콘 미표시, Nav의 "지도 검색"만 노출

**커밋**: `feat(layout): Header 경로별 숨김 + 모바일 검색 진입점`

---

### T4-4. 회귀 QA + 문서 업데이트 (1시간)

**회귀 경로** (전부 동작 확인):
1. `/` → 로그인 버튼 → `/login` → 로그인 → `/map`
2. `/profile` → 통계 카드 → 즐겨찾기 → 다시 프로필 → 숫자 동기화
3. `/map` → 카페 탭 → 바텀시트 → Android 뒤로 → 닫힘
4. `/search` → 한글 2자 → Enter → 상세
5. `/cafes/[id]` → 갤러리 → ESC → 닫힘

**문서**: `mooda_review/08_next_iteration_v3.md` 하단에 "Phase 4 완료 ✅" 섹션 추가:
```md
## Phase 4 완료 (YYYY-MM-DD)
- /api/users/me/stats 신설
- ProfilePageClient 통계 허브화
- Header 조건부 렌더 + 모바일 검색 진입점
- 회귀 QA 5경로 통과
```

**커밋**: `docs: Phase 4 완료 기록`

---

## 🤔 판단 필요 시

- **ReviewCount 스키마 이름**: `prisma.review` vs `prisma.reviews` — schema.prisma 확인 후
- **통계 캐시 정책**: 5분(`s-maxage=300`)이 적절한지 — 즐겨찾기 추가 직후 반영 빠르게 원하면 0으로 낮추고 invalidateTags에 의존
- **내 리뷰 페이지**: T4-2에서 `내 리뷰` StatCard는 현재 Link 아님 — 별도 페이지(`/profile/reviews`)가 필요한지는 본 Phase 범위 밖. 다음 Phase 또는 추후.

---

**Phase 4 종료 조건**: DoD 전부 체크 + 커밋 4개 push → Phase 5로.
