'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { MapBounds } from '@/types';

const DEFAULT_DELAY_MS = 300;

/**
 * Debounces the Redux mapSlice bounds/center so in-flight drags don't thrash
 * RTK Query with new cache keys on every frame.
 */
export function useDebouncedMapBounds(delay: number = DEFAULT_DELAY_MS) {
  const bounds = useAppSelector((s) => s.map.bounds);
  const [debounced, setDebounced] = useState<MapBounds | null>(bounds);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(bounds), delay);
    return () => clearTimeout(t);
  }, [bounds, delay]);

  return debounced;
}

export function useDebouncedMapCenter(delay: number = DEFAULT_DELAY_MS) {
  const center = useAppSelector((s) => s.map.center);
  const level = useAppSelector((s) => s.map.level);
  const [debounced, setDebounced] = useState({ center, level });

  useEffect(() => {
    const t = setTimeout(() => setDebounced({ center, level }), delay);
    return () => clearTimeout(t);
  }, [center.lat, center.lng, level, delay]);

  return debounced;
}
