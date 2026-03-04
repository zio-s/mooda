'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

const StyledLabel = styled.label`
  display: block;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
  line-height: 1.5;
  user-select: none;
`;

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  (props, ref) => <StyledLabel ref={ref} {...props} />
);
Label.displayName = 'Label';
