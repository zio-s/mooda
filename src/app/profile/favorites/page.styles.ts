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

export const EmptyState = styled.div`
  padding: 64px 0;
  text-align: center;
  color: ${theme.colors.textMuted};

  p {
    margin: 0;
    font-size: ${theme.fontSize.sm};
  }
`;
