'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

const StyledSkeleton = styled.div`
  background: linear-gradient(
    90deg,
    ${theme.colors.ink100} 0%,
    ${theme.colors.ink200} 50%,
    ${theme.colors.ink100} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2s ease-in-out infinite;
  border-radius: ${theme.borderRadius.md};
`;

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <StyledSkeleton ref={ref} {...props} />,
);
Skeleton.displayName = 'Skeleton';

type TextProps = {
  lines?: number;
  gap?: number;
  lastWidth?: string;
  className?: string;
};

const TextStack = styled.div<{ $gap: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap}px;
`;

const TextLine = styled(StyledSkeleton)<{ $width?: string }>`
  height: 14px;
  width: ${({ $width }) => $width ?? '100%'};
  border-radius: 6px;
`;

export function SkeletonText({
  lines = 3,
  gap = 8,
  lastWidth = '60%',
  className,
}: TextProps) {
  const entries = Array.from({ length: lines });
  return (
    <TextStack $gap={gap} className={className} aria-hidden>
      {entries.map((_, i) => (
        <TextLine key={i} $width={i === entries.length - 1 ? lastWidth : undefined} />
      ))}
    </TextStack>
  );
}

export const SkeletonBlock = styled(StyledSkeleton)<{ $h?: number; $r?: number }>`
  width: 100%;
  height: ${({ $h = 160 }) => $h}px;
  border-radius: ${({ $r }) => ($r !== undefined ? `${$r}px` : theme.borderRadius.lg)};
`;
