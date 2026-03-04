'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

interface BadgeStyleProps {
  $variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  default: css`
    background: ${theme.colors.primary};
    color: white;
    border-color: transparent;
  `,
  secondary: css`
    background: #f3f4f6;
    color: ${theme.colors.text};
    border-color: transparent;
  `,
  outline: css`
    background: transparent;
    color: ${theme.colors.text};
    border-color: ${theme.colors.border};
  `,
  destructive: css`
    background: ${theme.colors.error};
    color: white;
    border-color: transparent;
  `,
};

const StyledBadge = styled.span<BadgeStyleProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid transparent;
  padding: 2px 8px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
  line-height: 1.5;

  ${({ $variant = 'default' }) => variantStyles[$variant]}
`;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', ...props }, ref) => (
    <StyledBadge ref={ref} $variant={variant} {...props} />
  )
);
Badge.displayName = 'Badge';
