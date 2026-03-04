'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 672px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const CreateBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: ${theme.borderRadius.md};
  border: 1.5px solid ${theme.colors.primary};
  background: transparent;
  color: ${theme.colors.primaryText};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryLight};
  }
`;

export const CollectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CollectionCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  text-decoration: none;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }
`;

export const CollectionInfo = styled.div`
  flex: 1;
`;

export const CollectionName = styled.p`
  margin: 0 0 2px;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const CollectionCount = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
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
