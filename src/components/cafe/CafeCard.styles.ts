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
  border: 1px solid transparent;
  background: ${theme.colors.bgCard};
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;

  /* transform / translate / scale 제거. 호버는 shadow 강조 + 테두리로만
     표현 → 이미지 줌 없음, 카드 들썩임 없음, jank 최소. */
  @media (hover: hover) and (pointer: fine) {
    ${CardLink}:hover & {
      box-shadow: ${theme.shadows.md};
      border-color: ${theme.colors.border};
    }
  }
`;

export const PhotoArea = styled.div<{ $compact?: boolean }>`
  position: relative;
  overflow: hidden;
  background: ${theme.colors.bgMuted};
  /* 고정 비율로 고정 — 이미지 소스 비율이 다양해도 카드 레이아웃이 튀지 않음.
     16:9에 가까운 카드 썸네일 비율. $compact(즐겨찾기 카드)만 짧게. */
  aspect-ratio: ${({ $compact }) => ($compact ? '16 / 9' : '5 / 3')};
  width: 100%;

  /* Next/Image fill일 때 내부 img가 position:absolute + inset:0. object-fit
     cover가 제대로 먹도록 명시. 호버 스케일 제거(위 CardWrapper와 동일 이유). */
  & > img,
  & > span > img {
    object-fit: cover;
    object-position: center;
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
  /* 시각적으로 아이콘은 16px이지만 터치 타겟은 44×44 확보 (iOS HIG).
     padding으로 hit area 확장 → 주변 요소와 겹치지 않게 외곽 margin은 최소. */
  width: 44px;
  height: 44px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
  transition: color 0.15s ease;

  &:hover {
    color: ${theme.colors.err};
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
  color: ${theme.colors.onPrimaryTint};
  font-size: 11px;
  font-weight: ${theme.fontWeight.medium};
`;
