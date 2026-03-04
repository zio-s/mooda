import { Suspense } from 'react';
import { MapClient } from './MapClient';

export const metadata = {
  title: '지도 검색',
  description: '분위기 필터로 주변 카페를 지도에서 찾아보세요.',
};

export default function MapPage() {
  return (
    <Suspense>
      <MapClient />
    </Suspense>
  );
}
