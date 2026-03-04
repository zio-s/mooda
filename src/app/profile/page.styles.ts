'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 672px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

export const ProfileName = styled.h1`
  margin: 0 0 2px;
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const ProfileEmail = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

export const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MenuCard = styled(Link)`
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

export const MenuLabel = styled.span`
  flex: 1;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;
