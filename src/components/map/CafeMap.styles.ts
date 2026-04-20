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
// 40×40 iOS HIG 최소 터치 타깃 (기존 36px에서 상향, r12, shadow md)
export const LocateBtn = styled.button<{ $locating?: boolean }>`
  position: absolute;
  /* ZoomControl 위 + iPhone home indicator 회피 */
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  right: calc(12px + env(safe-area-inset-right, 0px));
  z-index: ${theme.z.mapFloatingButton};
  width: ${theme.touch.sm};
  height: ${theme.touch.sm};
  border-radius: 12px;
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${theme.shadows.md};
  color: ${({ $locating }) => ($locating ? theme.colors.primary : theme.colors.ink700)};
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  svg {
    animation: ${({ $locating }) => ($locating ? pulse : 'none')} 1s ease infinite;
  }

  &:hover {
    background: ${theme.colors.primaryLight};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const NearbyLoadingOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.8);
  color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  box-shadow: ${theme.shadows.lg};
  pointer-events: none;

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;
