'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

type Props = {
  placeholder?: string;
  className?: string;
  /** Route pushed on tap. Defaults to `/search`. */
  href?: string;
  /**
   * true면 아이콘만 보이는 44px 원형 버튼으로 축소. FilterBar에 이미 chips
   * 가 들어찼거나 좁은 뷰포트에서 경쟁 요소와 충돌하지 않게 해주는 fallback.
   */
  compact?: boolean;
};

const Pill = styled.button<{ $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: ${({ $compact }) => ($compact ? '44px' : '100%')};
  min-width: ${({ $compact }) => ($compact ? '44px' : '120px')};
  flex: ${({ $compact }) => ($compact ? '0 0 auto' : '1 1 auto')};
  height: ${({ $compact }) => ($compact ? '44px' : '48px')};
  padding: ${({ $compact }) => ($compact ? '0' : '0 16px')};
  justify-content: ${({ $compact }) => ($compact ? 'center' : 'flex-start')};
  border-radius: ${({ $compact }) => ($compact ? '50%' : '24px')};
  background: ${theme.colors.white};
  box-shadow: ${theme.shadows.sm};
  cursor: pointer;
  text-align: left;
  color: ${theme.colors.ink500};
  transition: transform 0.12s ease, box-shadow 0.15s ease;

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    color: ${theme.colors.ink700};
    flex-shrink: 0;
  }

  /* Phase 7-B T7-B3: PC ≥1024 에서는 compact prop 무시 + FilterBar 한 줄
     inline 확장. flex:1 min-width 200 max-width 520 으로 FilterBar 중앙 확보. */
  @media (min-width: ${theme.breakpoints.lg}) {
    width: auto;
    min-width: 200px;
    max-width: 520px;
    flex: 1 1 auto;
    height: 44px;
    padding: 0 16px;
    justify-content: flex-start;
    border-radius: 24px;
  }
`;

const Label = styled.span<{ $compact: boolean }>`
  flex: 1;
  font-size: 14.5px;
  font-weight: 500;
  color: ${theme.colors.ink500};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: ${({ $compact }) => ($compact ? 'none' : 'inline')};

  /* PC 에서는 compact 여부와 무관하게 Label 강제 표시 */
  @media (min-width: ${theme.breakpoints.lg}) {
    display: inline;
  }
`;

export function SearchTrigger({
  placeholder = '성수동 조용한 카페',
  href = '/search',
  className,
  compact = false,
}: Props) {
  const router = useRouter();
  return (
    <Pill
      type="button"
      $compact={compact}
      onClick={() => router.push(href)}
      aria-label="카페 검색"
      className={className}
    >
      <Search size={18} strokeWidth={2} aria-hidden />
      <Label $compact={compact}>{placeholder}</Label>
    </Pill>
  );
}
