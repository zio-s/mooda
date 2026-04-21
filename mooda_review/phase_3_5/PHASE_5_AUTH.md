# Phase 5 — 로그인/회원가입 리디자인

> **목표**: 로그인/가입 화면을 브랜드 톤으로. 카카오 우선 + 이메일 서브 + 비로그인 이탈 방지 CTA.
> **기간**: 1일 (≈ 8시간)
> **선행**: Phase 3-4 완료

---

## 🎯 DoD (Definition of Done)

- [ ] 로그인 카드 상단 `primaryLight` band(48px) 표시
- [ ] 카카오 버튼이 primary CTA로 최상단, 이메일 폼은 기본 접힘/풀어쓰기 중 선택한 방식
- [ ] "비로그인으로 둘러보기" 링크 → `/map` (이탈 방지)
- [ ] Input `aria-invalid` 시 red border (theme.colors.err)
- [ ] 회원가입 페이지 동일 톤
- [ ] 모바일 세로(360×800) 에서 카드 min 여백 적절
- [ ] `pnpm typecheck && pnpm build` 통과

---

## 🧩 작업 목록 (3개)

### T5-1. 로그인 페이지 리디자인 (3시간)

**파일 1**: `src/app/(auth)/login/page.tsx`

**구조 변경 포인트**:
- 최상단 CTA: 카카오 (primary)
- 그 아래 "이메일로 시작" Disclosure → 열면 이메일 폼
- Divider "또는" → 제거 또는 최소화
- 하단 "비로그인으로 둘러보기" (ghost)
- 회원가입 링크 유지

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from './page.styles';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const { register, handleSubmit, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

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

  async function handleKakao() {
    await signIn('kakao', { callbackUrl: PATHS.Map });
  }

  return (
    <PageWrapper>
      <FormCard>
        <BrandBand />
        <CardHeader>
          <LogoWrapper>
            <Coffee size={28} />
          </LogoWrapper>
          <CardTitle>Mooda에 오신 걸 환영해요</CardTitle>
          <CardDesc>분위기로 찾는 나만의 카페</CardDesc>
        </CardHeader>

        <CardBody>
          <KakaoButton onClick={handleKakao}>
            카카오로 시작하기
          </KakaoButton>

          <EmailToggle
            type="button"
            onClick={() => setEmailOpen((v) => !v)}
            aria-expanded={emailOpen}
          >
            <Mail size={15} />
            이메일로 시작하기
            <ChevronDown size={15} style={{ transform: emailOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </EmailToggle>

          {emailOpen && (
            <EmailPanel>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Field>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && <ErrorText role="alert">{errors.email.message}</ErrorText>}
                </Field>
                <Field>
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  {errors.password && <ErrorText role="alert">{errors.password.message}</ErrorText>}
                </Field>
                <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? '로그인 중…' : '로그인'}
                </Button>
              </Form>
            </EmailPanel>
          )}

          <GuestLink href={PATHS.Map}>
            <MapPin size={14} />
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
```

**파일 2**: `src/app/(auth)/login/page.styles.ts` — 교체 / 확장

```ts
export const PageWrapper = styled.div`
  display: flex;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  background: ${theme.colors.bg};
`;

export const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.lg};
  overflow: hidden;
`;

export const BrandBand = styled.div`
  height: 48px;
  background: ${theme.colors.primaryLight};
`;

export const CardHeader = styled.div`
  padding: 20px 24px 8px;
  text-align: center;
  margin-top: -24px; /* band와 겹쳐 로고가 위로 올라오게 */
`;

export const LogoWrapper = styled.div`
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  color: ${theme.colors.primary};
  box-shadow: ${theme.shadows.sm};
`;

export const CardTitle = styled.h1`
  margin: 0 0 4px;
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
  letter-spacing: -0.01em;
`;

export const CardDesc = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const CardBody = styled.div`
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const KakaoButton = styled.button`
  width: 100%;
  height: ${theme.touch.md};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.kakao};
  color: ${theme.colors.kakaoText};
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover { background: #FDD835; }
  &:active { transform: scale(0.99); }
`;

export const EmailToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: ${theme.touch.md};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.ink700};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:hover { background: ${theme.colors.ink50}; }
`;

export const EmailPanel = styled.div`
  padding-top: 4px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.err};
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const GuestLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: ${theme.touch.sm};
  margin-top: 4px;
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.ink500};
  font-size: ${theme.fontSize.sm};
  text-decoration: none;

  &:hover { color: ${theme.colors.primary}; background: ${theme.colors.ink50}; }
`;

export const FooterText = styled.p`
  margin: 4px 0 0;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const FooterLink = styled(Link)`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;
```

**추가**: `Input` 컴포넌트가 `aria-invalid` 시각 처리 지원 확인.
파일: `src/components/ui/input.tsx`
```ts
// 없으면 추가
&[aria-invalid='true'] {
  border-color: ${theme.colors.err};
  box-shadow: 0 0 0 3px ${theme.colors.errBg};
}
```

**커밋**: `feat(auth): 로그인 리디자인 — brand band + 카카오 primary + 비로그인 CTA`

---

### T5-2. 회원가입 페이지 동일 톤 적용 (3시간)

