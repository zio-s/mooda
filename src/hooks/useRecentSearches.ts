'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mooda:recent-cafes:v1';
const MAX_ITEMS = 8;

export type RecentCafe = {
  cafeId: string;
  name: string;
  subtitle?: string;
  visitedAt: number;
};

function readFromStorage(): RecentCafe[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentCafe[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.cafeId === 'string' && typeof item.name === 'string',
    );
  } catch {
    return [];
  }
}

function writeToStorage(items: RecentCafe[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded / disabled — fall through silently, not critical */
  }
}

/**
 * Persists recently-visited cafes in localStorage. Only items the user actually
 * opened are stored (not keystrokes). SSR-safe: initial state is empty and
 * hydrates from localStorage in an effect.
 */
export function useRecentSearches() {
  const [items, setItems] = useState<RecentCafe[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readFromStorage());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: RecentCafe[]) => {
    setItems(next);
    writeToStorage(next);
  }, []);

  const add = useCallback(
    (entry: Omit<RecentCafe, 'visitedAt'>) => {
      setItems((current) => {
        const filtered = current.filter((c) => c.cafeId !== entry.cafeId);
        const next = [
          { ...entry, visitedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        writeToStorage(next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (cafeId: string) => {
      setItems((current) => {
        const next = current.filter((c) => c.cafeId !== cafeId);
        writeToStorage(next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { items, hydrated, add, remove, clear };
}
