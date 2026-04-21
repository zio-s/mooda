'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import { Coffee, ChevronDown, Mail, MapPin } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PageWrapper,
  FormCard,
  BrandBand,
  CardHeader,
  LogoWrapper,
  CardTitle,
  CardDesc,
  CardBody,
  KakaoButton,
  EmailToggle,
  EmailPanel,
  Form,
  Field,
  GuestLink,
  FooterText,
  FooterLink,
} from '../_shared.styles';

/**
 * 이메일 로그인 폼은 lazy-load — react-hook-form + zod + resolver 번들을
 * "이메일로 시작하기" 토글이 열리는 시점까지 연기해서 초기 paint 를 단축.
 * 카카오 단독 사용자는 이 번들을 전혀 받지 않는다.
 */
const EmailLoginForm = dynamic(() => import('./EmailLoginForm'), {
  ssr: false,
  loading: () => (
    <Form as="div" aria-busy>
      <Field>
        <Skeleton style={{ height: 18, width: 48, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Field>
        <Skeleton style={{ height: 18, width: 60, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Skeleton style={{ height: 44, borderRadius: 8 }} />
    </Form>
  ),
});

export default function LoginPage() {
  const [emailOpen, setEmailOpen] = useState(false);

  async function handleKakaoLogin() {
    await signIn('kakao', { callbackUrl: PATHS.Map });
  }

  return (
    <PageWrapper>
      <FormCard>
        <BrandBand />
        <CardHeader>
          <LogoWrapper aria-hidden>
            <Coffee size={28} />
          </LogoWrapper>
          <CardTitle>Mooda에 오신 걸 환영해요</CardTitle>
          <CardDesc>분위기로 찾는 나만의 카페</CardDesc>
        </CardHeader>

        <CardBody>
          <KakaoButton type="button" onClick={handleKakaoLogin}>
            카카오로 시작하기
          </KakaoButton>

          <EmailToggle
            type="button"
            onClick={() => setEmailOpen((v) => !v)}
            aria-expanded={emailOpen}
            aria-controls="email-login-panel"
          >
            <Mail size={15} aria-hidden />
            이메일로 시작하기
            <ChevronDown
              size={15}
              aria-hidden
              style={{
                transform: emailOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </EmailToggle>

          {emailOpen && (
            <EmailPanel id="email-login-panel">
              <EmailLoginForm />
            </EmailPanel>
          )}

          <GuestLink href={PATHS.Map}>
            <MapPin size={14} aria-hidden />
            둘러보기 (비로그인)
          </GuestLink>

          <FooterText>
            계정이 없으신가요?{' '}
            <FooterLink href={PATHS.Signup}>회원가입</FooterLink>
          </FooterText>
        </CardBody>
      </FormCard>
    </PageWrapper>
  );
}
