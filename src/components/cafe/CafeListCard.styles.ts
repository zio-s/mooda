import styled from 'styled-components';
import { theme } from '@/styles/theme';
import { CATEGORY_META } from '@/constants/moods';

export const Wrapper = styled.button<{ $selected: boolean }>`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selected }) =>
    $selected ? theme.colors.primaryLight : 'transparent'};
  box-shadow: ${({ $selected }) =>
    $selected ? `inset 3px 0 0 ${theme.colors.primary}` : 'none'};
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? theme.colors.primaryLight : theme.colors.ink50};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${theme.colors.primary};
  }
`;

export const Thumb = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  background: ${theme.colors.ink100};

  img {
    object-fit: cover;
  }
`;

export const ThumbPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.ink300};
`;

export const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
`;

export const CafeName = styled.span`
  font-size: 14.5px;
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.ink900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${theme.colors.ink500};

  svg {
    vertical-align: middle;
  }
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

export const MoodRow = styled.div`
  display: flex;
  gap: 4px;
  overflow: hidden;

  > * {
    flex-shrink: 0;
  }
`;

export const MoodTag = styled.span<{ $category: keyof typeof CATEGORY_META }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
  font-size: 11.5px;
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $category }) =>
    CATEGORY_META[$category]?.bg ?? theme.colors.ink100};
  color: ${({ $category }) =>
    CATEGORY_META[$category]?.fg ?? theme.colors.ink700};
  white-space: nowrap;
`;
