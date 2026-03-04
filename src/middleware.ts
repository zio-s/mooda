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

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
