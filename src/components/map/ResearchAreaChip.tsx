'use client';

import styled, { keyframes } from 'styled-components';
import { Search } from 'lucide-react';
import { theme } from '@/styles/theme';

type Props = {
  visible: boolean;
  loading?: boolean;
  onClick: () => void;
};

const slideDown = keyframes`
  from { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

const Wrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: ${theme.z.mapFloatingButton};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease;
  animation: ${({ $visible }) => ($visible ? slideDown : 'none')} 0.18s ease-out;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: ${theme.colors.ink900};
  color: ${theme.colors.white};
  font-size: 12.5px;
  font-weight: 600;
  box-shadow: ${theme.shadows.lg};
  cursor: pointer;
  transition: transform 0.12s ease, background 0.15s ease;

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export function ResearchAreaChip({ visible, loading, onClick }: Props) {
  return (
    <Wrapper $visible={visible} aria-hidden={!visible}>
      <Chip type="button" onClick={onClick} disabled={!visible || loading}>
        <Search aria-hidden />
        {loading ? '검색 중…' : '이 지역 재검색'}
      </Chip>
    </Wrapper>
  );
}
