'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const MapPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  /* Header(48px · Phase 7-B 축소) + Header safe-area-top를 함께 차감해야 notch
     기기에서 하단이 잘리지 않음. 모바일 브라우저 주소창은 dvh로 흡수. */
  height: calc(100vh - 48px - env(safe-area-inset-top, 0px));
  @supports (height: 100dvh) {
    height: calc(100dvh - 48px - env(safe-area-inset-top, 0px));
  }
`;

// ─── Filter Bar ───────────────────────────────────────────
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bg};
  padding: 8px 10px;
  flex-shrink: 0;
  min-width: 0;
  /* 가로 overflow 방지 — 자식이 총합 viewport를 넘기면 ChipsScroll이 자체
     overflow-x scroll 하거나 버튼 텍스트가 shrink/ellipsis 되도록 두어도 OK.
     "분위기 필터"/"지역 이동" 버튼에 flex-shrink:0을 걸면 SearchTrigger
     min-width(120)와 합쳐 뷰포트를 쉽게 넘김 → 이 규칙 제거. */
  z-index: ${theme.zIndex.dropdown};

  @media (min-width: ${theme.breakpoints.md}) {
    gap: 8px;
    padding: 8px 12px;
  }
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
  display: flex;
  align-items: center;

  &::-webkit-scrollbar {
    display: none;
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
  padding: 64px 24px;
  text-align: center;
  color: ${theme.colors.textMuted};

  div {
    width: 64px;
    height: 64px;
    border-radius: ${theme.borderRadius.full};
    background: ${theme.colors.bgMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.colors.ink500};
    line-height: 1;
  }

  p {
    margin: 12px 0 0;
    font-size: ${theme.fontSize.sm};
    line-height: 1.7;
    letter-spacing: -0.01em;
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
  /* AreaSelect 버튼이 FilterBar 우측 끝에 위치하므로 왼쪽으로 펼침 →
     오른쪽 정렬. left:0 은 뷰포트 밖으로 dropdown을 밀어내 가로 스크롤
     유발. */
  right: 0;
  left: auto;
  min-width: 140px;
  /* 작은 화면에서도 뷰포트 밖으로 넘치지 않게 폭 상한. */
  max-width: calc(100vw - 24px);
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

// ─── Segmented control (지도 / 목록) ───────────────────────
export const Segmented = styled.div`
  display: inline-flex;
  padding: 3px;
  background: ${theme.colors.ink100};
  border-radius: 10px;
  flex-shrink: 0;
`;

export const SegmentedBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? theme.colors.ink900 : theme.colors.ink500)};
  background: ${({ $active }) => ($active ? theme.colors.white : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? theme.shadows.sm : 'none')};
  transition: background 0.15s ease, color 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const SegmentedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 10px;
  font-weight: 700;
`;

// ─── Sort dropdown ─────────────────────────────────────────
export const SortWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const SortBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.ink700};
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.ink100};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const SortMenu = styled.ul<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 140px;
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.ink200};
  border-radius: 12px;
  box-shadow: ${theme.shadows.lg};
  padding: 4px;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  z-index: ${theme.z.mapFloatingButton};
  list-style: none;
`;

export const SortOption = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? theme.colors.primary : theme.colors.ink900)};
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.ink50};
  }
`;

// ─── Toolbar row (segmented + sort) ────────────────────────
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid ${theme.colors.ink100};
  background: ${theme.colors.bg};
  flex-shrink: 0;
`;
