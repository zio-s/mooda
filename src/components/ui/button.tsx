'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

// New 3-tier API (02_components.md § Button)
type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link' | 'default';
type Size = 'lg' | 'md' | 'sm' | 'default' | 'icon';

interface ButtonStyleProps {
  $variant: Variant;
  $size: Size;
  $fullWidth?: boolean;
  $loading?: boolean;
}

const variantStyles: Record<Variant, ReturnType<typeof css>> = {
  primary: css`
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    border: none;
    box-shadow: ${theme.shadows.md};
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.primaryHover}; }
    }
  `,
  // Legacy "default" = primary.
  default: css`
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    border: none;
    box-shadow: ${theme.shadows.md};
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.primaryHover}; }
    }
  `,
  secondary: css`
    background: ${theme.colors.ink100};
    color: ${theme.colors.ink900};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.ink200}; }
    }
  `,
  ghost: css`
    background: transparent;
    color: ${theme.colors.ink700};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.ink100}; }
    }
  `,
  outline: css`
    background: transparent;
    color: ${theme.colors.ink900};
    border: 1.5px solid ${theme.colors.border};
    @media (hover: hover) {
      &:hover:not(:disabled) { background: ${theme.colors.ink50}; }
    }
  `,
  destructive: css`
    background: ${theme.colors.err};
    color: ${theme.colors.white};
    border: none;
    @media (hover: hover) {
      &:hover:not(:disabled) { background: #991b1b; }
    }
  `,
  link: css`
    background: transparent;
    color: ${theme.colors.primary};
    border: none;
    text-decoration: underline;
    padding: 0;
    height: auto;
  `,
};

const sizeStyles: Record<Size, ReturnType<typeof css>> = {
  lg: css`
    height: ${theme.touch.lg};
    padding: 0 20px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 14px;
  `,
  md: css`
    height: ${theme.touch.md};
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 12px;
  `,
  sm: css`
    height: ${theme.touch.sm};
    padding: 0 12px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 10px;
  `,
  default: css`
    height: ${theme.touch.md};
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 12px;
  `,
  icon: css`
    width: ${theme.touch.sm};
    height: ${theme.touch.sm};
    padding: 0;
    border-radius: 12px;
  `,
};

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const StyledButton = styled.button<ButtonStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  line-height: 1;
  outline: none;
  flex-shrink: 0;
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ $loading }) => $loading && css`
    & > :not(.btn-spinner) { opacity: 0.5; }
  `}

  svg { flex-shrink: 0; width: 16px; height: 16px; }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${theme.colors.primaryLight};
    outline: 1.5px solid ${theme.colors.primary};
    outline-offset: 1px;
  }
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Reserved for Radix Slot integration; not wired in this build. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      // asChild is accepted for API compatibility but intentionally unused here.
      asChild: _asChild,
      ...props
    },
    ref,
  ) => {
    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        $loading={loading}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner className="btn-spinner" aria-hidden /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </StyledButton>
    );
  },
);
Button.displayName = 'Button';
