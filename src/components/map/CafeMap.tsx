'use client';

/**
 * Cafe map provider router. 사용자가 선택한 mapProvider에 따라 Kakao / Naver
 * 어댑터를 런타임에 교체. 선택 상태는 mapSlice.provider에서 읽고, Redux 쓰기는
 * 어댑터 내부에서 자체적으로 처리한다.
 */
import { useAppSelector } from '@/store/hooks';
import { KakaoCafeMap } from './adapters/KakaoCafeMap';
import { NaverCafeMap } from './adapters/NaverCafeMap';
import type { CafeMapAdapterProps } from './adapters/types';

export function CafeMap(props: CafeMapAdapterProps) {
  const provider = useAppSelector((s) => s.map.provider);
  if (provider === 'naver') return <NaverCafeMap {...props} />;
  return <KakaoCafeMap {...props} />;
}