**파일 1**: `src/app/(auth)/signup/page.tsx`

로그인과 동일 구조(BrandBand + 로고 + 카드), 카카오 버튼 대신 이메일 폼이 기본 노출.
- CardTitle: "Mooda 시작하기"
- CardDesc: "무료로 계정을 만들어보세요"
- 폼 아래 "이미 계정이 있나요? 로그인" 링크
- 상단에 "카카오로 빠르게 가입" 버튼 (로그인 흐름과 통합)

```tsx
// 주요 구조 (상세 생략, T5-1 패턴 재활용)
<FormCard>
  <BrandBand />
  <CardHeader>
    <LogoWrapper><Coffee size={28} /></LogoWrapper>
    <CardTitle>Mooda 시작하기</CardTitle>
    <CardDesc>30초면 계정 생성이 완료돼요</CardDesc>
  </CardHeader>
  <CardBody>
    <KakaoButton onClick={() => signIn('kakao', { callbackUrl: PATHS.Map })}>
      카카오로 빠르게 가입
    </KakaoButton>
    <OrDivider>또는</OrDivider>
    <Form onSubmit={handleSubmit(onSubmit)}>
      {/* name, email, password, passwordConfirm 필드 */}
    </Form>
    <FooterText>
      이미 계정이 있나요? <FooterLink href={PATHS.Login}>로그인</FooterLink>
    </FooterText>
  </CardBody>
</FormCard>
```

**파일 2**: `src/app/(auth)/signup/page.styles.ts`

로그인 스타일과 중복 — 공통 모듈로 뺄지 결정:

**옵션 A (권장)**: 공통 파일 `src/app/(auth)/_shared.styles.ts` 신설, 양쪽 import
```ts
// _shared.styles.ts
export * from './login/page.styles';  // 아니, 반대로
```
실제로는 `_shared.styles.ts`에 `PageWrapper`·`FormCard`·`BrandBand`·`CardHeader`·`LogoWrapper`·`CardTitle`·`CardDesc`·`CardBody`·`KakaoButton`·`Field`·`ErrorText`·`FooterText`·`FooterLink` 전부 이동, 양쪽에서 import.

**옵션 B**: 각자 복붙 — 유지보수 비용 있음.

**→ 권장: 옵션 A.**

**커밋 1**: `refactor(auth): 로그인/회원가입 공통 스타일 _shared로 추출`
**커밋 2**: `feat(auth): 회원가입 리디자인 — 동일 카드 톤 + 카카오 가입 옵션`

---

### T5-3. 로그인 필요 toast action 버튼 (1시간, QA v2 N13)

**범위**: 앱 전역 — `toast.error('로그인이 필요합니다')` 패턴을 쓰는 곳 전부.

**grep 대상**:
```bash
git grep -n "로그인이 필요" src/
```

**파일**: 발견된 각 위치에서
```tsx
// before
toast.error('로그인이 필요합니다');

// after
toast.error('로그인이 필요합니다', {
  action: {
    label: '로그인',
    onClick: () => router.push(PATHS.Login),
  },
});
```

**주의**: `useRouter` import 필요. toast 호출이 이벤트 핸들러 안일 것이므로 router 접근 가능.

**커밋**: `feat(toast): 로그인 필요 알림에 이동 버튼 추가`

---

### T5-4. 회귀 QA + 문서 업데이트 (1시간)

**수동 QA**:
- `/login` → 모바일 세로(360×800) 에서 카드 여백 적절, BrandBand 보임
- 카카오 버튼 탭 → 카카오 OAuth 플로우
- "이메일로 시작하기" 클릭 → 폼 펼쳐짐, 다시 클릭 → 접힘
- 이메일 빈 값 제출 → ErrorText 빨강, Input border 빨강
- "둘러보기 (비로그인)" → `/map` 이동
- "회원가입" → `/signup`, 톤 일치 확인
- 로그인 필요 액션(즐겨찾기 등) → toast의 "로그인" 버튼 → `/login`

**문서**: `mooda_review/08_next_iteration_v3.md` 에 "Phase 5 완료 ✅" 섹션 추가.

**커밋**: `docs: Phase 5 완료 기록`

---

## 🤔 판단 필요 시

- **이메일 폼 Disclosure vs 풀어쓰기**: 기본 펼친 상태로 둘지? → **권장**: 접기 (카카오가 주 동선, 시각 노이즈 감소)
- **회원가입 카카오 버튼**: 원-탭 가입 플로우가 실제 설정되어있는지 확인. 안 되면 로그인으로 redirect.
- **toast action 스타일**: sonner 기본 스타일로 충분 vs 커스텀 → **권장**: 기본

---

**Phase 5 종료 조건**: DoD 전부 체크 + 커밋 4개 push → **Phase 3-5 완료.**

---

## 🎉 Phase 3-5 전체 완료 시 상태

| 영역 | Phase 3-5 후 |
|---|---|
| 디자인 토큰 밖 컬러 | 0건 |
| 프로필 = 콘텐츠 허브 | ✅ |
| 로그인/가입 = 브랜드 톤 | ✅ |
| Header 경로별 최적화 | ✅ |
| 접근성 (aria-invalid, AA 대비) | 개선 |
| **종합 체감 점수** | **A (93/100)** |
