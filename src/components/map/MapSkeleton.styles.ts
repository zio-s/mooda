import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
  background: ${theme.colors.bgMuted};
  animation: ${pulse} 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SkeletonContent = styled.div`
  text-align: center;
  color: ${theme.colors.textMuted};
`;

export const SkeletonIcon = styled.div`
  font-size: 36px;
  margin-bottom: 8px;
`;

export const SkeletonText = styled.p`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  margin: 0;
`;
