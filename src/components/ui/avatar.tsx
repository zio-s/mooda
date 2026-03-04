'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

const AvatarRoot = styled.div<{ $size?: number }>`
  width: ${({ $size = 32 }) => $size}px;
  height: ${({ $size = 32 }) => $size}px;
  border-radius: 50%;
  overflow: hidden;
  background: ${theme.colors.bgMuted};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarFallbackDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.textMuted};
  background: ${theme.colors.bgMuted};
  text-transform: uppercase;
`;

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

interface AvatarImageProps {
  src: string;
  alt?: string;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
}

export function Avatar({ size = 32, children, ...props }: AvatarProps) {
  return (
    <AvatarRoot $size={size} {...props}>
      {children}
    </AvatarRoot>
  );
}

export function AvatarImage({ src, alt = '' }: AvatarImageProps) {
  const [error, setError] = useState(false);
  if (!src || error) return null;
  return <AvatarImg src={src} alt={alt} onError={() => setError(true)} />;
}

export function AvatarFallback({ children }: AvatarFallbackProps) {
  return <AvatarFallbackDiv>{children}</AvatarFallbackDiv>;
}
