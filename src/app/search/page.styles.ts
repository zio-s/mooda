'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

export const Wrapper = styled.div`
  /* iOS Safari 주소창 토글로 100dvh가 재계산되면 Body 스크롤 위치가 튀는
     현상이 있음. 고정 height + 외부 overflow:hidden로 Body(검색 결과)
     하나만 스크롤 영역으로 일원화. */
  height: 100dvh;
  overflow: hidden;
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
  min-width: 0;
  border: none;
  background: transparent;
  color: ${theme.colors.ink900};
  font-size: 16px; /* iOS 16px 하한 */
  font-weight: 500;
  outline: none;

  /* 포커스 피드백은 부모 InputWrap의 brand border + tint shadow가 담당.
     전역 :focus-visible box-shadow 규칙이 인풋에 이중 링을 그리는 문제
     방지 — 여기서 명시적으로 비활성화. */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

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
  min-height: 0; /* flex item이 scroll container가 되도록 필수 */
  overflow-y: auto;
  overscroll-behavior: contain;
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

// role="button" 의 <div> — <button> 안에 <button>(RowRemove) 중첩이 HTML 스펙
// 위반이라 native button 사용 불가. keyboard/focus 동작은 SearchClient 에서
// tabIndex + onKeyDown 으로 보강, 여기서는 button 감각 시각/제스처만 복원.
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s ease;

  &:hover {
    background: ${theme.colors.ink50};
  }

  &:active {
    background: ${theme.colors.ink100};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${theme.colors.primary};
  }

  &[aria-disabled='true'] {
    cursor: default;
    opacity: 0.6;
  }

  &[aria-disabled='true']:hover,
  &[aria-disabled='true']:active {
    background: transparent;
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
