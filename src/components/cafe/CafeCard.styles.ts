import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

/**
 * 카드 전체가 하나의 링크로 동작하도록 CardLink로 감싼다. 내부의 인터랙티브
 * 요소(♥ 버튼 등)는 e.preventDefault + e.stopPropagation으로 네비게이션을
 * 막고 자신의 핸들러만 실행.
 */
export const CardLink = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.lg};
  }
`;

export const CardWrapper = styled.article`
  border-radius: ${theme.borderRadius.lg};
  border: none;
  background: ${theme.colors.bgCard};
  overflow: hidden;
  box-shadow: ${theme.shadows.card};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  @media (hover: hover) {
    ${CardLink}:hover & {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.cardHover};
    }
  }

  ${CardLink}:active & {
    transform: translateY(0);
  }
`;

export const PhotoArea = styled.div<{ $compact?: boolean }>`
  position: relative;
  overflow: hidden;
  background: ${theme.colors.bgMuted};
  height: ${({ $compact }) => ($compact ? '128px' : '176px')};

  img {
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  ${CardWrapper}:hover & img {
    transform: scale(1.05);
  }
`;

export const PhotoCarousel = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  height: 100%;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const PhotoSlide = styled.div`
  flex: 0 0 100%;
  scroll-snap-align: start;
  position: relative;
  height: 100%;
`;

export const PhotoDots = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 2;
`;

export const PhotoDot = styled.span<{ $active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#fff' : 'rgba(255, 255, 255, 0.5)')};
  transition: background 0.2s ease;
`;

/**
 * 사진이 많을 때 점 N개 대신 "N/M" pill로 전환 — 노이즈 감축.
 * 우측 하단에 놓아 점과 시각적으로 다름을 명시.
 */
export const PhotoCountPill = styled.span`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  z-index: 2;
`;

export const PhotoPlaceholder = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: ${theme.colors.textMuted};
`;

/**
 * OpenBadge가 사진 위 위에 올라갈 자리. OpenBadge 자체는 별도 컴포넌트
 * (02_components.md § OpenBadge)에서 색/아이콘을 관리한다.
 */
export const BadgeAnchor = styled.div`
  position: absolute;
  left: 8px;
  top: 8px;
  display: inline-flex;
`;

export const Content = styled.div`
  padding: 12px 14px 14px;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const CafeName = styled.h3`
  min-width: 0;
  flex: 1;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.colors.text};
  margin: 0;
  transition: color 0.15s ease;

  ${CardLink}:hover & {
    color: ${theme.colors.primaryHover};
  }
`;

export const FavoriteBtn = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: ${theme.colors.textMuted};
  transition: color 0.15s ease;

  &:hover {
    color: #f87171;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

export const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const MoodTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

export const MoodTag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: ${theme.borderRadius.full};
  border: none;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryText};
  font-size: 11px;
  font-weight: ${theme.fontWeight.medium};
`;
