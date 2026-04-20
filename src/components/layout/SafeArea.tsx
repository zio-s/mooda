'use client';

import styled from 'styled-components';

/**
 * PWA safe-area insets (iPhone notch / home indicator).
 * Requires `viewport-fit=cover` in layout.tsx viewport export (already set).
 */

export const SafeAreaTop = styled.div`
  padding-top: env(safe-area-inset-top, 0px);
`;

export const SafeAreaBottom = styled.div`
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;

export const SafeAreaInset = styled.div`
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
`;

/** Full-height container that fills the viewport accounting for safe areas. */
export const SafeAreaFill = styled.div`
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;
