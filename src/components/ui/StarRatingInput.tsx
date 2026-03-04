'use client';

import { useState, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

// ─── 상수 ──────────────────────────────────────────────────────────────────────
const STAR_LABELS = ['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'] as const;

const SIZE_PX = { sm: '18px', md: '24px', lg: '32px' } as const;

// ─── Styled ───────────────────────────────────────────────────────────────────
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

const RequiredMark = styled.span`
  color: ${theme.colors.error};
  margin-left: 2px;
`;

const StarsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
`;

const StarBtn = styled.button<{
  $filled: boolean;
  $readOnly: boolean;
  $size: keyof typeof SIZE_PX;
}>`
  background: none;
  border: none;
  padding: 3px;
  line-height: 1;
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'pointer')};
  font-size: ${({ $size }) => SIZE_PX[$size]};
  color: ${({ $filled }) => ($filled ? '#fbbf24' : '#d1d5db')};
  transition: color 0.1s ease, transform 0.1s ease;
  display: flex;
  align-items: center;

  &:not([disabled]):hover {
    transform: scale(1.15);
    color: #fbbf24;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const RatingLabel = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  margin-left: 8px;
  min-width: 64px;
`;

const ErrorMsg = styled.p`
  margin: 2px 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.error};
`;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface StarRatingInputProps {
  /** 현재 별점 (0 = 미선택, 1~5) */
  value: number;
  /** 별점 변경 핸들러 */
  onChange?: (val: number) => void;
  /** 별 크기 */
  size?: keyof typeof SIZE_PX;
  /** 읽기 전용 */
  readOnly?: boolean;
  /** 폼 레이블 */
  label?: string;
  /** 필수 여부 */
  required?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 선택된 별점 텍스트 ("괜찮아요" 등) 표시 여부 */
  showLabel?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StarRatingInput({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  label,
  required = false,
  error,
  showLabel = true,
  className,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered > 0 ? hovered : value;

  const handleClick = useCallback(
    (star: number) => {
      if (readOnly) return;
      // 같은 별 다시 클릭 시 초기화 (취소 가능)
      onChange?.(value === star ? 0 : star);
    },
    [readOnly, onChange, value]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, star: number) => {
      if (readOnly) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(star);
      }
      // 방향키로 별점 조작
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onChange?.(Math.min(5, value + 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onChange?.(Math.max(0, value - 1));
      }
    },
    [readOnly, handleClick, onChange, value]
  );

  return (
    <Wrapper className={className} role="group" aria-label={label ?? '별점'}>
      {label && (
        <FieldLabel>
          {label}
          {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
        </FieldLabel>
      )}
      <StarsRow>
        {([1, 2, 3, 4, 5] as const).map((star) => (
          <StarBtn
            key={star}
            type="button"
            $filled={star <= display}
            $readOnly={readOnly}
            $size={size}
            disabled={readOnly}
            aria-label={`${star}점`}
            aria-pressed={value >= star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            onKeyDown={(e) => handleKeyDown(e, star)}
          >
            ★
          </StarBtn>
        ))}
        {showLabel && !readOnly && (
          <RatingLabel aria-live="polite">
            {STAR_LABELS[display] || '별점을 선택하세요'}
          </RatingLabel>
        )}
      </StarsRow>
      {error && <ErrorMsg role="alert">{error}</ErrorMsg>}
    </Wrapper>
  );
}
