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

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ─── 선택된 마커 바운스 애니메이션 ──────────────────────────
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
  50% { transform: translateY(-5px); }
  70% { transform: translateY(-8px); }
`;

export const SelectedMarkerWrap = styled.div`
  cursor: pointer;
  animation: ${bounce} 0.6s ease-out;

  img {
    display: block;
  }
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
