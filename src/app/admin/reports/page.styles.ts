'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const PageTitle = styled.h1`
  margin: 0 0 24px;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const EmptyText = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
`;
