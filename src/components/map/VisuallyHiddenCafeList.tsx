'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PATHS } from '@/constants/paths';
import { VisuallyHiddenBlock } from '@/components/a11y/VisuallyHidden';
import { computeOpenStatus, type CafeHourInput } from '@/lib/cafe/openStatus';
import type { Cafe } from '@/types';

const STATUS_LABEL: Record<'open' | 'closing-soon' | 'closed', string> = {
  open: '영업중',
  'closing-soon': '영업 종료 임박',
  closed: '영업종료',
};

function openStatusFor(cafe: Cafe): 'open' | 'closing-soon' | 'closed' | null {
  if (!cafe.hours || cafe.hours.length === 0) {
    if (cafe.isOpen === true) return 'open';
    if (cafe.isOpen === false) return 'closed';
    return null;
  }
  const normalized: CafeHourInput[] = cafe.hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime ?? null,
    closeTime: h.closeTime ?? null,
    isClosed: h.isClosed,
  }));
  return computeOpenStatus(normalized);
}

/**
 * 지도 영역의 시각적 숨김 텍스트 목록. 스크린리더가 map 인터랙션에 접근
 * 불가하기 때문에 같은 카페 목록을 role="list"로 병행 제공한다 (WCAG 1.3.1).
 *
 * 포커스 가능한 링크로 만들어, 키보드 사용자가 Tab으로 카페별 상세 이동 가능.
 */
export function VisuallyHiddenCafeList({
  cafes,
  title = '화면에 표시된 카페 목록',
}: {
  cafes: Cafe[];
  title?: string;
}) {
  const items = useMemo(() => {
    return cafes.map((cafe) => {
      const status = openStatusFor(cafe);
      return {
        id: cafe.id,
        name: cafe.name,
        status: status ? STATUS_LABEL[status] : '영업 정보 없음',
        address: cafe.address,
        rating: Number.isFinite(cafe.avgRating) ? cafe.avgRating.toFixed(1) : null,
        reviewCount: cafe.reviewCount,
      };
    });
  }, [cafes]);

  return (
    <VisuallyHiddenBlock as="nav" aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p>현재 표시된 카페가 없어요.</p>
      ) : (
        <ol role="list">
          {items.map((item) => (
            <li key={item.id} role="listitem">
              <Link href={PATHS.CafeDetail(item.id)}>
                {item.name}
                {`, ${item.status}`}
                {item.rating && `, 평점 ${item.rating} (${item.reviewCount}개 리뷰)`}
                {item.address && `, ${item.address}`}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </VisuallyHiddenBlock>
  );
}
