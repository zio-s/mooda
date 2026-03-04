'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

const StyledInput = styled.input`
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  background: transparent;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${theme.colors.textLight};
  }

  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${theme.colors.bgMuted};
  }
`;

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <StyledInput ref={ref} {...props} />
);
Input.displayName = 'Input';
