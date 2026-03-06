'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { KeywordSearchResult } from '@/types';
import {
  SearchWrapper,
  SearchInputWrap,
  SearchInput,
  ClearBtn,
  Dropdown,
  ResultItem,
  ResultName,
  ResultAddress,
  ResultBadge,
  NoResult,
  LoadingText,
} from './CafeSearch.styles';

interface CafeSearchProps {
  onSelect: (result: { cafeId: string; lat: number; lng: number; name: string }) => void;
}

export function CafeSearch({ onSelect }: CafeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KeywordSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setOpen(false);
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/cafes/keyword-search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Select a result
  const handleSelect = useCallback(
    async (result: KeywordSearchResult) => {
      setOpen(false);
      setQuery(result.name);

      if (result.cafeId) {
        onSelect({ cafeId: result.cafeId, lat: result.lat, lng: result.lng, name: result.name });
      } else {
        setRegistering(true);
        try {
          const res = await fetch('/api/cafes/keyword-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kakaoPlaceId: result.kakaoPlaceId,
              name: result.name,
              address: result.address,
              lat: result.lat,
              lng: result.lng,
              phone: result.phone,
              kakaoUrl: result.kakaoUrl,
            }),
          });
          const data = await res.json();
          onSelect({ cafeId: data.cafeId, lat: result.lat, lng: result.lng, name: result.name });
        } catch {
          onSelect({ cafeId: '', lat: result.lat, lng: result.lng, name: result.name });
        } finally {
          setRegistering(false);
        }
      }
    },
    [onSelect],
  );

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    setResults([]);
  };

  return (
    <SearchWrapper ref={wrapperRef}>
      <SearchInputWrap $focused={focused}>
        <Search size={14} />
        <SearchInput
          placeholder="카페 검색..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (results.length > 0 && query.trim().length >= 2) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
        />
        {query && (
          <ClearBtn onClick={handleClear} type="button">
            <X size={14} />
          </ClearBtn>
        )}
      </SearchInputWrap>

      {open && (
        <Dropdown>
          {loading || registering ? (
            <LoadingText>{registering ? '카페 등록 중...' : '검색 중...'}</LoadingText>
          ) : results.length === 0 ? (
            <NoResult>검색 결과가 없습니다</NoResult>
          ) : (
            results.map((r) => (
              <ResultItem key={r.kakaoPlaceId} onClick={() => handleSelect(r)}>
                <ResultName>
                  {r.name}
                  {r.cafeId && <ResultBadge> · Mooda 등록</ResultBadge>}
                </ResultName>
                <ResultAddress>{r.address}</ResultAddress>
              </ResultItem>
            ))
          )}
        </Dropdown>
      )}
    </SearchWrapper>
  );
}
