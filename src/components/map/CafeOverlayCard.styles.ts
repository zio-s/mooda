import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';
import { CATEGORY_META } from '@/constants/moods';

/**
 * T7-B6 Desktop Overlay Card — PC 전용. 모바일에서는 display:none 으로 숨겨서
 * isDesktop 훅 렌더 분기와 이중 가드. ListPanel + 지도 컨트롤과 겹침 방지
 * 는 MapArea flex:1 컨텍스트 내 absolute 배치로 해결.
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

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
`;

export const MetaSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const CafeTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
  letter-spacing: -0.01em;
`;

export const MetaInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.ink500};

  svg {
    vertical-align: middle;
  }
`;

export const MetaInlineItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

export const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

export const ActionCell = styled.button`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  color: ${theme.colors.ink700};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;

  svg {
    color: ${theme.colors.ink700};
  }

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    svg {
      color: ${theme.colors.primary};
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 10px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.ink900};
`;

export const MoodChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const MoodChip = styled.span<{ $category: keyof typeof CATEGORY_META }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $category }) =>
    CATEGORY_META[$category]?.bg ?? theme.colors.ink100};
  color: ${({ $category }) =>
    CATEGORY_META[$category]?.fg ?? theme.colors.ink700};
  font-size: 12px;
  font-weight: ${theme.fontWeight.medium};
`;

export const MoodCount = styled.span`
  opacity: 0.8;
  font-weight: ${theme.fontWeight.normal};
`;

export const InfoList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: ${theme.colors.ink700};

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${theme.colors.ink500};
  }
`;

export const InfoLink = styled.a`
  color: ${theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const ReviewAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const ReviewSample = styled.article`
  padding: 12px;
  border: 1px solid ${theme.colors.borderLight};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.bg};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ReviewAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.ink700};
  font-weight: ${theme.fontWeight.medium};
`;

export const ReviewStars = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: ${theme.colors.star};
`;

export const ReviewText = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${theme.colors.ink700};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const EmptyLine = styled.p`
  margin: 0;
  padding: 12px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.bg};
  color: ${theme.colors.ink500};
  font-size: ${theme.fontSize.xs};
  text-align: center;
`;
