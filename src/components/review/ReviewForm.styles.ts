'use client';

import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/theme';

// ─── 애니메이션 ───────────────────────────────────────────────────────────────
const fadeSlide = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── 폼 래퍼 ─────────────────────────────────────────────────────────────────
export const FormWrapper = styled.div<{ $compact?: boolean }>`
  border-radius: ${theme.borderRadius.lg};
  border: 1.5px solid ${theme.colors.primaryMid};
  background: ${theme.colors.primaryLight};
  padding: ${({ $compact }) => ($compact ? '14px' : '20px')};
  animation: ${fadeSlide} 0.2s ease;
`;

export const FormTitle = styled.h3`
  margin: 0 0 16px;
  font-size: ${theme.fontSize.md};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.text};
`;

export const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

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
  background: transparent;
`;

export const ErrorMsg = styled.p`
  margin: 2px 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.error};
`;

// ─── 폼 하단 버튼 영역 ────────────────────────────────────────────────────────
export const FormFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

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

// ─── 비로그인 안내 ────────────────────────────────────────────────────────────
export const LoginNotice = styled.div`
  padding: 24px;
  text-align: center;
  border-radius: ${theme.borderRadius.lg};
  border: 1px dashed ${theme.colors.border};
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
  line-height: 1.6;
`;

// ─── 내 기존 리뷰 카드 ────────────────────────────────────────────────────────
export const MyReviewCard = styled.div`
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.primaryMid};
  padding: 16px;
  background: ${theme.colors.primaryLight};
`;

export const MyReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const MyReviewBadge = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.primaryText};
  background: ${theme.colors.primaryMid};
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
`;

export const EditBtn = styled.button`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
  background: none;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: 3px 10px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: ${theme.colors.text};
    border-color: ${theme.colors.text};
  }
`;

export const MyReviewContent = styled.p`
  margin: 8px 0 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  line-height: 1.5;
`;

// ─── 리뷰 작성 유도 섹션 ─────────────────────────────────────────────────────
export const WriteReviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0 8px;
`;

export const WriteReviewBtn = styled.button`
  align-self: flex-start;
  height: 36px;
  padding: 0 20px;
  border-radius: ${theme.borderRadius.md};
  border: 1.5px solid ${theme.colors.primary};
  background: transparent;
  color: ${theme.colors.primaryText};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryLight};
  }
`;
