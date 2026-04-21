'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

/**
 * 로그인/회원가입 공용 스타일. BrandBand + 카드 구조 + 공통 버튼/폼/
 * 푸터 링크까지 모두 포함. 각 페이지는 여기서 필요한 것만 import.
 */

export const PageWrapper = styled.div`
  display: flex;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  background: ${theme.colors.bg};
`;

export const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.border};
`;

/** 카드 상단 brand 배경 띠 — 로고 backdrop. */
export const BrandBand = styled.div`
  height: 48px;
  background: ${theme.colors.primaryLight};
`;

export const CardHeader = styled.div`
  padding: 0 24px 8px;
  text-align: center;
  /* band와 겹쳐 로고가 살짝 위로 올라오도록 */
  margin-top: -24px;
`;

export const LogoWrapper = styled.div`
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  color: ${theme.colors.primary};
  box-shadow: ${theme.shadows.sm};
`;

export const CardTitle = styled.h1`
  margin: 0 0 4px;
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
  letter-spacing: -0.01em;
`;

export const CardDesc = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const CardBody = styled.div`
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const KakaoButton = styled.button`
  width: 100%;
  height: ${theme.touch.md};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.kakao};
  color: ${theme.colors.kakaoText};
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover {
    background: #fdd835;
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const EmailToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: ${theme.touch.md};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.ink700};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.ink50};
  }
`;

export const EmailPanel = styled.div`
  padding-top: 4px;
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
  color: ${theme.colors.err};
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${theme.colors.ink700};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }
`;

export const GuestLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: ${theme.touch.sm};
  margin-top: 4px;
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.ink500};
  font-size: ${theme.fontSize.sm};
  text-decoration: none;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: ${theme.colors.primary};
    background: ${theme.colors.ink50};
  }
`;

export const FooterText = styled.p`
  margin: 4px 0 0;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const FooterLink = styled(Link)`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
