'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const Separator = styled.div<{ orientation?: 'horizontal' | 'vertical' }>`
  background: ${theme.colors.border};
  flex-shrink: 0;
  ${({ orientation = 'horizontal' }) =>
    orientation === 'horizontal'
      ? 'height: 1px; width: 100%;'
      : 'width: 1px; height: 100%;'}
`;
