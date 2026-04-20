'use client';

import styled from 'styled-components';

/**
 * 스크린리더에는 노출되지만 시각적으로는 완전히 숨김.
 * 지도 같은 비텍스트 UI 옆에 내용물 목록을 제공해 a11y 보완.
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const VisuallyHiddenBlock = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
