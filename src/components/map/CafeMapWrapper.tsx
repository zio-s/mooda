'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './MapSkeleton';
import type { Cafe } from '@/types';

const CafeMap = dynamic(() => import('./CafeMap').then((m) => ({ default: m.CafeMap })), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export function CafeMapWrapper(props: {
  onCafeSelect?: (cafe: Cafe | null) => void;
  onNearbyFound?: (cafe: Cafe) => void;
  cafes: Cafe[];
}) {
  return <CafeMap {...props} />;
}
