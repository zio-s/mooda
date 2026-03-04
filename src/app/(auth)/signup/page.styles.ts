'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const PageWrapper = styled.div`
  display: flex;
  min-height: calc(100vh - 56px);
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
`;

export const FormCard = styled.div`
  width: 100%;
  max-width: 360px;
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

export const CardHeader = styled.div`
  padding: 24px 24px 0;
  text-align: center;
`;

export const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  color: ${theme.colors.primary};
`;

export const CardTitle = styled.h1`
  margin: 0 0 4px;
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const CardDesc = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

export const CardBody = styled.div`
  padding: 20px 24px 24px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.error};
`;

export const FooterText = styled.p`
  margin: 16px 0 0;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

export const FooterLink = styled(Link)`
  color: ${theme.colors.primaryText};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
