'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const Wrapper = styled.div`
  min-height: 100dvh;
  background: ${theme.colors.white};
  display: flex;
  flex-direction: column;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;
  background: ${theme.colors.white};
  border-bottom: 1px solid ${theme.colors.ink100};
`;

/* iOS HIG 최소 터치 타깃 44px — 검색은 primary action이라 sm(40) 대신 md(44). */
export const BackButton = styled.button`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.ink700};
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.ink100};
  }
`;

export const InputWrap = styled.div<{ $focused: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border-radius: 22px;  /* height/2 */
  background: ${theme.colors.ink100};
  border: 1.5px solid
    ${({ $focused }) => ($focused ? theme.colors.primary : 'transparent')};
  box-shadow: ${({ $focused }) =>
    $focused ? `0 0 0 3px ${theme.colors.primaryLight}` : 'none'};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  color: ${theme.colors.ink500};
`;

export const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: ${theme.colors.ink900};
  font-size: 16px; /* iOS 16px 하한 */
  font-weight: 500;
  outline: none;

  &::placeholder {
    color: ${theme.colors.ink400};
    font-weight: 400;
  }
`;

/* 시각은 20px 원 유지, hit area는 32px — 모바일 loose-touch 대응. */
export const ClearButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${theme.colors.white};

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${theme.colors.ink300};
    position: absolute;
    z-index: -1;
  }
  /* icon은 자식으로 들어오므로 ::before가 뒤로 깔리게 stacking context 필요. */
  position: relative;
  z-index: 0;

  & > * {
    position: relative;
    z-index: 1;
  }
`;

export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.ink500};
  letter-spacing: 0.02em;
`;

export const ClearAllButton = styled.button`
  font-size: 12px;
  font-weight: 500;
  color: ${theme.colors.ink500};
  padding: 4px 8px;
  border-radius: 6px;

  &:hover {
    background: ${theme.colors.ink100};
  }
`;

export const Band = styled.div`
  height: 8px;
  background: ${theme.colors.ink50};
`;

export const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  text-align: left;
  transition: background 0.12s ease;

  &:hover {
    background: ${theme.colors.ink50};
  }

  &:active {
    background: ${theme.colors.ink100};
  }
`;

export const IconBox = styled.div<{ $variant: 'mooda' | 'generic' | 'recent' }>`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $variant }) =>
    $variant === 'mooda'
      ? theme.colors.primaryLight
      : $variant === 'recent'
        ? theme.colors.ink50
        : theme.colors.ink100};
  color: ${({ $variant }) =>
    $variant === 'mooda' ? theme.colors.primary : theme.colors.ink500};
`;

export const RowBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const RowTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14.5px;
  font-weight: 600;
  color: ${theme.colors.ink900};

  /* highlight segments */
  mark {
    background: rgba(180, 83, 9, 0.14);
    color: ${theme.colors.primary};
    padding: 0 1px;
    border-radius: 2px;
  }
`;

export const MoodaChip = styled.span`
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: 4px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

export const RowMeta = styled.div`
  margin-top: 2px;
  font-size: 12.5px;
  color: ${theme.colors.ink500};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowRemove = styled.button`
  flex-shrink: 0;
  padding: 8px;
  color: ${theme.colors.ink400};

  &:hover {
    color: ${theme.colors.ink700};
  }
`;

export const InfoNote = styled.p`
  padding: 20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px);
  font-size: 12px;
  line-height: 1.5;
  color: ${theme.colors.ink500};
  background: ${theme.colors.ink50};
`;

export const EmptyState = styled.div`
  padding: 48px 20px;
  text-align: center;
  color: ${theme.colors.ink500};
  font-size: 14px;
`;

export const LoadingLine = styled.div`
  padding: 24px 20px;
  font-size: 13px;
  color: ${theme.colors.ink500};
  text-align: center;
`;

export const HintCard = styled.div`
  margin: 24px 20px;
  padding: 20px;
  border-radius: 16px;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primaryHover};

  h3 {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  p {
    font-size: 12.5px;
    line-height: 1.5;
    color: ${theme.colors.ink700};
  }
`;
