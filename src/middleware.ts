import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import { PATHS } from '@/constants/paths';

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  // 로그인 필요 페이지
  if (pathname.startsWith('/profile')) {
    if (!session?.user) {
      return NextResponse.redirect(
        new URL(`${PATHS.Login}?callbackUrl=${pathname}`, request.url)
      );
    }
  }

  // 관리자 전용 페이지
  if (pathname.startsWith('/admin')) {
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL(PATHS.Map, request.url));
    }
  }

  return NextResponse.next();
});

/**
 * matcher 범위 정리:
 *  - /profile/:path*  → /profile, /profile/favorites, /profile/collections,
 *                       /profile/collections/[id] 전부 포함 (constants/paths.ts)
 *  - /admin/:path*    → /admin, /admin/cafes, /admin/reports 전부 포함
 *  - /api/*는 각 route handler 내부에서 session 체크 → middleware 미적용.
 *
 * QA v2 § N17에서 제기된 "/favorites, /collections 경로 보호 누락"은 실경로가
 * /profile 하위라 이미 커버됨.
 */
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
