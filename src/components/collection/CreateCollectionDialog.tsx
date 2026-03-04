'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCollectionMutation } from '@/store/api/collectionsApi';

import {
  FieldGroup,
  FieldLabel,
  RequiredMark,
  OptionalText,
  TextareaWrapper,
  CharCounter,
  InputCounter,
  ErrorMsg,
  CancelBtn,
  SubmitBtn,
} from './CreateCollectionDialog.styles';

// ─── 유효성 스키마 ────────────────────────────────────────────────────────────
const MAX_NAME = 50;
const MAX_DESC = 200;

const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, '컬렉션 이름을 입력해주세요')
    .max(MAX_NAME, `${MAX_NAME}자 이내로 작성해주세요`),
  description: z
    .string()
    .max(MAX_DESC, `${MAX_DESC}자 이내로 작성해주세요`),
});

type CreateCollectionValues = z.infer<typeof createCollectionSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CreateCollectionDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 생성 성공 후 콜백 (페이지 새로고침 등) */
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCollectionValues>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: { name: '', description: '' },
  });

  const name = watch('name') ?? '';
  const description = watch('description') ?? '';

  function handleOpenChange(v: boolean) {
    if (!v) reset(); // 닫힐 때 폼 초기화
    onOpenChange(v);
  }

  async function onSubmit(values: CreateCollectionValues) {
    try {
      await createCollection(values).unwrap();
      toast.success(`'${values.name}' 컬렉션을 만들었습니다!`);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('컬렉션 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 컬렉션 만들기</DialogTitle>
          <DialogDescription>
            좋아하는 카페들을 주제별로 모아두세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── 컬렉션 이름 ────────────────────────────────────────────── */}
            <FieldGroup>
              <FieldLabel htmlFor="col-name">
                컬렉션 이름
                <RequiredMark aria-hidden="true">*</RequiredMark>
              </FieldLabel>
              <div style={{ position: 'relative' }}>
                <Input
                  id="col-name"
                  {...register('name')}
                  placeholder="예: 홍대 감성 카페, 혼공하기 좋은 곳"
                  autoFocus
                  maxLength={MAX_NAME + 5}
                  style={{ paddingRight: '60px' }}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'col-name-error' : undefined}
                />
                <InputCounter $over={name.length > MAX_NAME}>
                  {name.length}/{MAX_NAME}
                </InputCounter>
              </div>
              {errors.name && (
                <ErrorMsg id="col-name-error" role="alert">
                  {errors.name.message}
                </ErrorMsg>
              )}
            </FieldGroup>

            {/* ── 설명 ────────────────────────────────────────────────────── */}
            <FieldGroup>
              <FieldLabel htmlFor="col-desc">
                설명
                <OptionalText>(선택)</OptionalText>
              </FieldLabel>
              <TextareaWrapper>
                <Textarea
                  id="col-desc"
                  {...register('description')}
                  placeholder="이 컬렉션을 간단히 소개해보세요."
                  rows={3}
                  style={{ paddingBottom: '28px' }}
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description ? 'col-desc-error' : undefined
                  }
                />
                <CharCounter $over={description.length > MAX_DESC}>
                  {description.length}/{MAX_DESC}
                </CharCounter>
              </TextareaWrapper>
              {errors.description && (
                <ErrorMsg id="col-desc-error" role="alert">
                  {errors.description.message}
                </ErrorMsg>
              )}
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <CancelBtn type="button">취소</CancelBtn>
            </DialogClose>
            <SubmitBtn type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading && (
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              )}
              만들기
            </SubmitBtn>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
