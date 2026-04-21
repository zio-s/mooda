import styled from 'styled-components';
import { theme } from '@/styles/theme';

/**
 * CafeOverlayCard 쉘 전용 스타일 — TopNav · Hero · 외곽 wrapper.
 * Body 내부 섹션(메타·액션·분위기·정보·리뷰) 은 CafeDetailBody.styles.ts 공용.
 *
 * T7-B6: PC 전용. 모바일에서는 display:none 으로 숨겨서 isDesktop 훅 렌더
 * 분기와 이중 가드. ListPanel + 지도 컨트롤과 겹침 방지는 MapArea flex:1
 * 컨텍스트 내 absolute 배치로 해결.
 */
export const OverlayWrap = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 420px;
  max-width: calc(100% - 32px);
  max-height: calc(100% - 32px);
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: ${theme.z.overlayCard};
  display: flex;
  flex-direction: column;

  @media (max-width: ${theme.breakpoints.xl}) {
    width: 380px;
  }
  @media (max-width: ${theme.breakpoints.lg}) {
    display: none;
  }
`;

export const TopNav = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${theme.colors.borderLight};
  z-index: 1;
`;

export const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${theme.touch.md};
  height: ${theme.touch.md};
  border-radius: ${theme.borderRadius.full};
  background: transparent;
  color: ${theme.colors.ink700};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${theme.colors.ink100};
    color: ${theme.colors.ink900};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const HeroArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: ${theme.colors.ink100};
  overflow: hidden;
  flex-shrink: 0;
`;

export const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const HeroPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.ink300};
`;

export const PhotoCounter = styled.span`
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 3px 10px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(28, 25, 23, 0.6);
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;
