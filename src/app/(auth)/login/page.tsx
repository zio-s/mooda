'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PATHS } from '@/constants/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coffee } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageWrapper,
  FormCard,
  CardHeader,
  LogoWrapper,
  CardTitle,
  CardDesc,
  CardBody,
  KakaoButton,
  Divider,
  Form,
  Field,
  ErrorText,
  FooterText,
  FooterLink,
} from './page.styles';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        <CardHeader>
          <LogoWrapper>
            <Coffee size={32} />
          </LogoWrapper>
          <CardTitle>로그인</CardTitle>
          <CardDesc>Mooda에 오신 것을 환영합니다</CardDesc>
        </CardHeader>
        <CardBody>
          <KakaoButton onClick={handleKakaoLogin}>카카오로 로그인</KakaoButton>

          <Divider>또는</Divider>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Field>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                {...register('email')}
              />
              {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            </Field>

            <Field>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
            </Field>

            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form>

          <FooterText>
            계정이 없으신가요?{' '}
            <FooterLink href={PATHS.Signup}>회원가입</FooterLink>
          </FooterText>
        </CardBody>
      </FormCard>
    </PageWrapper>
  );
}
