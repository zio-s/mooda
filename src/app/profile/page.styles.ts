'use client';

import styled, { css } from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const PageContainer = styled.div`
  max-width: 672px;
  margin: 0 auto;
  padding: 32px 16px calc(32px + env(safe-area-inset-bottom, 0px));
`;

export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: ${theme.space[6]};
`;

export const ProfileIdentity = styled.div`
  min-width: 0;
`;

export const ProfileName = styled.h1`
  margin: 0 0 2px;
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProfileEmail = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* ─── Stats Row ─────────────────────────────────────────── */
export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.space[2]};
  margin-bottom: ${theme.space[6]};
`;

const StatCardBase = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: ${theme.space[4]} ${theme.space[2]};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  text-decoration: none;
  color: inherit;
  transition: transform 0.1s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    box-shadow: ${theme.shadows.sm};
    border-color: ${theme.colors.ink300};
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const StatCard = styled.div`
  ${StatCardBase}
`;

export const StatCardLink = styled(Link)`
  ${StatCardBase}
`;

export const StatValue = styled.span`
  font-size: ${theme.fontSize.xl};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

export const StatLabel = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.ink500};
`;

/* ─── Menu List ─────────────────────────────────────────── */
export const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[3]};
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
  transition: box-shadow 0.2s ease, transform 0.1s ease, background 0.1s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }

  /* 탭 시 피드백 — 살짝 축소 + 배경 변경. 모바일에서 터치 반응 명확. */
  &:active {
    transform: scale(0.99);
    background: ${theme.colors.ink50};
  }
`;

export const MenuIconBox = styled.span<{ $variant: 'primary' | 'err' }>`
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $variant }) =>
    $variant === 'err' ? theme.colors.errBg : theme.colors.primaryLight};
  color: ${({ $variant }) =>
    $variant === 'err' ? theme.colors.err : theme.colors.primary};
`;

export const MenuLabel = styled.span`
  flex: 1;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const MenuCount = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
  font-variant-numeric: tabular-nums;
`;

/* ─── Divider + Danger ─────────────────────────────────── */
export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${theme.colors.border};
  margin: ${theme.space[5]} 0;
`;

export const DangerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.err};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.errBg};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${theme.colors.err};
  }
`;
