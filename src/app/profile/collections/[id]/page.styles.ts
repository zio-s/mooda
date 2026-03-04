'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const PageTitle = styled.h1`
  margin: 0 0 8px;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const PageDesc = styled.p`
  margin: 0 0 24px;
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
`;

export const CafeGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media (min-width: ${theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const EmptyText = styled.p`
  padding: 32px 0;
  text-align: center;
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
  margin: 0;
`;
