import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check env vars
  results.hasAuthSecret = !!process.env.AUTH_SECRET;
  results.authSecretLength = process.env.AUTH_SECRET?.length ?? 0;
  results.hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  results.hasKakaoClientId = !!process.env.KAKAO_CLIENT_ID;
  results.kakaoClientIdLength = process.env.KAKAO_CLIENT_ID?.length ?? 0;
  results.hasKakaoClientSecret = !!process.env.KAKAO_CLIENT_SECRET;
  results.kakaoClientSecretLength = process.env.KAKAO_CLIENT_SECRET?.length ?? 0;
  results.hasAuthUrl = !!process.env.AUTH_URL;
  results.authUrl = process.env.AUTH_URL;
  results.hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  results.nextAuthUrl = process.env.NEXTAUTH_URL;
  results.hasTrustHost = !!process.env.AUTH_TRUST_HOST;
  results.nodeEnv = process.env.NODE_ENV;

  // Check for hidden characters in env vars
  results.kakaoClientIdHex = process.env.KAKAO_CLIENT_ID
    ? Buffer.from(process.env.KAKAO_CLIENT_ID).toString('hex').slice(-10)
    : null;
  results.kakaoClientSecretHex = process.env.KAKAO_CLIENT_SECRET
    ? Buffer.from(process.env.KAKAO_CLIENT_SECRET).toString('hex').slice(-10)
    : null;

  // Try to initialize NextAuth manually
  try {
    const NextAuth = (await import('next-auth')).default;
    const KakaoProvider = (await import('next-auth/providers/kakao')).default;

    const result = NextAuth({
      trustHost: true,
      session: { strategy: 'jwt' },
      providers: [
        KakaoProvider({
          clientId: process.env.KAKAO_CLIENT_ID!,
          clientSecret: process.env.KAKAO_CLIENT_SECRET!,
        }),
      ],
      callbacks: {
        async jwt({ token, user }) {
          if (user) token.id = user.id;
          return token;
        },
        async session({ session, token }) {
          if (token) session.user.id = token.id as string;
          return session;
        },
      },
    });
    results.nextAuthInit = 'success';
    results.hasHandlers = !!result.handlers;
    results.hasAuth = !!result.auth;
  } catch (e) {
    results.nextAuthInitError = String(e);
  }

  return NextResponse.json(results);
}
