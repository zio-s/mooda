'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const SearchWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const SearchInputWrap = styled.div<{ $focused?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid ${({ $focused }) => ($focused ? theme.colors.primary : theme.colors.border)};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  transition: border-color 0.15s ease;

  svg {
    flex-shrink: 0;
    color: ${theme.colors.textMuted};
  }
`;

export const SearchInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  width: 120px;

  &::placeholder {
    color: ${theme.colors.textLight};
  }

  @media (min-width: ${theme.breakpoints.md}) {
    width: 180px;
  }
`;

export const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${theme.colors.textMuted};

  @media (hover: hover) {
    &:hover {
      color: ${theme.colors.text};
    }
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 280px;
  max-height: 320px;
  overflow-y: auto;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  z-index: ${theme.zIndex.dropdown};
  padding: 4px;
`;

export const ResultItem = styled.button<{ $hasId?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;

  @media (hover: hover) {
    &:hover {
      background: ${theme.colors.bgMuted};
    }
  }
`;

export const ResultName = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const ResultAddress = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

export const ResultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeight.medium};
`;

export const NoResult = styled.div`
  padding: 16px;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

export const LoadingText = styled.div`
  padding: 16px;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;
