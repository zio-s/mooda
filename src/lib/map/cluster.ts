import type { Cafe } from '@/types';

/**
 * 화면 좌표가 아닌 **위경도 grid** 기반의 경량 클러스터러.
 *
 * Naver `MarkerClustering`이 공식 submodule이 아니라 별도 외부 스크립트라
 * 로드 실패가 잦아, 외부 의존 없이 동일 시각 효과(halo + count)를 내기 위한
 * 순수 함수로 대체. zoom → 도(degree) step 매핑은 휴리스틱이지만 서울 도심
 * 기준 grid ~120px과 유사한 분포를 보인다.
 */

export type ClusterEntry =
  | { kind: 'single'; cafe: Cafe }
  | {
      kind: 'cluster';
      key: string;
      lat: number;
      lng: number;
      size: number;
      cafeIds: string[];
    };

/**
 * Naver zoom 기준 grid step (도 단위). zoom이 1 오를 때마다 절반.
 *  zoom 15 → ~0.002°  (~220m at 서울 위도)
 *  zoom 13 → ~0.008°  (~880m)
 *  zoom 11 → ~0.032°  (~3.5km)
 */
function degreeStepForZoom(zoom: number): number {
  return 0.002 * Math.pow(2, 15 - zoom);
}

export function computeClusters(cafes: readonly Cafe[], zoom: number): ClusterEntry[] {
  const step = degreeStepForZoom(zoom);
  if (step <= 0 || !Number.isFinite(step)) {
    return cafes.map((cafe) => ({ kind: 'single', cafe }));
  }

  const buckets = new Map<string, Cafe[]>();
  for (const cafe of cafes) {
    const x = Math.floor(cafe.lng / step);
    const y = Math.floor(cafe.lat / step);
    const key = `${x},${y}`;
    const list = buckets.get(key);
    if (list) list.push(cafe);
    else buckets.set(key, [cafe]);
  }

  const out: ClusterEntry[] = [];
  for (const [key, group] of buckets) {
    if (group.length === 1) {
      out.push({ kind: 'single', cafe: group[0] });
    } else {
      let sumLat = 0;
      let sumLng = 0;
      const ids: string[] = [];
      for (const c of group) {
        sumLat += c.lat;
        sumLng += c.lng;
        ids.push(c.id);
      }
      out.push({
        kind: 'cluster',
        key,
        lat: sumLat / group.length,
        lng: sumLng / group.length,
        size: group.length,
        cafeIds: ids,
      });
    }
  }
  return out;
}

export const CLUSTER_TIERS = [
  { max: 10, size: 28, spread: 6, font: 12 },
  { max: 30, size: 32, spread: 7, font: 12 },
  { max: 50, size: 40, spread: 8, font: 13 },
  { max: Infinity, size: 48, spread: 10, font: 14 },
] as const;

export function tierForCount(count: number) {
  for (const tier of CLUSTER_TIERS) {
    if (count < tier.max) return tier;
  }
  return CLUSTER_TIERS[CLUSTER_TIERS.length - 1];
}
