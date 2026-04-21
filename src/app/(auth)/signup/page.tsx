'use client';

import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import { Coffee } from 'lucide-react';
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
  OrDivider,
  Form,
  Field,
  FooterText,
  FooterLink,
} from '../_shared.styles';

/**
 * 이메일 회원가입 폼은 lazy-load — react-hook-form + zod + resolver 번들을
 * 초기 paint 이후 async chunk 로 분리. 카카오 단독 가입자는 이 번들을 전혀
 * 받지 않고, 이메일 가입자는 skeleton → 실제 form 교체 (<200ms 체감).
 */
const EmailSignupForm = dynamic(() => import('./EmailSignupForm'), {
  ssr: false,
  loading: () => (
    <Form as="div" aria-busy>
      <Field>
        <Skeleton style={{ height: 18, width: 40, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Field>
        <Skeleton style={{ height: 18, width: 48, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Field>
        <Skeleton style={{ height: 18, width: 60, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Field>
        <Skeleton style={{ height: 18, width: 80, borderRadius: 4 }} />
        <Skeleton style={{ height: 44, borderRadius: 8 }} />
      </Field>
      <Skeleton style={{ height: 44, borderRadius: 8 }} />
    </Form>
  ),
});

export default function SignupPage() {
  async function handleKakaoSignup() {
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
          <CardTitle>Mooda 시작하기</CardTitle>
          <CardDesc>30초면 계정 생성이 완료돼요</CardDesc>
        </CardHeader>

        <CardBody>
          <KakaoButton type="button" onClick={handleKakaoSignup}>
            카카오로 빠르게 가입
          </KakaoButton>

          <OrDivider>또는</OrDivider>

          <EmailSignupForm />

          <FooterText>
            이미 계정이 있으신가요?{' '}
            <FooterLink href={PATHS.Login}>로그인</FooterLink>
          </FooterText>
        </CardBody>
      </FormCard>
    </PageWrapper>
  );
}
