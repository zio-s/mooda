'use client';

import styled, { css, keyframes } from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  margin-left: -8px;
  padding: 6px 8px;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;

export const DetailWrapper = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 48px);
`;

export const ContentInner = styled.div`
  padding: 20px 16px 0;
`;

// ─── Hero ─────────────────────────────────────────────────
export const HeroShell = styled.div`
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  background: ${theme.colors.ink100};

  @media (min-width: ${theme.breakpoints.sm}) {
    border-bottom-left-radius: ${theme.borderRadius.xl};
    border-bottom-right-radius: ${theme.borderRadius.xl};
  }
`;

export const HeroGradient = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${theme.colors.primaryLight2} 0%, ${theme.colors.primaryLight} 100%);

  /* 빗금 텍스처 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.22) 0 2px,
      transparent 2px 14px
    );
    mix-blend-mode: soft-light;
    pointer-events: none;
  }
`;

export const HeroGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.ink300};
  filter: drop-shadow(0 4px 10px rgba(180, 83, 9, 0.18));
`;

export const HeroOverlay = styled.div`
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  z-index: 5;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

export const HeroFab = styled.button<{ $active?: boolean }>`
  /* iOS HIG 최소 터치 타겟 44 — 주요 액션(뒤로·공유·Heart)이라 sm(40) 탈피. */
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: ${({ $active }) => ($active ? theme.colors.err : theme.colors.ink900)};
  box-shadow: ${theme.shadows.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, background 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
`;

export const HeroFabGroup = styled.div`
  display: inline-flex;
  gap: 8px;
`;

export const HeroCountPill = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: ${theme.colors.white};
  font-size: 11.5px;
  font-weight: 600;
`;

export const HeroPhotoFill = styled.div`
  position: absolute;
  inset: 0;
`;

// ─── Legacy Hero (CafeCard용, back-compat) ──────────────
export const HeroPhoto = styled.div`
  position: relative;
  margin-bottom: 24px;
  height: 256px;
  overflow: hidden;
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.bgMuted};

  @media (min-width: ${theme.breakpoints.sm}) {
    height: 320px;
  }
`;

export const PhotoPlaceholder = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 60px;
`;

// ─── Quick Actions ───────────────────────────────────────
export const QuickActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 20px 0 24px;
`;

export const QuickActionCell = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 6px;
  border-radius: 12px;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryHover};
  font-size: 11.5px;
  font-weight: 600;
  transition: background 0.15s ease, transform 0.12s ease;

  &:active {
    transform: scale(0.97);
    background: ${theme.colors.primaryLight2};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Header Row ──────────────────────────────────────────
export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const HeaderLeft = styled.div``;

export const CafeTitle = styled.h1`
  margin: 0 0 4px;
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.text};
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

export const RatingItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const OpenTime = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${theme.colors.success};
`;

// FavoriteButton 은 Hero FAB 하트 + Quick Actions 저장 버튼으로 대체됨 (Week 3)
// — 사용처 없어 제거.

// ─── Mood Tags ───────────────────────────────────────────
export const MoodSection = styled.div`
  margin-bottom: 24px;
`;

export const MoodSectionTitle = styled.p`
  margin: 0 0 8px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const MoodTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
`;

export const MoodVoteButton = styled.button<{ $voted?: boolean; $shake?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $voted }) => $voted ? theme.colors.primary : theme.colors.primaryMid};
  background: ${({ $voted }) => $voted ? theme.colors.primary : theme.colors.primaryLight};
  padding: 6px 12px;
  font-size: ${theme.fontSize.sm};
  color: ${({ $voted }) => $voted ? theme.colors.white : theme.colors.onPrimaryTint};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  font-weight: ${({ $voted }) => $voted ? '600' : '400'};

  ${({ $shake }) =>
    $shake &&
    css`
      animation: ${shake} 0.3s ease-out;
    `}

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${({ $voted }) => $voted ? theme.colors.primaryDark : theme.colors.primaryMid};
    color: ${theme.colors.white};
  }
`;

export const VoteCount = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primaryMid};
  padding: 1px 6px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.onPrimaryTint};
`;

export const MoodHint = styled.p`
  margin: 6px 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

// ─── Info Section ─────────────────────────────────────────
export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
`;

export const InfoLink = styled.a`
  color: ${theme.colors.primaryText};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const HoursSection = styled.div`
  margin-top: 16px;
`;

export const HoursTitle = styled.p`
  margin: 0 0 8px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const HourRow = styled.div<{ $today?: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: ${theme.fontSize.sm};
  color: ${({ $today }) => ($today ? theme.colors.primaryText : theme.colors.text)};
  font-weight: ${({ $today }) => ($today ? theme.fontWeight.semibold : theme.fontWeight.normal)};
  padding: 2px 0;
`;

export const DescSection = styled.div`
  margin-top: 16px;
`;

export const DescTitle = styled.p`
  margin: 0 0 4px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const DescText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  line-height: 1.6;
`;

// ─── Reviews ─────────────────────────────────────────────
export const ReviewCard = styled.div`
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: 16px;
`;

export const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export const ReviewerName = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const StarRow = styled.div`
  display: flex;
`;

export const ReviewDate = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

export const ReviewContent = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  line-height: 1.5;
`;

export const EmptyMessage = styled.p`
  padding: 32px 0;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

// ─── Google Review ───────────────────────────────────────
export const GoogleReviewCard = styled.div`
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: 16px;
`;

export const GoogleReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

export const GoogleAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.full};
  object-fit: cover;
  background: ${theme.colors.bgMuted};
  flex-shrink: 0;
`;

export const GoogleAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const GoogleRatingBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: ${theme.colors.primaryLight};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primaryHover};
`;

// ─── Gallery ─────────────────────────────────────────────
export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;

  @media (min-width: ${theme.breakpoints.sm}) {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
`;

export const GalleryItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  background: ${theme.colors.bgMuted};

  &:hover img {
    transform: scale(1.05);
  }

  img {
    transition: transform 0.2s ease;
  }
`;

export const GalleryOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${theme.zIndex.modal};
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
`;

export const GalleryNav = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: ${theme.borderRadius.full};
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.15s ease;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

export const GalleryCounter = styled.span`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: ${theme.fontSize.sm};
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: ${theme.borderRadius.full};
`;

// ─── Blog Posts ───────────────────────────────────────────
export const BlogPost = styled.a`
  display: block;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: 16px;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${theme.colors.primaryMid};
    background: ${theme.colors.primaryLight};
  }
`;

export const BlogTitle = styled.h4`
  margin: 0 0 4px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const BlogDesc = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const BlogMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;
