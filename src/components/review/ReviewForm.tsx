'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { PATHS } from '@/constants/paths';
import { StarRatingInput } from '@/components/ui/StarRatingInput';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReviewMutation } from '@/store/api/cafesApi';

import {
  FormWrapper,
  FormTitle,
  FormBody,
  FieldGroup,
  FieldLabel,
  OptionalText,
  TextareaWrapper,
  CharCounter,
  ErrorMsg,
  FormFooter,
  CancelBtn,
  SubmitBtn,
  LoginNotice,
  MyReviewCard,
  MyReviewHeader,
  MyReviewBadge,
  EditBtn,
  MyReviewContent,
  WriteReviewSection,
  WriteReviewBtn,
} from './ReviewForm.styles';

// ─── 유효성 스키마 ────────────────────────────────────────────────────────────
const MAX_CONTENT = 500;

const reviewSchema = z.object({
  // rating=0이면 미선택 → min(1) 에러로 처리
  rating: z.number().min(1, '별점을 선택해주세요').max(5),
  content: z
    .string()
    .max(MAX_CONTENT, `${MAX_CONTENT}자 이내로 작성해주세요`),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ReviewFormProps {
  /** 리뷰를 작성할 카페 ID */
  cafeId: string;
  /** 폼 타이틀에 사용할 카페 이름 */
  cafeName?: string;
  /** 기존 리뷰 (있으면 수정 모드로 동작) */
  existingReview?: {
    rating: number;
    content?: string;
  };
  /** 성공 후 콜백 (페이지 새로고침 등) */
  onSuccess?: () => void;
  /** 취소 콜백 (없으면 취소 버튼 미표시) */
  onCancel?: () => void;
  /**
   * true: 헤더 타이틀을 숨기고 작성하기 버튼→폼 토글 방식으로 동작
   * false(기본): 항상 폼이 펼쳐진 채로 표시
   */
  compact?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ReviewForm({
  cafeId,
  cafeName,
  existingReview,
  onSuccess,
  onCancel,
  compact = false,
  className,
}: ReviewFormProps) {
  const { data: session, status } = useSession();
  const isEditMode = !!existingReview;

  // compact 모드이고 기존 리뷰가 없을 때는 폼을 처음에 숨김
  const [formOpen, setFormOpen] = useState(!compact || isEditMode);
  // 기존 리뷰 있을 때는 '내 리뷰 카드' 먼저 표시
  const [editingExisting, setEditingExisting] = useState(false);

  const [createReview, { isLoading }] = useCreateReviewMutation();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      content: existingReview?.content ?? '',
    },
  });

  const content = watch('content') ?? '';

  async function onSubmit(values: ReviewFormValues) {
    try {
      await createReview({ cafeId, ...values }).unwrap();
      toast.success(isEditMode ? '리뷰가 수정되었습니다' : '리뷰가 등록되었습니다! 감사합니다 :)');
      setEditingExisting(false);
      setFormOpen(false);
      onSuccess?.();
    } catch {
      toast.error('리뷰 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  function handleCancel() {
    if (editingExisting) {
      setEditingExisting(false);
    } else if (compact) {
      reset();
      setFormOpen(false);
    }
    onCancel?.();
  }

  // ── 세션 로딩 중 ─────────────────────────────────────────────────────────
  if (status === 'loading') return null;

  // ── 비로그인 ──────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <LoginNotice className={className}>
        <Link
          href={PATHS.Login}
          style={{ color: '#92400e', fontWeight: 600, textDecoration: 'underline' }}
        >
          로그인
        </Link>
        {' '}후 리뷰를 작성할 수 있어요.
      </LoginNotice>
    );
  }

  // ── 기존 리뷰 카드 (수정 모드 아닐 때) ───────────────────────────────────
  if (isEditMode && !editingExisting) {
    return (
      <MyReviewCard className={className}>
        <MyReviewHeader>
          <MyReviewBadge>내 리뷰</MyReviewBadge>
          <EditBtn type="button" onClick={() => setEditingExisting(true)}>
            수정하기
          </EditBtn>
        </MyReviewHeader>
        <StarRatingInput
          value={existingReview.rating}
          readOnly
          size="sm"
          showLabel={false}
        />
        {existingReview.content && (
          <MyReviewContent>{existingReview.content}</MyReviewContent>
        )}
      </MyReviewCard>
    );
  }

  // ── compact 모드 + 폼 닫힘 → 작성하기 버튼만 표시 ─────────────────────
  if (compact && !formOpen && !editingExisting) {
    return (
      <WriteReviewSection className={className}>
        <WriteReviewBtn type="button" onClick={() => setFormOpen(true)}>
          + 리뷰 작성하기
        </WriteReviewBtn>
      </WriteReviewSection>
    );
  }

  // ── 폼 ───────────────────────────────────────────────────────────────────
  return (
    <FormWrapper $compact={compact} className={className}>
      {!compact && (
        <FormTitle>
          {isEditMode ? '리뷰 수정' : `${cafeName ?? '카페'} 리뷰 작성`}
        </FormTitle>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormBody>
          {/* ── 별점 ─────────────────────────────────────────────────────── */}
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRatingInput
                label="별점"
                required
                value={field.value}
                onChange={field.onChange}
                size="lg"
                showLabel
                error={errors.rating?.message}
              />
            )}
          />

          {/* ── 리뷰 내용 ─────────────────────────────────────────────────── */}
          <FieldGroup>
            <FieldLabel htmlFor="review-content">
              리뷰 내용
              <OptionalText>(선택 · 최대 {MAX_CONTENT}자)</OptionalText>
            </FieldLabel>
            <TextareaWrapper>
              <Textarea
                id="review-content"
                {...register('content')}
                placeholder="카페 방문 경험을 자유롭게 남겨주세요."
                rows={4}
                style={{ paddingBottom: '28px' }}
                aria-invalid={!!errors.content}
                aria-describedby={errors.content ? 'review-content-error' : undefined}
              />
              <CharCounter $over={content.length > MAX_CONTENT}>
                {content.length}/{MAX_CONTENT}
              </CharCounter>
            </TextareaWrapper>
            {errors.content && (
              <ErrorMsg id="review-content-error" role="alert">
                {errors.content.message}
              </ErrorMsg>
            )}
          </FieldGroup>

          {/* ── 버튼 ─────────────────────────────────────────────────────── */}
          <FormFooter>
            {(compact || editingExisting || onCancel) && (
              <CancelBtn type="button" onClick={handleCancel}>
                취소
              </CancelBtn>
            )}
            <SubmitBtn type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isEditMode ? '수정 완료' : '리뷰 등록'}
            </SubmitBtn>
          </FormFooter>
        </FormBody>
      </form>
    </FormWrapper>
  );
}
