import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

export const MapErrorWrapper = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
`;

// ─── 현재 위치 버튼 ──────────────────────────────────────
export const LocateBtn = styled.button<{ $locating?: boolean }>`
  position: absolute;
  bottom: 88px;          /* ZoomControl 위에 위치 */
  right: 12px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.bg};
  border: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${theme.shadows.md};
  color: ${({ $locating }) => ($locating ? theme.colors.primary : theme.colors.text)};
  transition: all 0.2s ease;

  svg {
    animation: ${({ $locating }) => ($locating ? pulse : 'none')} 1s ease infinite;
  }

  &:hover {
    background: ${theme.colors.primaryLight};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primaryText};
  }
`;
