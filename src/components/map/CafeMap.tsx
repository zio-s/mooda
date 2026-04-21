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
  // BUG-MAP-A4: key prop 으로 provider 별 어댑터 tree 를 분리 → 토글 시 React 가
  // 이전 어댑터 unmount(→ SDK destroy) 후 새 어댑터 mount 를 동기 순서로 보장.
  // key 없이 컴포넌트 타입만 바꾸면 두 SDK 인스턴스가 DOM 에 일시 overlap 가능.
  if (provider === 'naver') return <NaverCafeMap key="naver" {...props} />;
  return <KakaoCafeMap key="kakao" {...props} />;
}
