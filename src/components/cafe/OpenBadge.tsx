'use client';

import styled, { css } from 'styled-components';
import type { OpenStatus } from '@/lib/cafe/openStatus';

type Size = 'sm' | 'md';

type Props = {
  status: OpenStatus;
  size?: Size;
  className?: string;
};

const MAP: Record<OpenStatus, { label: string; bg: string; fg: string; dot: string; aria: string }> = {
  open: {
    label: '영업중',
    bg: 'var(--ok-bg)',
    fg: 'var(--ok)',
    dot: '●',
    aria: '영업중',
  },
  'closing-soon': {
    label: '곧 마감',
    bg: 'var(--warn-bg)',
    fg: 'var(--warn)',
    dot: '◐',
    aria: '영업 종료 임박',
  },
  closed: {
    label: '영업종료',
    bg: 'var(--ink-100)',
    fg: 'var(--ink-500)',
    dot: '○',
    aria: '영업종료',
  },
};

const sizeStyles: Record<Size, ReturnType<typeof css>> = {
  sm: css`
    height: 18px;
    padding: 0 6px;
    font-size: 10.5px;
  `,
  md: css`
    height: 22px;
    padding: 0 8px;
    font-size: 11.5px;
  `,
};

const Badge = styled.span<{ $bg: string; $fg: string; $size: Size }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  ${({ $size }) => sizeStyles[$size]}
`;

const Dot = styled.span`
  font-size: 0.85em;
  line-height: 1;
`;

export function OpenBadge({ status, size = 'sm', className }: Props) {
  const token = MAP[status];
  return (
    <Badge
      $bg={token.bg}
      $fg={token.fg}
      $size={size}
      className={className}
      role="status"
      aria-label={token.aria}
    >
      <Dot aria-hidden>{token.dot}</Dot>
      {token.label}
    </Badge>
  );
}
