import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const CardWrapper = styled.article`
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
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

export const PhotoPlaceholder = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: ${theme.colors.textMuted};
`;

export const StatusBadge = styled.span<{ $open: boolean }>`
  position: absolute;
  left: 8px;
  top: 8px;
  border-radius: ${theme.borderRadius.full};
  padding: 2px 8px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $open }) => ($open ? '#dcfce7' : '#fee2e2')};
  color: ${({ $open }) => ($open ? '#15803d' : '#dc2626')};
`;

export const Content = styled.div`
  padding: 12px;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const NameLink = styled(Link)`
  min-width: 0;
  text-decoration: none;
  display: block;
`;

export const CafeName = styled.h3`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.colors.text};
  margin: 0;
  transition: color 0.15s ease;

  ${NameLink}:hover & {
    color: ${theme.colors.primaryDark};
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
  height: 20px;
  padding: 0 6px;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.primaryMid};
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryText};
  font-size: ${theme.fontSize.xs};
`;
