'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PATHS } from '@/constants/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Field, ErrorText } from '../_shared.styles';

/**
 * 이메일 로그인 폼 — 로그인 페이지에서 `dynamic({ ssr: false })` 로 lazy-load.
 * react-hook-form + zod + resolver 번들을 "이메일로 시작하기" 토글 클릭 시점
 * 까지 미루어 초기 paint 를 단축. 카카오 단독 사용자는 이 번들을 받지 않음.
 */

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

export default function EmailLoginForm() {
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

  return (
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
  );
}
