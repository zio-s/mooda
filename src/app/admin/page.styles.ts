'use client';

import styled from 'styled-components';
import Link from 'next/link';
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

export const StatsGrid = styled.div`
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
  grid-template-columns: repeat(2, 1fr);

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const StatCard = styled.div`
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  overflow: hidden;
`;

export const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textMuted};
`;

export const StatValue = styled.p`
  margin: 0;
  padding: 0 16px 16px;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const AdminLinks = styled.div`
  display: flex;
  gap: 12px;
`;

export const AdminLink = styled(Link)`
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  padding: 8px 16px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;
