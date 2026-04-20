'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

// ─── 배경 오버레이 ──────────────────────────────────────────────────
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 140;
  -webkit-tap-highlight-color: transparent;

  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

// ─── 시트 본체 ──────────────────────────────────────────────────────
export const SheetWrap = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 150;
  background: ${theme.colors.bgCard};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(${({ $visible }) => ($visible ? '0' : '110%')});
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  /* iPhone SE 같은 작은 세로(667px) 기기에서 '경로 상세' 펼쳤을 때 컨텐츠가
     잘리지 않도록. dvh는 주소창 상태 반영, 140은 지도가 항상 약간은 보이도록. */
  max-height: min(75vh, calc(100dvh - 140px));
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  /* scroll chain 차단 — 시트 내부 스크롤 끝에서 지도(배경)까지 스크롤이
     번지는 iOS 기본 동작 억제. pan-y만 허용(좌우 제스처는 지도에 위임). */
  overscroll-behavior: contain;
  touch-action: pan-y;

  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

export const HandleBar = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 6px;
  border-radius: 2px;
  background: ${theme.colors.border};
  flex-shrink: 0;
`;

export const InfoSection = styled.div`
  /* 하단은 iPhone home indicator와 겹치지 않게 safe-area 반영. */
  padding: 0 16px calc(14px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  /* 이 영역은 요약 정보라 고정 높이에 맞게 렌더. 스크롤이 필요한 긴 경로
     상세는 ExpandedSection이 담당 → 이중 스크롤 영역 제거. */
  overflow: visible;
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
  /* 카페명은 primaryLight 배경이 아니라 card 배경 위의 primary heading →
     ink900(theme.colors.text)로 통일해 가독성 우선. */
  color: ${theme.colors.text};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
`;

export const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.bgMuted};
  color: ${theme.colors.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  position: relative;
  z-index: 10;

  &:hover,
  &:active {
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
  color: ${theme.colors.onPrimaryTint};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  flex-wrap: wrap;
`;

export const DetailLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: none;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${theme.colors.primaryDark};
  }
`;

// 네이버지도 길찾기 링크 — 앱 딥링크 우선, 웹 폴백. 브랜드 컬러는 naver green.
export const NaverDirectionsLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: ${theme.borderRadius.md};
  background: #03c75a;
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: none;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: #02b050;
  }
`;

export const ToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 8px 12px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.bgMuted};
  color: ${theme.colors.text};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover,
  &:active {
    background: ${theme.colors.border};
  }

  svg {
    transition: transform 0.2s ease;
  }
`;

// ─── 확장 영역 (경로 상세) ──────────────────────────────────────────
export const ExpandedSection = styled.div`
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  flex: 1;
  min-height: 0;
  border-top: 1px solid ${theme.colors.border};
  margin-top: 4px;
`;

export const RouteSection = styled.div`
  padding: 8px 16px 16px;
`;
