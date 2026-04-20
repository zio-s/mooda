import type { Cafe } from '@/types';

/**
 * 카페 지도 어댑터 공통 props. Kakao / Naver 구현체가 모두 구현한다.
 *
 * CafeMapWrapper (dynamic import + SSR 가드) 아래에 위치하며, 상위(MapClient)는
 * 어떤 provider가 떠 있는지 알 필요 없이 동일 API로 호출한다.
 */
export interface CafeMapAdapterProps {
  cafes: Cafe[];
  onCafeSelect?: (cafe: Cafe | null) => void;
  onNearbyFound?: (cafe: Cafe) => void;
}
