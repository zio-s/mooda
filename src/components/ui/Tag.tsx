'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

type Variant = 'solid' | 'tint' | 'outline';

export interface TagProps {
  label: string;
  variant?: Variant;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<Variant, ReturnType<typeof css>> = {
  solid: css`
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    border: 1px solid transparent;
  `,
  tint: css`
    background: ${theme.colors.primaryLight};
    color: #78350f; /* amber-900 per spec */
    border: 1px solid transparent;
  `,
  outline: css`
    background: ${theme.colors.white};
    color: ${theme.colors.ink700};
    border: 1px solid ${theme.colors.ink200};
  `,
};

const Pill = styled.button<{ $variant: Variant; $clickable: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.1;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  ${({ $variant }) => variantStyles[$variant]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Count = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
`;

export function Tag({
  label,
  variant = 'outline',
  count,
  selected,
  onClick,
  className,
}: TagProps) {
  // selected option uses the solid treatment when an outline tag is toggled.
  const resolvedVariant: Variant = selected ? 'solid' : variant;
  const clickable = Boolean(onClick);

  return (
    <Pill
      type="button"
      $variant={resolvedVariant}
      $clickable={clickable}
      onClick={onClick}
      aria-pressed={clickable ? Boolean(selected) : undefined}
      className={className}
    >
      {label}
      {typeof count === 'number' && count > 0 && <Count>{count}</Count>}
    </Pill>
  );
}
