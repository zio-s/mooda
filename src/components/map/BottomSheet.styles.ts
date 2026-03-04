'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const SheetWrap = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: ${theme.colors.bgCard};
  border-top-left-radius: ${theme.borderRadius.xl};
  border-top-right-radius: ${theme.borderRadius.xl};
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.14);
  z-index: 150;
  touch-action: none;
  user-select: none;
  display: flex;
  flex-direction: column;

  /* 데스크톱에서 숨김 — ListPanel 사용 */
  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

export const DragHandle = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 20px;
  padding-top: 8px;
  flex-shrink: 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

export const HandleBar = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${theme.colors.border};
`;

export const InfoSection = styled.div`
  padding: 4px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const CafeName = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.primaryText};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
`;

export const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.bgMuted};
  color: ${theme.colors.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.border};
    color: ${theme.colors.text};
  }
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};

  span {
    font-size: ${theme.fontSize.xs};
    font-weight: ${theme.fontWeight.normal};
    color: ${theme.colors.textMuted};
  }
`;

export const MoodChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const MoodChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryText};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
`;

export const DetailLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
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

export const KakaoLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
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

// ─── 확장 영역 (경로 상세) ──────────────────────────────────────────
export const ExpandedSection = styled.div`
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-height: 50vh;
  border-top: 1px solid ${theme.colors.border};
  margin-top: 4px;
`;

export const RouteSection = styled.div`
  padding-bottom: 16px;
`;

export const PhotoSection = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const StatusBadge = styled.span<{ $open: boolean }>`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $open }) => ($open ? theme.colors.success : theme.colors.error)};
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;
