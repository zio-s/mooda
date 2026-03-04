import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import KakaoProvider from 'next-auth/providers/kakao';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from './auth.config';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ['state'],
      profile(profile) {
        const kakaoAccount = (profile as { kakao_account?: { email?: string; profile?: { nickname?: string; profile_image_url?: string } } }).kakao_account;
        const email = kakaoAccount?.email ?? `kakao_${profile.id}@mooda.local`;
        return {
          id: String(profile.id),
          name: kakaoAccount?.profile?.nickname ?? null,
          email,
          image: kakaoAccount?.profile?.profile_image_url ?? null,
        };
      },
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'kakao' && user.email) {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email } });
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
              },
            });
          }
        } catch (e) {
          console.error('Failed to upsert kakao user:', e);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      if (account?.provider === 'kakao' && user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
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
});
