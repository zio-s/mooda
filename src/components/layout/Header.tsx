'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Map, Coffee, Search } from 'lucide-react';
import {
  HeaderWrapper,
  HeaderInner,
  Logo,
  Nav,
  NavLink,
  HeaderRight,
  AvatarButton,
  MenuLink,
  AuthLink,
  SearchIconLink,
  SignupWrapper,
} from './Header.styles';

/**
 * Phase 7-B 에서 Phase 4 의 "몰입 경로(Header 전면 숨김)" 결정을 철회.
 * 홈 복귀 경로 + 브랜드 앵커는 모든 뷰포트 필수라는 판단.
 * 대신 Header 높이를 56 → 48 로 축소해 세로 공간 손실 최소화.
 * /search 만 자체 전용 상단 UI(검색 input + 뒤로가기) 를 가지므로 계속 숨김.
 */
const HIDDEN_PREFIXES = ['/search'];
function shouldHideHeader(pathname: string): boolean {
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (shouldHideHeader(pathname)) return null;

  return (
    <HeaderWrapper>
      <HeaderInner>
        <Logo href={PATHS.Home}>
          <Coffee size={18} />
          Mooda
        </Logo>

        <Nav>
          <NavLink
            href={PATHS.Map}
            $active={pathname === PATHS.Map || pathname.startsWith('/map')}
          >
            <Map size={15} />
            {/* 모바일에서는 아이콘만, sm 이상에서 텍스트 표시 */}
            <span>지도 검색</span>
          </NavLink>
        </Nav>

        <HeaderRight>
          {/* 모바일 전용 검색 진입점 — 데스크톱은 Nav의 '지도 검색'으로 대체. */}
          <SearchIconLink href={PATHS.Search} aria-label="검색">
            <Search size={18} />
          </SearchIconLink>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AvatarButton>
                  <Avatar size={32}>
                    <AvatarImage src={session.user.image ?? ''} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) ?? session.user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </AvatarButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <MenuLink href={PATHS.Profile}>내 프로필</MenuLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <MenuLink href={PATHS.Favorites}>즐겨찾기</MenuLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <MenuLink href={PATHS.Collections}>컬렉션</MenuLink>
                </DropdownMenuItem>
                {session.user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <MenuLink href={PATHS.Admin}>관리자</MenuLink>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  danger
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm">
                <AuthLink href={PATHS.Login}>로그인</AuthLink>
              </Button>
              {/* 모바일에서 숨김 — 로그인 페이지에 회원가입 링크 있음 */}
              <SignupWrapper>
                <Button size="sm">
                  <AuthLink href={PATHS.Signup}>회원가입</AuthLink>
                </Button>
              </SignupWrapper>
            </>
          )}
        </HeaderRight>
      </HeaderInner>
    </HeaderWrapper>
  );
}
