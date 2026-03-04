'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';

// ─── 공통 필드 레이아웃 ──────────────────────────────────────────────────────
export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const FieldLabel = styled.label`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

export const RequiredMark = styled.span`
  color: ${theme.colors.error};
  margin-left: 2px;
`;

export const OptionalText = styled.span`
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.textLight};
  margin-left: 4px;
  font-size: ${theme.fontSize.xs};
`;

// ─── Textarea 래퍼 (글자 수 카운터용) ────────────────────────────────────────
export const TextareaWrapper = styled.div`
  position: relative;
`;

export const CharCounter = styled.span<{ $over: boolean }>`
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: ${theme.fontSize.xs};
  color: ${({ $over }) => ($over ? theme.colors.error : theme.colors.textLight)};
  pointer-events: none;
`;

export const InputCounter = styled.span<{ $over: boolean }>`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: ${theme.fontSize.xs};
  color: ${({ $over }) => ($over ? theme.colors.error : theme.colors.textLight)};
  pointer-events: none;
`;

export const ErrorMsg = styled.p`
  margin: 2px 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.error};
`;

// ─── 버튼 ────────────────────────────────────────────────────────────────────
export const CancelBtn = styled.button`
  height: 36px;
  padding: 0 16px;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: transparent;
  font-size: ${theme.fontSize.sm};
  font-family: inherit;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.bgMuted};
    color: ${theme.colors.text};
  }
`;

export const SubmitBtn = styled.button`
  height: 36px;
  padding: 0 20px;
  border-radius: ${theme.borderRadius.md};
  border: none;
  background: ${theme.colors.primary};
  color: white;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
