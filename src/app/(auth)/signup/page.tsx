'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Coffee } from 'lucide-react';
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
  OrDivider,
  Form,
  Field,
  ErrorText,
  FooterText,
  FooterLink,
} from '../_shared.styles';

const schema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
    email: z.string().email('올바른 이메일을 입력해주세요'),
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? '회원가입에 실패했습니다');
        return;
      }

      await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: PATHS.Map,
      });
    } finally {
      setLoading(false);
    }
  }

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

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Field>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <ErrorText id="name-error" role="alert">
                  {errors.name.message}
                </ErrorText>
              )}
            </Field>
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
                autoComplete="new-password"
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
            <Field>
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.passwordConfirm}
                aria-describedby={
                  errors.passwordConfirm ? 'passwordConfirm-error' : undefined
                }
                {...register('passwordConfirm')}
              />
              {errors.passwordConfirm && (
                <ErrorText id="passwordConfirm-error" role="alert">
                  {errors.passwordConfirm.message}
                </ErrorText>
              )}
            </Field>
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? '가입 중…' : '회원가입'}
            </Button>
          </Form>

          <FooterText>
            이미 계정이 있으신가요?{' '}
            <FooterLink href={PATHS.Login}>로그인</FooterLink>
          </FooterText>
        </CardBody>
      </FormCard>
    </PageWrapper>
  );
}
