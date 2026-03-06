'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

type Variant = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonStyleProps {
  $variant?: Variant;
  $size?: Size;
}

const variantStyles: Record<Variant, ReturnType<typeof css>> = {
  default: css`
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.primaryDark}; }
    }
  `,
  outline: css`
    background: transparent;
    color: ${theme.colors.text};
    border: 1.5px solid ${theme.colors.border};
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.bgMuted}; }
    }
  `,
  ghost: css`
    background: transparent;
    color: ${theme.colors.text};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.bgMuted}; }
    }
  `,
  secondary: css`
    background: #f3f4f6;
    color: ${theme.colors.text};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: #e5e7eb; }
    }
  `,
  destructive: css`
    background: ${theme.colors.error};
    color: white;
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: #b91c1c; }
    }
  `,
  link: css`
    background: transparent;
    color: ${theme.colors.primary};
    border: none;
    text-decoration: underline;
    padding: 0;
  `,
};

const sizeStyles: Record<Size, ReturnType<typeof css>> = {
  default: css`padding: 8px 16px; font-size: 14px; height: 36px;`,
  sm: css`padding: 6px 12px; font-size: 13px; height: 32px;`,
  lg: css`padding: 10px 24px; font-size: 16px; height: 40px;`,
  icon: css`width: 36px; height: 36px; padding: 0;`,
};

const StyledButton = styled.button<ButtonStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1;
  outline: none;
  flex-shrink: 0;

  ${({ $variant = 'default' }) => variantStyles[$variant]}
  ${({ $size = 'default' }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg { flex-shrink: 0; width: 16px; height: 16px; }
`;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
    return (
      <StyledButton ref={ref} $variant={variant} $size={size} {...props}>
        {children}
      </StyledButton>
    );
  }
);
Button.displayName = 'Button';
