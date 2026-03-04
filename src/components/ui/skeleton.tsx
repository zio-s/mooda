'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const StyledSkeleton = styled.div`
  background: #e5e7eb;
  border-radius: 6px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <StyledSkeleton ref={ref} {...props} />
);
Skeleton.displayName = 'Skeleton';
