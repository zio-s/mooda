import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const FilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const CategoryGroup = styled.div``;

export const CategoryLabel = styled.p`
  margin: 0 0 8px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const MoodButtonsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const MoodButton = styled.button<{ $selected?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $selected }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  background: ${({ $selected }) =>
    $selected ? theme.colors.primaryLight : theme.colors.bg};
  color: ${({ $selected }) =>
    $selected ? theme.colors.primaryText : theme.colors.text};
  padding: 4px 12px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primaryLight};
  }
`;

export const MoodEmoji = styled.span``;

export const ClearRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
`;

export const SelectionCount = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

// MoodFilterChips
export const ChipsWrapper = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
`;

export const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: ${theme.borderRadius.full};
  border: none;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryText};
  padding: 3px 10px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryMid};
  }
`;
