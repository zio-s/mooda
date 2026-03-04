'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const PageTitle = styled.h1`
  margin: 0 0 24px;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
`;

export const Table = styled.table`
  width: 100%;
  font-size: ${theme.fontSize.sm};
  border-collapse: collapse;
`;

export const Thead = styled.thead`
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgMuted};
`;

export const Th = styled.th<{ $align?: 'left' | 'center' | 'right' }>`
  padding: 12px 16px;
  text-align: ${({ $align }) => $align ?? 'left'};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
  white-space: nowrap;
`;

export const Tbody = styled.tbody``;

export const Tr = styled.tr`
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;

export const Td = styled.td<{ $align?: 'left' | 'center' | 'right'; $muted?: boolean; $bold?: boolean }>`
  padding: 12px 16px;
  text-align: ${({ $align }) => $align ?? 'left'};
  color: ${({ $muted }) => ($muted ? theme.colors.textMuted : theme.colors.text)};
  font-weight: ${({ $bold }) => ($bold ? theme.fontWeight.medium : theme.fontWeight.normal)};
`;

export const VerifiedBadge = styled.span<{ $verified: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $verified }) => ($verified ? '#dcfce7' : theme.colors.bgMuted)};
  color: ${({ $verified }) => ($verified ? '#15803d' : theme.colors.textMuted)};
`;
