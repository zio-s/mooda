'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/styles/theme';

/**
 * 데스크톱 뷰포트(≥1024px) 감지. SSR hydration mismatch 방지를 위해 초기 false 로
 * 렌더 후 client 에서 matchMedia 결과로 업데이트한다. Phase 7-B 에서 FilterBar
 * 한 줄 / Segmented 제거 / CafeOverlayCard 렌더 분기에 사용.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${theme.breakpoints.lg})`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}
