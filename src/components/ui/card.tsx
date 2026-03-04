'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const Card = styled.div`
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
  transition: box-shadow 0.2s ease;
`;

export const CardHeader = styled.div`
  padding: 16px 20px 0;
`;

export const CardTitle = styled.h3`
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.text};
  line-height: 1.3;
`;

export const CardDescription = styled.p`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  margin-top: 4px;
`;

export const CardContent = styled.div`
  padding: 12px 20px 20px;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px 16px;
  border-top: 1px solid ${theme.colors.borderLight};
`;
