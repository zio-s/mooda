'use client';

import styled from 'styled-components';
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
  padding: 16px 16px 64px;
`;

// ─── Photo ───────────────────────────────────────────────
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

export const FavoriteButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${({ $active }) => ($active ? '#fca5a5' : theme.colors.border)};
  background: ${({ $active }) => ($active ? '#fef2f2' : 'transparent')};
  color: ${({ $active }) => ($active ? theme.colors.error : theme.colors.text)};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #fca5a5;
    background: #fef2f2;
    color: ${theme.colors.error};
  }
`;

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

export const MoodVoteButton = styled.button<{ $voted?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $voted }) => $voted ? theme.colors.primary : theme.colors.primaryMid};
  background: ${({ $voted }) => $voted ? theme.colors.primary : theme.colors.primaryLight};
  padding: 6px 12px;
  font-size: ${theme.fontSize.sm};
  color: ${({ $voted }) => $voted ? theme.colors.white : theme.colors.primaryText};
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: ${({ $voted }) => $voted ? '600' : '400'};

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
  color: ${theme.colors.primaryText};
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
  background: #fef3c7;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: #92400e;
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
