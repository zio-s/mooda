'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const MapPageWrapper = styled.div`
  display: flex;
  /* 모바일 브라우저 주소창을 제외한 실제 뷰포트 높이 */
  height: calc(100vh - 56px);
  @supports (height: 100dvh) {
    height: calc(100dvh - 56px);
  }
  flex-direction: column;
`;

// ─── Filter Bar ───────────────────────────────────────────
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bg};
  padding: 8px 12px;
  flex-shrink: 0;
  z-index: ${theme.zIndex.dropdown};
`;

export const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.xs};
  padding: 0 5px;
`;

export const ChipsScroll = styled.div`
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  display: none;
  align-items: center;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: ${theme.breakpoints.md}) {
    display: flex;
  }
`;

// ─── Main Area ────────────────────────────────────────────
export const MainArea = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const MapArea = styled.div<{ $hidden?: boolean }>`
  flex: 1;
  height: 100%;
  display: ${({ $hidden }) => ($hidden ? 'none' : 'block')};

  @media (min-width: ${theme.breakpoints.md}) {
    display: block;
  }
`;

export const ListPanel = styled.div<{ $visible?: boolean }>`
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  width: 100%;
  background: ${theme.colors.bg};
  overflow: hidden;

  @media (min-width: ${theme.breakpoints.md}) {
    display: flex;
    width: 320px;
    border-left: 1px solid ${theme.colors.border};
  }

  @media (min-width: ${theme.breakpoints.lg}) {
    width: 368px;
  }
`;

export const ListHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${theme.colors.borderLight};
  flex-shrink: 0;
`;

export const ListCount = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textMuted};
`;

export const ListInner = styled.div`
  padding: 12px;
  flex: 1;
  overflow-y: auto;
`;

export const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 16px;
  text-align: center;
  color: ${theme.colors.textMuted};

  p {
    margin: 8px 0 0;
    font-size: ${theme.fontSize.sm};
    line-height: 1.6;
  }
`;

// ─── Area Select (지역 바로가기) ──────────────────────────
export const AreaSelectWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const AreaSelectBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  color: ${theme.colors.text};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  @media (hover: hover) {
    &:hover {
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  }

  svg {
    flex-shrink: 0;
    color: ${theme.colors.textMuted};
  }
`;

export const AreaDropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 140px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  z-index: ${theme.zIndex.dropdown};
  padding: 4px;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  max-height: 280px;
  overflow-y: auto;
`;

export const AreaOption = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $active }) => ($active ? theme.colors.primaryLight : 'transparent')};
  color: ${({ $active }) => ($active ? theme.colors.primaryText : theme.colors.text)};
  font-size: ${theme.fontSize.sm};
  font-weight: ${({ $active }) => ($active ? theme.fontWeight.semibold : theme.fontWeight.normal)};
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;

  @media (hover: hover) {
    &:hover {
      background: ${({ $active }) => ($active ? theme.colors.primaryLight : theme.colors.bgMuted)};
    }
  }
`;

// ─── Loading Progress Bar ─────────────────────────────────
export const LoadingBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: ${theme.zIndex.dropdown};
  overflow: hidden;
  background: rgba(217, 119, 6, 0.15);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -40%;
    width: 40%;
    height: 100%;
    background: ${theme.colors.primary};
    border-radius: 2px;
    animation: loading-slide 1s ease-in-out infinite;
  }

  @keyframes loading-slide {
    0% { left: -40%; }
    100% { left: 100%; }
  }
`;

// ─── Mobile Selected Cafe Preview ─────────────────────────
export const MobilePreview = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));

  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;
