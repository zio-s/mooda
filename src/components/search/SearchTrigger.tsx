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
};

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  /* FilterBar의 flex item으로 배치될 때 min-width:0 이어야 label ellipsis 정상
     동작 + 320px 뷰포트에서도 자연스럽게 shrink. */
  min-width: 0;
  flex: 1 1 auto;
  height: 48px;
  padding: 0 16px;
  border-radius: 24px;
  background: ${theme.colors.white};
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  text-align: left;
  color: ${theme.colors.ink500};
  transition: transform 0.12s ease, box-shadow 0.15s ease;

  &:active {
    transform: scale(0.99);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    color: ${theme.colors.ink700};
    flex-shrink: 0;
  }
`;

const Label = styled.span`
  flex: 1;
  font-size: 14.5px;
  font-weight: 500;
  color: ${theme.colors.ink500};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function SearchTrigger({
  placeholder = '성수동 조용한 카페',
  href = '/search',
  className,
}: Props) {
  const router = useRouter();
  return (
    <Pill
      type="button"
      onClick={() => router.push(href)}
      aria-label="카페 검색"
      className={className}
    >
      <Search size={18} strokeWidth={2} aria-hidden />
      <Label>{placeholder}</Label>
    </Pill>
  );
}
