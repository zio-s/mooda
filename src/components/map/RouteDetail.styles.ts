'use client';

import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

export const RouteWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 16px 12px;
`;

export const RouteSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
`;

export const SummaryChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};

  strong {
    font-weight: ${theme.fontWeight.semibold};
    color: ${theme.colors.text};
    font-size: ${theme.fontSize.sm};
  }
`;

export const RouteDivider = styled.div`
  height: 1px;
  background: ${theme.colors.borderLight};
  margin: 6px 0;
`;

// ─── 경로 스텝 타임라인 ─────────────────────────────────────────────
export const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
`;

export const StepItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
  position: relative;
`;

export const StepIcon = styled.div<{ $color?: string }>`
  width: 24px;
  height: 24px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $color }) => $color ?? theme.colors.bgMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;

  svg {
    width: 12px;
    height: 12px;
    color: white;
  }
`;

export const StepConnector = styled.div<{ $color?: string }>`
  position: absolute;
  left: 11px;
  top: 30px;
  bottom: -6px;
  width: 2px;
  background: ${({ $color }) => $color ?? theme.colors.borderLight};
  z-index: 1;
`;

export const StepContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StepTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
  line-height: 1.4;
`;

export const LineBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $color }) => $color};
  color: white;
  font-size: 11px;
  font-weight: ${theme.fontWeight.semibold};
  white-space: nowrap;
  line-height: 1.5;
`;

export const StepMeta = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

export const StepStation = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

// ─── 액션 버튼 ──────────────────────────────────────────────────────
export const RouteActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 16px 4px;
`;

export const KakaoMapLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  padding: 8px 12px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.kakao};
  color: ${theme.colors.kakaoText};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }
`;

export const DetailBtn = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  padding: 8px 12px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryDark};
  }
`;

// ─── 로딩 / 에러 상태 ───────────────────────────────────────────────
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

export const RouteSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px;
`;

export const SkeletonLine = styled.div<{ $w?: string }>`
  height: 14px;
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    ${theme.colors.borderLight} 25%,
    ${theme.colors.bgMuted} 50%,
    ${theme.colors.borderLight} 75%
  );
  background-size: 400px 14px;
  animation: ${shimmer} 1.2s infinite linear;
`;

export const RouteError = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

export const LocationPrompt = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.primary};
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${theme.colors.primaryDark};
  }
`;
