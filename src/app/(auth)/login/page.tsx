'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Coffee, ChevronDown, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { PATHS } from '@/constants/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ErrorText,
  GuestLink,
  FooterText,
  FooterLink,
} from '../_shared.styles';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
      } else {
        router.push(PATHS.Map);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

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
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Field>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                  />
                  {errors.email && (
                    <ErrorText id="email-error" role="alert">
                      {errors.email.message}
                    </ErrorText>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    {...register('password')}
                  />
                  {errors.password && (
                    <ErrorText id="password-error" role="alert">
                      {errors.password.message}
                    </ErrorText>
                  )}
                </Field>
                <Button type="submit" disabled={loading} fullWidth>
                  {loading ? '로그인 중…' : '로그인'}
                </Button>
              </Form>
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
