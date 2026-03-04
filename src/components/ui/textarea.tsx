'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

const StyledTextarea = styled.textarea`
  display: block;
  width: 100%;
  min-height: 80px;
  padding: 8px 12px;
  border-radius: ${theme.borderRadius.md};
  border: 1.5px solid ${theme.colors.border};
  background: transparent;
  font-size: ${theme.fontSize.sm};
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  color: ${theme.colors.text};

  &::placeholder {
    color: ${theme.colors.textLight};
  }

  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => <StyledTextarea ref={ref} {...props} />);

Textarea.displayName = 'Textarea';
