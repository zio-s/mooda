import type { NextAuthConfig } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';

// Edge Runtime 호환 설정 (PrismaAdapter, bcryptjs 제외)
// middleware.ts에서 사용
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ['state'],
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'user';
      }
      return session;
    },
  },
};
